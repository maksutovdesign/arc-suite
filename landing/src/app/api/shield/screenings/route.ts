import { createHash, randomUUID } from "crypto"
import { NextRequest, NextResponse } from "next/server"

import {
  CIRCLE_SCREENING_CHAINS,
  CircleComplianceError,
  evaluateShieldPolicy,
  getCircleComplianceConfiguration,
  screenCircleAddress,
} from "@/lib/backend/circle-compliance"
import { requireArcApiKey } from "@/lib/backend/auth"
import { createRequestId, logOperationalEvent, requestIdHeaders } from "@/lib/backend/observability"
import { enforceRateLimit, rateLimitHeaders, rateLimitResponse } from "@/lib/backend/rate-limit"
import type { ShieldScreening, ShieldSummary } from "@/lib/backend/schema"
import {
  checkSupabaseShieldReadiness,
  findSupabaseShieldScreening,
  insertSupabaseShieldScreening,
  listSupabaseShieldScreenings,
} from "@/lib/backend/supabase"

export const runtime = "nodejs"
export const maxDuration = 30

export async function GET(request: NextRequest) {
  const requestId = createRequestId(request)
  const unauthorized = await requireArcApiKey(request, ["read"])
  if (unauthorized) return unauthorized

  const requestedLimit = Number(new URL(request.url).searchParams.get("limit") ?? 50)
  const limit = Number.isFinite(requestedLimit) ? Math.min(Math.max(Math.round(requestedLimit), 1), 200) : 50
  const [screeningRows, auditStorage] = await Promise.all([
    listSupabaseShieldScreenings(limit),
    checkSupabaseShieldReadiness(),
  ])
  const screenings = screeningRows ?? []

  return NextResponse.json(
    {
      configuration: {
        ...getCircleComplianceConfiguration(),
        auditStorage,
      },
      screenings,
      summary: summarize(screenings),
    },
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
    return NextResponse.json(
      { error: "invalid_screening_request", message: validationError },
      { headers: requestIdHeaders(requestId), status: 400 },
    )
  }

  const address = body.address.trim()
  const chain = body.chain
  const idempotencyKey = body.idempotencyKey ?? randomUUID()
  const existing = await findSupabaseShieldScreening(idempotencyKey)
  if (existing) {
    return NextResponse.json(
      { idempotent: true, screening: existing, stored: true },
      { headers: requestIdHeaders(requestId) },
    )
  }

  const ipHash = hashClientIp(request)
  const rateLimit = await enforceRateLimit({
    bucketKey: request.headers.get("x-arc-client-bucket") ?? ipHash ?? address,
    ipHash,
    max: 30,
    route: "shield_screening",
    windowMs: 10 * 60 * 1000,
  })
  if (!rateLimit.allowed) {
    const response = rateLimitResponse(rateLimit)
    response.headers.set("X-Request-Id", requestId)
    return response
  }

  try {
    const providerResult = await screenCircleAddress({ address, chain, idempotencyKey })
    const providerResponse = providerResult.response
    const policy = evaluateShieldPolicy(providerResponse)
    const screeningInput: Omit<ShieldScreening, "workspaceId" | "createdAt"> = {
      id: `scr_${randomUUID()}`,
      idempotencyKey,
      address,
      chain,
      provider: "circle_compliance_engine",
      providerScreeningId: typeof providerResponse.id === "string" ? providerResponse.id : null,
      providerResult: typeof providerResponse.result === "string" ? providerResponse.result : null,
      providerStatus: "completed",
      decision: policy.decision,
      decisionReason: policy.decisionReason,
      ruleName: policy.ruleName,
      actions: policy.actions,
      riskScore: policy.riskScore,
      riskCategories: policy.riskCategories,
      reasons: policy.reasons,
      alertId: typeof providerResponse.alertId === "string" ? providerResponse.alertId : null,
      rawResponse: providerResult.rawResponse,
      requestId,
    }
    const stored = await insertSupabaseShieldScreening(screeningInput)
    const screening = stored ?? {
      ...screeningInput,
      workspaceId: "wrk_arc_demo",
      createdAt: new Date().toISOString(),
    }

    logOperationalEvent({
      details: {
        addressSuffix: address.slice(-6),
        chain,
        decision: screening.decision,
        providerResult: screening.providerResult,
        riskCategories: screening.riskCategories,
        stored: Boolean(stored),
      },
      event: "shield.screening.completed",
      level: screening.decision === "block" ? "warn" : "info",
      requestId,
      route: "/api/shield/screenings",
    })

    return NextResponse.json(
      { idempotent: false, screening, stored: Boolean(stored) },
      { headers: { ...rateLimitHeaders(rateLimit), ...requestIdHeaders(requestId) }, status: 201 },
    )
  } catch (error) {
    const providerError = error instanceof CircleComplianceError
      ? error
      : new CircleComplianceError("Circle Compliance request failed", 502, {})
    const screeningInput: Omit<ShieldScreening, "workspaceId" | "createdAt"> = {
      id: `scr_${randomUUID()}`,
      idempotencyKey,
      address,
      chain,
      provider: "circle_compliance_engine",
      providerScreeningId: null,
      providerResult: null,
      providerStatus: "provider_error",
      decision: "review",
      decisionReason: "Provider screening was unavailable. Manual review is required.",
      ruleName: null,
      actions: ["REVIEW"],
      riskScore: "UNKNOWN",
      riskCategories: [],
      reasons: [],
      alertId: null,
      rawResponse: {
        error: providerError.message,
        providerStatus: providerError.status,
        response: providerError.response,
      },
      requestId,
    }
    const stored = await insertSupabaseShieldScreening(screeningInput)
    const screening = stored ?? {
      ...screeningInput,
      workspaceId: "wrk_arc_demo",
      createdAt: new Date().toISOString(),
    }

    logOperationalEvent({
      details: {
        chain,
        providerStatus: providerError.status,
        stored: Boolean(stored),
      },
      event: "shield.screening.provider_error",
      level: "error",
      requestId,
      route: "/api/shield/screenings",
    })

    return NextResponse.json(
      {
        error: "circle_compliance_unavailable",
        message: providerError.message,
        screening,
        stored: Boolean(stored),
      },
      {
        headers: { ...rateLimitHeaders(rateLimit), ...requestIdHeaders(requestId) },
        status: providerError.status === 401 || providerError.status === 403 ? 502 : providerError.status,
      },
    )
  }
}

