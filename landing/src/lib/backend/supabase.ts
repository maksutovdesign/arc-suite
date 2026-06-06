import { createHash, randomBytes, randomUUID } from "crypto"
import type {
  AccessDecisionLog,
  Agent,
  AnalyticsEvent,
  AnalyticsEventInput,
  AnalyticsSource,
  ApiKeyScope,
  ApiListing,
  ApiProvider,
  BudgetAlert,
  InvestorLead,
  InvestorLeadInput,
  LeadInterest,
  ReputationProfile,
  Transaction,
  WorkspaceApiKey,
  WorkspaceApiKeyCreated,
  WorkspaceMember,
} from "./schema"

type WorkspaceRow = {
  id: string
  name: string
  mode: "pilot"
  created_at?: string
  updated_at?: string | null
}

type AgentRow = {
  id: string
  workspace_id: string
  name: string
  address: string
  status: Agent["status"]
  network: Agent["network"]
  balance_usdc: string | number
  monthly_budget_usdc: string | number
  monthly_spent_usdc: string | number
  daily_limit_usdc: string | number
  daily_spent_usdc: string | number
  tx_count: number
  tags: string[] | null
  created_at: string
  last_active_at: string | null
}

type TransactionRow = {
  id: string
  workspace_id: string
  agent_id: string
  amount_usdc: string | number
  category: Transaction["category"]
  description: string
  status: Transaction["status"]
  occurred_at: string
  tx_hash: string
  network: Transaction["network"]
  recipient: string
}

type AlertRow = {
  id: string
  workspace_id: string
  agent_id: string
  type: BudgetAlert["type"]
  severity: BudgetAlert["severity"]
  message: string
  created_at: string
  resolved_at: string | null
}

type ReputationRow = {
  agent_id: string
  score: number
  score_change_30d: number
  tier: ReputationProfile["tier"]
  payment_reliability: number
  volume_consistency: number
  response_time: number
  dispute_history: number
  account_age: number
  updated_at: string
}

type ProviderRow = {
  id: string
  name: string
  verified: boolean
}

type ApiListingRow = {
  id: string
  provider_id: string
  name: string
  category: ApiListing["category"]
  price_usdc: string | number
  pricing_unit: string
  uptime_pct: string | number
  request_count: string | number
  min_reputation_score: number
}

type AccessDecisionRow = {
  id: string
  workspace_id: string
  agent_id: string
  api_id: string
  amount_usdc: string | number
  allowed: boolean
  reason: string
  required_score: number
  score: number
  monthly_budget_used_pct: number
  daily_budget_used_pct: number
  created_at: string
}

type WorkspaceMemberRow = {
  id: string
  workspace_id: string
  email: string
  name: string
  role: WorkspaceMember["role"]
  created_at: string
  last_active_at: string | null
}

type WorkspaceApiKeyRow = {
  id: string
  workspace_id: string
  name: string
  key_hash: string
  key_prefix: string
  scopes: ApiKeyScope[] | null
  created_by: string | null
  created_at: string
  last_used_at: string | null
  rotated_at: string | null
  revoked_at: string | null
}

type AnalyticsEventRow = {
  id: string
  workspace_id: string
  event_name: string
  source: AnalyticsSource
  surface: string | null
  placement: string | null
  anonymous_id: string | null
  session_id: string | null
  path: string | null
  url: string | null
  referrer: string | null
  user_agent: string | null
  ip_hash: string | null
  properties: Record<string, unknown> | null
  created_at: string
}

type InvestorLeadRow = {
  id: string
  workspace_id: string
  name: string
  email: string
  company: string | null
  role: string | null
  interest: LeadInterest
  message: string | null
  status: InvestorLead["status"]
  anonymous_id: string | null
  session_id: string | null
  path: string | null
  url: string | null
  referrer: string | null
  user_agent: string | null
  ip_hash: string | null
  properties: Record<string, unknown> | null
  created_at: string
}

type RateLimitEventRow = {
  id: string
  workspace_id: string
  route: string
  bucket_key: string
  ip_hash: string | null
  created_at: string
}

export type BackendDataset = {
  workspace: {
    id: string
    name: string
    mode: "pilot"
    updatedAt: string
  }
  agents: Agent[]
  transactions: Transaction[]
  alerts: BudgetAlert[]
  reputationProfiles: ReputationProfile[]
  providers: ApiProvider[]
  apiListings: ApiListing[]
}

