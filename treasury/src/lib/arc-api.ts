import { AGENTS, ALERTS, STATS, TRANSACTIONS, type Agent, type BudgetAlert, type Transaction } from "@/data/mock"

type ApiAgent = {
  id: string
  name: string
  address: string
  status: Agent["status"]
  network: Agent["network"]
  balanceUsdc: number
  monthlyBudgetUsdc: number
  monthlySpentUsdc: number
  dailyLimitUsdc: number
  dailySpentUsdc: number
  txCount: number
  tags: string[]
  createdAt: string
  lastActiveAt: string | null
}

type ApiTransaction = {
  id: string
  agentId: string
  agentName: string
  amountUsdc: number
  category: Transaction["category"]
  description: string
  status: Transaction["status"]
  occurredAt: string
  txHash: string
  network: Transaction["network"]
  recipient: string
  explorerUrl?: string | null
  sourceAddress?: string | null
  chainId?: number | null
  settlementId?: string | null
}

type ApiSummary = {
  treasury: {
    managedUsdc: number
    monthlySpentUsdc: number
    monthlyBudgetUsdc: number
    activeAlerts: number
    criticalAlerts: number
    avgTxCostUsdc: number
  }
}

export type ApiListing = {
  id: string
  providerId: string
  providerName: string
  name: string
  category: "Finance" | "AI / LLM" | "Data feeds" | "Compute" | "Oracles"
  priceUsdc: number
  pricingUnit: string
  uptimePct: number
  requestCount: number
  minReputationScore: number
}

export type AccessDecision = {
  id: string
  workspaceId: string
  allowed: boolean
  agentId: string
  apiId: string
  amountUsdc: number
  reason: string
  requiredScore: number
  score: number
  monthlyBudgetUsedPct: number
  dailyBudgetUsedPct: number
  createdAt: string
}

export type ArcSettlementConfiguration = {
  configured: boolean
  chain: "Arc_Testnet"
  chainId: number
  explorerBaseUrl: string
  sourceAddress: string | null
  defaultRecipient: string | null
  allowedRecipients: string[]
  maxAmountUsdc: number
  missing: string[]
}

export type ArcSettlementOutcome = {
  ok: boolean
  idempotent: boolean
  decision: {
    allowed: boolean
    agentId: string
    apiId: string
    amountUsdc: number
    decisionId: string | null
    reason: string
    requiredScore: number
    score: number
    monthlyBudgetUsedPct: number
    dailyBudgetUsedPct: number
  }
  result?: {
    scoreDelta: number
    settlement: {
      id: string
      status: string
      txHash: string | null
      explorerUrl: string | null
      reputationScoreBefore: number | null
      reputationScoreAfter: number | null
    }
    transaction: ApiTransaction
  }
  settlement?: {
    id: string
    status: string
  }
}

export type WorkspaceMember = {
  id: string
  workspaceId: string
  email: string
  name: string
  role: "owner" | "admin" | "operator" | "viewer"
  createdAt: string
  lastActiveAt: string | null
}

export type WorkspaceApiKey = {
  id: string
  workspaceId: string
  name: string
  keyPrefix: string
  scopes: Array<"read" | "write" | "admin">
  createdBy: string | null
  createdAt: string
  lastUsedAt: string | null
  rotatedAt: string | null
  revokedAt: string | null
}

export type WorkspaceApiKeyCreated = WorkspaceApiKey & {
  secret: string
}

export type WorkspaceSecurity = {
  workspace: {
    id: string
    name: string
    mode: "pilot"
    updatedAt: string
  }
  members: WorkspaceMember[]
  apiKeys: WorkspaceApiKey[]
}

type TreasuryDashboardData = {
  agents: Agent[]
  alerts: BudgetAlert[]
  transactions: Transaction[]
  accessDecisions: AccessDecision[]
  apiListings: ApiListing[]
  stats: typeof STATS
  source: "api" | "mock"
}

