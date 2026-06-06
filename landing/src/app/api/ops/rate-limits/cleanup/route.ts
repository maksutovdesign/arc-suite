import { NextRequest, NextResponse } from "next/server"
import { requireArcApiKey } from "@/lib/backend/auth"
import { cleanupRateLimitEvents } from "@/lib/backend/rate-limit"

export async function GET(request: NextRequest) {
  const unauthorized = await authorizeOpsRequest(request)
  if (unauthorized) return unauthorized

  const retentionHours = Number(request.nextUrl.searchParams.get("retentionHours") ?? "24")
  const result = await cleanupRateLimitEvents(Number.isFinite(retentionHours) ? retentionHours : 24)

  return NextResponse.json({
    ok: result.deletedSupabase !== null,
    ...result,
  }, { status: result.deletedSupabase === null ? 503 : 200 })
}

async function authorizeOpsRequest(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  const bearer = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "")

  if (cronSecret && bearer === cronSecret) return null
  return requireArcApiKey(request, ["admin"])
}