const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const WORKSPACE_ID = process.env.ARC_WORKSPACE_ID ?? "wrk_arc_demo"

export function isSupabaseConfigured() {
  return Boolean(SUPABASE_URL && SUPABASE_KEY)
}

export function getSupabaseConfigurationStatus() {
  return {
    configured: isSupabaseConfigured(),
    hasServiceRole: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    hasUrl: Boolean(SUPABASE_URL),
    workspaceId: WORKSPACE_ID,
  }
}

export async function loadSupabaseDataset(): Promise<BackendDataset | null> {
  if (!isSupabaseConfigured()) return null

  try {
    const [workspaceRows, agentRows, transactionRows, alertRows, reputationRows, providerRows, apiRows] = await Promise.all([
      getRows<WorkspaceRow>("workspaces", `select=*&id=eq.${encodeURIComponent(WORKSPACE_ID)}&limit=1`),
      getRows<AgentRow>("agents", `select=*&workspace_id=eq.${encodeURIComponent(WORKSPACE_ID)}&order=created_at.asc`),
      getRows<TransactionRow>("transactions", `select=*&workspace_id=eq.${encodeURIComponent(WORKSPACE_ID)}&order=occurred_at.desc`),
      getRows<AlertRow>("budget_alerts", `select=*&workspace_id=eq.${encodeURIComponent(WORKSPACE_ID)}&order=created_at.desc`),
      getRows<ReputationRow>("reputation_profiles", "select=*&order=score.desc"),
      getRows<ProviderRow>("api_providers", "select=*&order=name.asc"),
      getRows<ApiListingRow>("api_listings", "select=*&order=request_count.desc"),
    ])

    if (!workspaceRows[0] || agentRows.length === 0) return null

    return {
      workspace: {
        id: workspaceRows[0].id,
        name: workspaceRows[0].name,
        mode: workspaceRows[0].mode,
        updatedAt: workspaceRows[0].updated_at ?? new Date().toISOString(),
      },
      agents: agentRows.map(mapAgent),
      transactions: transactionRows.map(mapTransaction),
      alerts: alertRows.map(mapAlert),
      reputationProfiles: reputationRows.map(mapReputation),
      providers: providerRows.map(mapProvider),
      apiListings: apiRows.map(mapApiListing),
    }
  } catch {
    return null
  }
}

export async function insertSupabaseAgent(agent: Agent): Promise<Agent | null> {
  if (!isSupabaseConfigured()) return null

  try {
    const rows = await postRows<AgentRow>("agents", [toAgentRow(agent)])
    return rows[0] ? mapAgent(rows[0]) : null
  } catch {
    return null
  }
}

export async function updateSupabaseAgent(agentId: string, updates: Partial<Agent>): Promise<Agent | null> {
  if (!isSupabaseConfigured()) return null

  const row: Partial<AgentRow> = {}
  if (updates.name !== undefined) row.name = updates.name
  if (updates.address !== undefined) row.address = updates.address
  if (updates.status !== undefined) row.status = updates.status
  if (updates.network !== undefined) row.network = updates.network
  if (updates.balanceUsdc !== undefined) row.balance_usdc = updates.balanceUsdc
  if (updates.monthlyBudgetUsdc !== undefined) row.monthly_budget_usdc = updates.monthlyBudgetUsdc
  if (updates.monthlySpentUsdc !== undefined) row.monthly_spent_usdc = updates.monthlySpentUsdc
  if (updates.dailyLimitUsdc !== undefined) row.daily_limit_usdc = updates.dailyLimitUsdc
  if (updates.dailySpentUsdc !== undefined) row.daily_spent_usdc = updates.dailySpentUsdc
  if (updates.txCount !== undefined) row.tx_count = updates.txCount
  if (updates.tags !== undefined) row.tags = updates.tags
  if (updates.lastActiveAt !== undefined) row.last_active_at = updates.lastActiveAt

  try {
    const rows = await patchRows<AgentRow>("agents", `id=eq.${encodeURIComponent(agentId)}`, row)
    return rows[0] ? mapAgent(rows[0]) : null
  } catch {
    return null
  }
}

