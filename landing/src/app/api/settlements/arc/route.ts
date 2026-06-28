import { NextRequest, NextResponse } from "next/server"
import { getArcSettlementConfiguration } from "@/lib/backend/arc-settlement"
import { requireArcApiKey } from "@/lib/backend/auth"
import { createRequestId, logOperationalEvent, requestIdHeaders } from "@/lib/backend/observability"
import { executeArcSettlement, SettlementExecutionError } from "@/lib/backend/settlement-service"
import { isSupabaseConfigured } from "@/lib/backend/supabase"

export const runtime = "nodejs"
export const maxDuration = 60

export async function GET(request: NextRequest) {
  const unauthorized = await requireArcApiKey(request, ["read"])
  if (unauthorized) return unauthorized

  const config = getArcSettlementConfiguration()
  return NextResponse.json({
    configured: config.configured && isSupabaseConfigured(),
    chain: config.chain,
    chainId: config.chainId,
    explorerBaseUrl: config.explorerBaseUrl,
    sourceWalletId: config.sourceWalletId,
    sourceAddress: config.sourceAddress,
    usdcTokenId: config.usdcTokenId,
    usdcTokenAddress: config.usdcTokenAddress,
    defaultRecipient: config.defaultRecipient,
    allowedRecipients: config.allowedRecipients,
    maxAmountUsdc: config.maxAmountUsdc,
    missing: [
      ...config.missing,
      ...(!isSupabaseConfigured() ? ["SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY"] : []),
    ],
  })
}

export async function POST(request: NextRequest) {
  const requestId = createRequestId(request)
  const unauthorized = await requireArcApiKey(request, ["write"])
  if (unauthorized) return unauthorized

  const body = await request.json().catch(() => null)
  const validationError = validateRequest(body)
  if (validationError) {
    return NextResponse.json(
      { error: "Invalid settlement request", message: validationError },
      { headers: requestIdHeaders(requestId), status: 400 },
    )
  }

  try {
    const outcome = await executeArcSettlement({
      agentId: body.agentId,
      apiId: body.apiId,
      amountUsdc: body.amountUsdc,
      recipientAddress: body.recipientAddress,
      idempotencyKey: body.idempotencyKey,
      memoLabel: typeof body.memoLabel === "string" ? body.memoLabel : undefined,
      memo: isRecord(body.memo) ? body.memo : undefined,
    })

    logOperationalEvent({
      details: {
        agentId: body.agentId,
        apiId: body.apiId,
        idempotent: outcome.idempotent,
        ok: outcome.ok,
        settlementId: outcome.ok ? outcome.result.settlement.id : outcome.settlement.id,
        txHash: outcome.ok ? outcome.result.transaction.txHash : null,
      },
      event: outcome.ok ? "arc_settlement.confirmed" : "arc_settlement.policy_denied",
      requestId,
      route: "/api/settlements/arc",
    })

    return NextResponse.json(outcome, {
      headers: requestIdHeaders(requestId),
      status: outcome.ok ? 201 : 403,
    })
  } catch (error) {
    const executionError = error instanceof SettlementExecutionError
      ? error
      : new SettlementExecutionError("arc_settlement_failed", "Arc settlement failed", 500)

    logOperationalEvent({
      details: {
        agentId: body.agentId,
        apiId: body.apiId,
        code: executionError.code,
        ...executionError.details,
      },
      event: "arc_settlement.failed",
      level: "error",
      requestId,
      route: "/api/settlements/arc",
    })

    return NextResponse.json(
      {
        error: executionError.code,
        message: executionError.message,
        details: executionError.details,
      },
      { headers: requestIdHeaders(requestId), status: executionError.status },
    )
  }
}

function validateRequest(body: unknown) {
  if (!body || typeof body !== "object" || Array.isArray(body)) return "JSON object is required"
  const data = body as Record<string, unknown>
  if (typeof data.agentId !== "string" || !data.agentId.trim()) return "agentId is required"
  if (typeof data.apiId !== "string" || !data.apiId.trim()) return "apiId is required"
  if (typeof data.amountUsdc !== "number" || !Number.isFinite(data.amountUsdc) || data.amountUsdc <= 0) return "amountUsdc must be a positive number"
  if (typeof data.recipientAddress !== "string" || !/^0x[a-fA-F0-9]{40}$/.test(data.recipientAddress)) return "recipientAddress must be a full EVM address"
  if (typeof data.idempotencyKey !== "string" || !/^[a-zA-Z0-9._:-]{12,120}$/.test(data.idempotencyKey)) {
    return "idempotencyKey must be 12-120 safe characters"
  }
  if (data.memoLabel !== undefined && (typeof data.memoLabel !== "string" || data.memoLabel.trim().length > 120)) {
    return "memoLabel must be a string up to 120 characters"
  }
  if (data.memo !== undefined && !isRecord(data.memo)) return "memo must be a JSON object"
  return null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value))
}
