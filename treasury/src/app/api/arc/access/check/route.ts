import { NextRequest, NextResponse } from "next/server"
import { runAccessCheck } from "@/lib/arc-api"

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  if (!body || typeof body.agentId !== "string" || typeof body.apiId !== "string") {
    return NextResponse.json({ error: "agentId and apiId are required" }, { status: 400 })
  }

  try {
    return NextResponse.json(await runAccessCheck({
      agentId: body.agentId,
      apiId: body.apiId,
      amountUsdc: typeof body.amountUsdc === "number" ? body.amountUsdc : undefined,
    }))
  } catch {
    return NextResponse.json({ error: "Arc access check failed" }, { status: 502 })
  }
}
