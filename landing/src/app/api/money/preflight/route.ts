import { createHash } from "crypto"
import { NextRequest, NextResponse } from "next/server"
import { verifyMessage } from "viem"

import { CircleComplianceError, evaluateShieldPolicy, screenCircleAddress } from "@/lib/backend/circle-compliance"
import {
  complianceChainFor,
  getMoneyPolicyConfiguration,
  moneyAuthorizationMessage,
  validateMoneyAuthorization,
} from "@/lib/backend/money-policy"
import { createRequestId, logOperationalEvent, requestIdHeaders } from "@/lib/backend/observability"
import { enforceRateLimit, rateLimitHeaders, rateLimitResponse } from "@/lib/backend/rate-limit"

export const runtime = "nodejs"
export const maxDuration = 30

export function GET(request: NextRequest) {
  const requestId = createRequestId(request)
  const configuration = getMoneyPolicyConfiguration()
  return NextResponse.json({
    enabled: configuration.enabled,
    feeBps: configuration.feeBps,
    feeRecipient: configuration.feeRecipient,
    maxAmountUsdc: configuration.maxAmountUsdc,
    allowlistRequired: configuration.allowlistRequired,
    complianceConfigured: configuration.complianceConfigured,
    signatureTtlSeconds: configuration.signatureTtlSeconds,
    missing: configuration.missing,
  }, { headers: { "Cache-Control": "no-store", ...requestIdHeaders(requestId) } })
}

export async function POST(request: NextRequest) {
  const requestId = createRequestId(request)
  const body = await request.json().catch(() => null)
  const validation = validateMoneyAuthorization(body)
  if (!validation.input) {
    return NextResponse.json(
      { authorized: false, error: "invalid_money_authorization", message: validation.error },
      { headers: requestIdHeaders(requestId), status: 400 },
    )
  }

  const input = validation.input
  const signature = body && typeof body === "object" && !Array.isArray(body)
    ? (body as Record<string, unknown>).signature
    : null
  if (typeof signature !== "string" || !/^0x[a-fA-F0-9]+$/.test(signature)) {
    return NextResponse.json(
      { authorized: false, error: "signature_required", message: "A wallet signature is required." },
      { headers: requestIdHeaders(requestId), status: 400 },
    )
  }

  const configuration = getMoneyPolicyConfiguration()
  if (!configuration.enabled || !configuration.feeRecipient) {
    return NextResponse.json(
      { authorized: false, error: "execution_disabled", message: "Money Movement execution is not fully configured.", missing: configuration.missing },
      { headers: requestIdHeaders(requestId), status: 503 },
    )
  }

  const ipHash = hashClientIp(request)
  const rateLimit = await enforceRateLimit({
    bucketKey: `${ipHash ?? "anonymous"}:${input.walletAddress.toLowerCase()}`,
    ipHash,
    max: 12,
    route: "money_preflight",
    windowMs: 10 * 60 * 1000,
  })
  if (!rateLimit.allowed) {
    const response = rateLimitResponse(rateLimit)
    response.headers.set("X-Request-Id", requestId)
    return response
  }

  const policyError = policyValidationError(input, configuration)
  if (policyError) {
    logDecision("money.preflight.denied", "warn", { reason: policyError, operation: input.operation }, requestId)
    return NextResponse.json(
      { authorized: false, error: "policy_denied", message: policyError, traceId: requestId },
      { headers: { ...rateLimitHeaders(rateLimit), ...requestIdHeaders(requestId) }, status: 403 },
    )
  }

  const signatureValid = await verifyMessage({
    address: input.walletAddress as `0x${string}`,
    message: moneyAuthorizationMessage(input),
    signature: signature as `0x${string}`,
  }).catch(() => false)
  if (!signatureValid) {
    logDecision("money.preflight.invalid_signature", "warn", { operation: input.operation }, requestId)
    return NextResponse.json(
      { authorized: false, error: "invalid_signature", message: "The authorization signature does not match the connected wallet.", traceId: requestId },
      { headers: { ...rateLimitHeaders(rateLimit), ...requestIdHeaders(requestId) }, status: 401 },
    )
  }

  const nonceLimit = await enforceRateLimit({
    bucketKey: input.nonce,
    max: 1,
    route: "money_preflight_nonce",
    windowMs: configuration.signatureTtlSeconds * 1000,
  })
  if (!nonceLimit.allowed) {
    logDecision("money.preflight.replay_blocked", "warn", { operation: input.operation }, requestId)
    return NextResponse.json(
      { authorized: false, error: "authorization_replayed", message: "This wallet authorization has already been used.", traceId: requestId },
      { headers: { ...rateLimitHeaders(nonceLimit), ...requestIdHeaders(requestId) }, status: 409 },
    )
  }

  const screeningTarget = complianceChainFor(input.destinationChain)
  try {
    const providerResult = await screenCircleAddress({
      address: input.recipient,
      chain: screeningTarget.chain,
      idempotencyKey: input.nonce,
    })
    const policy = evaluateShieldPolicy(providerResult.response, { address: input.recipient, chain: screeningTarget.chain })
    const authorized = policy.decision === "allow"

    logDecision(authorized ? "money.preflight.authorized" : "money.preflight.denied", authorized ? "info" : "warn", {
      amountUsdc: Number(input.amount),
      complianceBasis: screeningTarget.basis,
      decision: policy.decision,
      destinationChain: input.destinationChain,
      operation: input.operation,
      riskScore: policy.riskScore,
    }, requestId)

    return NextResponse.json({
      authorized,
      traceId: requestId,
      expiresAt: new Date(Date.parse(input.issuedAt) + configuration.signatureTtlSeconds * 1000).toISOString(),
      policy: {
        decision: policy.decision,
        reason: policy.decisionReason,
        riskScore: policy.riskScore,
        riskCategories: policy.riskCategories,
        ruleName: policy.ruleName,
        provider: "circle_compliance_engine",
        screeningChain: screeningTarget.chain,
        screeningBasis: screeningTarget.basis,
      },
    }, {
      headers: { ...rateLimitHeaders(rateLimit), ...requestIdHeaders(requestId) },
      status: authorized ? 200 : 403,
    })
  } catch (error) {
    const providerError = error instanceof CircleComplianceError
      ? error
      : new CircleComplianceError("Circle Compliance request failed", 502, {})
    logDecision("money.preflight.provider_error", "error", { providerStatus: providerError.status }, requestId)
    return NextResponse.json(
      { authorized: false, error: "compliance_unavailable", message: "Compliance screening is unavailable; execution is blocked.", traceId: requestId },
      { headers: { ...rateLimitHeaders(rateLimit), ...requestIdHeaders(requestId) }, status: 503 },
    )
  }
}

