import { NextRequest, NextResponse } from "next/server"

import { getArcEscrowConfiguration } from "@/lib/backend/arc-escrow"
import { requireArcApiKey } from "@/lib/backend/auth"
import { createRequestId, requestIdHeaders } from "@/lib/backend/observability"
import { checkSupabaseEscrowReadiness, getSupabaseEscrowOverview } from "@/lib/backend/supabase"

export async function GET(request: NextRequest) {
  const requestId = createRequestId(request)
  const unauthorized = await requireArcApiKey(request, ["read"])
  if (unauthorized) return unauthorized
  const config = getArcEscrowConfiguration()
  const configuration = {
    onchainConfigured: config.configured,
    chain: config.chain,
    contractAddress: config.contractAddress,
    missing: config.missing,
  }
  const [overview, configured] = await Promise.all([
    getSupabaseEscrowOverview(configuration),
    checkSupabaseEscrowReadiness(),
  ])
  return NextResponse.json(
    { configured, overview },
    { headers: requestIdHeaders(requestId), status: configured && overview ? 200 : 503 },
  )
}
