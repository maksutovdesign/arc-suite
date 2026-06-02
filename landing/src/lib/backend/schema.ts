export type AgentStatus = "active" | "paused" | "alert" | "idle"
export type TransactionCategory = "api_call" | "data_feed" | "compute" | "storage" | "bridge" | "swap"
export type TransactionStatus = "completed" | "pending" | "failed"
export type AlertSeverity = "warning" | "critical"
export type ReputationTier = "Platinum" | "Gold" | "Silver" | "New"

export type Agent = {
  id: string
  workspaceId: string
  name: string
  address: string
  status: AgentStatus
  network: "Arc" | "Ethereum"
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

export type Transaction = {
  id: string
  workspaceId: string
  agentId: string
  amountUsdc: number
  category: TransactionCategory
  description: string
  status: TransactionStatus
  occurredAt: string
  txHash: string
  network: "Arc" | "Ethereum"
  recipient: string
}

export type BudgetAlert = {
  id: string
  workspaceId: string
  agentId: string
  type: "daily_limit" | "monthly_limit" | "low_balance" | "unusual_spend"
  severity: AlertSeverity
  message: string
  createdAt: string
  resolvedAt: string | null
}

export type ReputationProfile = {
  agentId: string
  score: number
  scoreChange30d: number
  tier: ReputationTier
  breakdown: {
    paymentReliability: number
    volumeConsistency: number
    responseTime: number
    disputeHistory: number
    accountAge: number
  }
  updatedAt: string
}

export type ApiProvider = {
  id: string
  name: string
  verified: boolean
}

export type ApiListing = {
  id: string
  providerId: string
  name: string
  category: "Finance" | "AI / LLM" | "Data feeds" | "Compute" | "Oracles"
  priceUsdc: number
  pricingUnit: string
  uptimePct: number
  requestCount: number
  minReputationScore: number
}

export type AccessCheckRequest = {
  agentId: string
  apiId: string
  amountUsdc?: number
}

export type AccessDecision = {
  allowed: boolean
  agentId: string
  apiId: string
  reason: string
  requiredScore: number
  score: number
  monthlyBudgetUsedPct: number
  dailyBudgetUsedPct: number
}

export type PilotSummary = {
  workspace: {
    id: string
    name: string
    mode: "pilot"
    updatedAt: string
  }
  treasury: {
    managedUsdc: number
    monthlySpentUsdc: number
    monthlyBudgetUsdc: number
    activeAlerts: number
    criticalAlerts: number
    avgTxCostUsdc: number
    tradeBotBudget: {
      spentUsdc: number
      limitUsdc: number
      walletBalanceUsdc: number
      dailySpentUsdc: number
      dailyLimitUsdc: number
      usedPct: number
    }
  }
  reputation: {
    agentsScored: number
    topScore: number
    dimensions: number
    leaderboard: Array<{
      name: string
      score: number
      delta: string
      tier: ReputationTier
    }>
  }
  marketplace: {
    apisListed: number
    providers: number
    requests: number
    avgUptimePct: number
    categoryMix: Array<{ label: ApiListing["category"]; value: number }>
  }
  endpoints: Array<{
    method: "GET" | "POST"
    path: string
    description: string
  }>
}
