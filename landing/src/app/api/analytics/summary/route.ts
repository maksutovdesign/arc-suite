import { NextRequest, NextResponse } from "next/server"
import { requireArcApiKey } from "@/lib/backend/auth"
import { getAnalyticsSummary } from "@/lib/backend/service"

export async function GET(request: NextRequest) {
  const unauthorized = await requireArcApiKey(request, ["read"])
  if (unauthorized) return unauthorized

  const limitParam = request.nextUrl.searchParams.get("limit")
  const limit = limitParam ? Math.min(Math.max(Number(limitParam), 1), 500) : 200

  return NextResponse.json(await getAnalyticsSummary(Number.isFinite(limit) ? limit : 200))
}
