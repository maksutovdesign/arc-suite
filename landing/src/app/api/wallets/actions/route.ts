import { NextRequest, NextResponse } from "next/server"

import { requireArcApiKey } from "@/lib/backend/auth"
import { createRequestId, logOperationalEvent, requestIdHeaders } from "@/lib/backend/observability"
import { enqueueSupabaseExecutionJob, requestSupabaseWalletLifecycleAction } from "@/lib/backend/supabase"

const actions = ["sign", "recover", "suspend", "resume", "retire"] as const

export async function POST(request: NextRequest) {
  const requestId = createRequestId(request)
  const unauthorized = await requireArcApiKey(request, ["write"])
  if (unauthorized) return unauthorized
  const body = await request.json().catch(() => null)
  const validationError = validate(body)
  if (validationError) {
    return NextResponse.json({ error: "invalid_wallet_action", message: validationError }, { status: 400, headers: requestIdHeaders(requestId) })
  }
  try {
    const event = await requestSupabaseWalletLifecycleAction({
      walletId: body.walletId,
      idempotencyKey: body.idempotencyKey,
      action: body.action,
      actor: body.actor.trim(),
      detail: body.detail.trim(),
      metadata: { source: body.source ?? "wallet_os_console" },
    })
    if (!event) throw new Error("Arc Wallet OS migration is required.")
    const job = await enqueueSupabaseExecutionJob({
      idempotencyKey: `wallet:${event.id}`,
      kind: "wallet_operation",
      resourceType: "wallet_event",
      resourceId: event.id,
      action: event.action,
      payload: { walletId: event.walletId, actor: event.actor, detail: event.detail },
      initialStatus: "waiting_provider",
    })
    if (!job) throw new Error("Execution worker migration is required.")
    logOperationalEvent({
      event: "wallet.lifecycle.requested",
      requestId,
      route: "/api/wallets/actions",
      details: { walletId: event.walletId, action: event.action },
    })
    return NextResponse.json({ event, job }, { status: 201, headers: requestIdHeaders(requestId) })
  } catch (reason) {
    const message = reason instanceof Error ? reason.message : "Wallet lifecycle request failed."
    return NextResponse.json(
      { error: "wallet_action_failed", message },
      { status: message.includes("not found") ? 404 : 409, headers: requestIdHeaders(requestId) },
    )
  }
}

function validate(body: unknown) {
  if (!body || typeof body !== "object" || Array.isArray(body)) return "JSON object is required"
  const value = body as Record<string, unknown>
  if (typeof value.walletId !== "string" || !value.walletId.trim()) return "walletId is required"
  if (!actions.includes(value.action as (typeof actions)[number])) return "Unsupported lifecycle action"
  if (typeof value.actor !== "string" || value.actor.trim().length < 2 || value.actor.length > 120) return "actor must be 2-120 characters"
  if (typeof value.detail !== "string" || value.detail.trim().length < 3 || value.detail.length > 240) return "detail must be 3-240 characters"
  if (typeof value.idempotencyKey !== "string" || !/^[a-zA-Z0-9._:-]{12,120}$/.test(value.idempotencyKey)) return "idempotencyKey must be 12-120 safe characters"
  return null
}
