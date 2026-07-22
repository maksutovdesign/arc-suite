export type IntegrationState = "configured" | "partial" | "missing"

export type ExternalIntegration = {
  id: "app-kit" | "turnkey" | "risk" | "goldsky" | "pyth" | "chainlink" | "lifi"
  name: string
  state: IntegrationState
  capabilities: string[]
  missing: string[]
  detail: string
}

export function getExternalIntegrationReadiness(): ExternalIntegration[] {
  const riskProvider = readEnv("KESTREL_RISK_PROVIDER")?.toLowerCase() ?? "circle"
  const riskRequirements = riskProvider === "trm"
    ? ["TRM_API_KEY"]
    : riskProvider === "elliptic"
      ? ["ELLIPTIC_API_KEY", "ELLIPTIC_API_SECRET"]
      : ["CIRCLE_API_KEY"]

  return [
    integration({
      id: "app-kit",
      name: "Circle App Kit",
      requirements: [],
      capabilities: ["Send", "Bridge", "Swap", "Unified Balance", "developer fees", "transaction proof"],
      detail: "SDK and Viem browser-wallet adapter are installed. Execution uses the user's connected signer.",
      forceConfigured: true,
    }),
    integration({
      id: "turnkey",
      name: "Turnkey policy signing",
      requirements: ["TURNKEY_API_PUBLIC_KEY", "TURNKEY_API_PRIVATE_KEY", "TURNKEY_ORGANIZATION_ID", "TURNKEY_WALLET_ADDRESS"],
      capabilities: ["backend signing", "agent wallet policies", "key rotation", "approval controls"],
      detail: "Server-side Company Wallet adapter for policy-constrained agent and treasury operations.",
    }),
    integration({
      id: "risk",
      name: `${riskProvider === "circle" ? "Circle" : riskProvider === "trm" ? "TRM Labs" : "Elliptic"} risk adapter`,
      requirements: riskRequirements,
      capabilities: ["pre-transaction screening", "post-settlement monitoring", "audit decision"],
      detail: `Provider-neutral risk slot. Active provider selection: ${riskProvider}.`,
    }),
    integration({
      id: "goldsky",
      name: "Goldsky event indexing",
      requirements: ["GOLDSKY_GRAPHQL_URL"],
      capabilities: ["contract event indexing", "reconciliation", "alerts", "proof timelines"],
      detail: "GraphQL/Turbo endpoint becomes the event source for settlement and proof reconciliation.",
    }),
    integration({
      id: "pyth",
      name: "Pyth price guard",
      requirements: ["PYTH_ARC_CONTRACT_ADDRESS", "PYTH_PRICE_FEED_IDS"],
      capabilities: ["price freshness", "deviation guard", "price-aware settlement"],
      detail: "Arc contract and feed IDs are required before price checks can fail closed.",
    }),
    integration({
      id: "chainlink",
      name: "Chainlink CCIP and data",
      requirements: ["ARC_RPC_URL", "CHAINLINK_ARC_FEED_ADDRESS"],
      capabilities: ["CCIP message status", "data freshness", "cross-chain evidence"],
      detail: "Arc Testnet router metadata exists; live RPC/feed reads require deployment configuration.",
    }),
    integration({
      id: "lifi",
      name: "LI.FI fallback routing",
      requirements: ["LIFI_API_KEY", "LIFI_INTEGRATOR"],
      capabilities: ["arbitrary-token entry", "route fallback", "cross-chain quote"],
      detail: "Used only when the native Circle USDC route cannot satisfy the user's source asset or chain.",
    }),
  ]
}

function integration(input: {
  id: ExternalIntegration["id"]
  name: string
  requirements: string[]
  capabilities: string[]
  detail: string
  forceConfigured?: boolean
}): ExternalIntegration {
  const missing = input.requirements.filter((name) => !readEnv(name))
  const configuredCount = input.requirements.length - missing.length
  const state: IntegrationState = input.forceConfigured || missing.length === 0
    ? "configured"
    : configuredCount > 0
      ? "partial"
      : "missing"

  return {
    id: input.id,
    name: input.name,
    state,
    capabilities: input.capabilities,
    missing,
    detail: input.detail,
  }
}

function readEnv(name: string) {
  const value = process.env[name]?.trim()
  return value || null
}
