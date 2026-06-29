import { createHash, randomBytes, randomUUID } from "crypto"
import { logOperationalEvent } from "./observability"
import type {
  AccessDecisionLog,
  Agent,
  AnalyticsEvent,
  AnalyticsEventInput,
  AnalyticsSource,
  ArcAgentIdentity,
  ArcAgentJob,
  ArcAgentJobArtifact,
  ArcAgentJobValidation,
  ArcSettlement,
  ArcSettlementResult,
  ArcSettlementStatus,
  BillingAccount,
  BillingInvoice,
  BillingOverview,
  BillingPlan,
  BillingSettlementBatch,
  BillingUsageEvent,
  EscrowDeal,
  EscrowEvent,
  EscrowMilestone,
  EscrowOverview,
  ExecutionJob,
  ExecutionOverview,
  FlowRun,
  GasOverview,
  GasPolicy,
  GasSponsorship,
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
  WalletAccount,
  WalletLifecycleEvent,
  WalletOverview,
  WalletRole,
  WalletSigningPolicy,
  CircleWebhookEvent,
  WorkspaceApiKey,
  WorkspaceApiKeyCreated,
  WorkspaceMember,
} from "./schema"
import type { StoredAgenticProof } from "../agentic-demo-proof"

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
  memo_label?: string | null
  memo?: Record<string, unknown> | null
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
  memo_label?: string | null
  memo?: Record<string, unknown> | null
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

type ArcAgentIdentityRow = {
  id: string
  workspace_id: string
  agent_id: string
  standard: ArcAgentIdentity["standard"]
  registry_address: string | null
  agent_uri: string
  service_endpoint: string
  wallet_address: string
  validation_endpoint: string
  reputation_endpoint: string
  capabilities: string[] | null
  trust_model: ArcAgentIdentity["trustModel"] | null
  metadata: Record<string, unknown> | null
  status: ArcAgentIdentity["status"]
  registered_at: string
  updated_at: string
}

type ArcAgentJobRow = {
  id: string
  workspace_id: string
  agent_identity_id: string
  requester_agent_id: string
  provider_agent_id: string
  api_id: string
  flow_run_id: string | null
  execution_job_id: string | null
  standard: ArcAgentJob["standard"]
  kind: ArcAgentJob["kind"]
  status: ArcAgentJob["status"]
  requested_capability: string
  amount_usdc: string | number
  input_hash: string
  output_hash: string | null
  policy_hash: string
  receipt_hash: string | null
  settlement_id: string | null
  tx_hash: string | null
  constraints: ArcAgentJob["constraints"] | null
  metadata: Record<string, unknown> | null
  created_at: string
  updated_at: string
  completed_at: string | null
}

type ArcAgentJobArtifactRow = {
  id: string
  workspace_id: string
  job_id: string
  type: ArcAgentJobArtifact["type"]
  uri: string
  digest: string
  signature: string | null
  created_at: string
}

type ArcAgentJobValidationRow = {
  id: string
  workspace_id: string
  job_id: string
  validator_agent_id: string | null
  result: ArcAgentJobValidation["result"]
  score: string | number
  evidence_uri: string
  evidence_hash: string
  signature: string
  created_at: string
}

type BillingPlanRow = {
  id: string
  workspace_id: string
  name: string
  monthly_fee_usdc: string | number
  included_units: string | number
  discount_bps: number
  active: boolean
  created_at: string
}

type BillingAccountRow = {
  id: string
  workspace_id: string
  agent_id: string
  plan_id: string
  prepaid_balance_usdc: string | number
  low_balance_threshold_usdc: string | number
  status: BillingAccount["status"]
  current_period_start: string
  current_period_end: string
  created_at: string
  updated_at: string
}

type BillingUsageRow = {
  id: string
  workspace_id: string
  billing_account_id: string
  agent_id: string
  api_id: string
  idempotency_key: string
  units: string | number
  unit_price_usdc: string | number
  gross_amount_usdc: string | number
  discount_usdc: string | number
  net_amount_usdc: string | number
  pricing_unit: string
  invoice_id: string
  batch_id: string | null
  metadata: Record<string, unknown> | null
  occurred_at: string
  created_at: string
}

type BillingInvoiceRow = {
  id: string
  workspace_id: string
  billing_account_id: string
  agent_id: string
  period_start: string
  period_end: string
  status: BillingInvoice["status"]
  usage_count: number
  subtotal_usdc: string | number
  discount_usdc: string | number
  total_usdc: string | number
  batch_id: string | null
  created_at: string
  updated_at: string
}

type BillingBatchRow = {
  id: string
  workspace_id: string
  status: BillingSettlementBatch["status"]
  usage_count: number
  invoice_count: number
  gross_amount_usdc: string | number
  net_amount_usdc: string | number
  settlement_id: string | null
  tx_hash: string | null
  explorer_url: string | null
  created_at: string
  updated_at: string
  settled_at: string | null
}

type BillingSummaryRow = {
  prepaid_balance_usdc: string | number
  metered_usage_usdc: string | number
  unbatched_usage_usdc: string | number
  active_accounts: string | number
  low_balance_accounts: string | number
}

type GasPolicyRow = {
  id: string
  workspace_id: string
  agent_id: string
  mode: GasPolicy["mode"]
  status: GasPolicy["status"]
  per_tx_limit_usdc: string | number
  daily_limit_usdc: string | number
  monthly_limit_usdc: string | number
  daily_spent_usdc: string | number
  monthly_spent_usdc: string | number
  sponsored_count: string | number
  denied_count: string | number
  allowed_contracts: string[] | null
  created_at: string
  updated_at: string
}

type GasSponsorshipRow = {
  id: string
  workspace_id: string
  policy_id: string
  agent_id: string
  idempotency_key: string
  mode: GasSponsorship["mode"]
  network: string
  action: string
  destination: string | null
  estimated_fee_usdc: string | number
  actual_fee_usdc: string | number | null
  status: GasSponsorship["status"]
  decision_reason: string
  provider: string
  provider_transaction_id: string | null
  tx_hash: string | null
  explorer_url: string | null
  metadata: Record<string, unknown> | null
  created_at: string
  updated_at: string
  confirmed_at: string | null
}

type WalletAccountRow = {
  id: string
  workspace_id: string
  name: string
  owner_label: string
  custody_model: WalletAccount["custodyModel"]
  account_type: WalletAccount["accountType"]
  status: WalletAccount["status"]
  network: string
  address: string | null
  circle_wallet_id: string | null
  circle_wallet_set_id: string | null
  auth_method: WalletAccount["authMethod"]
  recovery_method: WalletAccount["recoveryMethod"]
  created_at: string
  updated_at: string
  last_signed_at: string | null
}

type WalletRoleRow = {
  id: string
  workspace_id: string
  wallet_id: string
  principal: string
  role: WalletRole["role"]
  status: WalletRole["status"]
  created_at: string
  revoked_at: string | null
}

type WalletSigningPolicyRow = {
  id: string
  workspace_id: string
  wallet_id: string
  status: WalletSigningPolicy["status"]
  approvals_required: number
  transaction_limit_usdc: string | number
  daily_limit_usdc: string | number
  allowed_contracts: string[] | null
  require_shield: boolean
  require_reputation_score: number
  updated_at: string
}

