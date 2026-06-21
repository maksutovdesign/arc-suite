import { agents, alerts, apiListings, providers, reputationProfiles, transactions, WORKSPACE } from "./seed"
import type {
  AccessCheckRequest,
  AccessDecisionLog,
  AccessDecisionResult,
  Agent,
  AnalyticsEventInput,
  AnalyticsSummary,
  AnalyticsSource,
  ApiKeyScope,
  InvestorLead,
  InvestorLeadInput,
  LeadInterest,
  OpsHealthCheck,
  OpsHealthCheckInput,
  OpsHealthCheckResult,
  OpsHealthCheckResultStatus,
  OpsHealthCheckSource,
  OpsHealthCheckStatus,
  OpsHealthHistory,
  OpsHealthWarning,
  PilotSummary,
  ReputationEvent,
  Transaction,
  WorkspaceApiKey,
  WorkspaceApiKeyCreated,
  WorkspaceMember,
} from "./schema"
import {
  createSupabaseWorkspaceApiKey,
  insertAccessDecision,
  insertSupabaseAnalyticsEvent,
  insertSupabaseInvestorLead,
  insertSupabaseOpsHealthCheck,
  insertSupabaseAgent,
  listSupabaseInvestorLeads,
  listSupabaseOpsHealthChecks,
  listSupabaseAnalyticsEvents,
  listSupabaseAccessDecisions,
  listSupabaseWorkspaceApiKeys,
  listSupabaseWorkspaceMembers,
  loadSupabaseDataset,
  revokeSupabaseWorkspaceApiKey,
  rotateSupabaseWorkspaceApiKey,
  updateSupabaseAgent,
  type BackendDataset,
} from "./supabase"

const ANALYTICS_EVENTS = new Set([
  "demo_click",
  "investors_click",
  "github_click",
  "x_click",
  "access_check_run",
  "access_check_result",
  "lead_submit",
  "lead_created",
])

const ANALYTICS_SOURCES = new Set<AnalyticsSource>(["landing", "treasury", "reputation", "marketplace"])

export async function listAgents() {
  const dataset = await getDataset()
  return dataset.agents
}

export async function listTransactions() {
  const dataset = await getDataset()
  return dataset.transactions.map((transaction) => ({
    ...transaction,
    agentName: dataset.agents.find((agent) => agent.id === transaction.agentId)?.name ?? transaction.agentId,
  }))
}

export async function listApiListings() {
  const dataset = await getDataset()
  return dataset.apiListings.map((api) => ({
    ...api,
    providerName: dataset.providers.find((provider) => provider.id === api.providerId)?.name ?? api.providerId,
  }))
}

export async function getReputationProfile(agentId: string) {
  const dataset = await getDataset()
  const profile = dataset.reputationProfiles.find((item) => item.agentId === agentId)
  if (!profile) return null
  const agent = dataset.agents.find((item) => item.id === agentId)
  return {
    ...profile,
    agentName: agent?.name ?? agentId,
    address: agent?.address,
  }
}

export async function listReputationEvents(limit = 40): Promise<ReputationEvent[]> {
  const dataset = await getDataset()
  const accessEvents = (await listAccessDecisions(limit)).map((decision) => {
    const agent = dataset.agents.find((item) => item.id === decision.agentId)
    return {
      id: `rep_${decision.id}`,
      workspaceId: decision.workspaceId,
      agentId: decision.agentId,
      agentName: agent?.name ?? decision.agentId,
      type: decision.allowed ? "payment_completed" as const : "payment_denied" as const,
      description: decision.reason,
      scoreDelta: 0,
      timestamp: decision.createdAt,
    }
  })

  const transactionEvents = dataset.transactions.map((transaction) => {
    const agent = dataset.agents.find((item) => item.id === transaction.agentId)
    return transactionToReputationEvent(transaction, agent?.name ?? transaction.agentId)
  })

  const profileEvents = dataset.reputationProfiles.map((profile) => {
    const agent = dataset.agents.find((item) => item.id === profile.agentId)
    return {
      id: `rep_profile_${profile.agentId}`,
      workspaceId: agent?.workspaceId ?? dataset.workspace.id,
      agentId: profile.agentId,
      agentName: agent?.name ?? profile.agentId,
      type: profile.scoreChange30d >= 0 ? "new_service" as const : "dispute_raised" as const,
      description: `${profile.tier} tier profile refreshed at score ${profile.score}`,
      scoreDelta: profile.scoreChange30d,
      timestamp: profile.updatedAt,
    }
  })

  return [...accessEvents, ...transactionEvents, ...profileEvents]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, limit)
}

