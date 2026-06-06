import { createHash } from "crypto"
import { NextRequest, NextResponse } from "next/server"
import { enforceRateLimit, rateLimitHeaders, rateLimitResponse } from "@/lib/backend/rate-limit"
import { recordAnalyticsEvent } from "@/lib/backend/service"
import type { AnalyticsSource } from "@/lib/backend/schema"

const ALLOWED_ORIGINS = [
  "https://arcsuite-app.vercel.app",
  "https://landing-nu-olive-43.vercel.app",
  "https://treasury-umber.vercel.app",
  "https://reputation-five.vercel.app",
  "https://marketplace-eosin-eight.vercel.app",
  "http://127.0.0.1:3100",
  "http://127.0.0.1:3000",
  "http://localhost:3100",
  "http://localhost:3000",
]

export function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    headers: corsHeaders(request),
    status: 204,
  })
}

export async function POST(request: NextRequest) {
  const body = await parseAnalyticsBody(request, 8_192)
  if (!body || typeof body.eventName !== "string") {
    return NextResponse.json({ error: "eventName is required" }, { headers: corsHeaders(request), status: 400 })
  }

  const ipHash = hashClientIp(request)
  const rateLimit = await enforceRateLimit({
    bucketKey: ipHash ?? optionalString(body.sessionId) ?? optionalString(body.anonymousId),
    ipHash,
    max: 240,
    route: "analytics_events",
    windowMs: 10 * 60 * 1000,
  })
  if (!rateLimit.allowed) {
    return rateLimitResponseWithCors(request, rateLimit)
  }

  const event = await recordAnalyticsEvent({
    eventName: body.eventName,
    source: normalizeSource(body.source),
    surface: optionalString(body.surface),
    placement: optionalString(body.placement),
    anonymousId: optionalString(body.anonymousId),
    sessionId: optionalString(body.sessionId),
    path: optionalString(body.path),
    url: optionalString(body.url),
    referrer: optionalString(body.referrer) ?? request.headers.get("referer"),
    userAgent: request.headers.get("user-agent"),
    ipHash,
    properties: optionalProperties(body.properties),
  })

  return NextResponse.json(
    { ok: true, stored: Boolean(event) },
    { headers: { ...corsHeaders(request), ...rateLimitHeaders(rateLimit) }, status: event ? 201 : 202 },
  )
}

async function parseAnalyticsBody(request: NextRequest, maxBytes: number) {
  try {
    const raw = await request.text()
    if (raw.length > maxBytes) return null
    return JSON.parse(raw) as Record<string, unknown>
  } catch {
    return null
  }
}

function normalizeSource(value: unknown): AnalyticsSource {
  if (value === "treasury" || value === "reputation" || value === "marketplace") return value
  return "landing"
}

function optionalString(value: unknown) {
  return typeof value === "string" ? value : null
}

function optionalProperties(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {}
}

function hashClientIp(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
  const ip = forwardedFor || request.headers.get("x-real-ip")
  const salt = process.env.ARC_ANALYTICS_SALT ?? process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!ip || !salt) return null
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex")
}

function corsHeaders(request: NextRequest) {
  const origin = request.headers.get("origin")
  const headers: Record<string, string> = {
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Max-Age": "86400",
  }

  if (origin && (ALLOWED_ORIGINS.includes(origin) || /^https:\/\/[a-z0-9-]+-maksutovdesigns-projects\.vercel\.app$/.test(origin))) {
    headers["Access-Control-Allow-Origin"] = origin
  }

  return headers
}

function rateLimitResponseWithCors(request: NextRequest, decision: Awaited<ReturnType<typeof enforceRateLimit>>) {
  const response = rateLimitResponse(decision)
  for (const [key, value] of Object.entries(corsHeaders(request))) {
    response.headers.set(key, value)
  }
  return response
}