type WalletLifecycleEventRow = {
  id: string
  workspace_id: string
  wallet_id: string
  action: WalletLifecycleEvent["action"]
  status: WalletLifecycleEvent["status"]
  actor: string
  detail: string
  provider_operation_id: string | null
  tx_hash: string | null
  explorer_url: string | null
  metadata: Record<string, unknown> | null
  created_at: string
  completed_at: string | null
}

type ExecutionJobRow = {
  id: string
  workspace_id: string
  idempotency_key: string
  kind: ExecutionJob["kind"]
  resource_type: ExecutionJob["resourceType"]
  resource_id: string
  action: string
  status: ExecutionJob["status"]
  provider: ExecutionJob["provider"]
  provider_operation_id: string | null
  payload: Record<string, unknown> | null
  provider_receipt: Record<string, unknown> | null
  attempts: number
  max_attempts: number
  next_attempt_at: string
  lease_owner: string | null
  lease_expires_at: string | null
  last_error_code: string | null
  last_error_message: string | null
  created_at: string
  updated_at: string
  completed_at: string | null
}

type CircleWebhookEventRow = {
  id: string
  workspace_id: string
  notification_id: string
  subscription_id: string | null
  notification_type: string
  provider_operation_id: string | null
  signature_key_id: string | null
  signature_verified: boolean
  payload: Record<string, unknown>
  processing_status: CircleWebhookEvent["processingStatus"]
  processing_error: string | null
  received_at: string
  processed_at: string | null
}

type EscrowDealRow = {
  id: string
  workspace_id: string
  idempotency_key: string
  title: string
  description: string
  buyer_agent_id: string
  seller_agent_id: string
  total_amount_usdc: string | number
  released_amount_usdc: string | number
  refunded_amount_usdc: string | number
  status: EscrowDeal["status"]
  contract_address: string | null
  contract_deal_id: string | null
  funding_tx_hash: string | null
  explorer_url: string | null
  dispute_reason: string | null
  created_at: string
  updated_at: string
  completed_at: string | null
}

type EscrowMilestoneRow = {
  id: string
  workspace_id: string
  deal_id: string
  position: number
  title: string
  description: string
  amount_usdc: string | number
  status: EscrowMilestone["status"]
  due_at: string | null
  submitted_at: string | null
  released_at: string | null
  refunded_at: string | null
  tx_hash: string | null
  explorer_url: string | null
  created_at: string
  updated_at: string
}

