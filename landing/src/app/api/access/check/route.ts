import { createHash } from "crypto"
import { NextRequest, NextResponse } from "next/server"
import { requireArcApiKey } from "@/lib/backend/auth"
import { createRequestId, logOperationalEvent, requestIdHeaders } from "@/lib/backend/observability"
import { enforceRateLimit, rateLimitHeaders, rateLimitResponse } from "@/lib/backend/rate-limit"
import { checkAccess } from "@/lib/backend/service"

export async function POST(request: NextRequest) {
  const requestId = createRequestId(request)
  const unauthorized = await requireArcApiKey(request, ["write"])
  if (unauthorized) return unauthorized

  const body = await request.json().catch(() => null)
  if (!body || typeof body.agentId !== "string" || typeof body.apiId !== "string") {
    logOperationalEvent({ event: "access_check.invalid_payload", level: "warn", requestId, route: "/api/access/check" })
    return NextResponse.json({ error: "agentId and apiId are required" }, { headers: requestIdHeaders(requestId), status: 400 })
  }

  const ipHash = hashClientIp(request)
  const rateLimit = await enforceRateLimit({
    bucketKey: request.headers.get("x-arc-client-bucket") ?? ipHash ?? `${body.agentId}:${body.apiId}`,
    ipHash,
    max: 60,
    route: "access_check",
    windowMs: 10 * 60 * 1000,
  })
  if (!rateLimit.allowed) {
    logOperationalEvent({ event: "access_check.rate_limited", level: "warn", requestId, route: "/api/access/check" })
    const response = rateLimitResponse(rateLimit)
    response.headers.set("X-Request-Id", requestId)
    return response
  }

  const decision = await checkAccess({
    agentId: body.agentId,
    apiId: body.apiId,
    amountUsdc: typeof body.amountUsdc === "number" ? body.amountUsdc : undefined,
  })

  if (!decision) {
    logOperationalEvent({
      details: { agentId: body.agentId, apiId: body.apiId },
      event: "access_check.not_found",
      level: "warn",
      requestId,
      route: "/api/access/check",
    })
    return NextResponse.json(
      { error: "Agent, API, or reputation profile not found" },
      { headers: requestIdHeaders(requestId), status: 404 },
    )
  }

  logOperationalEvent({
    details: {
      agentId: decision.agentId,
      allowed: decision.allowed,
      apiId: decision.apiId,
      reason: decision.reason,
    },
    event: "access_check.completed",
    requestId,
    route: "/api/access/check",
  })

  return NextResponse.json({ decision }, { headers: { ...rateLimitHeaders(rateLimit), ...requestIdHeaders(requestId) } })
}

function hashClientIp(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
  const ip = forwardedFor || request.headers.get("x-real-ip")
  const salt = process.env.ARC_ANALYTICS_SALT ?? process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!ip || !salt) return null
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex")
}
