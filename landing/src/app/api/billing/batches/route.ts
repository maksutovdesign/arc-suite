import { NextRequest, NextResponse } from "next/server"

import { requireArcApiKey } from "@/lib/backend/auth"
import { createRequestId, logOperationalEvent, requestIdHeaders } from "@/lib/backend/observability"
import { createSupabaseBillingBatch, enqueueSupabaseExecutionJob } from "@/lib/backend/supabase"

export async function POST(request: NextRequest) {
  const requestId = createRequestId(request)
  const unauthorized = await requireArcApiKey(request, ["write"])
  if (unauthorized) return unauthorized
  const batch = await createSupabaseBillingBatch()
  if (!batch) {
    return NextResponse.json({ error: "no_unbatched_usage", message: "There are no unbatched usage events." }, { status: 409, headers: requestIdHeaders(requestId) })
  }
  const job = await enqueueSupabaseExecutionJob({
    idempotencyKey: `billing:${batch.id}`,
    kind: "billing_settlement",
    resourceType: "billing_batch",
    resourceId: batch.id,
    action: "settle",
    payload: {
      invoiceCount: batch.invoiceCount,
      netAmountUsdc: batch.netAmountUsdc,
      usageCount: batch.usageCount,
    },
    initialStatus: "waiting_provider",
  })
  if (!job) {
    return NextResponse.json({ error: "execution_worker_unavailable", message: "Execution worker migration is required." }, { status: 503, headers: requestIdHeaders(requestId) })
  }
  logOperationalEvent({
    event: "billing.batch.created",
    requestId,
    route: "/api/billing/batches",
    details: { batchId: batch.id, usageCount: batch.usageCount, netAmountUsdc: batch.netAmountUsdc },
  })
  return NextResponse.json({ batch, job }, { status: 201, headers: requestIdHeaders(requestId) })
}
