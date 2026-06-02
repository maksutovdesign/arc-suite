import { NextResponse } from "next/server"
import { requireArcApiKey } from "@/lib/backend/auth"
import { setPilotAgentStatus } from "@/lib/backend/service"

type RouteContext = {
  params: Promise<{ agentId: string }>
}

export async function POST(request: Request, context: RouteContext) {
  const unauthorized = requireArcApiKey(request)
  if (unauthorized) return unauthorized

  const { agentId } = await context.params
  const agent = await setPilotAgentStatus(agentId, "paused")
  if (!agent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 })
  }

  return NextResponse.json({ agent })
}
