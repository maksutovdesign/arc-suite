import { NextRequest, NextResponse } from "next/server"
import { checkAccess } from "@/lib/backend/service"

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  if (!body || typeof body.agentId !== "string" || typeof body.apiId !== "string") {
    return NextResponse.json({ error: "agentId and apiId are required" }, { status: 400 })
  }

  const decision = checkAccess({
    agentId: body.agentId,
    apiId: body.apiId,
    amountUsdc: typeof body.amountUsdc === "number" ? body.amountUsdc : undefined,
  })

  if (!decision) {
    return NextResponse.json({ error: "Agent, API, or reputation profile not found" }, { status: 404 })
  }

  return NextResponse.json({ decision })
}
