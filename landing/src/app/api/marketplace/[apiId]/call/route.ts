import { NextRequest, NextResponse } from "next/server"

import { GATEWAY_X_PAYMENT_RESPONSE_HEADER, getGatewaySellerConfiguration, requireGatewayPayment, settleGatewayPayment } from "@/lib/backend/gateway-seller"
import { listApiListings } from "@/lib/backend/service"

export const runtime = "nodejs"
export const maxDuration = 30

// Real Circle Gateway Nanopayments seller endpoint: an x402-compatible client
// gets a genuine 402 challenge, signs a gas-free Gateway authorization, and
// only reaches the handler below once Gateway has verified the payment.
// Settlement happens only after this handler returns successfully — see
// requireGatewayPayment / settleGatewayPayment in gateway-seller.ts. This
// replaces the simulated provider signature used elsewhere in the demo/proof
// flow with a live, real-money payment path.
export async function GET(request: NextRequest, { params }: { params: Promise<{ apiId: string }> }) {
  const { apiId } = await params
  const configuration = getGatewaySellerConfiguration()
  if (!configuration.enabled) {
    return NextResponse.json(
      { error: "gateway_seller_not_configured", message: "Real paid-call settlement is not configured.", missing: configuration.missing },
      { status: 503 },
    )
  }

  const listing = (await listApiListings()).find((item) => item.id === apiId)
  if (!listing) {
    return NextResponse.json({ error: "listing_not_found", message: `No marketplace listing with id ${apiId}.` }, { status: 404 })
  }

  const check = await requireGatewayPayment(request.headers, {
    payTo: configuration.sellerAddress!,
    price: `$${listing.priceUsdc}`,
    network: configuration.network,
    url: request.url,
    description: `${listing.name} — pay-per-call access via Circle Gateway Nanopayments.`,
  })
  if (!check.ok) return NextResponse.json(check.body, { status: check.status })

  const { settlement, headerValue } = await settleGatewayPayment(check.paymentPayload, check.requirements)
  if (!settlement.success) {
    return NextResponse.json(
      { error: "settlement_failed", message: settlement.errorReason ?? "Gateway settlement failed after a verified payment." },
      { status: 502 },
    )
  }

  const response = NextResponse.json({
    apiId: listing.id,
    api: listing.name,
    provider: listing.providerName,
    servedAt: new Date().toISOString(),
    note: "Kestrel-hosted example response for the paid marketplace listing — replace with a real upstream call for production use.",
  })
  if (headerValue) response.headers.set(GATEWAY_X_PAYMENT_RESPONSE_HEADER, headerValue)
  return response
}
