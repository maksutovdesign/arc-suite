import { createHash } from "crypto"
import { NextRequest, NextResponse } from "next/server"

import { requireArcApiKey } from "@/lib/backend/auth"
import { CIRCLE_SCREENING_CHAINS } from "@/lib/backend/circle-compliance"
import { executeArcFlow, FlowExecutionError } from "@/lib/backend/flow-service"
import { createRequestId, logOperationalEvent, requestIdHeaders } from "@/lib/backend/observability"
import { enforceRateLimit, rateLimitHeaders, rateLimitResponse } from "@/lib/backend/rate-limit"
import type { FlowRun, FlowSummary } from "@/lib/backend/schema"
import { checkSupabaseFlowReadiness, listSupabaseFlowRuns } from "@/lib/backend/supabase"

export const runtime = "nodejs"
export const maxDuration = 60

export async function GET(request: NextRequest) {
  const requestId = createRequestId(request)
  const unauthorized = await requireArcApiKey(request, ["read"])
  if (unauthorized) return unauthorized
  const requested = Number(new URL(request.url).searchParams.get("limit") ?? 50)
  const limit = Number.isFinite(requested) ? Math.min(Math.max(Math.round(requested), 1), 100) : 50
  const [runs, auditStorage] = await Promise.all([
    listSupabaseFlowRuns(limit),
    checkSupabaseFlowReadiness(),
  ])
  const items = runs ?? []
  return NextResponse.json(
    { auditStorage, runs: items, summary: summarize(items) },
    { headers: requestIdHeaders(requestId) },
  )
}

export async function POST(request: NextRequest) {
  const requestId = createRequestId(request)
  const unauthorized = await requireArcApiKey(request, ["write"])
  if (unauthorized) return unauthorized
  const body = await request.json().catch(() => null)
  const validationError = validateRequest(body)
  if (validationError) {
    return NextResponse.json({ error: "invalid_flow_request", message: validationError }, { status: 400, headers: requestIdHeaders(requestId) })
  }

  const ipHash = hashClientIp(request)
  const rateLimit = await enforceRateLimit({
    bucketKey: request.headers.get("x-arc-client-bucket") ?? ipHash ?? body.agentId,
    ipHash,
    max: 10,
    route: "flow_run",
    windowMs: 10 * 60 * 1000,
  })
  if (!rateLimit.allowed) {
    const response = rateLimitResponse(rateLimit)
    response.headers.set("X-Request-Id", requestId)
    return response
  }

  try {
    const result = await executeArcFlow({ ...body, requestId })
    logOperationalEvent({
      event: "flow.run.completed",
      requestId,
      route: "/api/flow/runs",
      level: result.run.status === "completed" ? "info" : "warn",
      details: { flowRunId: result.run.id, status: result.run.status, txHash: result.run.txHash },
    })
    return NextResponse.json(result, {
      status: result.idempotent ? 200 : 201,
      headers: { ...rateLimitHeaders(rateLimit), ...requestIdHeaders(requestId) },
    })
  } catch (error) {
    const execution = error instanceof FlowExecutionError
      ? error
      : new FlowExecutionError("flow_execution_failed", "Arc Flow failed.", 500)
    logOperationalEvent({
      event: "flow.run.failed",
      requestId,
      route: "/api/flow/runs",
      level: "error",
      details: { code: execution.code, flowRunId: execution.run?.id },
    })
    return NextResponse.json(
      { error: execution.code, message: execution.message, run: execution.run },
      { status: execution.status, headers: { ...rateLimitHeaders(rateLimit), ...requestIdHeaders(requestId) } },
    )
  }
}

function validateRequest(body: unknown) {
  if (!body || typeof body !== "object" || Array.isArray(body)) return "JSON object is required"
  const data = body as Record<string, unknown>
  if (typeof data.agentId !== "string" || !data.agentId.trim()) return "agentId is required"
  if (typeof data.apiId !== "string" || !data.apiId.trim()) return "apiId is required"
  if (typeof data.amountUsdc !== "number" || !Number.isFinite(data.amountUsdc) || data.amountUsdc <= 0) return "amountUsdc must be positive"
  if (typeof data.recipientAddress !== "string" || !/^0x[a-fA-F0-9]{40}$/.test(data.recipientAddress)) return "recipientAddress must be a full EVM address"
  if (typeof data.screeningChain !== "string" || !CIRCLE_SCREENING_CHAINS.includes(data.screeningChain as (typeof CIRCLE_SCREENING_CHAINS)[number])) return "screeningChain is unsupported"
  if (typeof data.idempotencyKey !== "string" || !/^[a-zA-Z0-9._:-]{12,100}$/.test(data.idempotencyKey)) return "idempotencyKey must be 12-100 safe characters"
  return null
}

function summarize(runs: FlowRun[]): FlowSummary {
  return {
    total: runs.length,
    completed: runs.filter((run) => run.status === "completed").length,
    review: runs.filter((run) => run.status === "review").length,
    blocked: runs.filter((run) => run.status === "blocked").length,
    failed: runs.filter((run) => run.status === "failed").length,
    lastRunAt: runs[0]?.createdAt ?? null,
  }
}

function hashClientIp(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip")
  const salt = process.env.ARC_ANALYTICS_SALT ?? process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!ip || !salt) return null
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex")
}
