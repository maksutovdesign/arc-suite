import { randomUUID } from "crypto"

import {
  CircleComplianceError,
  evaluateShieldPolicy,
  screenCircleAddress,
} from "./circle-compliance"
import { executeArcSettlement, SettlementExecutionError } from "./settlement-service"
import type { FlowRun, FlowStep, ShieldScreening } from "./schema"
import {
  findSupabaseFlowRun,
  insertSupabaseFlowRun,
  insertSupabaseShieldScreening,
  updateSupabaseFlowRun,
} from "./supabase"

export class FlowExecutionError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly status = 500,
    readonly run: FlowRun | null = null,
  ) {
    super(message)
    this.name = "FlowExecutionError"
  }
}

export async function executeArcFlow(input: {
  agentId: string
  apiId: string
  amountUsdc: number
  recipientAddress: string
  screeningChain: string
  idempotencyKey: string
  requestId: string
}) {
  const existing = await findSupabaseFlowRun(input.idempotencyKey)
  if (existing) return { idempotent: true, run: existing }

  const runId = `flow_${randomUUID()}`
  let steps = initialSteps()
  let run = await insertSupabaseFlowRun({
    id: runId,
    idempotencyKey: input.idempotencyKey,
    agentId: input.agentId,
    apiId: input.apiId,
    recipientAddress: input.recipientAddress.toLowerCase(),
    screeningChain: input.screeningChain,
    amountUsdc: input.amountUsdc,
    status: "running",
    currentStep: "screening",
    steps,
    screeningId: null,
    screeningDecision: null,
    accessDecisionId: null,
    accessAllowed: null,
    settlementId: null,
    txHash: null,
    explorerUrl: null,
    reputationScoreBefore: null,
    reputationScoreAfter: null,
    errorCode: null,
    errorMessage: null,
    requestId: input.requestId,
    completedAt: null,
  })
  if (!run) {
    throw new FlowExecutionError("flow_audit_unavailable", "Arc Flow migration is required before a run can start.", 503)
  }

  try {
    steps = setStep(steps, "screening", "running", "Screening recipient with Circle Compliance Engine.")
    run = await persist(runId, { steps, currentStep: "screening" }, run)
    const provider = await screenCircleAddress({
      address: input.recipientAddress,
      chain: input.screeningChain,
      idempotencyKey: randomUUID(),
    })
    const response = provider.response
    const policy = evaluateShieldPolicy(response, {
      address: input.recipientAddress,
      chain: input.screeningChain,
    })
    const screeningInput: Omit<ShieldScreening, "workspaceId" | "createdAt"> = {
      id: `scr_${randomUUID()}`,
      idempotencyKey: randomUUID(),
      address: input.recipientAddress.toLowerCase(),
      chain: input.screeningChain,
      provider: "circle_compliance_engine",
      providerScreeningId: typeof response.id === "string" ? response.id : null,
      providerResult: typeof response.result === "string" ? response.result : null,
      providerStatus: "completed",
      decision: policy.decision,
      decisionReason: policy.decisionReason,
      ruleName: policy.ruleName,
      actions: policy.actions,
      riskScore: policy.riskScore,
      riskCategories: policy.riskCategories,
      reasons: policy.reasons,
      alertId: typeof response.alertId === "string" ? response.alertId : null,
      rawResponse: provider.rawResponse,
      requestId: input.requestId,
    }
    const screening = await insertSupabaseShieldScreening(screeningInput)
    if (!screening) throw new FlowExecutionError("screening_audit_unavailable", "Compliance result could not be persisted.", 503, run)

    if (policy.decision !== "allow") {
      steps = setStep(steps, "screening", policy.decision === "block" ? "blocked" : "review", policy.decisionReason)
      steps = setStep(steps, "access", "skipped", "Waiting for compliance clearance.")
      steps = setStep(steps, "settlement", "skipped", "No value moved.")
      steps = setStep(steps, "reputation", "skipped", "No economic event to score.")
      run = await persist(runId, {
        status: policy.decision === "block" ? "blocked" : "review",
        steps,
        screeningId: screening.id,
        screeningDecision: policy.decision,
        completedAt: new Date().toISOString(),
      }, run)
      return { idempotent: false, run }
    }

    steps = setStep(steps, "screening", "passed", policy.decisionReason)
    steps = setStep(steps, "access", "running", "Checking reputation, budget and balance policies.")
    run = await persist(runId, {
      currentStep: "access",
      steps,
      screeningId: screening.id,
      screeningDecision: "allow",
    }, run)

    const settlement = await executeArcSettlement({
      agentId: input.agentId,
      apiId: input.apiId,
      amountUsdc: input.amountUsdc,
      recipientAddress: input.recipientAddress,
      idempotencyKey: `flow:${input.idempotencyKey}`,
    })

    if (!settlement.ok) {
      steps = setStep(steps, "access", "blocked", settlement.decision.reason)
      steps = setStep(steps, "settlement", "skipped", "Policy denied transfer.")
      steps = setStep(steps, "reputation", "skipped", "Denied request is already available in Reputation events.")
      run = await persist(runId, {
        status: "blocked",
        steps,
        accessDecisionId: settlement.decision.decisionId,
        accessAllowed: false,
        settlementId: settlement.settlement.id,
        completedAt: new Date().toISOString(),
      }, run)
      return { idempotent: false, run }
    }

    steps = setStep(steps, "access", "passed", settlement.decision.reason)
    steps = setStep(steps, "settlement", "passed", "USDC confirmed on Arc Testnet.")
    steps = setStep(steps, "reputation", "passed", `Reputation updated by ${formatDelta(settlement.result.scoreDelta)} points.`)
    run = await persist(runId, {
      status: "completed",
      currentStep: "reputation",
      steps,
      accessDecisionId: settlement.decision.decisionId,
      accessAllowed: true,
      settlementId: settlement.result.settlement.id,
      txHash: settlement.result.transaction.txHash,
      explorerUrl: settlement.result.transaction.explorerUrl ?? settlement.result.settlement.explorerUrl,
      reputationScoreBefore: settlement.result.settlement.reputationScoreBefore,
      reputationScoreAfter: settlement.result.settlement.reputationScoreAfter,
      completedAt: new Date().toISOString(),
    }, run)
    return { idempotent: false, run }
  } catch (error) {
    const execution = normalizeError(error)
    steps = setStep(steps, run.currentStep, "failed", execution.message)
    run = await persist(runId, {
      status: execution.code.startsWith("circle_") ? "review" : "failed",
      steps,
      errorCode: execution.code,
      errorMessage: execution.message.slice(0, 500),
      completedAt: new Date().toISOString(),
    }, run)
    throw new FlowExecutionError(execution.code, execution.message, execution.status, run)
  }
}

