import { NextResponse } from "next/server"
import { resumeAgent } from "@/lib/arc-api"

type RouteContext = {
  params: Promise<{ agentId: string }>
}

export async function POST(_request: Request, context: RouteContext) {
  const { agentId } = await context.params
  try {
    return NextResponse.json(await resumeAgent(agentId))
  } catch {
    return NextResponse.json({ error: "Arc API resume failed" }, { status: 502 })
  }
}