const DEFAULT_API_BASE_URL = process.env.NODE_ENV === "production" ? "https://arcsuite-app.vercel.app" : "http://127.0.0.1:3100"
const API_BASE_URL = process.env.ARC_SUITE_API_URL ?? process.env.NEXT_PUBLIC_ARC_SUITE_API_URL ?? DEFAULT_API_BASE_URL
const ARC_API_KEY = process.env.ARC_API_KEY

export async function getTreasuryDashboardData(): Promise<TreasuryDashboardData> {
  try {
    const [summaryRes, agentsRes, transactionsRes, apisRes] = await Promise.all([
      fetch(`${API_BASE_URL}/api/pilot/summary`, { cache: "no-store", headers: arcApiHeaders() }),
      fetch(`${API_BASE_URL}/api/agents`, { cache: "no-store", headers: arcApiHeaders() }),
      fetch(`${API_BASE_URL}/api/transactions`, { cache: "no-store", headers: arcApiHeaders() }),
      fetch(`${API_BASE_URL}/api/apis`, { cache: "no-store", headers: arcApiHeaders() }),
    ])

    if (!summaryRes.ok || !agentsRes.ok || !transactionsRes.ok || !apisRes.ok) {
      throw new Error("Arc API request failed")
    }

    const summary = (await summaryRes.json()) as ApiSummary
    const agentsPayload = (await agentsRes.json()) as { agents: ApiAgent[] }
    const [transactionsPayload, apisPayload, decisionsPayload] = await Promise.all([
      transactionsRes.json() as Promise<{ transactions: ApiTransaction[] }>,
      apisRes.json() as Promise<{ apis: ApiListing[] }>,
      fetchAccessDecisions(),
    ])

    const agents = agentsPayload.agents.map(mapAgent)
    const transactions = transactionsPayload.transactions.map(mapTransaction)

    return {
      agents,
      alerts: ALERTS,
      transactions,
      accessDecisions: decisionsPayload,
      apiListings: apisPayload.apis,
      stats: {
        totalAgents: agents.length,
        activeAgents: agents.filter((agent) => agent.status === "active").length,
        totalUSDCManaged: summary.treasury.managedUsdc,
        monthlySpent: summary.treasury.monthlySpentUsdc,
        monthlyBudget: summary.treasury.monthlyBudgetUsdc,
        activeAlerts: summary.treasury.activeAlerts,
        totalTransactions: agents.reduce((sum, agent) => sum + agent.txCount, 0),
        avgTxCost: summary.treasury.avgTxCostUsdc,
      },
      source: "api",
    }
  } catch {
    return {
      agents: AGENTS,
      alerts: ALERTS,
      transactions: TRANSACTIONS,
      accessDecisions: [],
      apiListings: [],
      stats: STATS,
      source: "mock",
    }
  }
}

export async function patchAgent(agentId: string, updates: Partial<ApiAgent>) {
  return arcApiRequest(`/api/agents/${agentId}`, {
    body: JSON.stringify(updates),
    method: "PATCH",
  })
}

export async function pauseAgent(agentId: string) {
  return arcApiRequest(`/api/agents/${agentId}/pause`, { method: "POST" })
}

export async function resumeAgent(agentId: string) {
  return arcApiRequest(`/api/agents/${agentId}/resume`, { method: "POST" })
}

export async function runAccessCheck(input: { agentId: string; apiId: string; amountUsdc?: number }) {
  return arcApiRequest("/api/access/check", {
    body: JSON.stringify(input),
    method: "POST",
  })
}

export async function getArcSettlementConfiguration(): Promise<ArcSettlementConfiguration> {
  const response = await fetch(`${API_BASE_URL}/api/settlements/arc`, { cache: "no-store", headers: arcApiHeaders() })
  if (!response.ok) throw new Error(`Arc settlement configuration failed: ${response.status}`)
  return response.json() as Promise<ArcSettlementConfiguration>
}

