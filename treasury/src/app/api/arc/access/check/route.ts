import { NextRequest, NextResponse } from "next/server"
import { runAccessCheck } from "@/lib/arc-api"
import { requireTreasuryViewer } from "@/lib/treasury-auth"

export async function POST(request: NextRequest) {
  const unauthorized = requireTreasuryViewer(request)
  if (unauthorized) return unauthorized

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