export async function insertAccessDecision(input: {
  agentId: string
  apiId: string
  amountUsdc: number
  allowed: boolean
  reason: string
  requiredScore: number
  score: number
  monthlyBudgetUsedPct: number
  dailyBudgetUsedPct: number
}) {
  if (!isSupabaseConfigured()) return

  try {
    await postRows("access_decisions", [
      {
        id: `dec_${crypto.randomUUID()}`,
        workspace_id: WORKSPACE_ID,
        agent_id: input.agentId,
        api_id: input.apiId,
        amount_usdc: input.amountUsdc,
        allowed: input.allowed,
        reason: input.reason,
        required_score: input.requiredScore,
        score: input.score,
        monthly_budget_used_pct: input.monthlyBudgetUsedPct,
        daily_budget_used_pct: input.dailyBudgetUsedPct,
      },
    ])
  } catch {
    // Access checks should remain available even if audit logging is temporarily unavailable.
  }
}

export async function listSupabaseAccessDecisions(limit = 20): Promise<AccessDecisionLog[] | null> {
  if (!isSupabaseConfigured()) return null

  try {
    const rows = await getRows<AccessDecisionRow>(
      "access_decisions",
      `select=*&workspace_id=eq.${encodeURIComponent(WORKSPACE_ID)}&order=created_at.desc&limit=${limit}`,
    )
    return rows.map(mapAccessDecision)
  } catch {
    return null
  }
}

export async function listSupabaseWorkspaceMembers(): Promise<WorkspaceMember[] | null> {
  if (!isSupabaseConfigured()) return null

  try {
    const rows = await getRows<WorkspaceMemberRow>(
      "workspace_members",
      `select=*&workspace_id=eq.${encodeURIComponent(WORKSPACE_ID)}&order=created_at.asc`,
    )
    return rows.map(mapWorkspaceMember)
  } catch {
    return null
  }
}

export async function listSupabaseWorkspaceApiKeys(): Promise<WorkspaceApiKey[] | null> {
  if (!isSupabaseConfigured()) return null

  try {
    const rows = await getRows<WorkspaceApiKeyRow>(
      "workspace_api_keys",
      `select=*&workspace_id=eq.${encodeURIComponent(WORKSPACE_ID)}&order=created_at.desc`,
    )
    return rows.map(mapWorkspaceApiKey)
  } catch {
    return null
  }
}

export async function createSupabaseWorkspaceApiKey(input: {
  name: string
  scopes: ApiKeyScope[]
  createdBy?: string
}): Promise<WorkspaceApiKeyCreated | null> {
  if (!isSupabaseConfigured()) return null

  const secret = generateApiKeySecret()
  const rows = await postRows<WorkspaceApiKeyRow>("workspace_api_keys", [
    {
      id: `key_${randomUUID()}`,
      workspace_id: WORKSPACE_ID,
      name: input.name,
      key_hash: hashApiKey(secret),
      key_prefix: maskApiKey(secret),
      scopes: normalizeScopes(input.scopes),
      created_by: input.createdBy ?? "mem_arc_owner",
    },
  ])

  return rows[0] ? { ...mapWorkspaceApiKey(rows[0]), secret } : null
}

export async function rotateSupabaseWorkspaceApiKey(keyId: string): Promise<WorkspaceApiKeyCreated | null> {
  if (!isSupabaseConfigured()) return null

  const secret = generateApiKeySecret()
  const rows = await patchRows<WorkspaceApiKeyRow>(
    "workspace_api_keys",
    `id=eq.${encodeURIComponent(keyId)}&workspace_id=eq.${encodeURIComponent(WORKSPACE_ID)}`,
    {
      key_hash: hashApiKey(secret),
      key_prefix: maskApiKey(secret),
      rotated_at: new Date().toISOString(),
      revoked_at: null,
    },
  )

  return rows[0] ? { ...mapWorkspaceApiKey(rows[0]), secret } : null
}

export async function revokeSupabaseWorkspaceApiKey(keyId: string): Promise<WorkspaceApiKey | null> {
  if (!isSupabaseConfigured()) return null

  const rows = await patchRows<WorkspaceApiKeyRow>(
    "workspace_api_keys",
    `id=eq.${encodeURIComponent(keyId)}&workspace_id=eq.${encodeURIComponent(WORKSPACE_ID)}`,
    { revoked_at: new Date().toISOString() },
  )

  return rows[0] ? mapWorkspaceApiKey(rows[0]) : null
}