export async function createPilotAgent(input: Partial<Agent>) {
  const dataset = await getDataset()
  const now = new Date().toISOString()
  const id = `agt_${String(dataset.agents.length + 1).padStart(2, "0")}`
  const agent: Agent = {
    id,
    workspaceId: dataset.workspace.id,
    name: input.name ?? "Pilot Agent",
    address: input.address ?? "0xpilot...agent",
    status: input.status ?? "active",
    network: input.network ?? "Arc",
    balanceUsdc: input.balanceUsdc ?? 100,
    monthlyBudgetUsdc: input.monthlyBudgetUsdc ?? 500,
    monthlySpentUsdc: input.monthlySpentUsdc ?? 0,
    dailyLimitUsdc: input.dailyLimitUsdc ?? 30,
    dailySpentUsdc: input.dailySpentUsdc ?? 0,
    txCount: input.txCount ?? 0,
    tags: input.tags ?? ["pilot"],
    createdAt: now,
    lastActiveAt: null,
  }

  return (await insertSupabaseAgent(agent)) ?? agent
}

function transactionToReputationEvent(transaction: Transaction, agentName: string): ReputationEvent {
  if (transaction.status === "failed") {
    return {
      id: `rep_${transaction.id}`,
      workspaceId: transaction.workspaceId,
      agentId: transaction.agentId,
      agentName,
      type: "payment_failed",
      description: `${transaction.description} failed`,
      scoreDelta: -4,
      timestamp: transaction.occurredAt,
      txHash: transaction.txHash,
      explorerUrl: transaction.explorerUrl,
    }
  }

  if (transaction.status === "pending") {
    return {
      id: `rep_${transaction.id}`,
      workspaceId: transaction.workspaceId,
      agentId: transaction.agentId,
      agentName,
      type: "dispute_raised",
      description: `${transaction.description} pending operator review`,
      scoreDelta: -8,
      timestamp: transaction.occurredAt,
      txHash: transaction.txHash,
      explorerUrl: transaction.explorerUrl,
    }
  }

  if (transaction.category === "data_feed") {
    return {
      id: `rep_${transaction.id}`,
      workspaceId: transaction.workspaceId,
      agentId: transaction.agentId,
      agentName,
      type: "fast_response",
      description: `${transaction.description} completed with low-latency delivery`,
      scoreDelta: 5,
      timestamp: transaction.occurredAt,
      txHash: transaction.txHash,
      explorerUrl: transaction.explorerUrl,
    }
  }

  if (transaction.amountUsdc >= 1) {
    return {
      id: `rep_${transaction.id}`,
      workspaceId: transaction.workspaceId,
      agentId: transaction.agentId,
      agentName,
      type: "large_tx",
      description: `${transaction.description} settled for $${transaction.amountUsdc.toFixed(2)} USDC`,
      scoreDelta: 2,
      timestamp: transaction.occurredAt,
      txHash: transaction.txHash,
      explorerUrl: transaction.explorerUrl,
    }
  }

  return {
    id: `rep_${transaction.id}`,
    workspaceId: transaction.workspaceId,
    agentId: transaction.agentId,
    agentName,
    type: "payment_completed",
    description: `${transaction.description} completed`,
    scoreDelta: 3,
    timestamp: transaction.occurredAt,
    txHash: transaction.txHash,
    explorerUrl: transaction.explorerUrl,
  }
}

export async function updatePilotAgent(agentId: string, input: Partial<Agent>) {
  const dataset = await getDataset()
  const current = dataset.agents.find((agent) => agent.id === agentId)
  if (!current) return null

  const updates = normalizeAgentUpdates(input)
  const updated: Agent = {
    ...current,
    ...updates,
  }

  return (await updateSupabaseAgent(agentId, updates)) ?? updated
}

