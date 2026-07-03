import { createHash, randomUUID } from "crypto"
import { NextRequest, NextResponse } from "next/server"

import { requireArcApiKey } from "@/lib/backend/auth"
import {
  createOracleRiskSignal,
  demoOracleRiskSignals,
  summarizeOracleRiskSignals,
  withOracleObservationAdapters,
} from "@/lib/backend/oracle-risk"
import { createRequestId, logOperationalEvent, requestIdHeaders } from "@/lib/backend/observability"
import { enforceRateLimit, rateLimitHeaders, rateLimitResponse } from "@/lib/backend/rate-limit"
import type { OracleRiskSignalType } from "@/lib/backend/schema"
import {
  checkSupabaseOracleRiskReadiness,
  findSupabaseOracleRiskSignal,
  insertSupabaseOracleRiskSignal,
  listSupabaseOracleRiskSignals,
} from "@/lib/backend/supabase"

export const runtime = "nodejs"
export const maxDuration = 30

const signalTypes: OracleRiskSignalType[] = ["market_data", "proof_of_reserve", "ccip_route"]

export async function GET(request: NextRequest) {
  const requestId = createRequestId(request)
  const unauthorized = await requireArcApiKey(request, ["read"])
  if (unauthorized) return unauthorized

  const requestedLimit = Number(new URL(request.url).searchParams.get("limit") ?? 50)
  const limit = Number.isFinite(requestedLimit) ? Math.min(Math.max(Math.round(requestedLimit), 1), 200) : 50
  const [storedSignals, auditStorage] = await Promise.all([
    listSupabaseOracleRiskSignals(limit),
    checkSupabaseOracleRiskReadiness(),
  ])
  const signals = withOracleObservationAdapters(storedSignals ?? demoOracleRiskSignals.slice(0, limit))

  return NextResponse.json(
    {
      auditStorage,
      signals,
      sourceStatus: auditStorage ? "supabase" : "demo",
      summary: summarizeOracleRiskSignals(signals),
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
      { error: "invalid_oracle_signal_request", message: validationError },
      { headers: requestIdHeaders(requestId), status: 400 },
    )
  }

  const input = body as { signalType: OracleRiskSignalType; subject?: string; idempotencyKey?: string }
  const idempotencyKey = input.idempotencyKey ?? randomUUID()
  const existing = await findSupabaseOracleRiskSignal(idempotencyKey)
  if (existing) {
    const [signal] = withOracleObservationAdapters([existing])
    return NextResponse.json(
      { idempotent: true, signal, stored: true },
      { headers: requestIdHeaders(requestId) },
    )
  }

  const ipHash = hashClientIp(request)
  const rateLimit = await enforceRateLimit({
    bucketKey: request.headers.get("x-arc-client-bucket") ?? ipHash ?? input.signalType,
    ipHash,
    max: 30,
    route: "oracle_signal",
    windowMs: 10 * 60 * 1000,
  })
  if (!rateLimit.allowed) {
    const response = rateLimitResponse(rateLimit)
    response.headers.set("X-Request-Id", requestId)
    return response
  }

  const signalInput = createOracleRiskSignal({
    idempotencyKey,
    requestId,
    signalType: input.signalType,
    subject: input.subject,
  })
  const stored = await insertSupabaseOracleRiskSignal(signalInput)
  const signal = stored ?? {
    ...signalInput,
    createdAt: new Date().toISOString(),
    workspaceId: "wrk_arc_demo",
  }

  logOperationalEvent({
    details: {
      dataSource: signal.dataSource,
      result: signal.result,
      signalType: signal.signalType,
      sourceStatus: signal.sourceStatus,
      stored: Boolean(stored),
      subject: signal.subject,
    },
    event: "oracle.risk_signal.recorded",
    level: signal.result === "block" ? "warn" : "info",
    requestId,
    route: "/api/oracle/signals",
  })

  return NextResponse.json(
    { idempotent: false, signal, stored: Boolean(stored) },
    { headers: { ...rateLimitHeaders(rateLimit), ...requestIdHeaders(requestId) }, status: 201 },
  )
}

function validateRequest(body: unknown) {
  if (!body || typeof body !== "object" || Array.isArray(body)) return "JSON object is required"
  const input = body as Record<string, unknown>
  if (typeof input.signalType !== "string" || !signalTypes.includes(input.signalType as OracleRiskSignalType)) {
    return "signalType must be market_data, proof_of_reserve, or ccip_route"
  }
  if (input.subject !== undefined && (
    typeof input.subject !== "string"
    || input.subject.trim().length < 2
    || input.subject.trim().length > 140
  )) {
    return "subject must be between 2 and 140 characters"
  }
  if (input.idempotencyKey !== undefined && (
    typeof input.idempotencyKey !== "string"
    || input.idempotencyKey.trim().length < 8
    || input.idempotencyKey.trim().length > 100
    || !/^[a-zA-Z0-9:_.-]+$/.test(input.idempotencyKey.trim())
  )) {
    return "idempotencyKey must be 8-100 URL-safe characters"
  }
  return null
}

function hashClientIp(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
  const ip = forwardedFor || request.headers.get("x-real-ip")
  const salt = process.env.ARC_ANALYTICS_SALT ?? process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!ip || !salt) return null
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex")
}
