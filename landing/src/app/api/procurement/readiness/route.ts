import { NextRequest, NextResponse } from "next/server"

import {
  getPaidProviderConfiguration,
  getPaidProviderEvidence,
  inspectPaidProvider,
} from "@/lib/backend/paid-provider-service"
import { createRequestId, logOperationalEvent, requestIdHeaders } from "@/lib/backend/observability"

export const runtime = "nodejs"
export const maxDuration = 30

export async function GET(request: NextRequest) {
  const requestId = createRequestId(request)
  const configuration = getPaidProviderConfiguration()
  const evidence = await getPaidProviderEvidence()

  try {
    const provider = await inspectPaidProvider()
    logOperationalEvent({
      details: {
        available: provider.available,
        batching: provider.batching,
        priceUsdc: provider.priceUsdc,
        provider: provider.provider,
      },
      event: "procurement.provider.inspected",
      requestId,
      route: "/api/procurement/readiness",
    })
    return NextResponse.json(
      { configuration, evidence, provider },
      { headers: { "Cache-Control": "no-store", ...requestIdHeaders(requestId) } },
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : "Provider inspection failed"
    logOperationalEvent({
      details: { message },
      event: "procurement.provider.unavailable",
      level: "warn",
      requestId,
      route: "/api/procurement/readiness",
    })
    return NextResponse.json(
      {
        configuration,
        evidence,
        provider: {
          available: false,
          error: message,
          provider: configuration.provider,
          resource: configuration.resource,
        },
      },
      { headers: { "Cache-Control": "no-store", ...requestIdHeaders(requestId) }, status: 503 },
    )
  }
}