export async function setPilotAgentStatus(agentId: string, status: Agent["status"]) {
  return updatePilotAgent(agentId, { status })
}

export async function checkAccess(request: AccessCheckRequest): Promise<AccessDecisionResult | null> {
  const dataset = await getDataset()
  const agent = dataset.agents.find((item) => item.id === request.agentId)
  const api = dataset.apiListings.find((item) => item.id === request.apiId)
  const reputation = dataset.reputationProfiles.find((item) => item.agentId === request.agentId)
  if (!agent || !api || !reputation) return null

  const amount = request.amountUsdc ?? api.priceUsdc
  const monthlyBudgetUsedPct = Math.round(((agent.monthlySpentUsdc + amount) / agent.monthlyBudgetUsdc) * 100)
  const dailyBudgetUsedPct = Math.round(((agent.dailySpentUsdc + amount) / agent.dailyLimitUsdc) * 100)
  const scoreOk = reputation.score >= api.minReputationScore
  const budgetOk = monthlyBudgetUsedPct <= 100 && dailyBudgetUsedPct <= 100
  const balanceOk = agent.balanceUsdc >= amount
  const allowed = scoreOk && budgetOk && balanceOk && agent.status !== "paused"

  let reason = "Access approved"
  if (!scoreOk) reason = "Agent reputation below API requirement"
  else if (!budgetOk) reason = "Agent budget policy would be breached"
  else if (!balanceOk) reason = "Agent wallet balance is too low"
  else if (agent.status === "paused") reason = "Agent is paused by operator policy"

  const decision = {
    allowed,
    agentId: agent.id,
    apiId: api.id,
    reason,
    requiredScore: api.minReputationScore,
    score: reputation.score,
    monthlyBudgetUsedPct,
    dailyBudgetUsedPct,
  }

  const decisionLog = await insertAccessDecision({
    ...decision,
    amountUsdc: amount,
  })

  return {
    ...decision,
    amountUsdc: amount,
    decisionId: decisionLog?.id ?? null,
  }
}

export async function listAccessDecisions(limit = 20): Promise<AccessDecisionLog[]> {
  return (await listSupabaseAccessDecisions(limit)) ?? []
}

export async function getWorkspaceSecurity() {
  const dataset = await getDataset()
  const [members, apiKeys] = await Promise.all([
    listSupabaseWorkspaceMembers(),
    listSupabaseWorkspaceApiKeys(),
  ])

  return {
    workspace: dataset.workspace,
    members: members ?? fallbackMembers(dataset.workspace.id),
    apiKeys: apiKeys ?? fallbackApiKeys(dataset.workspace.id),
  }
}

export async function createWorkspaceApiKey(input: { name?: string; scopes?: string[] }): Promise<WorkspaceApiKeyCreated | null> {
  const name = typeof input.name === "string" && input.name.trim() ? input.name.trim().slice(0, 80) : "Workspace API key"
  const scopes = normalizeKeyScopes(input.scopes)
  return createSupabaseWorkspaceApiKey({ name, scopes })
}

export async function rotateWorkspaceApiKey(keyId: string): Promise<WorkspaceApiKeyCreated | null> {
  return rotateSupabaseWorkspaceApiKey(keyId)
}

export async function revokeWorkspaceApiKey(keyId: string): Promise<WorkspaceApiKey | null> {
  return revokeSupabaseWorkspaceApiKey(keyId)
}

export async function recordAnalyticsEvent(input: AnalyticsEventInput) {
  const eventName = normalizeAnalyticsEventName(input.eventName)
  const source = ANALYTICS_SOURCES.has(input.source) ? input.source : "landing"

  return insertSupabaseAnalyticsEvent({
    eventName,
    source,
    surface: normalizeOptionalText(input.surface, 80),
    placement: normalizeOptionalText(input.placement, 80),
    anonymousId: normalizeOptionalText(input.anonymousId, 120),
    sessionId: normalizeOptionalText(input.sessionId, 120),
    path: normalizeOptionalText(input.path, 240),
    url: normalizeOptionalText(input.url, 500),
    referrer: normalizeOptionalText(input.referrer, 500),
    userAgent: normalizeOptionalText(input.userAgent, 500),
    ipHash: normalizeOptionalText(input.ipHash, 96),
    properties: sanitizeAnalyticsProperties(input.properties),
  })
}

