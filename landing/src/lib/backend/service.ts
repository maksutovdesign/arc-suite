import { agents, alerts, apiListings, providers, reputationProfiles, transactions, WORKSPACE } from "./seed"
import type {
  AccessCheckRequest,
  AccessDecision,
  AccessDecisionLog,
  Agent,
  AnalyticsEventInput,
  AnalyticsSummary,
  AnalyticsSource,
  ApiKeyScope,
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
  insertSupabaseAgent,
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

export async function checkAccess(request: AccessCheckRequest): Promise<AccessDecision | null> {
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

  await insertAccessDecision({
    ...decision,
    amountUsdc: amount,
  })

  return decision
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

  return {
    totals,
    sources,
    recent: events.slice(0, 25),
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
      { method: "GET", path: "/api/access/decisions", description: "Access decision audit log" },
      { method: "GET", path: "/api/workspace/security", description: "Workspace members and scoped API keys" },
      { method: "POST", path: "/api/workspace/security", description: "Create a scoped workspace API key" },
      { method: "POST", path: "/api/workspace/security/keys/:keyId/rotate", description: "Rotate a workspace API key" },
      { method: "POST", path: "/api/analytics/events", description: "Capture landing and demo conversion events" },
      { method: "GET", path: "/api/analytics/summary", description: "Protected conversion analytics summary" },
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

function normalizeOptionalText(value: unknown, maxLength: number) {
  if (typeof value !== "string") return null
  const trimmed = value.trim()
  return trimmed ? trimmed.slice(0, maxLength) : null
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

function round2(value: number) {
  return Math.round(value * 100) / 100
}

function round3(value: number) {
  return Math.round(value * 1000) / 1000
}