export async function verifySupabaseApiKey(secret: string): Promise<WorkspaceApiKey | null> {
  if (!isSupabaseConfigured() || !secret.startsWith("arc_live_")) return null

  try {
    const rows = await getRows<WorkspaceApiKeyRow>(
      "workspace_api_keys",
      `select=*&key_hash=eq.${encodeURIComponent(hashApiKey(secret))}&revoked_at=is.null&limit=1`,
    )
    const key = rows[0]
    if (!key) return null

    await patchRows<WorkspaceApiKeyRow>("workspace_api_keys", `id=eq.${encodeURIComponent(key.id)}`, {
      last_used_at: new Date().toISOString(),
    }).catch(() => null)

    return mapWorkspaceApiKey(key)
  } catch {
    return null
  }
}

export async function insertSupabaseAnalyticsEvent(input: AnalyticsEventInput): Promise<AnalyticsEvent | null> {
  if (!isSupabaseConfigured()) return null

  try {
    const rows = await postRows<AnalyticsEventRow>("analytics_events", [
      {
        id: `evt_${randomUUID()}`,
        workspace_id: WORKSPACE_ID,
        event_name: input.eventName,
        source: input.source,
        surface: input.surface ?? null,
        placement: input.placement ?? null,
        anonymous_id: input.anonymousId ?? null,
        session_id: input.sessionId ?? null,
        path: input.path ?? null,
        url: input.url ?? null,
        referrer: input.referrer ?? null,
        user_agent: input.userAgent ?? null,
        ip_hash: input.ipHash ?? null,
        properties: input.properties ?? {},
      },
    ])

    return rows[0] ? mapAnalyticsEvent(rows[0]) : null
  } catch {
    return null
  }
}

export async function listSupabaseAnalyticsEvents(limit = 200): Promise<AnalyticsEvent[] | null> {
  if (!isSupabaseConfigured()) return null

  try {
    const rows = await getRows<AnalyticsEventRow>(
      "analytics_events",
      `select=*&workspace_id=eq.${encodeURIComponent(WORKSPACE_ID)}&order=created_at.desc&limit=${limit}`,
    )
    return rows.map(mapAnalyticsEvent)
  } catch {
    return null
  }
}

export async function insertSupabaseInvestorLead(input: InvestorLeadInput): Promise<InvestorLead | null> {
  if (!isSupabaseConfigured()) return null

  try {
    const rows = await postRows<InvestorLeadRow>("investor_leads", [
      {
        id: `lead_${randomUUID()}`,
        workspace_id: WORKSPACE_ID,
        name: input.name,
        email: input.email,
        company: input.company ?? null,
        role: input.role ?? null,
        interest: input.interest ?? "pilot",
        message: input.message ?? null,
        status: "new",
        anonymous_id: input.anonymousId ?? null,
        session_id: input.sessionId ?? null,
        path: input.path ?? null,
        url: input.url ?? null,
        referrer: input.referrer ?? null,
        user_agent: input.userAgent ?? null,
        ip_hash: input.ipHash ?? null,
        properties: input.properties ?? {},
      },
    ])

    return rows[0] ? mapInvestorLead(rows[0]) : null
  } catch {
    return null
  }
}

export async function listSupabaseInvestorLeads(limit = 100): Promise<InvestorLead[] | null> {
  if (!isSupabaseConfigured()) return null

  try {
    const rows = await getRows<InvestorLeadRow>(
      "investor_leads",
      `select=*&workspace_id=eq.${encodeURIComponent(WORKSPACE_ID)}&order=created_at.desc&limit=${limit}`,
    )
    return rows.map(mapInvestorLead)
  } catch {
    return null
  }
}

export async function countSupabaseRateLimitEvents(input: {
  bucketKey: string
  route: string
  sinceIso: string
}): Promise<number | null> {
  if (!isSupabaseConfigured()) return null

  try {
    const rows = await getRows<{ id: string }>(
      "rate_limit_events",
      `select=id&workspace_id=eq.${encodeURIComponent(WORKSPACE_ID)}&route=eq.${encodeURIComponent(input.route)}&bucket_key=eq.${encodeURIComponent(input.bucketKey)}&created_at=gte.${encodeURIComponent(input.sinceIso)}&limit=1000`,
    )
    return rows.length
  } catch (error) {
    logSupabaseError("rate limit count", error)
    return null
  }
}

export async function insertSupabaseRateLimitEvent(input: {
  bucketKey: string
  ipHash?: string | null
  route: string
}): Promise<boolean> {
  if (!isSupabaseConfigured()) return false

  try {
    await postRows<RateLimitEventRow>("rate_limit_events", [
      {
        id: `rl_${randomUUID()}`,
        workspace_id: WORKSPACE_ID,
        route: input.route,
        bucket_key: input.bucketKey,
        ip_hash: input.ipHash ?? null,
      },
    ])
    return true
  } catch (error) {
    logSupabaseError("rate limit insert", error)
    return false
  }
}