type EscrowEventRow = {
  id: string
  workspace_id: string
  deal_id: string
  milestone_id: string | null
  type: EscrowEvent["type"]
  actor: string
  detail: string
  amount_usdc: string | number
  tx_hash: string | null
  explorer_url: string | null
  provider_receipt: Record<string, unknown> | null
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

export async function getSupabaseRecentArcSettlements(limit = 6): Promise<ArcSettlement[]> {
  if (!isSupabaseConfigured()) return []

  try {
    const safeLimit = Math.min(Math.max(Math.floor(limit), 1), 12)
    const rows = await getRows<ArcSettlementRow>(
      "arc_settlements",
      `select=*&workspace_id=eq.${encodeURIComponent(WORKSPACE_ID)}&order=updated_at.desc&limit=${safeLimit}`,
    )
    return rows.map(mapArcSettlement)
  } catch (error) {
    logSupabaseError("recent arc settlements", error)
    return []
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
  memoLabel?: string | null
  memo?: Record<string, unknown>
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
        memo_label: input.memoLabel ?? null,
        memo: input.memo ?? {},
      },
    ])
    return rows[0] ? mapArcSettlement(rows[0]) : null
  } catch (error) {
    logSupabaseError("arc settlement insert", error)
    throw error
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

export async function ensureSupabaseArcAgentIdentity(identity: ArcAgentIdentity): Promise<ArcAgentIdentity | null> {
  if (!isSupabaseConfigured()) return null
  try {
    const existing = await getRows<ArcAgentIdentityRow>(
      "arc_agent_identities",
      `select=*&workspace_id=eq.${encodeURIComponent(WORKSPACE_ID)}&id=eq.${encodeURIComponent(identity.id)}&limit=1`,
    )
    if (existing[0]) return mapArcAgentIdentity(existing[0])

    const rows = await postRows<ArcAgentIdentityRow>("arc_agent_identities", [toArcAgentIdentityRow(identity)])
    return rows[0] ? mapArcAgentIdentity(rows[0]) : null
  } catch (error) {
    logSupabaseError("arc agent identity upsert", error)
    return null
  }
}

export async function insertSupabaseArcAgentJob(job: ArcAgentJob): Promise<ArcAgentJob | null> {
  if (!isSupabaseConfigured()) return null
  try {
    const rows = await postRows<ArcAgentJobRow>("arc_agent_jobs", [toArcAgentJobRow(job)])
    return rows[0] ? mapArcAgentJob(rows[0]) : null
  } catch (error) {
    logSupabaseError("arc agent job insert", error)
    return null
  }
}

export async function insertSupabaseArcAgentJobArtifacts(artifacts: ArcAgentJobArtifact[]): Promise<ArcAgentJobArtifact[] | null> {
  if (!isSupabaseConfigured()) return null
  try {
    const rows = await postRows<ArcAgentJobArtifactRow>("arc_agent_job_artifacts", artifacts.map(toArcAgentJobArtifactRow))
    return rows.map(mapArcAgentJobArtifact)
  } catch (error) {
    logSupabaseError("arc agent job artifact insert", error)
    return null
  }
}

export async function insertSupabaseArcAgentJobValidation(
  validation: ArcAgentJobValidation,
): Promise<ArcAgentJobValidation | null> {
  if (!isSupabaseConfigured()) return null
  try {
    const rows = await postRows<ArcAgentJobValidationRow>("arc_agent_job_validations", [toArcAgentJobValidationRow(validation)])
    return rows[0] ? mapArcAgentJobValidation(rows[0]) : null
  } catch (error) {
    logSupabaseError("arc agent job validation insert", error)
    return null
  }
}

export async function getSupabaseAgenticProof(id: string): Promise<StoredAgenticProof | null> {
  if (!isSupabaseConfigured()) return null
  try {
    const flowRows = await getRows<FlowRunRow>(
      "flow_runs",
      `select=*&workspace_id=eq.${encodeURIComponent(WORKSPACE_ID)}&id=eq.${encodeURIComponent(id)}&limit=1`,
    )
    const flowRun = flowRows[0] ? mapFlowRun(flowRows[0]) : null

    const jobRows = await getOptionalRows<ArcAgentJobRow>(
      "arc_agent_jobs",
      flowRun
        ? `select=*&workspace_id=eq.${encodeURIComponent(WORKSPACE_ID)}&flow_run_id=eq.${encodeURIComponent(flowRun.id)}&limit=1`
        : `select=*&workspace_id=eq.${encodeURIComponent(WORKSPACE_ID)}&id=eq.${encodeURIComponent(id)}&limit=1`,
      "agentic proof job lookup",
    )
    const job = jobRows[0] ? mapArcAgentJob(jobRows[0]) : null
    if (!flowRun && !job) return null

    const resolvedFlowRun = flowRun
    const artifactRows = job
      ? await getOptionalRows<ArcAgentJobArtifactRow>(
          "arc_agent_job_artifacts",
          `select=*&workspace_id=eq.${encodeURIComponent(WORKSPACE_ID)}&job_id=eq.${encodeURIComponent(job.id)}&order=created_at.asc`,
          "agentic proof artifact lookup",
        )
      : []
    const validationRows = job
      ? await getOptionalRows<ArcAgentJobValidationRow>(
          "arc_agent_job_validations",
          `select=*&workspace_id=eq.${encodeURIComponent(WORKSPACE_ID)}&job_id=eq.${encodeURIComponent(job.id)}&order=created_at.desc&limit=1`,
          "agentic proof validation lookup",
        )
      : []
    const identityRows = job
      ? await getOptionalRows<ArcAgentIdentityRow>(
          "arc_agent_identities",
          `select=*&workspace_id=eq.${encodeURIComponent(WORKSPACE_ID)}&id=eq.${encodeURIComponent(job.agentIdentityId)}&limit=1`,
          "agentic proof identity lookup",
        )
      : []

    if (!resolvedFlowRun) return null

    return {
      artifacts: artifactRows.map(mapArcAgentJobArtifact),
      flowRun: resolvedFlowRun,
      identity: identityRows[0] ? mapArcAgentIdentity(identityRows[0]) : null,
      job,
      validation: validationRows[0] ? mapArcAgentJobValidation(validationRows[0]) : null,
    }
  } catch (error) {
    logSupabaseError("agentic proof lookup", error)
    return null
  }
}

export async function checkSupabaseArcAgentReadiness() {
  if (!isSupabaseConfigured()) return false
  try {
    await Promise.all([
      getRows<Pick<ArcAgentIdentityRow, "id">>("arc_agent_identities", "select=id&limit=1"),
      getRows<Pick<ArcAgentJobRow, "id">>("arc_agent_jobs", "select=id&limit=1"),
      getRows<Pick<ArcAgentJobArtifactRow, "id">>("arc_agent_job_artifacts", "select=id&limit=1"),
      getRows<Pick<ArcAgentJobValidationRow, "id">>("arc_agent_job_validations", "select=id&limit=1"),
    ])
    return true
  } catch {
    return false
  }
}

export async function getSupabaseBillingOverview(limit = 50): Promise<BillingOverview | null> {
  if (!isSupabaseConfigured()) return null
  try {
    const [planRows, accountRows, usageRows, invoiceRows, batchRows, summaryRow] = await Promise.all([
      getRows<BillingPlanRow>("billing_plans", `select=*&workspace_id=eq.${encodeURIComponent(WORKSPACE_ID)}&order=created_at.asc`),
      getRows<BillingAccountRow>("billing_accounts", `select=*&workspace_id=eq.${encodeURIComponent(WORKSPACE_ID)}&order=created_at.asc`),
      getRows<BillingUsageRow>("billing_usage_events", `select=*&workspace_id=eq.${encodeURIComponent(WORKSPACE_ID)}&order=occurred_at.desc&limit=${limit}`),
      getRows<BillingInvoiceRow>("billing_invoices", `select=*&workspace_id=eq.${encodeURIComponent(WORKSPACE_ID)}&order=created_at.desc&limit=${limit}`),
      getRows<BillingBatchRow>("billing_settlement_batches", `select=*&workspace_id=eq.${encodeURIComponent(WORKSPACE_ID)}&order=created_at.desc&limit=${limit}`),
      postRpc<BillingSummaryRow>("get_billing_summary", { p_workspace_id: WORKSPACE_ID }),
    ])
    const accounts = accountRows.map(mapBillingAccount)
    const usage = usageRows.map(mapBillingUsage)
    return {
      plans: planRows.map(mapBillingPlan),
      accounts,
      usage,
      invoices: invoiceRows.map(mapBillingInvoice),
      batches: batchRows.map(mapBillingBatch),
      summary: {
        prepaidBalanceUsdc: toNumber(summaryRow.prepaid_balance_usdc),
        meteredUsageUsdc: toNumber(summaryRow.metered_usage_usdc),
        unbatchedUsageUsdc: toNumber(summaryRow.unbatched_usage_usdc),
        activeAccounts: toNumber(summaryRow.active_accounts),
        lowBalanceAccounts: toNumber(summaryRow.low_balance_accounts),
      },
    }
  } catch (error) {
    logSupabaseError("billing overview", error)
    return null
  }
}

export async function recordSupabaseBillingUsage(input: {
  id: string
  agentId: string
  apiId: string
  idempotencyKey: string
  units: number
  metadata: Record<string, unknown>
  occurredAt: string
}): Promise<BillingUsageEvent | null> {
  if (!isSupabaseConfigured()) return null
  try {
    const row = await postRpc<BillingUsageRow>("record_billing_usage", {
      p_event_id: input.id,
      p_workspace_id: WORKSPACE_ID,
      p_agent_id: input.agentId,
      p_api_id: input.apiId,
      p_idempotency_key: input.idempotencyKey,
      p_units: input.units,
      p_metadata: input.metadata,
      p_occurred_at: input.occurredAt,
    })
    return row ? mapBillingUsage(row) : null
  } catch (error) {
    logSupabaseError("billing usage", error)
    throw error
  }
}

export async function topUpSupabaseBillingAccount(agentId: string, amountUsdc: number): Promise<BillingAccount | null> {
  if (!isSupabaseConfigured()) return null
  const row = await postRpc<BillingAccountRow>("top_up_billing_account", {
    p_workspace_id: WORKSPACE_ID,
    p_agent_id: agentId,
    p_amount_usdc: amountUsdc,
  })
  return row ? mapBillingAccount(row) : null
}

export async function createSupabaseBillingBatch(): Promise<BillingSettlementBatch | null> {
  if (!isSupabaseConfigured()) return null
  const row = await postRpc<BillingBatchRow>("create_billing_settlement_batch", {
    p_batch_id: `batch_${randomUUID()}`,
    p_workspace_id: WORKSPACE_ID,
  })
  return row ? mapBillingBatch(row) : null
}

export async function checkSupabaseBillingReadiness() {
  if (!isSupabaseConfigured()) return false
  try {
    await getRows<Pick<BillingAccountRow, "id">>("billing_accounts", "select=id&limit=1")
    return true
  } catch {
    return false
  }
}

export async function getSupabaseGasOverview(limit = 100): Promise<GasOverview | null> {
  if (!isSupabaseConfigured()) return null
  try {
    const [policyRows, sponsorshipRows] = await Promise.all([
      getRows<GasPolicyRow>("gas_policies", `select=*&workspace_id=eq.${encodeURIComponent(WORKSPACE_ID)}&order=updated_at.desc`),
      getRows<GasSponsorshipRow>("gas_sponsorships", `select=*&workspace_id=eq.${encodeURIComponent(WORKSPACE_ID)}&order=created_at.desc&limit=${limit}`),
    ])
    const policies = policyRows.map(mapGasPolicy)
    const sponsorships = sponsorshipRows.map(mapGasSponsorship)
    return {
      policies,
      sponsorships,
      configuration: {
        circleConfigured: Boolean(process.env.CIRCLE_API_KEY),
        network: "ARC-TESTNET",
        modes: ["gas_station", "paymaster"],
      },
      summary: {
        sponsoredUsdc: sponsorships
          .filter((item) => item.status !== "denied" && item.status !== "failed")
          .reduce((total, item) => total + (item.actualFeeUsdc ?? item.estimatedFeeUsdc), 0),
        sponsoredTransactions: sponsorships.filter((item) => item.status !== "denied" && item.status !== "failed").length,
        deniedTransactions: sponsorships.filter((item) => item.status === "denied").length,
        activePolicies: policies.filter((policy) => policy.status === "active").length,
      },
    }
  } catch (error) {
    logSupabaseError("gas overview", error)
    return null
  }
}

export async function requestSupabaseGasSponsorship(input: {
  agentId: string
  idempotencyKey: string
  action: string
  destination?: string | null
  estimatedFeeUsdc: number
  metadata?: Record<string, unknown>
}): Promise<GasSponsorship | null> {
  if (!isSupabaseConfigured()) return null
  const row = await postRpc<GasSponsorshipRow>("request_gas_sponsorship", {
    p_id: `gsp_${randomUUID()}`,
    p_workspace_id: WORKSPACE_ID,
    p_agent_id: input.agentId,
    p_idempotency_key: input.idempotencyKey,
    p_action: input.action,
    p_destination: input.destination ?? null,
    p_estimated_fee_usdc: input.estimatedFeeUsdc,
    p_metadata: input.metadata ?? {},
  })
  return row ? mapGasSponsorship(row) : null
}

export async function updateSupabaseGasPolicy(input: {
  agentId: string
  mode: GasPolicy["mode"]
  status: GasPolicy["status"]
  perTxLimitUsdc: number
  dailyLimitUsdc: number
  monthlyLimitUsdc: number
}): Promise<GasPolicy | null> {
  if (!isSupabaseConfigured()) return null
  const row = await postRpc<GasPolicyRow>("update_gas_policy", {
    p_workspace_id: WORKSPACE_ID,
    p_agent_id: input.agentId,
    p_mode: input.mode,
    p_status: input.status,
    p_per_tx_limit_usdc: input.perTxLimitUsdc,
    p_daily_limit_usdc: input.dailyLimitUsdc,
    p_monthly_limit_usdc: input.monthlyLimitUsdc,
  })
  return row ? mapGasPolicy(row) : null
}

export async function checkSupabaseGasReadiness() {
  if (!isSupabaseConfigured()) return false
  try {
    await getRows<Pick<GasPolicyRow, "id">>("gas_policies", "select=id&limit=1")
    return true
  } catch {
    return false
  }
}

export async function getSupabaseWalletOverview(limit = 100): Promise<WalletOverview | null> {
  if (!isSupabaseConfigured()) return null
  try {
    const [walletRows, roleRows, policyRows, eventRows] = await Promise.all([
      getRows<WalletAccountRow>("wallet_accounts", `select=*&workspace_id=eq.${encodeURIComponent(WORKSPACE_ID)}&order=updated_at.desc`),
      getRows<WalletRoleRow>("wallet_roles", `select=*&workspace_id=eq.${encodeURIComponent(WORKSPACE_ID)}&order=created_at.asc`),
      getRows<WalletSigningPolicyRow>("wallet_signing_policies", `select=*&workspace_id=eq.${encodeURIComponent(WORKSPACE_ID)}&order=updated_at.desc`),
      getRows<WalletLifecycleEventRow>("wallet_lifecycle_events", `select=*&workspace_id=eq.${encodeURIComponent(WORKSPACE_ID)}&order=created_at.desc&limit=${limit}`),
    ])
    const wallets = walletRows.map(mapWalletAccount)
    const roles = roleRows.map(mapWalletRole)
    const policies = policyRows.map(mapWalletSigningPolicy)
    const events = eventRows.map(mapWalletLifecycleEvent)
    return {
      wallets,
      roles,
      policies,
      events,
      configuration: {
        circleConfigured: Boolean(process.env.CIRCLE_API_KEY),
        network: "ARC-TESTNET",
        custodyModels: ["developer", "user", "modular"],
      },
      summary: {
        totalWallets: wallets.length,
        activeWallets: wallets.filter((wallet) => wallet.status === "active").length,
        userControlledWallets: wallets.filter((wallet) => wallet.custodyModel !== "developer").length,
        pendingOperations: events.filter((event) => event.status === "requested" || event.status === "submitted").length,
      },
    }
  } catch (error) {
    logSupabaseError("wallet overview", error)
    return null
  }
}

export async function requestSupabaseWalletLifecycleAction(input: {
  walletId: string
  idempotencyKey: string
  action: WalletLifecycleEvent["action"]
  actor: string
  detail: string
  metadata?: Record<string, unknown>
}): Promise<WalletLifecycleEvent | null> {
  if (!isSupabaseConfigured()) return null
  const row = await postRpc<WalletLifecycleEventRow>("request_wallet_lifecycle_action", {
    p_event_id: `wevt_${randomUUID()}`,
    p_workspace_id: WORKSPACE_ID,
    p_wallet_id: input.walletId,
    p_idempotency_key: input.idempotencyKey,
    p_action: input.action,
    p_actor: input.actor,
    p_detail: input.detail,
    p_metadata: input.metadata ?? {},
  })
  return row ? mapWalletLifecycleEvent(row) : null
}

export async function updateSupabaseWalletSigningPolicy(input: {
  walletId: string
  status: WalletSigningPolicy["status"]
  approvalsRequired: number
  transactionLimitUsdc: number
  dailyLimitUsdc: number
  requireShield: boolean
  requireReputationScore: number
}): Promise<WalletSigningPolicy | null> {
  if (!isSupabaseConfigured()) return null
  const row = await postRpc<WalletSigningPolicyRow>("update_wallet_signing_policy", {
    p_workspace_id: WORKSPACE_ID,
    p_wallet_id: input.walletId,
    p_status: input.status,
    p_approvals_required: input.approvalsRequired,
    p_transaction_limit_usdc: input.transactionLimitUsdc,
    p_daily_limit_usdc: input.dailyLimitUsdc,
    p_require_shield: input.requireShield,
    p_require_reputation_score: input.requireReputationScore,
  })
  return row ? mapWalletSigningPolicy(row) : null
}

export async function checkSupabaseWalletReadiness() {
  if (!isSupabaseConfigured()) return false
  try {
    await getRows<Pick<WalletAccountRow, "id">>("wallet_accounts", "select=id&limit=1")
    return true
  } catch {
    return false
  }
}

export async function enqueueSupabaseExecutionJob(input: {
  idempotencyKey: string
  kind: ExecutionJob["kind"]
  resourceType: ExecutionJob["resourceType"]
  resourceId: string
  action: string
  providerOperationId?: string | null
  payload?: Record<string, unknown>
  initialStatus?: "queued" | "waiting_provider" | "succeeded"
}): Promise<ExecutionJob | null> {
  if (!isSupabaseConfigured()) return null
  const row = await postRpc<ExecutionJobRow>("enqueue_execution_job", {
    p_id: `exec_${randomUUID()}`,
    p_workspace_id: WORKSPACE_ID,
    p_idempotency_key: input.idempotencyKey,
    p_kind: input.kind,
    p_resource_type: input.resourceType,
    p_resource_id: input.resourceId,
    p_action: input.action,
    p_provider_operation_id: input.providerOperationId ?? null,
    p_payload: input.payload ?? {},
    p_initial_status: input.initialStatus ?? "queued",
  })
  return row ? mapExecutionJob(row) : null
}

export async function claimSupabaseExecutionJobs(input: {
  workerId: string
  limit?: number
  leaseSeconds?: number
}): Promise<ExecutionJob[] | null> {
  if (!isSupabaseConfigured()) return null
  const rows = await postRpc<ExecutionJobRow[]>("claim_execution_jobs", {
    p_workspace_id: WORKSPACE_ID,
    p_worker_id: input.workerId,
    p_limit: input.limit ?? 10,
    p_lease_seconds: input.leaseSeconds ?? 55,
  })
  return Array.isArray(rows) ? rows.map(mapExecutionJob) : []
}

export async function finishSupabaseExecutionJob(input: {
  jobId: string
  workerId: string
  status: "waiting_provider" | "retry" | "succeeded" | "failed"
  providerOperationId?: string | null
  providerReceipt?: Record<string, unknown>
  errorCode?: string | null
  errorMessage?: string | null
  retrySeconds?: number
}): Promise<ExecutionJob | null> {
  if (!isSupabaseConfigured()) return null
  const row = await postRpc<ExecutionJobRow>("finish_execution_job", {
    p_workspace_id: WORKSPACE_ID,
    p_job_id: input.jobId,
    p_worker_id: input.workerId,
    p_status: input.status,
    p_provider_operation_id: input.providerOperationId ?? null,
    p_provider_receipt: input.providerReceipt ?? {},
    p_error_code: input.errorCode ?? null,
    p_error_message: input.errorMessage ?? null,
    p_retry_seconds: input.retrySeconds ?? 60,
  })
  return row ? mapExecutionJob(row) : null
}

export async function recordSupabaseCircleWebhook(input: {
  notificationId: string
  subscriptionId?: string | null
  notificationType: string
  providerOperationId?: string | null
  signatureKeyId?: string | null
  signatureVerified: boolean
  payload: Record<string, unknown>
  providerState?: string | null
  txHash?: string | null
}): Promise<{ event: CircleWebhookEvent; duplicate: boolean; matched: number } | null> {
  if (!isSupabaseConfigured()) return null
  const result = await postRpc<{ event: CircleWebhookEventRow; duplicate: boolean; matched: number }>("record_circle_webhook", {
    p_id: `wh_${randomUUID()}`,
    p_workspace_id: WORKSPACE_ID,
    p_notification_id: input.notificationId,
    p_subscription_id: input.subscriptionId ?? null,
    p_notification_type: input.notificationType,
    p_provider_operation_id: input.providerOperationId ?? null,
    p_signature_key_id: input.signatureKeyId ?? null,
    p_signature_verified: input.signatureVerified,
    p_payload: input.payload,
    p_provider_state: input.providerState ?? null,
    p_tx_hash: input.txHash ?? null,
  })
  return result ? { ...result, event: mapCircleWebhookEvent(result.event) } : null
}

export async function reconcileSupabaseArcSettlementFromCircleWebhook(input: {
  providerOperationId?: string | null
  providerState?: string | null
  txHash?: string | null
  providerReceipt: Record<string, unknown>
  occurredAt?: string | null
}): Promise<ArcSettlementResult | ArcSettlement | null> {
  if (!isSupabaseConfigured()) return null
  const providerOperationId = input.providerOperationId?.trim() || null
  const txHash = input.txHash?.trim() || null
  if (!providerOperationId && !txHash) return null

  try {
    const rows = await getRows<ArcSettlementRow>(
      "arc_settlements",
      `select=*&workspace_id=eq.${encodeURIComponent(WORKSPACE_ID)}&order=updated_at.desc&limit=80`,
    )
    const settlement = rows.map(mapArcSettlement).find((item) => {
      if (txHash && item.txHash?.toLowerCase() === txHash.toLowerCase()) return true
      if (!providerOperationId) return false
      return providerReceiptContains(item.providerReceipt, providerOperationId)
    })
    if (!settlement) return null

    const normalizedState = (input.providerState ?? "").toUpperCase()
    const providerReceipt = {
      ...settlement.providerReceipt,
      circleWebhook: input.providerReceipt,
      ...(providerOperationId ? { circleTransactionId: providerOperationId } : {}),
    }

    if (txHash && ["COMPLETE", "CONFIRMED", "COMPLETED", "MINED"].includes(normalizedState)) {
      return await finalizeSupabaseArcSettlement({
        settlementId: settlement.id,
        transactionId: transactionIdForSettlement(settlement.id),
        txHash,
        explorerUrl: settlement.explorerUrl ?? `https://testnet.arcscan.app/tx/${txHash}`,
        gasEstimate: settlement.gasEstimate,
        providerReceipt,
        occurredAt: input.occurredAt ?? new Date().toISOString(),
      })
    }

    if (["FAILED", "DENIED", "CANCELLED", "STUCK"].includes(normalizedState)) {
      return await updateSupabaseArcSettlement(settlement.id, {
        errorCode: "circle_webhook_failed",
        errorMessage: `Circle webhook reported ${normalizedState}`,
        providerReceipt,
        status: "failed",
        txHash: txHash ?? settlement.txHash,
      })
    }

    return await updateSupabaseArcSettlement(settlement.id, {
      providerReceipt,
      status: settlement.status === "approved" ? "submitted" : settlement.status,
      txHash: txHash ?? settlement.txHash,
    })
  } catch (error) {
    logSupabaseError("arc settlement webhook reconciliation", error)
    return null
  }
}

export async function getSupabaseExecutionOverview(limit = 100): Promise<ExecutionOverview | null> {
  if (!isSupabaseConfigured()) return null
  try {
    const [jobRows, webhookRows] = await Promise.all([
      getRows<ExecutionJobRow>("execution_jobs", `select=*&workspace_id=eq.${encodeURIComponent(WORKSPACE_ID)}&order=created_at.desc&limit=${limit}`),
      getRows<CircleWebhookEventRow>("circle_webhook_events", `select=*&workspace_id=eq.${encodeURIComponent(WORKSPACE_ID)}&order=received_at.desc&limit=${limit}`),
    ])
    const jobs = jobRows.map(mapExecutionJob)
    return {
      jobs,
      webhooks: webhookRows.map(mapCircleWebhookEvent),
      summary: {
        queued: jobs.filter((job) => job.status === "queued" || job.status === "leased").length,
        waitingProvider: jobs.filter((job) => job.status === "waiting_provider").length,
        retrying: jobs.filter((job) => job.status === "retry").length,
        succeeded: jobs.filter((job) => job.status === "succeeded").length,
        failed: jobs.filter((job) => job.status === "failed" || job.status === "dead").length,
      },
    }
  } catch (error) {
    logSupabaseError("execution overview", error)
    return null
  }
}

export async function checkSupabaseExecutionReadiness() {
  if (!isSupabaseConfigured()) return false
  try {
    await getRows<Pick<ExecutionJobRow, "id">>("execution_jobs", "select=id&limit=1")
    return true
  } catch {
    return false
  }
}

export async function getSupabaseEscrowOverview(configuration: EscrowOverview["configuration"], limit = 100): Promise<EscrowOverview | null> {
  if (!isSupabaseConfigured()) return null
  try {
    const [dealRows, milestoneRows, eventRows] = await Promise.all([
      getRows<EscrowDealRow>("escrow_deals", `select=*&workspace_id=eq.${encodeURIComponent(WORKSPACE_ID)}&order=created_at.desc&limit=${limit}`),
      getRows<EscrowMilestoneRow>("escrow_milestones", `select=*&workspace_id=eq.${encodeURIComponent(WORKSPACE_ID)}&order=created_at.asc&limit=${limit * 5}`),
      getRows<EscrowEventRow>("escrow_events", `select=*&workspace_id=eq.${encodeURIComponent(WORKSPACE_ID)}&order=created_at.desc&limit=${limit * 5}`),
    ])
    const deals = dealRows.map(mapEscrowDeal)
    const milestones = milestoneRows.map(mapEscrowMilestone)
    const events = eventRows.map(mapEscrowEvent)
    return {
      deals,
      milestones,
      events,
      configuration,
      summary: {
        lockedUsdc: deals.reduce((sum, deal) => sum + Math.max(0, deal.totalAmountUsdc - deal.releasedAmountUsdc - deal.refundedAmountUsdc), 0),
        releasedUsdc: deals.reduce((sum, deal) => sum + deal.releasedAmountUsdc, 0),
        disputedUsdc: deals.filter((deal) => deal.status === "disputed").reduce((sum, deal) => sum + Math.max(0, deal.totalAmountUsdc - deal.releasedAmountUsdc - deal.refundedAmountUsdc), 0),
        activeDeals: deals.filter((deal) => ["active", "disputed"].includes(deal.status)).length,
      },
    }
  } catch (error) {
    logSupabaseError("escrow overview", error)
    return null
  }
}

export async function createSupabaseEscrowDeal(input: {
  id: string
  idempotencyKey: string
  title: string
  description: string
  buyerAgentId: string
  sellerAgentId: string
  milestones: Array<{ title: string; description: string; amountUsdc: number; dueAt: string | null }>
}): Promise<EscrowDeal | null> {
  if (!isSupabaseConfigured()) return null
  const row = await postRpc<EscrowDealRow>("create_escrow_deal", {
    p_id: input.id,
    p_workspace_id: WORKSPACE_ID,
    p_idempotency_key: input.idempotencyKey,
    p_title: input.title,
    p_description: input.description,
    p_buyer_agent_id: input.buyerAgentId,
    p_seller_agent_id: input.sellerAgentId,
    p_milestones: input.milestones,
  })
  return row ? mapEscrowDeal(row) : null
}

export async function applySupabaseEscrowAction(input: {
  dealId: string
  milestoneId: string
  action: "submit" | "release" | "refund" | "dispute"
  actor: string
  detail: string
  txHash?: string | null
  explorerUrl?: string | null
  providerReceipt?: Record<string, unknown>
}): Promise<EscrowDeal | null> {
  if (!isSupabaseConfigured()) return null
  const row = await postRpc<EscrowDealRow>("apply_escrow_action", {
    p_workspace_id: WORKSPACE_ID,
    p_deal_id: input.dealId,
    p_milestone_id: input.milestoneId,
    p_action: input.action,
    p_actor: input.actor,
    p_detail: input.detail,
    p_tx_hash: input.txHash ?? null,
    p_explorer_url: input.explorerUrl ?? null,
    p_provider_receipt: input.providerReceipt ?? {},
  })
  return row ? mapEscrowDeal(row) : null
}

export async function checkSupabaseEscrowReadiness() {
  if (!isSupabaseConfigured()) return false
  try {
    await getRows<Pick<EscrowDealRow, "id">>("escrow_deals", "select=id&limit=1")
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

  const tables = [
    "workspaces",
    "agents",
    "analytics_events",
    "investor_leads",
    "rate_limit_events",
    "ops_health_checks",
    "arc_settlements",
    "billing_plans",
    "billing_accounts",
    "billing_usage_events",
    "billing_invoices",
    "billing_settlement_batches",
    "escrow_deals",
    "escrow_milestones",
    "escrow_events",
    "gas_policies",
    "gas_sponsorships",
    "wallet_accounts",
    "wallet_roles",
    "wallet_signing_policies",
    "wallet_lifecycle_events",
    "execution_jobs",
    "circle_webhook_events",
    "arc_agent_identities",
    "arc_agent_jobs",
    "arc_agent_job_artifacts",
    "arc_agent_job_validations",
  ]
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

  if (!response.ok) throw await createSupabaseRestError(response, `Supabase read failed for ${table}`)
  return response.json() as Promise<T[]>
}

async function getOptionalRows<T>(table: string, query: string, scope: string): Promise<T[]> {
  try {
    return await getRows<T>(table, query)
  } catch (error) {
    logSupabaseError(scope, error)
    return []
  }
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

  if (!response.ok) throw await createSupabaseRestError(response, `Supabase insert failed for ${table}`)
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

  if (!response.ok) throw await createSupabaseRestError(response, `Supabase update failed for ${table}`)
  return response.json() as Promise<T[]>
}

async function postRpc<T>(functionName: string, body: unknown): Promise<T> {
  const response = await fetch(`${SUPABASE_URL?.replace(/\/$/, "")}/rest/v1/rpc/${functionName}`, {
    body: JSON.stringify(body),
    headers: supabaseHeaders(),
    method: "POST",
  })

  if (!response.ok) {
    const payload = await response.json().catch(() => null) as { message?: string; details?: string } | null
    throw new Error(payload?.message ?? payload?.details ?? `Supabase RPC failed for ${functionName}`)
  }
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

  if (!response.ok) throw await createSupabaseRestError(response, `Supabase delete failed for ${table}`)
  return response.json() as Promise<T[]>
}

async function createSupabaseRestError(response: Response, fallback: string) {
  const payload = await response.json().catch(() => null) as {
    code?: string
    details?: string
    hint?: string
    message?: string
  } | null
  const message = [
    fallback,
    `status=${response.status}`,
    payload?.code ? `code=${payload.code}` : null,
    payload?.message ? `message=${payload.message}` : null,
    payload?.details ? `details=${payload.details}` : null,
    payload?.hint ? `hint=${payload.hint}` : null,
  ].filter(Boolean).join("; ")
  return new Error(message)
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
    memoLabel: row.memo_label ?? null,
    memo: row.memo ?? {},
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
    memoLabel: row.memo_label ?? null,
    memo: row.memo ?? {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    confirmedAt: row.confirmed_at,
  }
}

function providerReceiptContains(receipt: Record<string, unknown>, value: string) {
  const wanted = value.toLowerCase()
  const stack: unknown[] = [receipt]
  while (stack.length > 0) {
    const current = stack.pop()
    if (!current || typeof current !== "object") continue
    if (Array.isArray(current)) {
      stack.push(...current)
      continue
    }
    for (const item of Object.values(current as Record<string, unknown>)) {
      if (typeof item === "string" && item.toLowerCase() === wanted) return true
      if (item && typeof item === "object") stack.push(item)
    }
  }
  return false
}

function transactionIdForSettlement(settlementId: string) {
  return `tx_arc_${settlementId.replace(/^set_/, "").replaceAll("-", "")}`
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

function mapArcAgentIdentity(row: ArcAgentIdentityRow): ArcAgentIdentity {
  return {
    agentId: row.agent_id,
    agentUri: row.agent_uri,
    capabilities: row.capabilities ?? [],
    id: row.id,
    metadata: row.metadata ?? {},
    registeredAt: row.registered_at,
    registryAddress: row.registry_address,
    reputationEndpoint: row.reputation_endpoint,
    serviceEndpoint: row.service_endpoint,
    standard: row.standard,
    status: row.status,
    trustModel: row.trust_model ?? {
      identityRegistry: "pending",
      reputationRegistry: "pending",
      validationRegistry: "pending",
    },
    updatedAt: row.updated_at,
    validationEndpoint: row.validation_endpoint,
    walletAddress: row.wallet_address,
    workspaceId: row.workspace_id,
  }
}

function mapArcAgentJob(row: ArcAgentJobRow): ArcAgentJob {
  return {
    agentIdentityId: row.agent_identity_id,
    amountUsdc: toNumber(row.amount_usdc),
    apiId: row.api_id,
    completedAt: row.completed_at,
    constraints: row.constraints ?? {
      deadlineAt: row.created_at,
      maxSpendUsdc: toNumber(row.amount_usdc),
      requireComplianceScreening: true,
      requiredReputation: 0,
    },
    createdAt: row.created_at,
    executionJobId: row.execution_job_id,
    flowRunId: row.flow_run_id,
    id: row.id,
    inputHash: row.input_hash,
    kind: row.kind,
    metadata: row.metadata ?? {},
    outputHash: row.output_hash,
    policyHash: row.policy_hash,
    providerAgentId: row.provider_agent_id,
    receiptHash: row.receipt_hash,
    requestedCapability: row.requested_capability,
    requesterAgentId: row.requester_agent_id,
    settlementId: row.settlement_id,
    standard: row.standard,
    status: row.status,
    txHash: row.tx_hash,
    updatedAt: row.updated_at,
    workspaceId: row.workspace_id,
  }
}

function mapArcAgentJobArtifact(row: ArcAgentJobArtifactRow): ArcAgentJobArtifact {
  return {
    createdAt: row.created_at,
    digest: row.digest,
    id: row.id,
    jobId: row.job_id,
    signature: row.signature,
    type: row.type,
    uri: row.uri,
    workspaceId: row.workspace_id,
  }
}

function mapArcAgentJobValidation(row: ArcAgentJobValidationRow): ArcAgentJobValidation {
  return {
    createdAt: row.created_at,
    evidenceHash: row.evidence_hash,
    evidenceUri: row.evidence_uri,
    id: row.id,
    jobId: row.job_id,
    result: row.result,
    score: toNumber(row.score),
    signature: row.signature,
    validatorAgentId: row.validator_agent_id,
    workspaceId: row.workspace_id,
  }
}

function mapBillingPlan(row: BillingPlanRow): BillingPlan {
  return {
    id: row.id, workspaceId: row.workspace_id, name: row.name,
    monthlyFeeUsdc: toNumber(row.monthly_fee_usdc), includedUnits: toNumber(row.included_units),
    discountBps: row.discount_bps, active: row.active, createdAt: row.created_at,
  }
}

function mapBillingAccount(row: BillingAccountRow): BillingAccount {
  return {
    id: row.id, workspaceId: row.workspace_id, agentId: row.agent_id, planId: row.plan_id,
    prepaidBalanceUsdc: toNumber(row.prepaid_balance_usdc),
    lowBalanceThresholdUsdc: toNumber(row.low_balance_threshold_usdc),
    status: row.status, currentPeriodStart: row.current_period_start, currentPeriodEnd: row.current_period_end,
    createdAt: row.created_at, updatedAt: row.updated_at,
  }
}

function mapBillingUsage(row: BillingUsageRow): BillingUsageEvent {
  return {
    id: row.id, workspaceId: row.workspace_id, billingAccountId: row.billing_account_id,
    agentId: row.agent_id, apiId: row.api_id, idempotencyKey: row.idempotency_key,
    units: toNumber(row.units), unitPriceUsdc: toNumber(row.unit_price_usdc),
    grossAmountUsdc: toNumber(row.gross_amount_usdc), discountUsdc: toNumber(row.discount_usdc),
    netAmountUsdc: toNumber(row.net_amount_usdc), pricingUnit: row.pricing_unit,
    invoiceId: row.invoice_id, batchId: row.batch_id, metadata: row.metadata ?? {},
    occurredAt: row.occurred_at, createdAt: row.created_at,
  }
}

function mapBillingInvoice(row: BillingInvoiceRow): BillingInvoice {
  return {
    id: row.id, workspaceId: row.workspace_id, billingAccountId: row.billing_account_id,
    agentId: row.agent_id, periodStart: row.period_start, periodEnd: row.period_end,
    status: row.status, usageCount: row.usage_count, subtotalUsdc: toNumber(row.subtotal_usdc),
    discountUsdc: toNumber(row.discount_usdc), totalUsdc: toNumber(row.total_usdc),
    batchId: row.batch_id, createdAt: row.created_at, updatedAt: row.updated_at,
  }
}

function mapBillingBatch(row: BillingBatchRow): BillingSettlementBatch {
  return {
    id: row.id, workspaceId: row.workspace_id, status: row.status, usageCount: row.usage_count,
    invoiceCount: row.invoice_count, grossAmountUsdc: toNumber(row.gross_amount_usdc),
    netAmountUsdc: toNumber(row.net_amount_usdc), settlementId: row.settlement_id,
    txHash: row.tx_hash, explorerUrl: row.explorer_url, createdAt: row.created_at,
    updatedAt: row.updated_at, settledAt: row.settled_at,
  }
}

function mapGasPolicy(row: GasPolicyRow): GasPolicy {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    agentId: row.agent_id,
    mode: row.mode,
    status: row.status,
    perTxLimitUsdc: toNumber(row.per_tx_limit_usdc),
    dailyLimitUsdc: toNumber(row.daily_limit_usdc),
    monthlyLimitUsdc: toNumber(row.monthly_limit_usdc),
    dailySpentUsdc: toNumber(row.daily_spent_usdc),
    monthlySpentUsdc: toNumber(row.monthly_spent_usdc),
    sponsoredCount: toNumber(row.sponsored_count),
    deniedCount: toNumber(row.denied_count),
    allowedContracts: row.allowed_contracts ?? [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function mapGasSponsorship(row: GasSponsorshipRow): GasSponsorship {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    policyId: row.policy_id,
    agentId: row.agent_id,
    idempotencyKey: row.idempotency_key,
    mode: row.mode,
    network: row.network,
    action: row.action,
    destination: row.destination,
    estimatedFeeUsdc: toNumber(row.estimated_fee_usdc),
    actualFeeUsdc: row.actual_fee_usdc === null ? null : toNumber(row.actual_fee_usdc),
    status: row.status,
    decisionReason: row.decision_reason,
    provider: row.provider,
    providerTransactionId: row.provider_transaction_id,
    txHash: row.tx_hash,
    explorerUrl: row.explorer_url,
    metadata: row.metadata ?? {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    confirmedAt: row.confirmed_at,
  }
}

function mapWalletAccount(row: WalletAccountRow): WalletAccount {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    name: row.name,
    ownerLabel: row.owner_label,
    custodyModel: row.custody_model,
    accountType: row.account_type,
    status: row.status,
    network: row.network,
    address: row.address,
    circleWalletId: row.circle_wallet_id,
    circleWalletSetId: row.circle_wallet_set_id,
    authMethod: row.auth_method,
    recoveryMethod: row.recovery_method,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastSignedAt: row.last_signed_at,
  }
}

function mapWalletRole(row: WalletRoleRow): WalletRole {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    walletId: row.wallet_id,
    principal: row.principal,
    role: row.role,
    status: row.status,
    createdAt: row.created_at,
    revokedAt: row.revoked_at,
  }
}

function mapWalletSigningPolicy(row: WalletSigningPolicyRow): WalletSigningPolicy {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    walletId: row.wallet_id,
    status: row.status,
    approvalsRequired: row.approvals_required,
    transactionLimitUsdc: toNumber(row.transaction_limit_usdc),
    dailyLimitUsdc: toNumber(row.daily_limit_usdc),
    allowedContracts: row.allowed_contracts ?? [],
    requireShield: row.require_shield,
    requireReputationScore: row.require_reputation_score,
    updatedAt: row.updated_at,
  }
}

function mapWalletLifecycleEvent(row: WalletLifecycleEventRow): WalletLifecycleEvent {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    walletId: row.wallet_id,
    action: row.action,
    status: row.status,
    actor: row.actor,
    detail: row.detail,
    providerOperationId: row.provider_operation_id,
    txHash: row.tx_hash,
    explorerUrl: row.explorer_url,
    metadata: row.metadata ?? {},
    createdAt: row.created_at,
    completedAt: row.completed_at,
  }
}

function mapExecutionJob(row: ExecutionJobRow): ExecutionJob {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    idempotencyKey: row.idempotency_key,
    kind: row.kind,
    resourceType: row.resource_type,
    resourceId: row.resource_id,
    action: row.action,
    status: row.status,
    provider: row.provider,
    providerOperationId: row.provider_operation_id,
    payload: row.payload ?? {},
    providerReceipt: row.provider_receipt ?? {},
    attempts: row.attempts,
    maxAttempts: row.max_attempts,
    nextAttemptAt: row.next_attempt_at,
    leaseOwner: row.lease_owner,
    leaseExpiresAt: row.lease_expires_at,
    lastErrorCode: row.last_error_code,
    lastErrorMessage: row.last_error_message,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    completedAt: row.completed_at,
  }
}

