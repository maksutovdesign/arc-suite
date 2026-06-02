import { NextResponse } from "next/server"
import { requireArcApiKey } from "@/lib/backend/auth"
import { listReputationEvents } from "@/lib/backend/service"

export async function GET(request: Request) {
  const unauthorized = requireArcApiKey(request)
  if (unauthorized) return unauthorized

  const url = new URL(request.url)
  const limit = Number(url.searchParams.get("limit") ?? 40)
  const events = await listReputationEvents(Number.isFinite(limit) ? limit : 40)

  return NextResponse.json({ events })
}
