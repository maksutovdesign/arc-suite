import { NextRequest, NextResponse } from "next/server"
import { requireArcApiKey } from "@/lib/backend/auth"
import { createPilotAgent, listAgents } from "@/lib/backend/service"

export async function GET(request: NextRequest) {
  const unauthorized = await requireArcApiKey(request, ["read"])
  if (unauthorized) return unauthorized

  return NextResponse.json({ agents: await listAgents() })
}

export async function POST(request: NextRequest) {
  const unauthorized = await requireArcApiKey(request, ["write"])
  if (unauthorized) return unauthorized

  const body = await request.json().catch(() => null)
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const agent = await createPilotAgent(body)
  return NextResponse.json({ agent }, { status: 201 })
}