export async function checkSupabaseReadiness() {
  const config = getSupabaseConfigurationStatus()
  if (!config.configured) {
    return {
      ok: false,
      config,
      tables: [] as Array<{ name: string; ok: boolean }>,
    }
  }

  const tables = ["workspaces", "agents", "analytics_events", "investor_leads", "rate_limit_events"]
  const checks = await Promise.all(tables.map(async (table) => {
    try {
      await getRows(table, "select=id&limit=1")
      return { name: table, ok: true }
    } catch (error) {
      logSupabaseError(`readiness ${table}`, error)
      return { name: table, ok: false }
    }
  }))

  return {
    ok: checks.every((check) => check.ok),
    config,
    tables: checks,
  }
}

async function getRows<T>(table: string, query: string): Promise<T[]> {
  const response = await fetch(`${restBaseUrl()}/${table}?${query}`, {
    cache: "no-store",
    headers: supabaseHeaders(),
  })

  if (!response.ok) throw new Error(`Supabase read failed for ${table}`)
  return response.json() as Promise<T[]>
}

async function postRows<T>(table: string, rows: unknown[]): Promise<T[]> {
  const response = await fetch(`${restBaseUrl()}/${table}`, {
    body: JSON.stringify(rows),
    headers: {
      ...supabaseHeaders(),
      Prefer: "return=representation",
    },
    method: "POST",
  })

  if (!response.ok) throw new Error(`Supabase insert failed for ${table}`)
  return response.json() as Promise<T[]>
}

async function patchRows<T>(table: string, query: string, row: unknown): Promise<T[]> {
  const response = await fetch(`${restBaseUrl()}/${table}?${query}`, {
    body: JSON.stringify(row),
    headers: {
      ...supabaseHeaders(),
      Prefer: "return=representation",
    },
    method: "PATCH",
  })

  if (!response.ok) throw new Error(`Supabase update failed for ${table}`)
  return response.json() as Promise<T[]>
}

function restBaseUrl() {
  return `${SUPABASE_URL?.replace(/\/$/, "")}/rest/v1`
}

function supabaseHeaders() {
  return {
    apikey: SUPABASE_KEY ?? "",
    Authorization: `Bearer ${SUPABASE_KEY}`,
    "Content-Type": "application/json",
  }
}

function logSupabaseError(scope: string, error: unknown) {
  if (process.env.NODE_ENV !== "production") {
    console.error(`[supabase:${scope}]`, error)
    return
  }

  const message = error instanceof Error ? error.message : "unknown error"
  console.error(`[supabase:${scope}] ${message}`)
}

function mapAgent(row: AgentRow): Agent {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    name: row.name,
    address: row.address,
    status: row.status,
    network: row.network,
    balanceUsdc: toNumber(row.balance_usdc),
    monthlyBudgetUsdc: toNumber(row.monthly_budget_usdc),
    monthlySpentUsdc: toNumber(row.monthly_spent_usdc),
    dailyLimitUsdc: toNumber(row.daily_limit_usdc),
    dailySpentUsdc: toNumber(row.daily_spent_usdc),
    txCount: row.tx_count,
    tags: row.tags ?? [],
    createdAt: row.created_at,
    lastActiveAt: row.last_active_at,
  }
}

function mapAnalyticsEvent(row: AnalyticsEventRow): AnalyticsEvent {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    eventName: row.event_name,
    source: row.source,
    surface: row.surface,
    placement: row.placement,
    anonymousId: row.anonymous_id,
    sessionId: row.session_id,
    path: row.path,
    url: row.url,
    referrer: row.referrer,
    userAgent: row.user_agent,
    ipHash: row.ip_hash,
    properties: row.properties ?? {},
    createdAt: row.created_at,
  }
}

function mapInvestorLead(row: InvestorLeadRow): InvestorLead {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    name: row.name,
    email: row.email,
    company: row.company,
    role: row.role,
    interest: row.interest,
    message: row.message,
    status: row.status,
    anonymousId: row.anonymous_id,
    sessionId: row.session_id,
    path: row.path,
    url: row.url,
    referrer: row.referrer,
    userAgent: row.user_agent,
    ipHash: row.ip_hash,
    properties: row.properties ?? {},
    createdAt: row.created_at,
  }
}

