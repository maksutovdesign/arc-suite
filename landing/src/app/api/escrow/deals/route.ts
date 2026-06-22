import { randomUUID } from "crypto"
import { NextRequest, NextResponse } from "next/server"

import { requireArcApiKey } from "@/lib/backend/auth"
import { createRequestId, logOperationalEvent, requestIdHeaders } from "@/lib/backend/observability"
import { createSupabaseEscrowDeal } from "@/lib/backend/supabase"

export async function POST(request: NextRequest) {
  const requestId = createRequestId(request)
  const unauthorized = await requireArcApiKey(request, ["write"])
  if (unauthorized) return unauthorized
  const body = await request.json().catch(() => null)
  const message = validate(body)
  if (message) return NextResponse.json({ error: "invalid_escrow_deal", message }, { status: 400, headers: requestIdHeaders(requestId) })

  try {
    const deal = await createSupabaseEscrowDeal({
      id: `esc_${randomUUID()}`,
      idempotencyKey: body.idempotencyKey,
      title: body.title.trim(),
      description: body.description?.trim() ?? "",
      buyerAgentId: body.buyerAgentId,
      sellerAgentId: body.sellerAgentId,
      milestones: body.milestones.map((item: Record<string, unknown>) => ({
        title: String(item.title).trim(),
        description: typeof item.description === "string" ? item.description.trim() : "",
        amountUsdc: Number(item.amountUsdc),
        dueAt: typeof item.dueAt === "string" && item.dueAt ? item.dueAt : null,
      })),
    })
    if (!deal) throw new Error("Arc Escrow migration is required.")
    logOperationalEvent({ event: "escrow.deal.created", requestId, route: "/api/escrow/deals", details: { dealId: deal.id, totalAmountUsdc: deal.totalAmountUsdc } })
    return NextResponse.json({ deal }, { status: 201, headers: requestIdHeaders(requestId) })
  } catch (reason) {
    const detail = reason instanceof Error ? reason.message : "Escrow deal creation failed."
    return NextResponse.json({ error: "escrow_deal_failed", message: detail }, { status: 409, headers: requestIdHeaders(requestId) })
  }
}

function validate(body: unknown) {
  if (!body || typeof body !== "object" || Array.isArray(body)) return "JSON object is required"
  const value = body as Record<string, unknown>
  if (typeof value.title !== "string" || value.title.trim().length < 3 || value.title.length > 120) return "title must be 3-120 characters"
  if (typeof value.buyerAgentId !== "string" || typeof value.sellerAgentId !== "string" || value.buyerAgentId === value.sellerAgentId) return "different buyerAgentId and sellerAgentId are required"
  if (typeof value.idempotencyKey !== "string" || !/^[a-zA-Z0-9._:-]{12,120}$/.test(value.idempotencyKey)) return "idempotencyKey must be 12-120 safe characters"
  if (!Array.isArray(value.milestones) || value.milestones.length < 1 || value.milestones.length > 20) return "1-20 milestones are required"
  let total = 0
  for (const raw of value.milestones) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return "Each milestone must be an object"
    const item = raw as Record<string, unknown>
    if (typeof item.title !== "string" || item.title.trim().length < 2 || item.title.length > 120) return "Each milestone needs a title"
    if (typeof item.amountUsdc !== "number" || !Number.isFinite(item.amountUsdc) || item.amountUsdc <= 0) return "Each milestone needs a positive amountUsdc"
    total += item.amountUsdc
  }
  if (total > 10_000) return "Escrow total must not exceed 10,000 USDC"
  return null
}
