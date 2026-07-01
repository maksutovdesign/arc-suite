import { NextRequest, NextResponse } from "next/server"

import { createRequestId, requestIdHeaders } from "@/lib/backend/observability"
import { providerFulfillmentPolicies } from "@/lib/backend/provider-service"

export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  const requestId = createRequestId(request)

  return NextResponse.json(
    {
      generatedAt: new Date().toISOString(),
      ok: true,
      policies: providerFulfillmentPolicies(),
    },
    {
      headers: {
        "Cache-Control": "no-store",
        ...requestIdHeaders(requestId),
      },
    },
  )
}
