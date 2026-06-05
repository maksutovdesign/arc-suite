import { createHash } from "crypto"
import { NextRequest, NextResponse } from "next/server"
import { requireArcApiKey } from "@/lib/backend/auth"
import { createInvestorLead, listInvestorLeads } from "@/lib/backend/service"

export async function GET(request: NextRequest) {
  const unauthorized = await requireArcApiKey(request, ["read"])
  if (unauthorized) return unauthorized

  const limitParam = request.nextUrl.searchParams.get("limit")
  const limit = limitParam ? Math.min(Math.max(Number(limitParam), 1), 200) : 100

  return NextResponse.json({ leads: await listInvestorLeads(Number.isFinite(limit) ? limit : 100) })
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const lead = await createInvestorLead({
    ...(body as Record<string, unknown>),
    ipHash: hashClientIp(request),
    referrer: typeof (body as Record<string, unknown>).referrer === "string" ? (body as Record<string, unknown>).referrer as string : request.headers.get("referer"),
    userAgent: request.headers.get("user-agent"),
  })

  if (!lead) {
    return NextResponse.json(
      { error: "Lead storage unavailable or invalid lead payload", stored: false },
      { status: 422 },
    )
  }

  return NextResponse.json({ lead, stored: true }, { status: 201 })
}

function hashClientIp(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
  const ip = forwardedFor || request.headers.get("x-real-ip")
  const salt = process.env.ARC_ANALYTICS_SALT ?? process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!ip || !salt) return null
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex")
}