export async function getAnalyticsSummary(limit = 200): Promise<AnalyticsSummary> {
  const events = (await listSupabaseAnalyticsEvents(limit)) ?? []
  const totals = aggregateCounts(events.map((event) => event.eventName)).map(([eventName, count]) => ({ eventName, count }))
  const sources = aggregateCounts(events.map((event) => event.source)).map(([source, count]) => ({ source: source as AnalyticsSource, count }))
  const placements = aggregateCounts(events.map((event) => `${event.eventName}:${event.placement ?? "unknown"}`)).map(([key, count]) => {
    const [eventName, placement] = key.split(":")
    return { eventName, placement, count }
  })
  const countByEvent = new Map(totals.map((item) => [item.eventName, item.count]))
  const demoClicks = countByEvent.get("demo_click") ?? 0
  const accessCheckRuns = countByEvent.get("access_check_run") ?? 0
  const accessCheckResults = countByEvent.get("access_check_result") ?? 0

  return {
    funnel: {
      accessCheckCompletionRatePct: percentage(accessCheckResults, accessCheckRuns),
      accessCheckResults,
      accessCheckRuns,
      demoClicks,
      demoToAccessCheckRatePct: percentage(accessCheckRuns, demoClicks),
      githubClicks: countByEvent.get("github_click") ?? 0,
      investorClicks: countByEvent.get("investors_click") ?? 0,
      xClicks: countByEvent.get("x_click") ?? 0,
    },
    placements,
    totals,
    sources,
    recent: events.slice(0, 50),
  }
}

export async function createInvestorLead(input: Partial<InvestorLeadInput>): Promise<InvestorLead | null> {
  const normalized = normalizeInvestorLead(input)
  if (!normalized) return null

  const lead = await insertSupabaseInvestorLead(normalized)
  await recordAnalyticsEvent({
    anonymousId: normalized.anonymousId,
    eventName: "lead_created",
    path: normalized.path,
    placement: "request_pilot_form",
    properties: {
      company: Boolean(normalized.company),
      interest: normalized.interest,
      stored: Boolean(lead),
    },
    referrer: normalized.referrer,
    sessionId: normalized.sessionId,
    source: "landing",
    surface: "lead_capture",
    url: normalized.url,
    userAgent: normalized.userAgent,
    ipHash: normalized.ipHash,
  })

  return lead
}

export async function listInvestorLeads(limit = 100): Promise<InvestorLead[]> {
  return (await listSupabaseInvestorLeads(limit)) ?? []
}

export async function recordOpsHealthCheck(input: unknown): Promise<{
  check: OpsHealthCheck | null
  normalized: OpsHealthCheckInput | null
  stored: boolean
}> {
  const normalized = normalizeOpsHealthCheck(input)
  if (!normalized) return { check: null, normalized: null, stored: false }

  const check = await insertSupabaseOpsHealthCheck(normalized)
  return {
    check,
    normalized,
    stored: Boolean(check),
  }
}

export async function getOpsHealthHistory(limit = 50): Promise<OpsHealthHistory> {
  const checks = (await listSupabaseOpsHealthChecks(limit)) ?? []
  return {
    checks,
    summary: summarizeOpsHealthChecks(checks),
  }
}

