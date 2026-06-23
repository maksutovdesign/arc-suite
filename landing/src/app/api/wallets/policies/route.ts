import { NextRequest, NextResponse } from "next/server"

import { requireArcApiKey } from "@/lib/backend/auth"
import { createRequestId, logOperationalEvent, requestIdHeaders } from "@/lib/backend/observability"
import { updateSupabaseWalletSigningPolicy } from "@/lib/backend/supabase"

export async function PATCH(request: NextRequest) {
  const requestId = createRequestId(request)
  const unauthorized = await requireArcApiKey(request, ["admin"])
  if (unauthorized) return unauthorized
  const body = await request.json().catch(() => null)
  const validationError = validate(body)
  if (validationError) {
    return NextResponse.json({ error: "invalid_wallet_policy", message: validationError }, { status: 400, headers: requestIdHeaders(requestId) })
  }
  try {
    const policy = await updateSupabaseWalletSigningPolicy(body)
    if (!policy) throw new Error("Arc Wallet OS migration is required.")
    logOperationalEvent({
      event: "wallet.policy.updated",
      requestId,
      route: "/api/wallets/policies",
      details: { walletId: policy.walletId, approvalsRequired: policy.approvalsRequired },
    })
    return NextResponse.json({ policy }, { headers: requestIdHeaders(requestId) })
  } catch (reason) {
    return NextResponse.json(
      { error: "wallet_policy_update_failed", message: reason instanceof Error ? reason.message : "Wallet policy update failed." },
      { status: 503, headers: requestIdHeaders(requestId) },
    )
  }
}

function validate(body: unknown) {
  if (!body || typeof body !== "object" || Array.isArray(body)) return "JSON object is required"
  const value = body as Record<string, unknown>
  if (typeof value.walletId !== "string" || !value.walletId.trim()) return "walletId is required"
  if (!["active", "paused"].includes(String(value.status))) return "status must be active or paused"
  if (!Number.isInteger(value.approvalsRequired) || Number(value.approvalsRequired) < 1 || Number(value.approvalsRequired) > 10) return "approvalsRequired must be 1-10"
  if (typeof value.transactionLimitUsdc !== "number" || value.transactionLimitUsdc < 0) return "transactionLimitUsdc must be non-negative"
  if (typeof value.dailyLimitUsdc !== "number" || value.dailyLimitUsdc < value.transactionLimitUsdc) return "dailyLimitUsdc must be at least the transaction limit"
  if (typeof value.requireShield !== "boolean") return "requireShield must be boolean"
  if (!Number.isInteger(value.requireReputationScore) || Number(value.requireReputationScore) < 0 || Number(value.requireReputationScore) > 1000) return "requireReputationScore must be 0-1000"
  return null
}
