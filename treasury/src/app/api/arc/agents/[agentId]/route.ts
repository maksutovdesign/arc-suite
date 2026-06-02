import { NextRequest, NextResponse } from "next/server"
import { patchAgent } from "@/lib/arc-api"

type RouteContext = {
  params: Promise<{ agentId: string }>
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { agentId } = await context.params
  const body = await request.json().catch(() => null)
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  try {
    return NextResponse.json(await patchAgent(agentId, body))
  } catch {
    return NextResponse.json({ error: "Arc API update failed" }, { status: 502 })
  }
}
