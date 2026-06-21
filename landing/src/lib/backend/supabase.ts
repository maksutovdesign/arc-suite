import { createHash, randomBytes, randomUUID } from "crypto"
import { logOperationalEvent } from "./observability"
import type {
  AccessDecisionLog,
  Agent,
  AnalyticsEvent,
  AnalyticsEventInput,
  AnalyticsSource,
  ArcSettlement,
  ArcSettlementResult,
  ArcSettlementStatus,
  FlowRun,
  ApiKeyScope,
  ApiListing,
  ApiProvider,
  BudgetAlert,
  InvestorLead,
  InvestorLeadInput,
  LeadInterest,
  OpsHealthCheck,
  OpsHealthCheckInput,
  OpsHealthCheckResult,
  OpsHealthCheckSource,
  OpsHealthWarning,
  ReputationProfile,
  ShieldScreening,
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
  explorer_url?: string | null
  source_address?: string | null
  chain_id?: string | number | null
  settlement_id?: string | null
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

type OpsHealthCheckRow = {
  id: string
  workspace_id: string
  monitor_name: string
  source: OpsHealthCheckSource
  status: OpsHealthCheck["status"]
  check_count: number
  warning_count: number
  failure_count: number
  duration_ms: number
  latency_warn_ms: number | null
  latency_fail_ms: number | null
  branch: string | null
  commit_sha: string | null
  run_id: string | null
  run_url: string | null
  results: OpsHealthCheckResult[] | null
  warnings: OpsHealthWarning[] | null
  metadata: Record<string, unknown> | null
  created_at: string
}

type ArcSettlementRow = {
  id: string
  workspace_id: string
  idempotency_key: string
  agent_id: string
  api_id: string
  access_decision_id: string | null
  transaction_id: string | null
  source_address: string
  recipient_address: string
  amount_usdc: string | number
  chain_id: string | number
  network: "Arc Testnet"
  provider: "circle_wallets_sdk"
  status: ArcSettlementStatus
  tx_hash: string | null
  explorer_url: string | null
  gas_estimate: Record<string, unknown> | null
  provider_receipt: Record<string, unknown> | null
  reputation_score_before: number | null
  reputation_score_after: number | null
  error_code: string | null
  error_message: string | null
  created_at: string
  updated_at: string
  confirmed_at: string | null
}

type FinalizeArcSettlementRow = {
  transactionId: string
  scoreBefore: number
  scoreAfter: number
  scoreDelta: number
}

type ShieldScreeningRow = {
  id: string
  workspace_id: string
  idempotency_key: string
  address: string
  chain: string
  provider: "circle_compliance_engine"
  provider_screening_id: string | null
  provider_result: string | null
  provider_status: ShieldScreening["providerStatus"]
  decision: ShieldScreening["decision"]
  decision_reason: string
  rule_name: string | null
  actions: string[] | null
  risk_score: string
  risk_categories: string[] | null
  reasons: ShieldScreening["reasons"] | null
  alert_id: string | null
  raw_response: Record<string, unknown> | null
  request_id: string | null
  created_at: string
}

type FlowRunRow = {
  id: string
  workspace_id: string
  idempotency_key: string
  agent_id: string
  api_id: string
  recipient_address: string
  screening_chain: string
  amount_usdc: string | number
  status: FlowRun["status"]
  current_step: FlowRun["currentStep"]
  steps: FlowRun["steps"] | null
  screening_id: string | null
  screening_decision: FlowRun["screeningDecision"]
  access_decision_id: string | null
  access_allowed: boolean | null
  settlement_id: string | null
  tx_hash: string | null
  explorer_url: string | null
  reputation_score_before: number | null
  reputation_score_after: number | null
  error_code: string | null
  error_message: string | null
  request_id: string | null
  created_at: string
  updated_at: string
  completed_at: string | null
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

export async function findSupabaseArcSettlement(idempotencyKey: string): Promise<ArcSettlement | null> {
  if (!isSupabaseConfigured()) return null

  try {
    const rows = await getRows<ArcSettlementRow>(
      "arc_settlements",
      `select=*&workspace_id=eq.${encodeURIComponent(WORKSPACE_ID)}&idempotency_key=eq.${encodeURIComponent(idempotencyKey)}&limit=1`,
    )
    return rows[0] ? mapArcSettlement(rows[0]) : null
  } catch (error) {
    logSupabaseError("arc settlement lookup", error)
    return null
  }
}

export async function getSupabaseArcSettlementResult(settlementId: string): Promise<ArcSettlementResult | null> {
  if (!isSupabaseConfigured()) return null

  try {
    const [settlementRows, transactionRows] = await Promise.all([
      getRows<ArcSettlementRow>(
        "arc_settlements",
        `select=*&id=eq.${encodeURIComponent(settlementId)}&workspace_id=eq.${encodeURIComponent(WORKSPACE_ID)}&limit=1`,
      ),
      getRows<TransactionRow>(
        "transactions",
        `select=*&settlement_id=eq.${encodeURIComponent(settlementId)}&workspace_id=eq.${encodeURIComponent(WORKSPACE_ID)}&limit=1`,
      ),
    ])
    const settlement = settlementRows[0]
    const transaction = transactionRows[0]
    if (!settlement || !transaction) return null

    return {
      settlement: mapArcSettlement(settlement),
      transaction: mapTransaction(transaction),
      scoreDelta: (settlement.reputation_score_after ?? 0) - (settlement.reputation_score_before ?? 0),
    }
  } catch (error) {
    logSupabaseError("arc settlement result", error)
    return null
  }
}

export async function insertSupabaseArcSettlement(input: {
  id: string
  idempotencyKey: string
  agentId: string
  apiId: string
  accessDecisionId: string | null
  sourceAddress: string
  recipientAddress: string
  amountUsdc: number
  status: ArcSettlementStatus
}): Promise<ArcSettlement | null> {
  if (!isSupabaseConfigured()) return null

  try {
    const rows = await postRows<ArcSettlementRow>("arc_settlements", [
      {
        id: input.id,
        workspace_id: WORKSPACE_ID,
        idempotency_key: input.idempotencyKey,
        agent_id: input.agentId,
        api_id: input.apiId,
        access_decision_id: input.accessDecisionId,
        source_address: input.sourceAddress,
        recipient_address: input.recipientAddress,
        amount_usdc: input.amountUsdc,
        chain_id: 5042002,
        network: "Arc Testnet",
        provider: "circle_wallets_sdk",
        status: input.status,
      },
    ])
    return rows[0] ? mapArcSettlement(rows[0]) : null
  } catch (error) {
    logSupabaseError("arc settlement insert", error)
    return null
  }
}

export async function insertSupabaseShieldScreening(
  screening: Omit<ShieldScreening, "workspaceId" | "createdAt">,
): Promise<ShieldScreening | null> {
  if (!isSupabaseConfigured()) return null

  try {
    const rows = await postRows<ShieldScreeningRow>("compliance_screenings", [
      {
        id: screening.id,
        workspace_id: WORKSPACE_ID,
        idempotency_key: screening.idempotencyKey,
        address: screening.address,
        chain: screening.chain,
        provider: screening.provider,
        provider_screening_id: screening.providerScreeningId,
        provider_result: screening.providerResult,
        provider_status: screening.providerStatus,
        decision: screening.decision,
        decision_reason: screening.decisionReason,
        rule_name: screening.ruleName,
        actions: screening.actions,
        risk_score: screening.riskScore,
        risk_categories: screening.riskCategories,
        reasons: screening.reasons,
        alert_id: screening.alertId,
        raw_response: screening.rawResponse,
        request_id: screening.requestId,
      },
    ])
    return rows[0] ? mapShieldScreening(rows[0]) : null
  } catch (error) {
    logSupabaseError("shield screening insert", error)
    return null
  }
}

export async function findSupabaseShieldScreening(idempotencyKey: string): Promise<ShieldScreening | null> {
  if (!isSupabaseConfigured()) return null

  try {
    const rows = await getRows<ShieldScreeningRow>(
      "compliance_screenings",
      `select=*&workspace_id=eq.${encodeURIComponent(WORKSPACE_ID)}&idempotency_key=eq.${encodeURIComponent(idempotencyKey)}&limit=1`,
    )
    return rows[0] ? mapShieldScreening(rows[0]) : null
  } catch (error) {
    logSupabaseError("shield screening lookup", error)
    return null
  }
}

export async function listSupabaseShieldScreenings(limit = 50): Promise<ShieldScreening[] | null> {
  if (!isSupabaseConfigured()) return null

  try {
    const rows = await getRows<ShieldScreeningRow>(
      "compliance_screenings",
      `select=*&workspace_id=eq.${encodeURIComponent(WORKSPACE_ID)}&order=created_at.desc&limit=${limit}`,
    )
    return rows.map(mapShieldScreening)
  } catch (error) {
    logSupabaseError("shield screening list", error)
    return null
  }
}

export async function checkSupabaseShieldReadiness() {
  if (!isSupabaseConfigured()) return false
  try {
    await getRows<Pick<ShieldScreeningRow, "id">>("compliance_screenings", "select=id&limit=1")
    return true
  } catch {
    return false
  }
}

export async function insertSupabaseFlowRun(
  run: Omit<FlowRun, "workspaceId" | "createdAt" | "updatedAt">,
): Promise<FlowRun | null> {
  if (!isSupabaseConfigured()) return null
  try {
    const rows = await postRows<FlowRunRow>("flow_runs", [{
      id: run.id,
      workspace_id: WORKSPACE_ID,
      idempotency_key: run.idempotencyKey,
      agent_id: run.agentId,
      api_id: run.apiId,
      recipient_address: run.recipientAddress,
      screening_chain: run.screeningChain,
      amount_usdc: run.amountUsdc,
      status: run.status,
      current_step: run.currentStep,
      steps: run.steps,
      screening_id: run.screeningId,
      screening_decision: run.screeningDecision,
      access_decision_id: run.accessDecisionId,
      access_allowed: run.accessAllowed,
      settlement_id: run.settlementId,
      tx_hash: run.txHash,
      explorer_url: run.explorerUrl,
      reputation_score_before: run.reputationScoreBefore,
      reputation_score_after: run.reputationScoreAfter,
      error_code: run.errorCode,
      error_message: run.errorMessage,
      request_id: run.requestId,
      completed_at: run.completedAt,
    }])
    return rows[0] ? mapFlowRun(rows[0]) : null
  } catch (error) {
    logSupabaseError("flow run insert", error)
    return null
  }
}

export async function updateSupabaseFlowRun(
  runId: string,
  updates: Partial<Omit<FlowRun, "id" | "workspaceId" | "idempotencyKey" | "createdAt">>,
): Promise<FlowRun | null> {
  if (!isSupabaseConfigured()) return null
  const row: Partial<FlowRunRow> = { updated_at: new Date().toISOString() }
  if (updates.status !== undefined) row.status = updates.status
  if (updates.currentStep !== undefined) row.current_step = updates.currentStep
  if (updates.steps !== undefined) row.steps = updates.steps
  if (updates.screeningId !== undefined) row.screening_id = updates.screeningId
  if (updates.screeningDecision !== undefined) row.screening_decision = updates.screeningDecision
  if (updates.accessDecisionId !== undefined) row.access_decision_id = updates.accessDecisionId
  if (updates.accessAllowed !== undefined) row.access_allowed = updates.accessAllowed
  if (updates.settlementId !== undefined) row.settlement_id = updates.settlementId
  if (updates.txHash !== undefined) row.tx_hash = updates.txHash
  if (updates.explorerUrl !== undefined) row.explorer_url = updates.explorerUrl
  if (updates.reputationScoreBefore !== undefined) row.reputation_score_before = updates.reputationScoreBefore
  if (updates.reputationScoreAfter !== undefined) row.reputation_score_after = updates.reputationScoreAfter
  if (updates.errorCode !== undefined) row.error_code = updates.errorCode
  if (updates.errorMessage !== undefined) row.error_message = updates.errorMessage
  if (updates.requestId !== undefined) row.request_id = updates.requestId
  if (updates.completedAt !== undefined) row.completed_at = updates.completedAt

  try {
    const rows = await patchRows<FlowRunRow>(
      "flow_runs",
      `id=eq.${encodeURIComponent(runId)}&workspace_id=eq.${encodeURIComponent(WORKSPACE_ID)}`,
      row,
    )
    return rows[0] ? mapFlowRun(rows[0]) : null
  } catch (error) {
    logSupabaseError("flow run update", error)
    return null
  }
}

export async function findSupabaseFlowRun(idempotencyKey: string): Promise<FlowRun | null> {
  if (!isSupabaseConfigured()) return null
  try {
    const rows = await getRows<FlowRunRow>(
      "flow_runs",
      `select=*&workspace_id=eq.${encodeURIComponent(WORKSPACE_ID)}&idempotency_key=eq.${encodeURIComponent(idempotencyKey)}&limit=1`,
    )
    return rows[0] ? mapFlowRun(rows[0]) : null
  } catch (error) {
    logSupabaseError("flow run lookup", error)
    return null
  }
}

export async function listSupabaseFlowRuns(limit = 50): Promise<FlowRun[] | null> {
  if (!isSupabaseConfigured()) return null
  try {
    const rows = await getRows<FlowRunRow>(
      "flow_runs",
      `select=*&workspace_id=eq.${encodeURIComponent(WORKSPACE_ID)}&order=created_at.desc&limit=${limit}`,
    )
    return rows.map(mapFlowRun)
  } catch (error) {
    logSupabaseError("flow run list", error)
    return null
  }
}

export async function checkSupabaseFlowReadiness() {
  if (!isSupabaseConfigured()) return false
  try {
    await getRows<Pick<FlowRunRow, "id">>("flow_runs", "select=id&limit=1")
    return true
  } catch {
    return false
  }
}

export async function updateSupabaseArcSettlement(
  settlementId: string,
  updates: {
    status?: ArcSettlementStatus
    txHash?: string | null
    explorerUrl?: string | null
    gasEstimate?: Record<string, unknown>
    providerReceipt?: Record<string, unknown>
    errorCode?: string | null
    errorMessage?: string | null
  },
): Promise<ArcSettlement | null> {
  if (!isSupabaseConfigured()) return null

  const row: Partial<ArcSettlementRow> = {
    updated_at: new Date().toISOString(),
  }
  if (updates.status !== undefined) row.status = updates.status
  if (updates.txHash !== undefined) row.tx_hash = updates.txHash
  if (updates.explorerUrl !== undefined) row.explorer_url = updates.explorerUrl
  if (updates.gasEstimate !== undefined) row.gas_estimate = updates.gasEstimate
  if (updates.providerReceipt !== undefined) row.provider_receipt = updates.providerReceipt
  if (updates.errorCode !== undefined) row.error_code = updates.errorCode
  if (updates.errorMessage !== undefined) row.error_message = updates.errorMessage

  try {
    const rows = await patchRows<ArcSettlementRow>(
      "arc_settlements",
      `id=eq.${encodeURIComponent(settlementId)}&workspace_id=eq.${encodeURIComponent(WORKSPACE_ID)}`,
      row,
    )
    return rows[0] ? mapArcSettlement(rows[0]) : null
  } catch (error) {
    logSupabaseError("arc settlement update", error)
    return null
  }
}

export async function finalizeSupabaseArcSettlement(input: {
  settlementId: string
  transactionId: string
  txHash: string
  explorerUrl: string
  gasEstimate: Record<string, unknown>
  providerReceipt: Record<string, unknown>
  occurredAt: string
}): Promise<ArcSettlementResult | null> {
  if (!isSupabaseConfigured()) return null

  try {
    const finalized = await postRpc<FinalizeArcSettlementRow>("finalize_arc_settlement", {
      p_settlement_id: input.settlementId,
      p_transaction_id: input.transactionId,
      p_tx_hash: input.txHash,
      p_explorer_url: input.explorerUrl,
      p_gas_estimate: input.gasEstimate,
      p_provider_receipt: input.providerReceipt,
      p_occurred_at: input.occurredAt,
    })
    const [settlementRows, transactionRows] = await Promise.all([
      getRows<ArcSettlementRow>(
        "arc_settlements",
        `select=*&id=eq.${encodeURIComponent(input.settlementId)}&workspace_id=eq.${encodeURIComponent(WORKSPACE_ID)}&limit=1`,
      ),
      getRows<TransactionRow>(
        "transactions",
        `select=*&id=eq.${encodeURIComponent(input.transactionId)}&workspace_id=eq.${encodeURIComponent(WORKSPACE_ID)}&limit=1`,
      ),
    ])

    if (!settlementRows[0] || !transactionRows[0]) return null
    return {
      settlement: mapArcSettlement(settlementRows[0]),
      transaction: mapTransaction(transactionRows[0]),
      scoreDelta: finalized.scoreDelta,
    }
  } catch (error) {
    logSupabaseError("arc settlement finalize", error)
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
}): Promise<AccessDecisionLog | null> {
  if (!isSupabaseConfigured()) return null

  try {
    const rows = await postRows<AccessDecisionRow>("access_decisions", [
      {
        id: `dec_${randomUUID()}`,
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
    return rows[0] ? mapAccessDecision(rows[0]) : null
  } catch {
    // Access checks should remain available even if audit logging is temporarily unavailable.
    return null
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

export async function deleteSupabaseRateLimitEventsBefore(olderThanIso: string): Promise<number | null> {
  if (!isSupabaseConfigured()) return null

  try {
    const rows = await deleteRows<{ id: string }>(
      "rate_limit_events",
      `workspace_id=eq.${encodeURIComponent(WORKSPACE_ID)}&created_at=lt.${encodeURIComponent(olderThanIso)}&select=id`,
    )
    return rows.length
  } catch (error) {
    logSupabaseError("rate limit cleanup", error)
    return null
  }
}

export async function insertSupabaseOpsHealthCheck(input: OpsHealthCheckInput): Promise<OpsHealthCheck | null> {
  if (!isSupabaseConfigured()) return null

  try {
    const rows = await postRows<OpsHealthCheckRow>("ops_health_checks", [
      {
        id: `ops_${randomUUID()}`,
        workspace_id: WORKSPACE_ID,
        monitor_name: input.monitorName ?? "Arc Suite Production Monitor",
        source: input.source ?? "local",
        status: input.status,
        check_count: input.checks,
        warning_count: input.warningCount,
        failure_count: input.failureCount,
        duration_ms: input.durationMs,
        latency_warn_ms: input.latencyWarnMs ?? null,
        latency_fail_ms: input.latencyFailMs ?? null,
        branch: input.branch ?? null,
        commit_sha: input.commitSha ?? null,
        run_id: input.runId ?? null,
        run_url: input.runUrl ?? null,
        results: input.results,
        warnings: input.warnings ?? [],
        metadata: input.metadata ?? {},
      },
    ])

    return rows[0] ? mapOpsHealthCheck(rows[0]) : null
  } catch (error) {
    logSupabaseError("ops health insert", error)
    return null
  }
}

export async function listSupabaseOpsHealthChecks(limit = 50): Promise<OpsHealthCheck[] | null> {
  if (!isSupabaseConfigured()) return null

  try {
    const rows = await getRows<OpsHealthCheckRow>(
      "ops_health_checks",
      `select=*&workspace_id=eq.${encodeURIComponent(WORKSPACE_ID)}&order=created_at.desc&limit=${limit}`,
    )
    return rows.map(mapOpsHealthCheck)
  } catch (error) {
    logSupabaseError("ops health list", error)
    return null
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

  const tables = ["workspaces", "agents", "analytics_events", "investor_leads", "rate_limit_events", "ops_health_checks", "arc_settlements"]
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

async function postRpc<T>(functionName: string, body: unknown): Promise<T> {
  const response = await fetch(`${SUPABASE_URL?.replace(/\/$/, "")}/rest/v1/rpc/${functionName}`, {
    body: JSON.stringify(body),
    headers: supabaseHeaders(),
    method: "POST",
  })

  if (!response.ok) throw new Error(`Supabase RPC failed for ${functionName}`)
  return response.json() as Promise<T>
}

async function deleteRows<T>(table: string, query: string): Promise<T[]> {
  const response = await fetch(`${restBaseUrl()}/${table}?${query}`, {
    headers: {
      ...supabaseHeaders(),
      Prefer: "return=representation",
    },
    method: "DELETE",
  })

  if (!response.ok) throw new Error(`Supabase delete failed for ${table}`)
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
  const message = error instanceof Error ? error.message : "unknown error"
  logOperationalEvent({
    details: { message },
    event: "supabase.error",
    level: "error",
    route: scope,
  })

  if (process.env.NODE_ENV !== "production") {
    console.error(`[supabase:${scope}]`, error)
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

function mapOpsHealthCheck(row: OpsHealthCheckRow): OpsHealthCheck {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    monitorName: row.monitor_name,
    source: row.source,
    status: row.status,
    checks: row.check_count,
    warningCount: row.warning_count,
    failureCount: row.failure_count,
    durationMs: row.duration_ms,
    latencyWarnMs: row.latency_warn_ms,
    latencyFailMs: row.latency_fail_ms,
    branch: row.branch,
    commitSha: row.commit_sha,
    runId: row.run_id,
    runUrl: row.run_url,
    results: row.results ?? [],
    warnings: row.warnings ?? [],
    metadata: row.metadata ?? {},
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
    explorerUrl: row.explorer_url ?? null,
    sourceAddress: row.source_address ?? null,
    chainId: row.chain_id === null || row.chain_id === undefined ? null : toNumber(row.chain_id),
    settlementId: row.settlement_id ?? null,
  }
}

function mapArcSettlement(row: ArcSettlementRow): ArcSettlement {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    idempotencyKey: row.idempotency_key,
    agentId: row.agent_id,
    apiId: row.api_id,
    accessDecisionId: row.access_decision_id,
    transactionId: row.transaction_id,
    sourceAddress: row.source_address,
    recipientAddress: row.recipient_address,
    amountUsdc: toNumber(row.amount_usdc),
    chainId: toNumber(row.chain_id),
    network: row.network,
    provider: row.provider,
    status: row.status,
    txHash: row.tx_hash,
    explorerUrl: row.explorer_url,
    gasEstimate: row.gas_estimate ?? {},
    providerReceipt: row.provider_receipt ?? {},
    reputationScoreBefore: row.reputation_score_before,
    reputationScoreAfter: row.reputation_score_after,
    errorCode: row.error_code,
    errorMessage: row.error_message,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    confirmedAt: row.confirmed_at,
  }
}

function mapShieldScreening(row: ShieldScreeningRow): ShieldScreening {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    idempotencyKey: row.idempotency_key,
    address: row.address,
    chain: row.chain,
    provider: row.provider,
    providerScreeningId: row.provider_screening_id,
    providerResult: row.provider_result,
    providerStatus: row.provider_status,
    decision: row.decision,
    decisionReason: row.decision_reason,
    ruleName: row.rule_name,
    actions: row.actions ?? [],
    riskScore: row.risk_score,
    riskCategories: row.risk_categories ?? [],
    reasons: row.reasons ?? [],
    alertId: row.alert_id,
    rawResponse: row.raw_response ?? {},
    requestId: row.request_id,
    createdAt: row.created_at,
  }
}

function mapFlowRun(row: FlowRunRow): FlowRun {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    idempotencyKey: row.idempotency_key,
    agentId: row.agent_id,
    apiId: row.api_id,
    recipientAddress: row.recipient_address,
    screeningChain: row.screening_chain,
    amountUsdc: toNumber(row.amount_usdc),
    status: row.status,
    currentStep: row.current_step,
    steps: row.steps ?? [],
    screeningId: row.screening_id,
    screeningDecision: row.screening_decision,
    accessDecisionId: row.access_decision_id,
    accessAllowed: row.access_allowed,
    settlementId: row.settlement_id,
    txHash: row.tx_hash,
    explorerUrl: row.explorer_url,
    reputationScoreBefore: row.reputation_score_before,
    reputationScoreAfter: row.reputation_score_after,
    errorCode: row.error_code,
    errorMessage: row.error_message,
    requestId: row.request_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    completedAt: row.completed_at,
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
