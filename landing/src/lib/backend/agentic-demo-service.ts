import { randomUUID } from "crypto"

import { buildAgenticDemoProof } from "@/lib/agentic-demo-proof"
import type { AgenticWorkflowProof } from "@/lib/agentic-demo-proof"
import { getArcSettlementConfiguration } from "./arc-settlement"
import {
  ensureSupabaseArcAgentIdentity,
  insertSupabaseArcAgentJob,
  insertSupabaseArcAgentJobArtifacts,
  insertSupabaseArcAgentJobValidation,
  insertSupabaseFlowRun,
} from "./supabase"
import type { FlowRun } from "./schema"
import { executeArcSettlement, SettlementExecutionError } from "./settlement-service"

type CreateAgenticDemoRunInput = {
  apiId?: string | null
  requestId: string
  sessionId?: string | null
}

type LiveSettlementStatus =
  | { enabled: false; status: "disabled" }
  | { enabled: true; status: "confirmed"; explorerUrl: string | null; settlementId: string; txHash: string | null }
  | { enabled: true; status: "policy_denied"; settlementId: string; reason: string }
  | { enabled: true; status: "failed"; code: string; message: string }

export type CreateAgenticDemoRunResult = {
  liveSettlement: LiveSettlementStatus
  proof: AgenticWorkflowProof
  proofUrl: string
  stored: boolean
}

export async function createAgenticDemoRun(input: CreateAgenticDemoRunInput): Promise<CreateAgenticDemoRunResult> {
  const suffix = randomUUID().replace(/-/g, "").slice(0, 12)
  const workflowId = `flow_agentic_${suffix}`
  const jobId = `arc_job_${suffix}`
  const generatedAt = new Date().toISOString()
  const baseProof = buildAgenticDemoProof({
    apiId: input.apiId,
    generatedAt,
    jobId,
    nonce: input.sessionId ? `${input.sessionId}:${suffix}` : suffix,
    workflowId,
  })
  const liveSettlement = await tryLiveSettlement({
    baseProof,
    requestId: input.requestId,
    sessionId: input.sessionId,
    workflowId,
  })
  const proof = buildAgenticDemoProof({
    apiId: input.apiId,
    flowRunOverrides: liveSettlement.flowRunOverrides,
    generatedAt,
    jobId,
    nonce: input.sessionId ? `${input.sessionId}:${suffix}` : suffix,
    workflowId,
  })
  const databaseProof = {
    ...proof,
    flowRun: {
      ...proof.flowRun,
      accessDecisionId: liveSettlement.flowRunOverrides.accessDecisionId ?? null,
      requestId: input.requestId,
      screeningId: null,
      settlementId: liveSettlement.flowRunOverrides.settlementId ?? null,
    },
    agentJob: {
      ...proof.agentJob,
      executionJobId: null,
      metadata: {
        ...proof.agentJob.metadata,
        liveSettlement: liveSettlement.status,
      },
      settlementId: liveSettlement.flowRunOverrides.settlementId ?? null,
    },
  }

  const flowRun = await insertSupabaseFlowRun(omitFlowTimestamps(databaseProof.flowRun))
  const identity = await ensureSupabaseArcAgentIdentity(databaseProof.agentIdentity)
  const job = await insertSupabaseArcAgentJob(databaseProof.agentJob)
  const artifacts = await insertSupabaseArcAgentJobArtifacts(databaseProof.artifacts)
  const validation = await insertSupabaseArcAgentJobValidation(databaseProof.agentValidation)
  const stored = Boolean(flowRun)
  const agentModelStored = Boolean(identity && job && artifacts?.length && validation)

  return {
    liveSettlement: liveSettlement.status,
    proof: {
      ...proof,
      proofSource: stored ? "supabase" : "demo",
      requestId: input.requestId,
      stored,
      agentJob: {
        ...proof.agentJob,
        metadata: {
          ...proof.agentJob.metadata,
          agentModelStored,
          liveSettlement: liveSettlement.status,
        },
      },
    },
    proofUrl: `/proof?id=${encodeURIComponent(workflowId)}`,
    stored,
  }
}

