import { NextRequest, NextResponse } from "next/server"

import { requireArcApiKey } from "@/lib/backend/auth"
import { createRequestId, logOperationalEvent, requestIdHeaders } from "@/lib/backend/observability"
import { topUpSupabaseBillingAccount } from "@/lib/backend/supabase"

export async function POST(request: NextRequest) {
  const requestId = createRequestId(request)
  const unauthorized = await requireArcApiKey(request, ["admin"])
  if (unauthorized) return unauthorized
  const body = await request.json().catch(() => null)
  if (!body || typeof body.agentId !== "string" || typeof body.amountUsdc !== "number" || body.amountUsdc <= 0 || body.amountUsdc > 10_000) {
    return NextResponse.json({ error: "invalid_topup", message: "agentId and amountUsdc between 0 and 10,000 are required" }, { status: 400, headers: requestIdHeaders(requestId) })
  }
  const account = await topUpSupabaseBillingAccount(body.agentId, body.amountUsdc)
  if (!account) return NextResponse.json({ error: "billing_account_not_found" }, { status: 404, headers: requestIdHeaders(requestId) })
  logOperationalEvent({ event: "billing.account.topped_up", requestId, route: "/api/billing/topups", details: { agentId: body.agentId, amountUsdc: body.amountUsdc } })
  return NextResponse.json({ account }, { status: 201, headers: requestIdHeaders(requestId) })
}
