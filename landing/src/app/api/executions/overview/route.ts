import { NextRequest, NextResponse } from "next/server"

import { requireArcApiKey } from "@/lib/backend/auth"
import { createRequestId, requestIdHeaders } from "@/lib/backend/observability"
import { checkSupabaseExecutionReadiness, getSupabaseExecutionOverview } from "@/lib/backend/supabase"

export async function GET(request: NextRequest) {
  const requestId = createRequestId(request)
  const unauthorized = await requireArcApiKey(request, ["read"])
  if (unauthorized) return unauthorized
  const [overview, configured] = await Promise.all([
    getSupabaseExecutionOverview(),
    checkSupabaseExecutionReadiness(),
  ])
  return NextResponse.json(
    { configured, overview },
    { status: configured && overview ? 200 : 503, headers: requestIdHeaders(requestId) },
  )
}