export async function runArcSettlement(input: {
  agentId: string
  apiId: string
  amountUsdc: number
  recipientAddress: string
  idempotencyKey: string
}) {
  const response = await fetch(`${API_BASE_URL}/api/settlements/arc`, {
    body: JSON.stringify(input),
    headers: arcApiHeaders({ "Content-Type": "application/json" }),
    method: "POST",
  })
  const payload = await response.json() as ArcSettlementOutcome & { error?: string; message?: string }
  return { payload, status: response.status }
}

export async function getWorkspaceSecurity(): Promise<WorkspaceSecurity | null> {
  const response = await fetch(`${API_BASE_URL}/api/workspace/security`, { cache: "no-store", headers: arcApiHeaders() })
  if (!response.ok) return null
  return response.json() as Promise<WorkspaceSecurity>
}

export async function createWorkspaceApiKey(input: { name: string; scopes: string[] }) {
  return arcApiRequest("/api/workspace/security", {
    body: JSON.stringify(input),
    method: "POST",
  }) as Promise<{ apiKey: WorkspaceApiKeyCreated }>
}

export async function rotateWorkspaceApiKey(keyId: string) {
  return arcApiRequest(`/api/workspace/security/keys/${keyId}/rotate`, { method: "POST" }) as Promise<{ apiKey: WorkspaceApiKeyCreated }>
}

export async function revokeWorkspaceApiKey(keyId: string) {
  return arcApiRequest(`/api/workspace/security/keys/${keyId}/revoke`, { method: "POST" }) as Promise<{ apiKey: WorkspaceApiKey }>
}

async function fetchAccessDecisions(): Promise<AccessDecision[]> {
  const response = await fetch(`${API_BASE_URL}/api/access/decisions?limit=12`, { cache: "no-store", headers: arcApiHeaders() })
  if (!response.ok) return []
  const payload = (await response.json()) as { decisions: AccessDecision[] }
  return payload.decisions
}

async function arcApiRequest(path: string, init: RequestInit) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      ...arcApiHeaders({ "Content-Type": "application/json" }),
      ...(init.headers ?? {}),
    },
  })

  if (!response.ok) {
    throw new Error(`Arc API request failed: ${response.status}`)
  }

  return response.json()
}

function arcApiHeaders(extra: Record<string, string> = {}) {
  return {
    ...extra,
    ...(ARC_API_KEY ? { "x-arc-api-key": ARC_API_KEY } : {}),
  }
}

function mapAgent(agent: ApiAgent): Agent {
  return {
    id: agent.id,
    name: agent.name,
    address: agent.address,
    status: agent.status,
    balance: agent.balanceUsdc,
    monthlyBudget: agent.monthlyBudgetUsdc,
    monthlySpent: agent.monthlySpentUsdc,
    dailyLimit: agent.dailyLimitUsdc,
    dailySpent: agent.dailySpentUsdc,
    txCount: agent.txCount,
    lastActive: agent.lastActiveAt ? formatLastActive(agent.lastActiveAt) : "never",
    network: agent.network,
    tags: agent.tags,
    createdAt: agent.createdAt.slice(0, 10),
  }
}

function mapTransaction(transaction: ApiTransaction): Transaction {
  return {
    id: transaction.id,
    agentId: transaction.agentId,
    agentName: transaction.agentName,
    amount: transaction.amountUsdc,
    category: transaction.category,
    description: transaction.description,
    status: transaction.status,
    timestamp: transaction.occurredAt,
    txHash: transaction.txHash,
    network: transaction.network,
    recipient: transaction.recipient,
    explorerUrl: transaction.explorerUrl,
    sourceAddress: transaction.sourceAddress,
    chainId: transaction.chainId,
    settlementId: transaction.settlementId,
  }
}

function formatLastActive(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime()
  const minutes = Math.max(0, Math.round(diffMs / 60000))
  if (minutes < 1) return "now"
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.round(minutes / 60)
  if (hours < 48) return `${hours} hour${hours === 1 ? "" : "s"} ago`
  const days = Math.round(hours / 24)
  return `${days} day${days === 1 ? "" : "s"} ago`
}