function validateRequest(body: unknown) {
  if (!body || typeof body !== "object" || Array.isArray(body)) return "JSON object is required"
  const input = body as Record<string, unknown>
  if (typeof input.address !== "string" || !/^0x[a-fA-F0-9]{40}$/.test(input.address.trim())) {
    return "address must be a full EVM address"
  }
  if (typeof input.chain !== "string" || !CIRCLE_SCREENING_CHAINS.includes(input.chain as (typeof CIRCLE_SCREENING_CHAINS)[number])) {
    return "chain is not supported by Circle Address Screening"
  }
  if (input.idempotencyKey !== undefined && (
    typeof input.idempotencyKey !== "string"
    || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(input.idempotencyKey)
  )) {
    return "idempotencyKey must be a UUID v4"
  }
  return null
}

function summarize(screenings: ShieldScreening[]): ShieldSummary {
  return {
    total: screenings.length,
    allowed: screenings.filter((item) => item.decision === "allow").length,
    review: screenings.filter((item) => item.decision === "review").length,
    blocked: screenings.filter((item) => item.decision === "block").length,
    providerErrors: screenings.filter((item) => item.providerStatus === "provider_error").length,
    lastScreenedAt: screenings[0]?.createdAt ?? null,
  }
}

function hashClientIp(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
  const ip = forwardedFor || request.headers.get("x-real-ip")
  const salt = process.env.ARC_ANALYTICS_SALT ?? process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!ip || !salt) return null
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex")
}
