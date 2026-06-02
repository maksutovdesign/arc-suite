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

type TreasuryDashboardData = {
  agents: Agent[]
  alerts: BudgetAlert[]
  transactions: Transaction[]
  accessDecisions: AccessDecision[]
  stats: typeof STATS
  source: "api" | "mock"
}

const DEFAULT_API_BASE_URL = process.env.NODE_ENV === "production" ? "https://arcsuite-app.vercel.app" : "http://127.0.0.1:3100"
const API_BASE_URL = process.env.ARC_SUITE_API_URL ?? process.env.NEXT_PUBLIC_ARC_SUITE_API_URL ?? DEFAULT_API_BASE_URL

export async function getTreasuryDashboardData(): Promise<TreasuryDashboardData> {
  try {
    const [summaryRes, agentsRes, transactionsRes] = await Promise.all([
      fetch(`${API_BASE_URL}/api/pilot/summary`, { cache: "no-store" }),
      fetch(`${API_BASE_URL}/api/agents`, { cache: "no-store" }),
      fetch(`${API_BASE_URL}/api/transactions`, { cache: "no-store" }),
    ])

    if (!summaryRes.ok || !agentsRes.ok || !transactionsRes.ok) {
      throw new Error("Arc API request failed")
    }

    const summary = (await summaryRes.json()) as ApiSummary
    const agentsPayload = (await agentsRes.json()) as { agents: ApiAgent[] }
    const [transactionsPayload, decisionsPayload] = await Promise.all([
      transactionsRes.json() as Promise<{ transactions: ApiTransaction[] }>,
      fetchAccessDecisions(),
    ])

    const agents = agentsPayload.agents.map(mapAgent)
    const transactions = transactionsPayload.transactions.map(mapTransaction)

    return {
      agents,
      alerts: ALERTS,
      transactions,
      accessDecisions: decisionsPayload,
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

async function fetchAccessDecisions(): Promise<AccessDecision[]> {
  const response = await fetch(`${API_BASE_URL}/api/access/decisions?limit=12`, { cache: "no-store" })
  if (!response.ok) return []
  const payload = (await response.json()) as { decisions: AccessDecision[] }
  return payload.decisions
}

async function arcApiRequest(path: string, init: RequestInit) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  })

  if (!response.ok) {
    throw new Error(`Arc API request failed: ${response.status}`)
  }

  return response.json()
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
