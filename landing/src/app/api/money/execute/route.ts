import { NextRequest, NextResponse } from "next/server"

import {
  createMoneyFeeBreakdown,
  executeServerMoneyMovement,
  getServerMoneyExecutionConfiguration,
  normalizeMoneyProof,
  verifyMoneyExecutionGrant,
} from "@/lib/backend/money-execution"
import { getMoneyPolicyConfiguration, validateMoneyAuthorization } from "@/lib/backend/money-policy"
import { createRequestId, logOperationalEvent, requestIdHeaders } from "@/lib/backend/observability"
import { enforceRateLimit, rateLimitHeaders, rateLimitResponse } from "@/lib/backend/rate-limit"

export const runtime = "nodejs"
export const maxDuration = 60

export function GET(request: NextRequest) {
  const requestId = createRequestId(request)
  const configuration = getServerMoneyExecutionConfiguration()
  return NextResponse.json(configuration, {
    headers: { "Cache-Control": "no-store", ...requestIdHeaders(requestId) },
  })
}

export async function POST(request: NextRequest) {
  const requestId = createRequestId(request)
  const body = await request.json().catch(() => null)
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "invalid_request", message: "JSON object is required." }, { status: 400 })
  }

  const action = (body as Record<string, unknown>).action
  if (action === "quote") return quoteResponse(body as Record<string, unknown>, requestId)
  if (action !== "execute") {
    return NextResponse.json(
      { error: "invalid_action", message: "Action must be quote or execute." },
      { headers: requestIdHeaders(requestId), status: 400 },
    )
  }

  const configuration = getServerMoneyExecutionConfiguration()
  if (!configuration.enabled) {
    return NextResponse.json(
      { error: "server_execution_disabled", message: "Server App Kit execution is not configured.", missing: configuration.missing },
      { headers: requestIdHeaders(requestId), status: 503 },
    )
  }

  const grant = verifyMoneyExecutionGrant((body as Record<string, unknown>).executionGrant)
  if (!grant) {
    return NextResponse.json(
      { error: "invalid_execution_grant", message: "A valid, unexpired policy execution grant is required." },
      { headers: requestIdHeaders(requestId), status: 401 },
    )
  }
  if (grant.authorization.operation === "swap" && !configuration.swapEnabled) {
    return NextResponse.json(
      { error: "swap_execution_disabled", message: "Server Swap requires an Arc App Kit key.", missing: configuration.swapMissing },
      { headers: requestIdHeaders(requestId), status: 503 },
    )
  }

  const rateLimit = await enforceRateLimit({
    bucketKey: grant.authorization.nonce,
    max: 1,
    route: "money_execute",
    windowMs: 10 * 60 * 1000,
  })
  if (!rateLimit.allowed) {
    const response = rateLimitResponse(rateLimit)
    response.headers.set("X-Request-Id", requestId)
    return response
  }

  const feeBreakdown = createMoneyFeeBreakdown(grant.authorization)
  try {
    const raw = await executeServerMoneyMovement(grant)
    const proof = normalizeMoneyProof({ feeBreakdown, grant, raw })
    logOperationalEvent({
      details: {
        amountUsdc: feeBreakdown.amountUsdc,
        feeRevenueUsdc: feeBreakdown.kestrelRevenueUsdc,
        operation: grant.authorization.operation,
        traceId: grant.traceId,
        txCount: proof.txHashes.length,
      },
      event: "money.execute.completed",
      requestId,
      route: "/api/money/execute",
    })
    return NextResponse.json({ executed: true, proof }, {
      headers: { ...rateLimitHeaders(rateLimit), ...requestIdHeaders(requestId) },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "App Kit execution failed."
    logOperationalEvent({
      details: { message, operation: grant.authorization.operation, traceId: grant.traceId },
      event: "money.execute.failed",
      level: "error",
      requestId,
      route: "/api/money/execute",
    })
    return NextResponse.json(
      { error: "app_kit_execution_failed", message, traceId: grant.traceId },
      { headers: { ...rateLimitHeaders(rateLimit), ...requestIdHeaders(requestId) }, status: 502 },
    )
  }
}

function quoteResponse(body: Record<string, unknown>, requestId: string) {
  const validation = validateMoneyAuthorization({
    ...body,
    issuedAt: new Date().toISOString(),
    nonce: "00000000-0000-4000-8000-000000000000",
    walletAddress: typeof body.walletAddress === "string" ? body.walletAddress : body.recipient,
  })
  if (!validation.input) {
    return NextResponse.json(
      { error: "invalid_quote", message: validation.error },
      { headers: requestIdHeaders(requestId), status: 400 },
    )
  }
  const policy = getMoneyPolicyConfiguration()
  if (!policy.feeRecipient || validation.input.feeRecipient.toLowerCase() !== policy.feeRecipient.toLowerCase()) {
    return NextResponse.json(
      { error: "fee_policy_mismatch", message: "The fee recipient does not match Kestrel policy." },
      { headers: requestIdHeaders(requestId), status: 403 },
    )
  }
  return NextResponse.json({
    feeBps: policy.feeBps,
    feeBreakdown: createMoneyFeeBreakdown(validation.input),
    serverExecution: getServerMoneyExecutionConfiguration(),
  }, { headers: { "Cache-Control": "no-store", ...requestIdHeaders(requestId) } })
}