export async function getPilotSummary(): Promise<PilotSummary> {
  const dataset = await getDataset()
  const activeAlerts = dataset.alerts.filter((alert) => !alert.resolvedAt)
  const completedTx = dataset.transactions.filter((transaction) => transaction.status === "completed")
  const avgTxCostUsdc = completedTx.reduce((sum, tx) => sum + tx.amountUsdc, 0) / completedTx.length
  const tradeBot = dataset.agents.find((agent) => agent.id === "agt_02") ?? dataset.agents[0]
  const leaderboard = dataset.reputationProfiles
    .map((profile) => ({
      profile,
      agent: dataset.agents.find((agent) => agent.id === profile.agentId),
    }))
    .filter((item) => item.agent)
    .sort((a, b) => b.profile.score - a.profile.score)
    .map((item) => ({
      name: item.agent?.name ?? item.profile.agentId,
      score: item.profile.score,
      delta: `${item.profile.scoreChange30d >= 0 ? "+" : ""}${item.profile.scoreChange30d}`,
      tier: item.profile.tier,
    }))

  const categoryMix = [
    { label: "Finance" as const, value: 31 },
    { label: "AI / LLM" as const, value: 27 },
    { label: "Data feeds" as const, value: 24 },
    { label: "Compute" as const, value: 18 },
    { label: "Oracles" as const, value: 15 },
  ]

  return {
    workspace: {
      ...dataset.workspace,
    },
    treasury: {
      managedUsdc: round2(dataset.agents.reduce((sum, agent) => sum + agent.balanceUsdc, 0)),
      monthlySpentUsdc: round2(dataset.agents.reduce((sum, agent) => sum + agent.monthlySpentUsdc, 0)),
      monthlyBudgetUsdc: dataset.agents.reduce((sum, agent) => sum + agent.monthlyBudgetUsdc, 0),
      activeAlerts: activeAlerts.length,
      criticalAlerts: activeAlerts.filter((alert) => alert.severity === "critical").length,
      avgTxCostUsdc: round3(Number.isFinite(avgTxCostUsdc) ? avgTxCostUsdc : 0),
      tradeBotBudget: {
        spentUsdc: tradeBot.monthlySpentUsdc,
        limitUsdc: tradeBot.monthlyBudgetUsdc,
        walletBalanceUsdc: tradeBot.balanceUsdc,
        dailySpentUsdc: tradeBot.dailySpentUsdc,
        dailyLimitUsdc: tradeBot.dailyLimitUsdc,
        usedPct: Math.round((tradeBot.monthlySpentUsdc / tradeBot.monthlyBudgetUsdc) * 100),
      },
    },
    reputation: {
      agentsScored: dataset.reputationProfiles.length,
      topScore: Math.max(...dataset.reputationProfiles.map((profile) => profile.score), 0),
      dimensions: 5,
      leaderboard,
    },
    marketplace: {
      apisListed: Math.max(dataset.apiListings.length, 143),
      providers: Math.max(dataset.providers.length, 58),
      requests: Math.max(dataset.apiListings.reduce((sum, api) => sum + api.requestCount, 0), 24800000),
      avgUptimePct: round2(
        dataset.apiListings.length > 0 ? dataset.apiListings.reduce((sum, api) => sum + api.uptimePct, 0) / dataset.apiListings.length : 0,
      ),
      categoryMix,
    },
    endpoints: [
      { method: "GET", path: "/api/health", description: "API health and schema version" },
      { method: "GET", path: "/api/pilot/summary", description: "Landing-ready pilot metrics" },
      { method: "GET", path: "/api/agents", description: "Agent wallets, limits, balances and status" },
      { method: "POST", path: "/api/agents", description: "Create a pilot agent profile" },
      { method: "PATCH", path: "/api/agents/:agentId", description: "Update budget, limits, status or metadata" },
      { method: "POST", path: "/api/agents/:agentId/pause", description: "Pause an agent by operator policy" },
      { method: "POST", path: "/api/agents/:agentId/resume", description: "Resume a paused agent" },
      { method: "GET", path: "/api/transactions", description: "USDC spend events" },
      { method: "GET", path: "/api/reputation/:agentId", description: "0-1000 reputation profile" },
      { method: "GET", path: "/api/reputation/events", description: "Live reputation timeline from transactions and access decisions" },
      { method: "POST", path: "/api/access/check", description: "x402 access decision from score and budget policy" },
      { method: "GET", path: "/api/settlements/arc", description: "Arc Testnet settlement readiness and allowlist status" },
      { method: "POST", path: "/api/settlements/arc", description: "Policy-gated USDC transfer with Supabase and Reputation updates" },
      { method: "GET", path: "/api/flow/runs", description: "Arc Flow execution history and summary" },
      { method: "POST", path: "/api/flow/runs", description: "Compliance-to-settlement autonomous payment orchestration" },
      { method: "GET", path: "/api/billing/overview", description: "x402 balances, invoices, usage and settlement batches" },
      { method: "POST", path: "/api/billing/usage", description: "Atomically meter usage and charge an agent prepaid balance" },
      { method: "POST", path: "/api/billing/topups", description: "Add operator credit to an agent billing account" },
      { method: "POST", path: "/api/billing/batches", description: "Aggregate nanopayments into a settlement-ready batch" },
      { method: "GET", path: "/api/access/decisions", description: "Access decision audit log" },
      { method: "GET", path: "/api/workspace/security", description: "Workspace members and scoped API keys" },
      { method: "POST", path: "/api/workspace/security", description: "Create a scoped workspace API key" },
      { method: "POST", path: "/api/workspace/security/keys/:keyId/rotate", description: "Rotate a workspace API key" },
      { method: "POST", path: "/api/analytics/events", description: "Capture landing and demo conversion events" },
      { method: "GET", path: "/api/analytics/summary", description: "Protected conversion analytics summary" },
      { method: "POST", path: "/api/leads", description: "Capture investor and pilot requests linked to analytics sessions" },
      { method: "GET", path: "/api/leads", description: "Protected investor CRM lead list" },
    ],
  }
}

