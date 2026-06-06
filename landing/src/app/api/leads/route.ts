import { createHash } from "crypto"
import { NextRequest, NextResponse } from "next/server"
import { requireArcApiKey } from "@/lib/backend/auth"
import { enforceRateLimit, rateLimitHeaders, rateLimitResponse } from "@/lib/backend/rate-limit"
import { createInvestorLead, listInvestorLeads } from "@/lib/backend/service"

const ALLOWED_ORIGINS = [
  "https://arcsuite-app.vercel.app",
  "https://landing-nu-olive-43.vercel.app",
  "http://127.0.0.1:3100",
  "http://localhost:3100",
]

export async function GET(request: NextRequest) {
  const unauthorized = await requireArcApiKey(request, ["read"])
  if (unauthorized) return unauthorized

  const limitParam = request.nextUrl.searchParams.get("limit")
  const limit = limitParam ? Math.min(Math.max(Number(limitParam), 1), 200) : 100

  return NextResponse.json({ leads: await listInvestorLeads(Number.isFinite(limit) ? limit : 100) })
}

export async function POST(request: NextRequest) {
  if (!isAllowedOrigin(request)) {
    return NextResponse.json({ error: "Origin not allowed" }, { status: 403 })
  }

  const body = await parseJsonBody(request, 16_384)
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  if (typeof body.website === "string" && body.website.trim()) {
    return NextResponse.json({ error: "Invalid lead payload" }, { status: 400 })
  }

  const ipHash = hashClientIp(request)
  const rateLimit = await enforceRateLimit({
    bucketKey: ipHash ?? optionalString(body.sessionId) ?? optionalString(body.anonymousId) ?? optionalString(body.email),
    ipHash,
    max: 5,
    route: "lead_capture",
    windowMs: 60 * 60 * 1000,
  })
  if (!rateLimit.allowed) return rateLimitResponse(rateLimit)

  const lead = await createInvestorLead({
    ...(body as Record<string, unknown>),
    ipHash,
    referrer: typeof (body as Record<string, unknown>).referrer === "string" ? (body as Record<string, unknown>).referrer as string : request.headers.get("referer"),
    userAgent: request.headers.get("user-agent"),
  })

  if (!lead) {
    return NextResponse.json(
      { error: "Lead storage unavailable or invalid lead payload", stored: false },
      { status: 422 },
    )
  }

  return NextResponse.json({ lead, stored: true }, { headers: rateLimitHeaders(rateLimit), status: 201 })
}

async function parseJsonBody(request: NextRequest, maxBytes: number) {
  const raw = await request.text().catch(() => null)
  if (!raw || raw.length > maxBytes) return null
  try {
    return JSON.parse(raw) as Record<string, unknown>
  } catch {
    return null
  }
}

function hashClientIp(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
  const ip = forwardedFor || request.headers.get("x-real-ip")
  const salt = process.env.ARC_ANALYTICS_SALT ?? process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!ip || !salt) return null
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex")
}

function isAllowedOrigin(request: NextRequest) {
  const origin = request.headers.get("origin")
  return !origin || ALLOWED_ORIGINS.includes(origin) || /^https:\/\/[a-z0-9-]+-maksutovdesigns-projects\.vercel\.app$/.test(origin)
}

function optionalString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null
}
