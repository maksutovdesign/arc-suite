import { NextRequest, NextResponse } from "next/server"
import { listAccessDecisions } from "@/lib/backend/service"

export async function GET(request: NextRequest) {
  const limit = Number(request.nextUrl.searchParams.get("limit") ?? 20)
  const decisions = await listAccessDecisions(Number.isFinite(limit) ? limit : 20)
  return NextResponse.json({ decisions })
}
