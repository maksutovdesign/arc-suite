export type AgentStatus = "active" | "paused" | "alert" | "idle"
export type TransactionCategory = "api_call" | "data_feed" | "compute" | "storage" | "bridge" | "swap"
export type TransactionStatus = "completed" | "pending" | "failed"
export type AlertSeverity = "warning" | "critical"
export type ReputationTier = "Platinum" | "Gold" | "Silver" | "New"
export type WorkspaceRole = "owner" | "admin" | "operator" | "viewer"
export type ApiKeyScope = "read" | "write" | "admin"
export type LeadInterest = "pilot" | "investment" | "partnership" | "press" | "other"
export type OpsHealthCheckSource = "github_actions" | "local" | "manual"
export type OpsHealthCheckStatus = "ok" | "warn" | "failed" | "test"
export type OpsHealthCheckResultStatus = "ok" | "warn" | "failed"
export type ArcSettlementStatus = "policy_denied" | "approved" | "submitted" | "confirmed" | "failed"
export type ShieldDecision = "allow" | "review" | "block"
export type ShieldProviderStatus = "completed" | "provider_error"
export type FlowRunStatus = "running" | "completed" | "review" | "blocked" | "failed"
export type FlowStepStatus = "pending" | "running" | "passed" | "review" | "blocked" | "failed" | "skipped"

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
  explorerUrl?: string | null
  sourceAddress?: string | null
  chainId?: number | null
  settlementId?: string | null
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
  explorerUrl?: string | null
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

export type AccessDecisionResult = AccessDecision & {
  amountUsdc: number
  decisionId: string | null
}

export type AccessDecisionLog = AccessDecision & {
  id: string
  workspaceId: string
  amountUsdc: number
  createdAt: string
}

export type ArcSettlement = {
  id: string
  workspaceId: string
  idempotencyKey: string
  agentId: string
  apiId: string
  accessDecisionId: string | null
  transactionId: string | null
  sourceAddress: string
  recipientAddress: string
  amountUsdc: number
  chainId: number
  network: "Arc Testnet"
  provider: "circle_wallets_sdk"
  status: ArcSettlementStatus
  txHash: string | null
  explorerUrl: string | null
  gasEstimate: Record<string, unknown>
  providerReceipt: Record<string, unknown>
  reputationScoreBefore: number | null
  reputationScoreAfter: number | null
  errorCode: string | null
  errorMessage: string | null
  createdAt: string
  updatedAt: string
  confirmedAt: string | null
}

export type ArcSettlementResult = {
  settlement: ArcSettlement
  transaction: Transaction
  scoreDelta: number
}

export type ShieldReason = {
  source: string
  sourceValue: string
  riskScore: string
  riskCategories: string[]
  type: string
}

export type ShieldScreening = {
  id: string
  workspaceId: string
  idempotencyKey: string
  address: string
  chain: string
  provider: "circle_compliance_engine"
  providerScreeningId: string | null
  providerResult: string | null
  providerStatus: ShieldProviderStatus
  decision: ShieldDecision
  decisionReason: string
  ruleName: string | null
  actions: string[]
  riskScore: string
  riskCategories: string[]
  reasons: ShieldReason[]
  alertId: string | null
  rawResponse: Record<string, unknown>
  requestId: string | null
  createdAt: string
}

export type ShieldSummary = {
  total: number
  allowed: number
  review: number
  blocked: number
  providerErrors: number
  lastScreenedAt: string | null
}

export type FlowStep = {
  key: "screening" | "access" | "settlement" | "reputation"
  label: string
  status: FlowStepStatus
  detail: string
  completedAt: string | null
}

export type FlowRun = {
  id: string
  workspaceId: string
  idempotencyKey: string
  agentId: string
  apiId: string
  recipientAddress: string
  screeningChain: string
  amountUsdc: number
  status: FlowRunStatus
  currentStep: FlowStep["key"]
  steps: FlowStep[]
  screeningId: string | null
  screeningDecision: ShieldDecision | null
  accessDecisionId: string | null
  accessAllowed: boolean | null
  settlementId: string | null
  txHash: string | null
  explorerUrl: string | null
  reputationScoreBefore: number | null
  reputationScoreAfter: number | null
  errorCode: string | null
  errorMessage: string | null
  requestId: string | null
  createdAt: string
  updatedAt: string
  completedAt: string | null
}

export type FlowSummary = {
  total: number
  completed: number
  review: number
  blocked: number
  failed: number
  lastRunAt: string | null
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

export type InvestorLeadInput = {
  name: string
  email: string
  company?: string | null
  role?: string | null
  interest?: LeadInterest
  message?: string | null
  anonymousId?: string | null
  sessionId?: string | null
  path?: string | null
  url?: string | null
  referrer?: string | null
  userAgent?: string | null
  ipHash?: string | null
  properties?: Record<string, unknown>
}

export type InvestorLead = InvestorLeadInput & {
  id: string
  workspaceId: string
  interest: LeadInterest
  status: "new" | "contacted" | "qualified" | "closed"
  createdAt: string
}

export type OpsHealthCheckResult = {
  detail?: string | null
  durationMs: number
  message?: string | null
  name: string
  status: OpsHealthCheckResultStatus
  warning?: string | null
}

export type OpsHealthWarning = {
  durationMs?: number | null
  message: string
  name: string
}

export type OpsHealthCheckInput = {
  branch?: string | null
  checks: number
  commitSha?: string | null
  durationMs: number
  failureCount: number
  latencyFailMs?: number | null
  latencyWarnMs?: number | null
  metadata?: Record<string, unknown>
  monitorName?: string
  results: OpsHealthCheckResult[]
  runId?: string | null
  runUrl?: string | null
  source?: OpsHealthCheckSource
  status: OpsHealthCheckStatus
  warningCount: number
  warnings?: OpsHealthWarning[]
}

export type OpsHealthCheck = OpsHealthCheckInput & {
  branch: string | null
  commitSha: string | null
  createdAt: string
  id: string
  latencyFailMs: number | null
  latencyWarnMs: number | null
  monitorName: string
  runId: string | null
  runUrl: string | null
  source: OpsHealthCheckSource
  warnings: OpsHealthWarning[]
  workspaceId: string
}

export type OpsHealthHistory = {
  checks: OpsHealthCheck[]
  summary: {
    avgLatencyMs: number
    failedRuns: number
    latestAt: string | null
    latestStatus: OpsHealthCheckStatus | null
    okRuns: number
    p95LatencyMs: number
    totalRuns: number
    uptimePct: number
    warningRuns: number
  }
}