async function tryLiveSettlement(input: {
  baseProof: AgenticWorkflowProof
  requestId: string
  sessionId?: string | null
  workflowId: string
}): Promise<{ flowRunOverrides: Partial<FlowRun>; status: LiveSettlementStatus }> {
  if (process.env.ARC_AGENTIC_LIVE_SETTLEMENT !== "true") {
    return { flowRunOverrides: {}, status: { enabled: false, status: "disabled" } }
  }

  try {
    const config = getArcSettlementConfiguration()
    const recipientAddress = normalizeAddress(process.env.ARC_AGENTIC_SETTLEMENT_RECIPIENT) ?? config.defaultRecipient
    if (!recipientAddress) {
      return {
        flowRunOverrides: {},
        status: {
          code: "recipient_not_configured",
          enabled: true,
          message: "ARC_AGENTIC_SETTLEMENT_RECIPIENT or ARC_SETTLEMENT_DEFAULT_RECIPIENT is required",
          status: "failed",
        },
      }
    }

    const amountUsdc = Math.min(
      parsePositiveNumber(process.env.ARC_AGENTIC_SETTLEMENT_AMOUNT_USDC, 0.003),
      config.maxAmountUsdc,
    )
    const result = await executeArcSettlement({
      agentId: input.baseProof.agent.id,
      amountUsdc,
      apiId: input.baseProof.api.id,
      idempotencyKey: input.workflowId,
      memo: {
        agenticWorkflow: true,
        requestId: input.requestId,
        sessionId: input.sessionId ?? null,
        source: "agentic_workflow",
      },
      memoLabel: "Arc Suite agentic workflow",
      recipientAddress,
    })

    if (!result.ok) {
      return {
        flowRunOverrides: {
          accessAllowed: false,
          accessDecisionId: result.decision.decisionId,
          amountUsdc: result.decision.amountUsdc,
          errorCode: "policy_denied",
          errorMessage: result.decision.reason,
          recipientAddress,
          settlementId: result.settlement.id,
          status: "blocked",
        },
        status: {
          enabled: true,
          reason: result.decision.reason,
          settlementId: result.settlement.id,
          status: "policy_denied",
        },
      }
    }

    const settlement = result.result.settlement
    return {
      flowRunOverrides: {
        accessAllowed: true,
        accessDecisionId: result.decision.decisionId,
        amountUsdc: settlement.amountUsdc,
        explorerUrl: settlement.explorerUrl,
        recipientAddress: settlement.recipientAddress,
        reputationScoreAfter: settlement.reputationScoreAfter,
        reputationScoreBefore: settlement.reputationScoreBefore,
        settlementId: settlement.id,
        txHash: settlement.txHash,
      },
      status: {
        enabled: true,
        explorerUrl: settlement.explorerUrl,
        settlementId: settlement.id,
        status: "confirmed",
        txHash: settlement.txHash,
      },
    }
  } catch (error) {
    return {
      flowRunOverrides: {},
      status: {
        code: error instanceof SettlementExecutionError ? error.code : "live_settlement_failed",
        enabled: true,
        message: error instanceof Error ? error.message : "Live settlement failed",
        status: "failed",
      },
    }
  }
}

function omitFlowTimestamps(flowRun: AgenticWorkflowProof["flowRun"]): Omit<FlowRun, "createdAt" | "updatedAt" | "workspaceId"> {
  const { createdAt, updatedAt, workspaceId, ...insertable } = flowRun as FlowRun
  void createdAt
  void updatedAt
  void workspaceId
  return insertable
}

function normalizeAddress(value: string | undefined | null) {
  const trimmed = value?.trim()
  if (!trimmed || !/^0x[a-fA-F0-9]{40}$/.test(trimmed)) return null
  return trimmed.toLowerCase()
}

function parsePositiveNumber(value: string | undefined, fallback: number) {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}
