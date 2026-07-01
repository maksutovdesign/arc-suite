import { NextRequest, NextResponse } from "next/server"

import { createRequestId, requestIdHeaders } from "@/lib/backend/observability"
import { getProviderTrustOverview } from "@/lib/backend/provider-service"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const requestId = createRequestId(request)
  const overview = await getProviderTrustOverview(50)

  return NextResponse.json(
    {
      generatedAt: overview.generatedAt,
      keys: overview.keys,
      ok: true,
    },
    {
      headers: {
        "Cache-Control": "no-store",
        ...requestIdHeaders(requestId),
      },
    },
  )
}
