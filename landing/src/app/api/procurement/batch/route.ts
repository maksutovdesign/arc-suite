import { NextRequest, NextResponse } from "next/server"

import {
  authorizePaidProviderBatch,
  executePaidProviderBatch,
  getPaidProviderConfiguration,
  getPaidProviderEvidence,
} from "@/lib/backend/paid-provider-service"
import { createRequestId, logOperationalEvent, requestIdHeaders } from "@/lib/backend/observability"
import { enforceRateLimit, rateLimitHeaders, rateLimitResponse } from "@/lib/backend/rate-limit"

export const runtime = "nodejs"
export const maxDuration = 300

export async function GET(request: NextRequest) {
  const requestId = createRequestId(request)
  return NextResponse.json(
    {
      configuration: getPaidProviderConfiguration(),
      evidence: await getPaidProviderEvidence(),
    },
    { headers: { "Cache-Control": "no-store", ...requestIdHeaders(requestId) } },
  )
}

export async function POST(request: NextRequest) {
  const requestId = createRequestId(request)
  if (!authorizePaidProviderBatch(request)) {
    return NextResponse.json(
      { error: "unauthorized", message: "A valid operator execution secret is required." },
      { headers: requestIdHeaders(requestId), status: 401 },
    )
  }

  const configuration = getPaidProviderConfiguration()
  if (!configuration.enabled) {
    return NextResponse.json(
      {
        error: "paid_provider_execution_disabled",
        message: "The paid provider signer or execution gate is not configured.",
        missing: configuration.missing,
      },
      { headers: requestIdHeaders(requestId), status: 503 },
    )
  }

  const body = await request.json().catch(() => ({})) as { count?: unknown }
  const count = typeof body.count === "number" ? body.count : configuration.batchSize
  if (!Number.isInteger(count) || count < 1 || count > configuration.maxBatchSize) {
    return NextResponse.json(
      { error: "invalid_batch_size", message: `count must be between 1 and ${configuration.maxBatchSize}.` },
      { headers: requestIdHeaders(requestId), status: 400 },
    )
  }

  const rateLimit = await enforceRateLimit({
    bucketKey: "paid_provider_operator",
    max: 1,
    route: "procurement_batch",
    windowMs: 10 * 60 * 1000,
  })
  if (!rateLimit.allowed) {
    const response = rateLimitResponse(rateLimit)
    response.headers.set("X-Request-Id", requestId)
    return response
  }

  try {
    const batch = await executePaidProviderBatch(count)
    logOperationalEvent({
      details: {
        batchId: batch.batchId,
        feeAccruedUsdc: batch.fee.accruedUsdc,
        proofCompletenessPct: batch.proofCompletenessPct,
        providerSpendUsdc: batch.providerSpendUsdc,
        requestedOperations: batch.requestedOperations,
        stored: batch.stored,
        successfulOperations: batch.successfulOperations,
      },
      event: "procurement.batch.completed",
      level: batch.successfulOperations === batch.requestedOperations ? "info" : "warn",
      requestId,
      route: "/api/procurement/batch",
    })
    return NextResponse.json(
      { batch, ok: batch.successfulOperations === batch.requestedOperations },
      {
        headers: { ...rateLimitHeaders(rateLimit), ...requestIdHeaders(requestId) },
        status: batch.successfulOperations === batch.requestedOperations ? 201 : 207,
      },
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : "Paid provider batch failed"
    logOperationalEvent({
      details: { message },
      event: "procurement.batch.failed",
      level: "error",
      requestId,
      route: "/api/procurement/batch",
    })
    return NextResponse.json(
      { error: "paid_provider_batch_failed", message },
      { headers: { ...rateLimitHeaders(rateLimit), ...requestIdHeaders(requestId) }, status: 502 },
    )
  }
}
