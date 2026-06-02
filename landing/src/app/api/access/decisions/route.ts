import { NextRequest, NextResponse } from "next/server"
import { requireArcApiKey } from "@/lib/backend/auth"
import { listAccessDecisions } from "@/lib/backend/service"

export async function GET(request: NextRequest) {
  const unauthorized = await requireArcApiKey(request, ["read"])
  if (unauthorized) return unauthorized

  const limit = Number(request.nextUrl.searchParams.get("limit") ?? 20)
  const decisions = await listAccessDecisions(Number.isFinite(limit) ? limit : 20)
  return NextResponse.json({ decisions })
}