function policyValidationError(
  input: NonNullable<ReturnType<typeof validateMoneyAuthorization>["input"]>,
  configuration: ReturnType<typeof getMoneyPolicyConfiguration>,
) {
  const issuedAt = Date.parse(input.issuedAt)
  const ageMs = Date.now() - issuedAt
  if (ageMs < -30_000 || ageMs > configuration.signatureTtlSeconds * 1000) return "The wallet authorization has expired."
  if (Number(input.amount) > configuration.maxAmountUsdc) return `Amount exceeds the ${configuration.maxAmountUsdc} USDC execution limit.`
  if (input.feeRecipient.toLowerCase() !== configuration.feeRecipient?.toLowerCase()) return "The fee recipient does not match server policy."
  if (configuration.allowlistRequired && !configuration.allowedRecipients.includes(input.recipient.toLowerCase())) return "Recipient is not in the production allowlist."
  if (input.operation === "send" && input.sourceChain !== input.destinationChain) return "Send must use the same source and destination chain."
  if ((input.operation === "bridge" || input.operation === "spend") && input.sourceChain === input.destinationChain) return "Cross-chain movement requires different source and destination chains."
  return null
}

function hashClientIp(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
  const ip = forwardedFor || request.headers.get("x-real-ip")
  const salt = process.env.ARC_ANALYTICS_SALT ?? process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!ip || !salt) return null
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex")
}

function logDecision(event: string, level: "info" | "warn" | "error", details: Record<string, unknown>, requestId: string) {
  logOperationalEvent({ event, level, details, requestId, route: "/api/money/preflight" })
}
