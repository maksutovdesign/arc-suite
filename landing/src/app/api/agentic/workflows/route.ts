import { createHash } from "crypto"
import { NextRequest, NextResponse } from "next/server"

import { createAgenticDemoRun } from "@/lib/backend/agentic-demo-service"
import { createRequestId, logOperationalEvent, requestIdHeaders } from "@/lib/backend/observability"
import { enforceRateLimit, rateLimitHeaders, rateLimitResponse } from "@/lib/backend/rate-limit"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  const requestId = createRequestId(request)
  const ipHash = hashClientIp(request)
  const body = await parseBody(request)
  const rateLimit = await enforceRateLimit({
    bucketKey: ipHash ?? optionalString(body?.sessionId),
    ipHash,
    max: 24,
    route: "agentic_workflows",
    windowMs: 10 * 60 * 1000,
  })

  if (!rateLimit.allowed) {
    logOperationalEvent({ event: "agentic.workflow.rate_limited", level: "warn", requestId, route: "/api/agentic/workflows" })
    const response = rateLimitResponse(rateLimit)
    response.headers.set("X-Request-Id", requestId)
    return response
  }

  const result = await createAgenticDemoRun({
    requestId,
    sessionId: optionalString(body?.sessionId),
  })

  logOperationalEvent({
    details: {
      proofUrl: result.proofUrl,
      stored: result.stored,
      workflowId: result.proof.workflowId,
    },
    event: "agentic.workflow.demo_created",
    level: result.stored ? "info" : "warn",
    requestId,
    route: "/api/agentic/workflows",
  })

  return NextResponse.json(
    {
      ok: true,
      proof: result.proof,
      proofUrl: result.proofUrl,
      runId: result.proof.workflowId,
      stored: result.stored,
    },
    {
      headers: {
        ...rateLimitHeaders(rateLimit),
        ...requestIdHeaders(requestId),
      },
      status: result.stored ? 201 : 202,
    },
  )
}

async function parseBody(request: NextRequest) {
  try {
    const raw = await request.text()
    if (!raw) return {}
    if (raw.length > 8_192) return {}
    return JSON.parse(raw) as Record<string, unknown>
  } catch {
    return {}
  }
}

function optionalString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim().slice(0, 160) : null
}

function hashClientIp(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
  const ip = forwardedFor || request.headers.get("x-real-ip")
  const salt = process.env.ARC_ANALYTICS_SALT ?? process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!ip || !salt) return null
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex")
}
