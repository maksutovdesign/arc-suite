import { randomUUID } from "crypto"
import { ArcTransferError, getArcSettlementConfiguration, resumeArcTestnetUsdc, sendArcTestnetUsdc } from "./arc-settlement"
import { checkAccess } from "./service"
import {
  finalizeSupabaseArcSettlement,
  findSupabaseArcSettlement,
  getSupabaseArcSettlementResult,
  insertSupabaseArcSettlement,
  isSupabaseConfigured,
  updateSupabaseArcSettlement,
} from "./supabase"
import type { AccessDecisionResult, ArcSettlement, ArcSettlementResult } from "./schema"

export type ExecuteArcSettlementResult =
  | {
      ok: true
      idempotent: boolean
      decision: AccessDecisionResult
      result: ArcSettlementResult
    }
  | {
      ok: false
      idempotent: boolean
      decision: AccessDecisionResult
      settlement: ArcSettlement
    }

export async function executeArcSettlement(input: {
  agentId: string
  apiId: string
  amountUsdc: number
  recipientAddress: string
  idempotencyKey: string
  memoLabel?: string
  memo?: Record<string, unknown>
}): Promise<ExecuteArcSettlementResult> {
  if (!isSupabaseConfigured()) {
    throw new SettlementExecutionError("supabase_required", "Supabase is required before an onchain transfer can be executed", 503)
  }

  const existing = await findSupabaseArcSettlement(input.idempotencyKey)
  if (existing) return resumeExistingSettlement(existing)

  const config = getArcSettlementConfiguration()
  if (!config.configured || !config.sourceAddress) {
    throw new SettlementExecutionError("arc_not_configured", `Missing Arc configuration: ${config.missing.join(", ")}`, 503)
  }

  const decision = await checkAccess({
    agentId: input.agentId,
    apiId: input.apiId,
    amountUsdc: input.amountUsdc,
  })
  if (!decision) {
    throw new SettlementExecutionError("policy_subject_not_found", "Agent, API, or reputation profile was not found", 404)
  }
  if (!decision.decisionId) {
    throw new SettlementExecutionError("policy_audit_unavailable", "Policy decision could not be persisted; transfer was not sent", 503)
  }

  const settlementId = `set_${randomUUID()}`
  const memo = buildSettlementMemo({
    ...input,
    accessDecisionId: decision.decisionId,
    amountUsdc: decision.amountUsdc,
    settlementId,
  })
  const settlement = await insertSettlementAudit({
    id: settlementId,
    idempotencyKey: input.idempotencyKey,
    agentId: input.agentId,
    apiId: input.apiId,
    accessDecisionId: decision.decisionId,
    sourceAddress: config.sourceAddress,
    recipientAddress: input.recipientAddress.toLowerCase(),
    amountUsdc: decision.amountUsdc,
    status: decision.allowed ? "approved" : "policy_denied",
    memoLabel: input.memoLabel ?? memo.label,
    memo: {
      ...memo.data,
      ...(input.memo ?? {}),
    },
  })
  if (!settlement) {
    throw new SettlementExecutionError("settlement_audit_unavailable", "Settlement audit record could not be created; transfer was not sent", 503)
  }
  if (!decision.allowed) {
    return {
      ok: false,
      idempotent: false,
      decision,
      settlement,
    }
  }

  try {
    const receipt = await sendArcTestnetUsdc({
      amountUsdc: decision.amountUsdc,
      recipientAddress: input.recipientAddress,
      providerIdempotencyKey: settlement.id.replace(/^set_/, ""),
    })
    await updateSupabaseArcSettlement(settlement.id, {
      status: "submitted",
      txHash: receipt.txHash,
      explorerUrl: receipt.explorerUrl,
      gasEstimate: receipt.gasEstimate,
      providerReceipt: receipt.providerReceipt,
    })

    const result = await finalizeSupabaseArcSettlement({
      settlementId: settlement.id,
      transactionId: transactionIdForSettlement(settlement.id),
      txHash: receipt.txHash,
      explorerUrl: receipt.explorerUrl,
      gasEstimate: receipt.gasEstimate,
      providerReceipt: receipt.providerReceipt,
      occurredAt: new Date().toISOString(),
    })
    if (!result) {
      throw new SettlementExecutionError(
        "persistence_failed",
        `Arc transfer succeeded but Supabase finalization failed. Reuse idempotency key ${input.idempotencyKey} to reconcile it.`,
        503,
        { explorerUrl: receipt.explorerUrl, txHash: receipt.txHash },
      )
    }

    return {
      ok: true,
      idempotent: false,
      decision,
      result,
    }
  } catch (error) {
    if (error instanceof SettlementExecutionError && error.code === "persistence_failed") throw error

    const code = error instanceof ArcTransferError ? error.code : "arc_transfer_failed"
    const message = error instanceof Error ? error.message : "Arc transfer failed"
    const details = error instanceof ArcTransferError ? error.details : {}
    await updateSupabaseArcSettlement(settlement.id, {
      status: code === "circle_confirmation_timeout" ? "submitted" : "failed",
      errorCode: code,
      errorMessage: message.slice(0, 500),
      providerReceipt: details,
    })
    throw new SettlementExecutionError(code, message, 502, details)
  }
}

