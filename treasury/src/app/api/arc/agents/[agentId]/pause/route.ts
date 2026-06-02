import { NextResponse } from "next/server"
import { pauseAgent } from "@/lib/arc-api"

type RouteContext = {
  params: Promise<{ agentId: string }>
}

export async function POST(_request: Request, context: RouteContext) {
  const { agentId } = await context.params
  try {
    return NextResponse.json(await pauseAgent(agentId))
  } catch {
    return NextResponse.json({ error: "Arc API pause failed" }, { status: 502 })
  }
}
