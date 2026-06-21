import { NextRequest, NextResponse } from "next/server"

import { requireArcApiKey } from "@/lib/backend/auth"
import { createRequestId, logOperationalEvent, requestIdHeaders } from "@/lib/backend/observability"
import { createSupabaseBillingBatch } from "@/lib/backend/supabase"

export async function POST(request: NextRequest) {
  const requestId = createRequestId(request)
  const unauthorized = await requireArcApiKey(request, ["write"])
  if (unauthorized) return unauthorized
  const batch = await createSupabaseBillingBatch()
  if (!batch) {
    return NextResponse.json({ error: "no_unbatched_usage", message: "There are no unbatched usage events." }, { status: 409, headers: requestIdHeaders(requestId) })
  }
  logOperationalEvent({
    event: "billing.batch.created",
    requestId,
    route: "/api/billing/batches",
    details: { batchId: batch.id, usageCount: batch.usageCount, netAmountUsdc: batch.netAmountUsdc },
  })
  return NextResponse.json({ batch }, { status: 201, headers: requestIdHeaders(requestId) })
}
