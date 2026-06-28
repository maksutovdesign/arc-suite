import { randomUUID } from "crypto"

import { buildAgenticDemoProof } from "@/lib/agentic-demo-proof"
import type { AgenticWorkflowProof } from "@/lib/agentic-demo-proof"
import {
  ensureSupabaseArcAgentIdentity,
  insertSupabaseArcAgentJob,
  insertSupabaseArcAgentJobArtifacts,
  insertSupabaseArcAgentJobValidation,
  insertSupabaseFlowRun,
} from "./supabase"

type CreateAgenticDemoRunInput = {
  requestId: string
  sessionId?: string | null
}

export type CreateAgenticDemoRunResult = {
  proof: AgenticWorkflowProof
  proofUrl: string
  stored: boolean
}

export async function createAgenticDemoRun(input: CreateAgenticDemoRunInput): Promise<CreateAgenticDemoRunResult> {
  const suffix = randomUUID().replace(/-/g, "").slice(0, 12)
  const workflowId = `flow_agentic_${suffix}`
  const jobId = `arc_job_${suffix}`
  const generatedAt = new Date().toISOString()
  const proof = buildAgenticDemoProof({
    generatedAt,
    jobId,
    nonce: input.sessionId ? `${input.sessionId}:${suffix}` : suffix,
    workflowId,
  })
  const databaseProof = {
    ...proof,
    flowRun: {
      ...proof.flowRun,
      accessDecisionId: null,
      requestId: input.requestId,
      screeningId: null,
      settlementId: null,
    },
    agentJob: {
      ...proof.agentJob,
      settlementId: null,
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
        },
      },
    },
    proofUrl: `/proof?id=${encodeURIComponent(workflowId)}`,
    stored,
  }
}

function omitFlowTimestamps(flowRun: AgenticWorkflowProof["flowRun"]) {
  const { createdAt: _createdAt, updatedAt: _updatedAt, workspaceId: _workspaceId, ...insertable } = flowRun
  return insertable
}
