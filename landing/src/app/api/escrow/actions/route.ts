import { randomUUID } from "crypto"
import { NextRequest, NextResponse } from "next/server"

import { EscrowContractError, executeArcEscrowAction } from "@/lib/backend/arc-escrow"
import { requireArcApiKey } from "@/lib/backend/auth"
import { createRequestId, logOperationalEvent, requestIdHeaders } from "@/lib/backend/observability"
import { applySupabaseEscrowAction } from "@/lib/backend/supabase"

export const runtime = "nodejs"
export const maxDuration = 60

export async function POST(request: NextRequest) {
  const requestId = createRequestId(request)
  const body = await request.json().catch(() => null)
  const message = validate(body)
  if (message) return NextResponse.json({ error: "invalid_escrow_action", message }, { status: 400, headers: requestIdHeaders(requestId) })
  const financial = body.action === "release" || body.action === "refund"
  const unauthorized = await requireArcApiKey(request, financial ? ["admin"] : ["write"])
  if (unauthorized) return unauthorized

  try {
    let receipt: { txHash: string; explorerUrl: string; providerReceipt: Record<string, unknown> } | null = null
    if (financial) {
      receipt = await executeArcEscrowAction({
        action: body.action,
        milestoneId: body.milestoneId,
        providerIdempotencyKey: randomUUID(),
      })
    }
    const deal = await applySupabaseEscrowAction({
      dealId: body.dealId,
      milestoneId: body.milestoneId,
      action: body.action,
      actor: body.actor?.trim() || "operator",
      detail: body.detail?.trim() || defaultDetail(body.action),
      txHash: receipt?.txHash,
      explorerUrl: receipt?.explorerUrl,
      providerReceipt: receipt?.providerReceipt,
    })
    if (!deal) throw new Error("Arc Escrow migration is required.")
    logOperationalEvent({
      event: `escrow.${body.action}`,
      requestId,
      route: "/api/escrow/actions",
      details: { dealId: body.dealId, milestoneId: body.milestoneId, txHash: receipt?.txHash ?? null },
    })
    return NextResponse.json({ deal, receipt }, { status: 201, headers: requestIdHeaders(requestId) })
  } catch (reason) {
    const error = reason instanceof EscrowContractError ? reason : null
    return NextResponse.json(
      { error: error?.code ?? "escrow_action_failed", message: reason instanceof Error ? reason.message : "Escrow action failed.", details: error?.details ?? {} },
      { status: error?.code === "escrow_contract_not_configured" ? 409 : 502, headers: requestIdHeaders(requestId) },
    )
  }
}

function validate(body: unknown) {
  if (!body || typeof body !== "object" || Array.isArray(body)) return "JSON object is required"
  const value = body as Record<string, unknown>
  if (typeof value.dealId !== "string" || !value.dealId) return "dealId is required"
  if (typeof value.milestoneId !== "string" || !value.milestoneId) return "milestoneId is required"
  if (!["submit", "release", "refund", "dispute"].includes(String(value.action))) return "action must be submit, release, refund, or dispute"
  if (value.detail !== undefined && (typeof value.detail !== "string" || value.detail.length > 500)) return "detail must be at most 500 characters"
  return null
}

function defaultDetail(action: string) {
  if (action === "submit") return "Milestone submitted for buyer review"
  if (action === "dispute") return "Milestone moved to dispute review"
  if (action === "release") return "Milestone released after confirmed contract execution"
  return "Milestone refunded after confirmed contract execution"
}
