import { NextRequest, NextResponse } from "next/server"

import { requireArcApiKey } from "@/lib/backend/auth"
import { createRequestId, requestIdHeaders } from "@/lib/backend/observability"
import { checkSupabaseBillingReadiness, getSupabaseBillingOverview } from "@/lib/backend/supabase"

export async function GET(request: NextRequest) {
  const requestId = createRequestId(request)
  const unauthorized = await requireArcApiKey(request, ["read"])
  if (unauthorized) return unauthorized
  const [overview, configured] = await Promise.all([
    getSupabaseBillingOverview(100),
    checkSupabaseBillingReadiness(),
  ])
  return NextResponse.json(
    { configured, overview },
    { headers: requestIdHeaders(requestId), status: configured && overview ? 200 : 503 },
  )
}
