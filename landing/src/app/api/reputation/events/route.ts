import { NextResponse } from "next/server"
import { listReputationEvents } from "@/lib/backend/service"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const limit = Number(url.searchParams.get("limit") ?? 40)
  const events = await listReputationEvents(Number.isFinite(limit) ? limit : 40)

  return NextResponse.json({ events })
}