function mapTransaction(row: TransactionRow): Transaction {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    agentId: row.agent_id,
    amountUsdc: toNumber(row.amount_usdc),
    category: row.category,
    description: row.description,
    status: row.status,
    occurredAt: row.occurred_at,
    txHash: row.tx_hash,
    network: row.network,
    recipient: row.recipient,
  }
}

function mapAlert(row: AlertRow): BudgetAlert {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    agentId: row.agent_id,
    type: row.type,
    severity: row.severity,
    message: row.message,
    createdAt: row.created_at,
    resolvedAt: row.resolved_at,
  }
}

function mapReputation(row: ReputationRow): ReputationProfile {
  return {
    agentId: row.agent_id,
    score: row.score,
    scoreChange30d: row.score_change_30d,
    tier: row.tier,
    breakdown: {
      paymentReliability: row.payment_reliability,
      volumeConsistency: row.volume_consistency,
      responseTime: row.response_time,
      disputeHistory: row.dispute_history,
      accountAge: row.account_age,
    },
    updatedAt: row.updated_at,
  }
}

function mapProvider(row: ProviderRow): ApiProvider {
  return {
    id: row.id,
    name: row.name,
    verified: row.verified,
  }
}

function mapApiListing(row: ApiListingRow): ApiListing {
  return {
    id: row.id,
    providerId: row.provider_id,
    name: row.name,
    category: row.category,
    priceUsdc: toNumber(row.price_usdc),
    pricingUnit: row.pricing_unit,
    uptimePct: toNumber(row.uptime_pct),
    requestCount: toNumber(row.request_count),
    minReputationScore: row.min_reputation_score,
  }
}

function mapAccessDecision(row: AccessDecisionRow): AccessDecisionLog {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    allowed: row.allowed,
    agentId: row.agent_id,
    apiId: row.api_id,
    amountUsdc: toNumber(row.amount_usdc),
    reason: row.reason,
    requiredScore: row.required_score,
    score: row.score,
    monthlyBudgetUsedPct: row.monthly_budget_used_pct,
    dailyBudgetUsedPct: row.daily_budget_used_pct,
    createdAt: row.created_at,
  }
}

function mapWorkspaceMember(row: WorkspaceMemberRow): WorkspaceMember {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    email: row.email,
    name: row.name,
    role: row.role,
    createdAt: row.created_at,
    lastActiveAt: row.last_active_at,
  }
}

function mapWorkspaceApiKey(row: WorkspaceApiKeyRow): WorkspaceApiKey {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    name: row.name,
    keyPrefix: row.key_prefix,
    scopes: normalizeScopes(row.scopes ?? ["read"]),
    createdBy: row.created_by,
    createdAt: row.created_at,
    lastUsedAt: row.last_used_at,
    rotatedAt: row.rotated_at,
    revokedAt: row.revoked_at,
  }
}

function toAgentRow(agent: Agent): AgentRow {
  return {
    id: agent.id,
    workspace_id: agent.workspaceId,
    name: agent.name,
    address: agent.address,
    status: agent.status,
    network: agent.network,
    balance_usdc: agent.balanceUsdc,
    monthly_budget_usdc: agent.monthlyBudgetUsdc,
    monthly_spent_usdc: agent.monthlySpentUsdc,
    daily_limit_usdc: agent.dailyLimitUsdc,
    daily_spent_usdc: agent.dailySpentUsdc,
    tx_count: agent.txCount,
    tags: agent.tags,
    created_at: agent.createdAt,
    last_active_at: agent.lastActiveAt,
  }
}

function toNumber(value: string | number) {
  return typeof value === "number" ? value : Number(value)
}

function generateApiKeySecret() {
  return `arc_live_${randomBytes(24).toString("hex")}`
}

function hashApiKey(secret: string) {
  return createHash("sha256").update(secret).digest("hex")
}

function maskApiKey(secret: string) {
  return `${secret.slice(0, 12)}...${secret.slice(-4)}`
}

function normalizeScopes(scopes: string[]): ApiKeyScope[] {
  const allowed = new Set<ApiKeyScope>(["read", "write", "admin"])
  const normalized = scopes.filter((scope): scope is ApiKeyScope => allowed.has(scope as ApiKeyScope))
  return normalized.length > 0 ? Array.from(new Set(normalized)) : ["read"]
}
