import { NextRequest, NextResponse } from "next/server"

import { requireArcApiKey } from "@/lib/backend/auth"
import { readArcWalletExecutionReadiness } from "@/lib/backend/arc-settlement"
import { createRequestId, requestIdHeaders } from "@/lib/backend/observability"

export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  const requestId = createRequestId(request)
  const unauthorized = await requireArcApiKey(request, ["read"])
  if (unauthorized) return unauthorized

  const readiness = await readArcWalletExecutionReadiness()
  return NextResponse.json(
    { readiness },
    { status: 200, headers: requestIdHeaders(requestId) },
  )
}
