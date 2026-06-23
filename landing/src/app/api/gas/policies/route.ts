import { NextRequest, NextResponse } from "next/server"

import { requireArcApiKey } from "@/lib/backend/auth"
import { createRequestId, logOperationalEvent, requestIdHeaders } from "@/lib/backend/observability"
import { updateSupabaseGasPolicy } from "@/lib/backend/supabase"

export async function PATCH(request: NextRequest) {
  const requestId = createRequestId(request)
  const unauthorized = await requireArcApiKey(request, ["admin"])
  if (unauthorized) return unauthorized
  const body = await request.json().catch(() => null)
  const validationError = validate(body)
  if (validationError) {
    return NextResponse.json(
      { error: "invalid_gas_policy", message: validationError },
      { status: 400, headers: requestIdHeaders(requestId) },
    )
  }
  try {
    const policy = await updateSupabaseGasPolicy(body)
    if (!policy) throw new Error("Arc Gas migration is required.")
    logOperationalEvent({
      event: "gas.policy.updated",
      requestId,
      route: "/api/gas/policies",
      details: { agentId: policy.agentId, mode: policy.mode, status: policy.status },
    })
    return NextResponse.json({ policy }, { headers: requestIdHeaders(requestId) })
  } catch (reason) {
    return NextResponse.json(
      { error: "gas_policy_update_failed", message: reason instanceof Error ? reason.message : "Gas policy update failed." },
      { status: 503, headers: requestIdHeaders(requestId) },
    )
  }
}

function validate(body: unknown) {
  if (!body || typeof body !== "object" || Array.isArray(body)) return "JSON object is required"
  const value = body as Record<string, unknown>
  if (typeof value.agentId !== "string" || !value.agentId.trim()) return "agentId is required"
  if (!["gas_station", "paymaster"].includes(String(value.mode))) return "mode must be gas_station or paymaster"
  if (!["active", "paused"].includes(String(value.status))) return "status must be active or paused"
  for (const key of ["perTxLimitUsdc", "dailyLimitUsdc", "monthlyLimitUsdc"]) {
    if (typeof value[key] !== "number" || !Number.isFinite(value[key]) || Number(value[key]) < 0 || Number(value[key]) > 10_000) return `${key} must be between 0 and 10,000`
  }
  if (Number(value.perTxLimitUsdc) > Number(value.dailyLimitUsdc) || Number(value.dailyLimitUsdc) > Number(value.monthlyLimitUsdc)) return "Limits must satisfy per-tx <= daily <= monthly"
  return null
}