function normalizeAgentUpdates(input: Partial<Agent>) {
  const updates: Partial<Agent> = {}
  if (typeof input.name === "string") updates.name = input.name
  if (typeof input.address === "string") updates.address = input.address
  if (input.status && ["active", "paused", "alert", "idle"].includes(input.status)) updates.status = input.status
  if (input.network && ["Arc", "Ethereum"].includes(input.network)) updates.network = input.network
  if (typeof input.balanceUsdc === "number") updates.balanceUsdc = input.balanceUsdc
  if (typeof input.monthlyBudgetUsdc === "number") updates.monthlyBudgetUsdc = input.monthlyBudgetUsdc
  if (typeof input.monthlySpentUsdc === "number") updates.monthlySpentUsdc = input.monthlySpentUsdc
  if (typeof input.dailyLimitUsdc === "number") updates.dailyLimitUsdc = input.dailyLimitUsdc
  if (typeof input.dailySpentUsdc === "number") updates.dailySpentUsdc = input.dailySpentUsdc
  if (typeof input.txCount === "number") updates.txCount = input.txCount
  if (Array.isArray(input.tags)) updates.tags = input.tags.filter((tag) => typeof tag === "string")
  if (input.lastActiveAt === null || typeof input.lastActiveAt === "string") updates.lastActiveAt = input.lastActiveAt
  return updates
}

async function getDataset(): Promise<BackendDataset> {
  return (await loadSupabaseDataset()) ?? getSeedDataset()
}

function getSeedDataset(): BackendDataset {
  return {
    workspace: {
      ...WORKSPACE,
      updatedAt: "2026-06-02T01:40:00Z",
    },
    agents,
    transactions,
    alerts,
    reputationProfiles,
    providers,
    apiListings,
  }
}

function fallbackMembers(workspaceId: string): WorkspaceMember[] {
  return [
    {
      id: "mem_arc_owner",
      workspaceId,
      email: "founder@arcsuite.dev",
      name: "Arc Suite Founder",
      role: "owner",
      createdAt: "2026-06-02T01:40:00Z",
      lastActiveAt: "2026-06-02T18:00:00Z",
    },
    {
      id: "mem_arc_ops",
      workspaceId,
      email: "ops@arcsuite.dev",
      name: "Pilot Ops",
      role: "operator",
      createdAt: "2026-06-02T01:42:00Z",
      lastActiveAt: null,
    },
  ]
}

function fallbackApiKeys(workspaceId: string): WorkspaceApiKey[] {
  return [
    {
      id: "key_arc_master_env",
      workspaceId,
      name: "Production server key",
      keyPrefix: "env:ARC_API_KEY",
      scopes: ["admin"],
      createdBy: "mem_arc_owner",
      createdAt: "2026-06-02T18:00:00Z",
      lastUsedAt: null,
      rotatedAt: null,
      revokedAt: null,
    },
  ]
}

