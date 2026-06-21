import { createHash, randomUUID } from "crypto"
import { NextRequest, NextResponse } from "next/server"

import { requireArcApiKey } from "@/lib/backend/auth"
import { createRequestId, logOperationalEvent, requestIdHeaders } from "@/lib/backend/observability"
import { enforceRateLimit, rateLimitHeaders, rateLimitResponse } from "@/lib/backend/rate-limit"
import { recordSupabaseBillingUsage } from "@/lib/backend/supabase"

export async function POST(request: NextRequest) {
  const requestId = createRequestId(request)
  const unauthorized = await requireArcApiKey(request, ["write"])
  if (unauthorized) return unauthorized
  const body = await request.json().catch(() => null)
  const error = validate(body)
  if (error) return NextResponse.json({ error: "invalid_usage_event", message: error }, { status: 400, headers: requestIdHeaders(requestId) })

  const rateLimit = await enforceRateLimit({
    bucketKey: request.headers.get("x-arc-client-bucket") ?? hashClientIp(request) ?? body.agentId,
    ipHash: hashClientIp(request),
    max: 120,
    route: "billing_usage",
    windowMs: 10 * 60 * 1000,
  })
  if (!rateLimit.allowed) {
    const response = rateLimitResponse(rateLimit)
    response.headers.set("X-Request-Id", requestId)
    return response
  }

  try {
    const usage = await recordSupabaseBillingUsage({
      id: `usage_${randomUUID()}`,
      agentId: body.agentId,
      apiId: body.apiId,
      idempotencyKey: body.idempotencyKey,
      units: body.units,
      metadata: typeof body.metadata === "object" && body.metadata ? body.metadata : {},
      occurredAt: new Date().toISOString(),
    })
    if (!usage) throw new Error("Billing usage migration is required.")
    logOperationalEvent({
      event: "billing.usage.recorded",
      requestId,
      route: "/api/billing/usage",
      details: { agentId: usage.agentId, apiId: usage.apiId, units: usage.units, netAmountUsdc: usage.netAmountUsdc },
    })
    return NextResponse.json({ usage }, { status: 201, headers: { ...rateLimitHeaders(rateLimit), ...requestIdHeaders(requestId) } })
  } catch (reason) {
    const message = reason instanceof Error ? reason.message : "Usage metering failed."
    const status = message.includes("Insufficient prepaid balance") ? 402 : message.includes("not found") ? 404 : 503
    return NextResponse.json({ error: "billing_usage_failed", message }, { status, headers: requestIdHeaders(requestId) })
  }
}

function validate(body: unknown) {
  if (!body || typeof body !== "object" || Array.isArray(body)) return "JSON object is required"
  const data = body as Record<string, unknown>
  if (typeof data.agentId !== "string" || !data.agentId.trim()) return "agentId is required"
  if (typeof data.apiId !== "string" || !data.apiId.trim()) return "apiId is required"
  if (typeof data.units !== "number" || !Number.isFinite(data.units) || data.units <= 0 || data.units > 1_000_000) return "units must be between 0 and 1,000,000"
  if (typeof data.idempotencyKey !== "string" || !/^[a-zA-Z0-9._:-]{12,120}$/.test(data.idempotencyKey)) return "idempotencyKey must be 12-120 safe characters"
  return null
}

function hashClientIp(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip")
  const salt = process.env.ARC_ANALYTICS_SALT ?? process.env.SUPABASE_SERVICE_ROLE_KEY
  return ip && salt ? createHash("sha256").update(`${salt}:${ip}`).digest("hex") : null
}