async function insertSettlementAudit(input: Parameters<typeof insertSupabaseArcSettlement>[0]) {
  try {
    return await insertSupabaseArcSettlement(input)
  } catch (error) {
    const reason = error instanceof Error ? error.message : "Unknown Supabase error"
    throw new SettlementExecutionError(
      "settlement_audit_unavailable",
      "Settlement audit record could not be created; transfer was not sent",
      503,
      { reason },
    )
  }
}

async function resumeExistingSettlement(existing: ArcSettlement): Promise<ExecuteArcSettlementResult> {
  const decision: AccessDecisionResult = {
    allowed: existing.status !== "policy_denied",
    agentId: existing.agentId,
    apiId: existing.apiId,
    amountUsdc: existing.amountUsdc,
    decisionId: existing.accessDecisionId,
    reason: existing.status === "policy_denied" ? "Policy denied this settlement" : "Access approved",
    requiredScore: 0,
    score: existing.reputationScoreBefore ?? 0,
    monthlyBudgetUsedPct: 0,
    dailyBudgetUsedPct: 0,
  }

  if (existing.status === "confirmed") {
    const result = await getSupabaseArcSettlementResult(existing.id)
    if (!result) {
      throw new SettlementExecutionError("settlement_result_unavailable", "Confirmed settlement could not be loaded", 503)
    }
    return { ok: true, idempotent: true, decision, result }
  }

  if (existing.status === "submitted" && existing.txHash && existing.explorerUrl) {
    const result = await finalizeSupabaseArcSettlement({
      settlementId: existing.id,
      transactionId: transactionIdForSettlement(existing.id),
      txHash: existing.txHash,
      explorerUrl: existing.explorerUrl,
      gasEstimate: existing.gasEstimate,
      providerReceipt: existing.providerReceipt,
      occurredAt: existing.confirmedAt ?? new Date().toISOString(),
    })
    if (!result) {
      throw new SettlementExecutionError("persistence_failed", "Submitted Arc transfer still could not be reconciled", 503, {
        explorerUrl: existing.explorerUrl,
        txHash: existing.txHash,
      })
    }
    return { ok: true, idempotent: true, decision, result }
  }

  if (existing.status === "submitted") {
    const circleTransactionId = typeof existing.providerReceipt.circleTransactionId === "string"
      ? existing.providerReceipt.circleTransactionId
      : null
    if (!circleTransactionId) {
      throw new SettlementExecutionError("submitted_transaction_unavailable", "Submitted settlement has no Circle transaction id for reconciliation", 409)
    }

    try {
      const receipt = await resumeArcTestnetUsdc(circleTransactionId)
      await updateSupabaseArcSettlement(existing.id, {
        status: "submitted",
        txHash: receipt.txHash,
        explorerUrl: receipt.explorerUrl,
        gasEstimate: receipt.gasEstimate,
        providerReceipt: receipt.providerReceipt,
        errorCode: null,
        errorMessage: null,
      })
      const result = await finalizeSupabaseArcSettlement({
        settlementId: existing.id,
        transactionId: transactionIdForSettlement(existing.id),
        txHash: receipt.txHash,
        explorerUrl: receipt.explorerUrl,
        gasEstimate: receipt.gasEstimate,
        providerReceipt: receipt.providerReceipt,
        occurredAt: new Date().toISOString(),
      })
      if (!result) throw new SettlementExecutionError("persistence_failed", "Reconciled Arc transfer could not be finalized", 503)
      return { ok: true, idempotent: true, decision, result }
    } catch (error) {
      if (error instanceof SettlementExecutionError) throw error
      const code = error instanceof ArcTransferError ? error.code : "arc_reconciliation_failed"
      const message = error instanceof Error ? error.message : "Arc reconciliation failed"
      throw new SettlementExecutionError(code, message, 502)
    }
  }

  if (existing.status === "policy_denied") {
    return { ok: false, idempotent: true, decision, settlement: existing }
  }

  throw new SettlementExecutionError(
    "idempotency_conflict",
    `Settlement already exists with status ${existing.status}; use a new key only after operator review`,
    409,
  )
}

export class SettlementExecutionError extends Error {
  code: string
  status: number
  details: Record<string, unknown>

  constructor(code: string, message: string, status: number, details: Record<string, unknown> = {}) {
    super(message)
    this.name = "SettlementExecutionError"
    this.code = code
    this.status = status
    this.details = details
  }
}

function transactionIdForSettlement(settlementId: string) {
  return `tx_arc_${settlementId.replace(/^set_/, "").replaceAll("-", "")}`
}

function buildSettlementMemo(input: {
  agentId: string
  apiId: string
  accessDecisionId: string | null
  settlementId: string
  idempotencyKey: string
  amountUsdc: number
}) {
  return {
    label: `API ${input.apiId} payment`,
    data: {
      schema: "arc-suite.memo.v1",
      purpose: "x402_api_payment",
      agentId: input.agentId,
      apiId: input.apiId,
      accessDecisionId: input.accessDecisionId,
      settlementId: input.settlementId,
      invoiceId: `inv_${input.settlementId.replace(/^set_/, "").slice(0, 12)}`,
      paymentReference: input.idempotencyKey,
      amountUsdc: input.amountUsdc,
      workflow: "policy_check.usdc_settlement.reputation_update",
    },
  }
}