function mapCircleWebhookEvent(row: CircleWebhookEventRow): CircleWebhookEvent {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    notificationId: row.notification_id,
    subscriptionId: row.subscription_id,
    notificationType: row.notification_type,
    providerOperationId: row.provider_operation_id,
    signatureKeyId: row.signature_key_id,
    signatureVerified: row.signature_verified,
    payload: row.payload ?? {},
    processingStatus: row.processing_status,
    processingError: row.processing_error,
    receivedAt: row.received_at,
    processedAt: row.processed_at,
  }
}

function mapEscrowDeal(row: EscrowDealRow): EscrowDeal {
  return {
    id: row.id, workspaceId: row.workspace_id, idempotencyKey: row.idempotency_key,
    title: row.title, description: row.description, buyerAgentId: row.buyer_agent_id,
    sellerAgentId: row.seller_agent_id, totalAmountUsdc: toNumber(row.total_amount_usdc),
    releasedAmountUsdc: toNumber(row.released_amount_usdc), refundedAmountUsdc: toNumber(row.refunded_amount_usdc),
    status: row.status, contractAddress: row.contract_address, contractDealId: row.contract_deal_id,
    fundingTxHash: row.funding_tx_hash, explorerUrl: row.explorer_url, disputeReason: row.dispute_reason,
    createdAt: row.created_at, updatedAt: row.updated_at, completedAt: row.completed_at,
  }
}

