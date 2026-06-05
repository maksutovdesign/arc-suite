import { NextResponse } from "next/server"
import { resumeAgent } from "@/lib/arc-api"
import { requireWritableTreasuryAdmin } from "@/lib/treasury-auth"

type RouteContext = {
  params: Promise<{ agentId: string }>
}

export async function POST(request: Request, context: RouteContext) {
  const unauthorized = requireWritableTreasuryAdmin(request)
  if (unauthorized) return unauthorized

  const { agentId } = await context.params
  try {
    return NextResponse.json(await resumeAgent(agentId))
  } catch {
    return NextResponse.json({ error: "Arc API resume failed" }, { status: 502 })
  }
}