function initialSteps(): FlowStep[] {
  return [
    { key: "screening", label: "Shield screening", status: "pending", detail: "Recipient risk has not been checked.", completedAt: null },
    { key: "access", label: "Access policy", status: "pending", detail: "Trust and budget policy has not run.", completedAt: null },
    { key: "settlement", label: "Arc settlement", status: "pending", detail: "USDC has not moved.", completedAt: null },
    { key: "reputation", label: "Reputation update", status: "pending", detail: "No score event recorded.", completedAt: null },
  ]
}

function setStep(steps: FlowStep[], key: FlowStep["key"], status: FlowStep["status"], detail: string) {
  return steps.map((step) => step.key === key
    ? { ...step, status, detail, completedAt: ["passed", "review", "blocked", "failed", "skipped"].includes(status) ? new Date().toISOString() : null }
    : step)
}

async function persist(runId: string, updates: Partial<FlowRun>, fallback: FlowRun) {
  return (await updateSupabaseFlowRun(runId, updates)) ?? { ...fallback, ...updates, updatedAt: new Date().toISOString() }
}

function normalizeError(error: unknown) {
  if (error instanceof FlowExecutionError) return error
  if (error instanceof CircleComplianceError) {
    return new FlowExecutionError("circle_compliance_unavailable", error.message, error.status === 401 || error.status === 403 ? 502 : error.status)
  }
  if (error instanceof SettlementExecutionError) return new FlowExecutionError(error.code, error.message, error.status)
  return new FlowExecutionError("flow_execution_failed", error instanceof Error ? error.message : "Arc Flow failed.", 500)
}

function formatDelta(value: number) {
  return value >= 0 ? `+${value}` : String(value)
}
