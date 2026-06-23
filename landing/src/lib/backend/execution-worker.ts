import { randomUUID } from "crypto"
import { initiateDeveloperControlledWalletsClient } from "@circle-fin/developer-controlled-wallets"

import type { ExecutionJob } from "./schema"
import { claimSupabaseExecutionJobs, finishSupabaseExecutionJob } from "./supabase"

const failedStates = new Set(["FAILED", "DENIED", "CANCELLED", "CANCELED"])
const successStates = new Set(["COMPLETE", "COMPLETED", "CONFIRMED", "SUCCESS", "SUCCEEDED"])

export async function runExecutionWorker(input?: { limit?: number; workerId?: string }) {
  const workerId = input?.workerId ?? `worker_${randomUUID()}`
  const jobs = await claimSupabaseExecutionJobs({ workerId, limit: input?.limit ?? 10 })
  if (!jobs) return { workerId, claimed: 0, results: [], configured: false }
  const results = []
  for (const job of jobs) {
    results.push(await processExecutionJob(job, workerId))
  }
  return { workerId, claimed: jobs.length, results, configured: true }
}

async function processExecutionJob(job: ExecutionJob, workerId: string) {
  if (!job.providerOperationId) {
    const updated = await finishSupabaseExecutionJob({
      jobId: job.id,
      workerId,
      status: "waiting_provider",
      errorCode: "provider_operation_pending",
      errorMessage: "Provider submission has not supplied an operation ID yet.",
      retrySeconds: 900,
    })
    return summarize(updated)
  }

  try {
    const transaction = await getCircleTransaction(job.providerOperationId)
    const state = String(transaction.state ?? transaction.status ?? "").toUpperCase()
    if (successStates.has(state)) {
      return summarize(await finishSupabaseExecutionJob({
        jobId: job.id,
        workerId,
        status: "succeeded",
        providerOperationId: job.providerOperationId,
        providerReceipt: transaction,
      }))
    }
    if (failedStates.has(state)) {
      return summarize(await finishSupabaseExecutionJob({
        jobId: job.id,
        workerId,
        status: "failed",
        providerOperationId: job.providerOperationId,
        providerReceipt: transaction,
        errorCode: "circle_provider_failed",
        errorMessage: String(transaction.errorReason ?? `Circle transaction entered ${state}`),
      }))
    }
    return summarize(await finishSupabaseExecutionJob({
      jobId: job.id,
      workerId,
      status: "waiting_provider",
      providerOperationId: job.providerOperationId,
      providerReceipt: transaction,
      retrySeconds: 90,
    }))
  } catch (error) {
    const retrySeconds = Math.min(15 * 60, 15 * 2 ** Math.min(job.attempts, 6))
    return summarize(await finishSupabaseExecutionJob({
      jobId: job.id,
      workerId,
      status: "retry",
      errorCode: "circle_reconciliation_failed",
      errorMessage: error instanceof Error ? error.message : "Circle reconciliation failed",
      retrySeconds,
    }))
  }
}

async function getCircleTransaction(id: string) {
  if (!process.env.CIRCLE_API_KEY || !process.env.CIRCLE_ENTITY_SECRET) throw new Error("Circle Wallets credentials are not configured")
  const client = initiateDeveloperControlledWalletsClient({
    apiKey: process.env.CIRCLE_API_KEY,
    entitySecret: process.env.CIRCLE_ENTITY_SECRET,
  })
  const response = await client.getTransaction({ id })
  const transaction = response.data?.transaction
  if (!transaction) throw new Error("Circle transaction was not found")
  return JSON.parse(JSON.stringify(transaction)) as Record<string, unknown>
}

function summarize(job: ExecutionJob | null) {
  return job ? { id: job.id, status: job.status, attempts: job.attempts, resourceId: job.resourceId } : null
}
