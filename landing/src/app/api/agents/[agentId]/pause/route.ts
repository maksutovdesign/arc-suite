import { NextResponse } from "next/server"
import { setPilotAgentStatus } from "@/lib/backend/service"

type RouteContext = {
  params: Promise<{ agentId: string }>
}

export async function POST(_request: Request, context: RouteContext) {
  const { agentId } = await context.params
  const agent = await setPilotAgentStatus(agentId, "paused")
  if (!agent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 })
  }

  return NextResponse.json({ agent })
}
