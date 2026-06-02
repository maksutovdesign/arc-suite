import { NextResponse } from "next/server"
import { getReputationProfile } from "@/lib/backend/service"

type RouteContext = {
  params: Promise<{ agentId: string }>
}

export async function GET(_request: Request, context: RouteContext) {
  const { agentId } = await context.params
  const reputation = await getReputationProfile(agentId)
  if (!reputation) {
    return NextResponse.json({ error: "Agent reputation not found" }, { status: 404 })
  }

  return NextResponse.json({ reputation })
}
