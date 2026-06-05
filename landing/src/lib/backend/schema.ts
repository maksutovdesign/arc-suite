export type AgentStatus = "active" | "paused" | "alert" | "idle"
export type TransactionCategory = "api_call" | "data_feed" | "compute" | "storage" | "bridge" | "swap"
export type TransactionStatus = "completed" | "pending" | "failed"
export type AlertSeverity = "warning" | "critical"
export type ReputationTier = "Platinum" | "Gold" | "Silver" | "New"
export type WorkspaceRole = "owner" | "admin" | "operator" | "viewer"
export type ApiKeyScope = "read" | "write" | "admin"

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

export type ReputationEventType =
  | "payment_completed"
  | "payment_failed"
  | "payment_denied"
  | "dispute_raised"
  | "dispute_resolved"
  | "fast_response"
  | "large_tx"
  | "new_service"

export type ReputationEvent = {
  id: string
  workspaceId: string
  agentId: string
  agentName: string
  type: ReputationEventType
  description: string
  scoreDelta: number
  timestamp: string
  txHash?: string
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

export type AccessDecisionLog = AccessDecision & {
  id: string
  workspaceId: string
  amountUsdc: number
  createdAt: string
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
    method: "GET" | "POST" | "PATCH"
    path: string
    description: string
  }>
}

export type WorkspaceMember = {
  id: string
  workspaceId: string
  email: string
  name: string
  role: WorkspaceRole
  createdAt: string
  lastActiveAt: string | null
}

export type WorkspaceApiKey = {
  id: string
  workspaceId: string
  name: string
  keyPrefix: string
  scopes: ApiKeyScope[]
  createdBy: string | null
  createdAt: string
  lastUsedAt: string | null
  rotatedAt: string | null
  revokedAt: string | null
}

export type WorkspaceApiKeyCreated = WorkspaceApiKey & {
  secret: string
}

export type AnalyticsSource = "landing" | "treasury" | "reputation" | "marketplace"

export type AnalyticsEventInput = {
  eventName: string
  source: AnalyticsSource
  surface?: string | null
  placement?: string | null
  anonymousId?: string | null
  sessionId?: string | null
  path?: string | null
  url?: string | null
  referrer?: string | null
  userAgent?: string | null
  ipHash?: string | null
  properties?: Record<string, unknown>
}

export type AnalyticsEvent = AnalyticsEventInput & {
  id: string
  workspaceId: string
  createdAt: string
}

export type AnalyticsSummary = {
  totals: Array<{ eventName: string; count: number }>
  sources: Array<{ source: AnalyticsSource; count: number }>
  placements: Array<{ eventName: string; placement: string; count: number }>
  funnel: {
    demoClicks: number
    investorClicks: number
    githubClicks: number
    xClicks: number
    accessCheckRuns: number
    accessCheckResults: number
    demoToAccessCheckRatePct: number
    accessCheckCompletionRatePct: number
  }
  recent: AnalyticsEvent[]
}
