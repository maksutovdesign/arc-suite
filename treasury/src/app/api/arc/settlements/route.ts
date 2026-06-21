import { NextRequest, NextResponse } from "next/server"
import { getArcSettlementConfiguration, runArcSettlement } from "@/lib/arc-api"
import { requireTreasuryViewer, requireWritableTreasuryAdmin } from "@/lib/treasury-auth"

export async function GET(request: NextRequest) {
  const unauthorized = requireTreasuryViewer(request)
  if (unauthorized) return unauthorized

  try {
    return NextResponse.json(await getArcSettlementConfiguration())
  } catch (error) {
    return NextResponse.json(
      { error: "Arc settlement configuration failed", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 502 },
    )
  }
}

export async function POST(request: NextRequest) {
  const unauthorized = requireWritableTreasuryAdmin(request)
  if (unauthorized) return unauthorized

  const body = await request.json().catch(() => null)
  if (
    !body
    || typeof body.agentId !== "string"
    || typeof body.apiId !== "string"
    || typeof body.amountUsdc !== "number"
    || typeof body.recipientAddress !== "string"
    || typeof body.idempotencyKey !== "string"
  ) {
    return NextResponse.json({ error: "Invalid Arc settlement request" }, { status: 400 })
  }

  try {
    const result = await runArcSettlement(body)
    return NextResponse.json(result.payload, { status: result.status })
  } catch (error) {
    return NextResponse.json(
      { error: "Arc settlement failed", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 502 },
    )
  }
}
