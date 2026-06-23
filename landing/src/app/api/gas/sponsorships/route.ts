import { createHash } from "crypto"
import { NextRequest, NextResponse } from "next/server"

import { requireArcApiKey } from "@/lib/backend/auth"
import { createRequestId, logOperationalEvent, requestIdHeaders } from "@/lib/backend/observability"
import { enforceRateLimit, rateLimitHeaders, rateLimitResponse } from "@/lib/backend/rate-limit"
import { requestSupabaseGasSponsorship } from "@/lib/backend/supabase"

export async function POST(request: NextRequest) {
  const requestId = createRequestId(request)
  const unauthorized = await requireArcApiKey(request, ["write"])
  if (unauthorized) return unauthorized
  const body = await request.json().catch(() => null)
  const validationError = validate(body)
  if (validationError) {
    return NextResponse.json(
      { error: "invalid_gas_sponsorship", message: validationError },
      { status: 400, headers: requestIdHeaders(requestId) },
    )
  }

  const ipHash = hashClientIp(request)
  const rateLimit = await enforceRateLimit({
    bucketKey: request.headers.get("x-arc-client-bucket") ?? ipHash ?? body.agentId,
    ipHash,
    max: 60,
    route: "gas_sponsorship",
    windowMs: 10 * 60 * 1000,
  })
  if (!rateLimit.allowed) {
    const response = rateLimitResponse(rateLimit)
    response.headers.set("X-Request-Id", requestId)
    return response
  }

  try {
    const sponsorship = await requestSupabaseGasSponsorship({
      agentId: body.agentId,
      idempotencyKey: body.idempotencyKey,
      action: body.action.trim(),
      destination: body.destination?.trim() || null,
      estimatedFeeUsdc: body.estimatedFeeUsdc,
      metadata: { source: body.source ?? "arc_gas_api" },
    })
    if (!sponsorship) throw new Error("Arc Gas migration is required.")
    logOperationalEvent({
      event: sponsorship.status === "denied" ? "gas.sponsorship.denied" : "gas.sponsorship.approved",
      level: sponsorship.status === "denied" ? "warn" : "info",
      requestId,
      route: "/api/gas/sponsorships",
      details: {
        agentId: sponsorship.agentId,
        estimatedFeeUsdc: sponsorship.estimatedFeeUsdc,
        reason: sponsorship.decisionReason,
      },
    })
    return NextResponse.json(
      { sponsorship },
      { status: sponsorship.status === "denied" ? 403 : 201, headers: { ...rateLimitHeaders(rateLimit), ...requestIdHeaders(requestId) } },
    )
  } catch (reason) {
    const message = reason instanceof Error ? reason.message : "Gas sponsorship failed."
    return NextResponse.json(
      { error: "gas_sponsorship_failed", message },
      { status: message.includes("not found") ? 404 : 503, headers: requestIdHeaders(requestId) },
    )
  }
}

function validate(body: unknown) {
  if (!body || typeof body !== "object" || Array.isArray(body)) return "JSON object is required"
  const value = body as Record<string, unknown>
  if (typeof value.agentId !== "string" || !value.agentId.trim()) return "agentId is required"
  if (typeof value.action !== "string" || value.action.trim().length < 3 || value.action.length > 120) return "action must be 3-120 characters"
  if (typeof value.estimatedFeeUsdc !== "number" || !Number.isFinite(value.estimatedFeeUsdc) || value.estimatedFeeUsdc < 0 || value.estimatedFeeUsdc > 100) return "estimatedFeeUsdc must be between 0 and 100"
  if (typeof value.idempotencyKey !== "string" || !/^[a-zA-Z0-9._:-]{12,120}$/.test(value.idempotencyKey)) return "idempotencyKey must be 12-120 safe characters"
  if (value.destination !== undefined && value.destination !== "" && (typeof value.destination !== "string" || !/^0x[a-fA-F0-9]{40}$/.test(value.destination))) return "destination must be a full EVM address"
  return null
}

function hashClientIp(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip")
  const salt = process.env.ARC_ANALYTICS_SALT ?? process.env.SUPABASE_SERVICE_ROLE_KEY
  return ip && salt ? createHash("sha256").update(`${salt}:${ip}`).digest("hex") : null
}