function normalizeKeyScopes(scopes: string[] | undefined): ApiKeyScope[] {
  const allowed = new Set<ApiKeyScope>(["read", "write", "admin"])
  const normalized = (scopes ?? ["read"]).filter((scope): scope is ApiKeyScope => allowed.has(scope as ApiKeyScope))
  return normalized.length > 0 ? Array.from(new Set(normalized)) : ["read"]
}

function normalizeAnalyticsEventName(value: string) {
  const normalized = value.trim().toLowerCase().replace(/[^a-z0-9_:-]/g, "_").slice(0, 80)
  if (ANALYTICS_EVENTS.has(normalized)) return normalized
  return normalized || "unknown_event"
}

function normalizeOpsHealthCheck(input: unknown): OpsHealthCheckInput | null {
  if (!input || typeof input !== "object" || Array.isArray(input)) return null

  const data = input as Record<string, unknown>
  const status = normalizeOpsStatus(data.status)
  if (!status) return null

  const results = Array.isArray(data.results)
    ? data.results.map(normalizeOpsResult).filter((result): result is OpsHealthCheckResult => Boolean(result)).slice(0, 40)
    : []
  const warnings = Array.isArray(data.warnings)
    ? data.warnings.map(normalizeOpsWarning).filter((warning): warning is OpsHealthWarning => Boolean(warning)).slice(0, 20)
    : []

  return {
    branch: normalizeOptionalText(data.branch, 120),
    checks: normalizeNonNegativeInteger(data.checks, results.length),
    commitSha: normalizeOptionalText(data.commitSha, 80),
    durationMs: normalizeNonNegativeInteger(data.durationMs, 0),
    failureCount: normalizeNonNegativeInteger(data.failureCount, results.filter((result) => result.status === "failed").length),
    latencyFailMs: normalizeNullableNonNegativeInteger(data.latencyFailMs),
    latencyWarnMs: normalizeNullableNonNegativeInteger(data.latencyWarnMs),
    metadata: sanitizeOpsMetadata(data.metadata),
    monitorName: normalizeOptionalText(data.monitorName, 120) ?? "Arc Suite Production Monitor",
    results,
    runId: normalizeOptionalText(data.runId, 120),
    runUrl: normalizeOptionalText(data.runUrl, 500),
    source: normalizeOpsSource(data.source),
    status,
    warningCount: normalizeNonNegativeInteger(data.warningCount, warnings.length),
    warnings,
  }
}

function normalizeOpsResult(input: unknown): OpsHealthCheckResult | null {
  if (!input || typeof input !== "object" || Array.isArray(input)) return null

  const data = input as Record<string, unknown>
  const name = normalizeOptionalText(data.name, 120)
  const status = normalizeOpsResultStatus(data.status)
  if (!name || !status) return null

  return {
    detail: normalizeOptionalText(data.detail, 500),
    durationMs: normalizeNonNegativeInteger(data.durationMs, 0),
    message: normalizeOptionalText(data.message, 500),
    name,
    status,
    warning: normalizeOptionalText(data.warning, 500),
  }
}

function normalizeOpsWarning(input: unknown): OpsHealthWarning | null {
  if (!input || typeof input !== "object" || Array.isArray(input)) return null

  const data = input as Record<string, unknown>
  const name = normalizeOptionalText(data.name, 120)
  const message = normalizeOptionalText(data.message, 500)
  if (!name || !message) return null

  return {
    durationMs: normalizeNullableNonNegativeInteger(data.durationMs),
    message,
    name,
  }
}

function normalizeOpsStatus(value: unknown): OpsHealthCheckStatus | null {
  if (value === "ok" || value === "warn" || value === "failed" || value === "test") return value
  return null
}

function normalizeOpsResultStatus(value: unknown): OpsHealthCheckResultStatus | null {
  if (value === "ok" || value === "warn" || value === "failed") return value
  return null
}

function normalizeOpsSource(value: unknown): OpsHealthCheckSource {
  if (value === "github_actions" || value === "manual") return value
  return "local"
}

