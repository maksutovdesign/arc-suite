import { isAddress } from "viem"
import type { FacilitatorClient, x402ResourceServer as X402ResourceServer } from "@x402/core/server"
import type { PaymentPayload, PaymentRequired, PaymentRequirements, SchemeNetworkServer } from "@x402/core/types"

const ARC_TESTNET_NETWORK: `${string}:${string}` = "eip155:5042002"
const DEFAULT_TESTNET_FACILITATOR_URL = "https://gateway-api-testnet.circle.com"
export const GATEWAY_X_PAYMENT_HEADER = "X-PAYMENT"
export const GATEWAY_X_PAYMENT_RESPONSE_HEADER = "X-PAYMENT-RESPONSE"

export function getGatewaySellerConfiguration() {
  const explicitlyEnabled = readEnv("KESTREL_GATEWAY_SELLER_ENABLED") === "true"
  const sellerAddress = readEnv("KESTREL_GATEWAY_SELLER_ADDRESS")
  const sellerAddressValid = Boolean(sellerAddress && isAddress(sellerAddress))
  const facilitatorUrl = readEnv("KESTREL_GATEWAY_FACILITATOR_URL") ?? DEFAULT_TESTNET_FACILITATOR_URL

  return {
    enabled: explicitlyEnabled && sellerAddressValid,
    sellerAddress: sellerAddressValid ? sellerAddress! : null,
    network: ARC_TESTNET_NETWORK,
    facilitatorUrl,
    missing: [
      ...(!explicitlyEnabled ? ["KESTREL_GATEWAY_SELLER_ENABLED=true"] : []),
      ...(!sellerAddressValid ? ["KESTREL_GATEWAY_SELLER_ADDRESS (a valid EVM address)"] : []),
    ],
  }
}

// The x402 resource server registers a Gateway facilitator and validates its
// supported networks on first use (an HTTP call), so it is built once and
// reused across requests/invocations rather than per-request.
let resourceServerPromise: Promise<X402ResourceServer> | null = null

function getGatewayResourceServer() {
  if (!resourceServerPromise) {
    // If initialization fails (e.g. a transient facilitator/network error), drop
    // the cached promise so the next call retries instead of staying poisoned.
    resourceServerPromise = buildResourceServer().catch((error) => {
      resourceServerPromise = null
      throw error
    })
  }
  return resourceServerPromise
}

async function buildResourceServer(): Promise<X402ResourceServer> {
  const config = getGatewaySellerConfiguration()
  const [{ x402ResourceServer }, { BatchFacilitatorClient, GatewayEvmScheme }] = await Promise.all([
    import("@x402/core/server"),
    import("@circle-fin/x402-batching/server"),
  ])
  const facilitator = new BatchFacilitatorClient({ url: config.facilitatorUrl })
  // `@circle-fin/x402-batching@3.2.0`'s bundled .d.ts references internal @x402/core
  // chunk types that don't structurally match any publicly published @x402/core
  // release (verified against both the latest and the package's own declared
  // peer-dependency floor). Both packages implement the same documented runtime
  // FacilitatorClient / SchemeNetworkServer contract, so this is a type-only SDK
  // packaging issue, not a runtime incompatibility — cast at this one boundary.
  const server = new x402ResourceServer(facilitator as unknown as FacilitatorClient)
    .register(ARC_TESTNET_NETWORK, new GatewayEvmScheme() as unknown as SchemeNetworkServer)
  await server.initialize()
  return server
}

export type GatewayPaidResource = {
  payTo: string
  price: string
  network: `${string}:${string}`
  maxTimeoutSeconds?: number
  url: string
  description: string
}

export type GatewayPaymentCheck =
  | { ok: true; paymentPayload: PaymentPayload; requirements: PaymentRequirements }
  | { ok: false; status: number; body: PaymentRequired | { error: string; message: string } }

/**
 * Verifies (but does not settle) an incoming request's X-PAYMENT header against
 * a single-resource payment requirement. Framework-agnostic: takes the standard
 * `Headers` object rather than a NextRequest, and returns plain data rather than
 * a NextResponse, so the route handler owns all HTTP-framework concerns.
 *
 * Settlement is a deliberately separate step (see {@link settleGatewayPayment})
 * so callers only charge the buyer after their protected handler has actually
 * produced a successful response.
 */
export async function requireGatewayPayment(headers: Headers, resource: GatewayPaidResource): Promise<GatewayPaymentCheck> {
  const server = await getGatewayResourceServer()
  const resourceInfo = { url: resource.url, description: resource.description, mimeType: "application/json" }
  const requirementsList = await server.buildPaymentRequirementsFromOptions(
    [{ scheme: "exact", payTo: resource.payTo, price: resource.price, network: resource.network, maxTimeoutSeconds: resource.maxTimeoutSeconds ?? 60 }],
    {},
  )

  const paymentHeader = headers.get(GATEWAY_X_PAYMENT_HEADER)
  if (!paymentHeader) {
    const paymentRequired = await server.createPaymentRequiredResponse(requirementsList, resourceInfo)
    return { ok: false, status: 402, body: paymentRequired }
  }

  const { decodePaymentSignatureHeader } = await import("@x402/core/http")
  let paymentPayload: PaymentPayload
  try {
    paymentPayload = decodePaymentSignatureHeader(paymentHeader)
  } catch {
    return { ok: false, status: 400, body: { error: "invalid_payment_header", message: `Malformed ${GATEWAY_X_PAYMENT_HEADER} header.` } }
  }

  const requirements = server.findMatchingRequirements(requirementsList, paymentPayload)
  if (!requirements) {
    const paymentRequired = await server.createPaymentRequiredResponse(requirementsList, resourceInfo, "No matching payment requirements for the submitted payment.")
    return { ok: false, status: 402, body: paymentRequired }
  }

  const verification = await server.verifyPayment(paymentPayload, requirements)
  if (!verification.isValid) {
    const paymentRequired = await server.createPaymentRequiredResponse(requirementsList, resourceInfo, verification.invalidReason ?? "Payment verification failed.")
    return { ok: false, status: 402, body: paymentRequired }
  }

  return { ok: true, paymentPayload, requirements }
}

/**
 * Settles a verified payment. Call this only after the protected handler has
 * produced a successful (non-error) response — settling earlier would charge
 * the buyer even if the handler itself then failed. Returns the encoded
 * X-PAYMENT-RESPONSE header value on success for the caller to attach.
 */
export async function settleGatewayPayment(paymentPayload: PaymentPayload, requirements: PaymentRequirements) {
  const server = await getGatewayResourceServer()
  const { encodePaymentResponseHeader } = await import("@x402/core/http")
  const settlement = await server.settlePayment(paymentPayload, requirements)
  return {
    settlement,
    headerValue: settlement.success ? encodePaymentResponseHeader(settlement) : null,
  }
}

function readEnv(name: string) {
  const value = process.env[name]?.trim()
  return value || null
}
