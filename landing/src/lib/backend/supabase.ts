import type { Agent, ApiListing, ApiProvider, BudgetAlert, ReputationProfile, Transaction } from "./schema"

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
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const WORKSPACE_ID = process.env.ARC_WORKSPACE_ID ?? "wrk_arc_demo"

export function isSupabaseConfigured() {
  return Boolean(SUPABASE_URL && SUPABASE_KEY)
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