function summarizeOpsHealthChecks(checks: OpsHealthCheck[]): OpsHealthHistory["summary"] {
  const productionRuns = checks.filter((check) => check.status !== "test")
  const okRuns = productionRuns.filter((check) => check.status === "ok").length
  const warningRuns = productionRuns.filter((check) => check.status === "warn").length
  const failedRuns = productionRuns.filter((check) => check.status === "failed").length
  const durations = productionRuns.map((check) => check.durationMs).sort((a, b) => a - b)
  const totalRuns = productionRuns.length

  return {
    avgLatencyMs: durations.length > 0 ? Math.round(durations.reduce((sum, value) => sum + value, 0) / durations.length) : 0,
    failedRuns,
    latestAt: checks[0]?.createdAt ?? null,
    latestStatus: checks[0]?.status ?? null,
    okRuns,
    p95LatencyMs: durations.length > 0 ? durations[Math.max(0, Math.ceil(durations.length * 0.95) - 1)] : 0,
    totalRuns,
    uptimePct: percentage(okRuns + warningRuns, totalRuns),
    warningRuns,
  }
}

function normalizeInvestorLead(input: Partial<InvestorLeadInput>): InvestorLeadInput | null {
  const name = normalizeOptionalText(input.name, 120)
  const email = normalizeOptionalText(input.email, 160)?.toLowerCase()
  if (!name || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null

  return {
    anonymousId: normalizeOptionalText(input.anonymousId, 120),
    company: normalizeOptionalText(input.company, 140),
    email,
    interest: normalizeLeadInterest(input.interest),
    ipHash: normalizeOptionalText(input.ipHash, 96),
    message: normalizeOptionalText(input.message, 1200),
    name,
    path: normalizeOptionalText(input.path, 240),
    properties: sanitizeAnalyticsProperties(input.properties),
    referrer: normalizeOptionalText(input.referrer, 500),
    role: normalizeOptionalText(input.role, 120),
    sessionId: normalizeOptionalText(input.sessionId, 120),
    url: normalizeOptionalText(input.url, 500),
    userAgent: normalizeOptionalText(input.userAgent, 500),
  }
}

function normalizeLeadInterest(value: unknown): LeadInterest {
  if (value === "investment" || value === "partnership" || value === "press" || value === "other") return value
  return "pilot"
}

function normalizeOptionalText(value: unknown, maxLength: number) {
  if (typeof value !== "string") return null
  const trimmed = value.trim()
  return trimmed ? trimmed.slice(0, maxLength) : null
}

function normalizeNonNegativeInteger(value: unknown, fallback: number) {
  const numberValue = typeof value === "number" ? value : Number(value)
  if (!Number.isFinite(numberValue) || numberValue < 0) return fallback
  return Math.round(numberValue)
}

function normalizeNullableNonNegativeInteger(value: unknown) {
  if (value === null || value === undefined || value === "") return null
  const numberValue = normalizeNonNegativeInteger(value, -1)
  return numberValue >= 0 ? numberValue : null
}

function sanitizeOpsMetadata(metadata: unknown): Record<string, unknown> {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return {}
  return Object.fromEntries(
    Object.entries(metadata as Record<string, unknown>)
      .filter(([key, value]) => typeof key === "string" && isAnalyticsPrimitive(value))
      .slice(0, 20)
      .map(([key, value]) => [key.slice(0, 80), value]),
  )
}

function sanitizeAnalyticsProperties(properties: unknown): Record<string, unknown> {
  if (!properties || typeof properties !== "object" || Array.isArray(properties)) return {}
  return Object.fromEntries(
    Object.entries(properties as Record<string, unknown>)
      .filter(([key, value]) => typeof key === "string" && isAnalyticsPrimitive(value))
      .slice(0, 20)
      .map(([key, value]) => [key.slice(0, 80), value]),
  )
}

function isAnalyticsPrimitive(value: unknown) {
  return value === null || ["string", "number", "boolean"].includes(typeof value)
}

function aggregateCounts(values: string[]) {
  const counts = new Map<string, number>()
  values.forEach((value) => counts.set(value, (counts.get(value) ?? 0) + 1))
  return [...counts.entries()].sort((a, b) => b[1] - a[1])
}

function percentage(numerator: number, denominator: number) {
  if (!denominator) return 0
  return Math.round((numerator / denominator) * 1000) / 10
}

function round2(value: number) {
  return Math.round(value * 100) / 100
}

function round3(value: number) {
  return Math.round(value * 1000) / 1000
}