function mapEscrowMilestone(row: EscrowMilestoneRow): EscrowMilestone {
  return {
    id: row.id, workspaceId: row.workspace_id, dealId: row.deal_id, position: row.position,
    title: row.title, description: row.description, amountUsdc: toNumber(row.amount_usdc),
    status: row.status, dueAt: row.due_at, submittedAt: row.submitted_at,
    releasedAt: row.released_at, refundedAt: row.refunded_at, txHash: row.tx_hash,
    explorerUrl: row.explorer_url, createdAt: row.created_at, updatedAt: row.updated_at,
  }
}

function mapEscrowEvent(row: EscrowEventRow): EscrowEvent {
  return {
    id: row.id, workspaceId: row.workspace_id, dealId: row.deal_id,
    milestoneId: row.milestone_id, type: row.type, actor: row.actor, detail: row.detail,
    amountUsdc: toNumber(row.amount_usdc), txHash: row.tx_hash, explorerUrl: row.explorer_url,
    providerReceipt: row.provider_receipt ?? {}, createdAt: row.created_at,
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

function toArcAgentIdentityRow(identity: ArcAgentIdentity): ArcAgentIdentityRow {
  return {
    agent_id: identity.agentId,
    agent_uri: identity.agentUri,
    capabilities: identity.capabilities,
    id: identity.id,
    metadata: identity.metadata,
    registered_at: identity.registeredAt,
    registry_address: identity.registryAddress,
    reputation_endpoint: identity.reputationEndpoint,
    service_endpoint: identity.serviceEndpoint,
    standard: identity.standard,
    status: identity.status,
    trust_model: identity.trustModel,
    updated_at: identity.updatedAt,
    validation_endpoint: identity.validationEndpoint,
    wallet_address: identity.walletAddress,
    workspace_id: WORKSPACE_ID,
  }
}

function toArcAgentJobRow(job: ArcAgentJob): ArcAgentJobRow {
  return {
    agent_identity_id: job.agentIdentityId,
    amount_usdc: job.amountUsdc,
    api_id: job.apiId,
    completed_at: job.completedAt,
    constraints: job.constraints,
    created_at: job.createdAt,
    execution_job_id: job.executionJobId,
    flow_run_id: job.flowRunId,
    id: job.id,
    input_hash: job.inputHash,
    kind: job.kind,
    metadata: job.metadata,
    output_hash: job.outputHash,
    policy_hash: job.policyHash,
    provider_agent_id: job.providerAgentId,
    receipt_hash: job.receiptHash,
    requested_capability: job.requestedCapability,
    requester_agent_id: job.requesterAgentId,
    settlement_id: null,
    standard: job.standard,
    status: job.status,
    tx_hash: job.txHash,
    updated_at: job.updatedAt,
    workspace_id: WORKSPACE_ID,
  }
}

function toArcAgentJobArtifactRow(artifact: ArcAgentJobArtifact): ArcAgentJobArtifactRow {
  return {
    created_at: artifact.createdAt,
    digest: artifact.digest,
    id: artifact.id,
    job_id: artifact.jobId,
    signature: artifact.signature,
    type: artifact.type,
    uri: artifact.uri,
    workspace_id: WORKSPACE_ID,
  }
}

function toArcAgentJobValidationRow(validation: ArcAgentJobValidation): ArcAgentJobValidationRow {
  return {
    created_at: validation.createdAt,
    evidence_hash: validation.evidenceHash,
    evidence_uri: validation.evidenceUri,
    id: validation.id,
    job_id: validation.jobId,
    result: validation.result,
    score: validation.score,
    signature: validation.signature,
    validator_agent_id: validation.validatorAgentId,
    workspace_id: WORKSPACE_ID,
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
