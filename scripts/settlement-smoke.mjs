const baseUrl = (process.env.ARC_SETTLEMENT_SMOKE_BASE_URL || "https://arcsuite-app.vercel.app").replace(/\/$/, "")
const apiKey = process.env.ARC_SETTLEMENT_SMOKE_API_KEY
const recipientAddress = process.env.ARC_SETTLEMENT_SMOKE_RECIPIENT
const amountUsdc = Number(process.env.ARC_SETTLEMENT_SMOKE_AMOUNT_USDC || "0.003")

if (!apiKey) {
  throw new Error("ARC_SETTLEMENT_SMOKE_API_KEY is required.")
}

if (!recipientAddress || !/^0x[a-fA-F0-9]{40}$/.test(recipientAddress)) {
  throw new Error("ARC_SETTLEMENT_SMOKE_RECIPIENT must be a full EVM address.")
}

if (!Number.isFinite(amountUsdc) || amountUsdc <= 0 || amountUsdc > 0.1) {
  throw new Error("ARC_SETTLEMENT_SMOKE_AMOUNT_USDC must be greater than 0 and at most 0.1.")
}

const idempotencyKey = `real-settlement:${new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14)}:${crypto.randomUUID()}`
const response = await fetch(`${baseUrl}/api/settlements/arc`, {
  method: "POST",
  headers: {
    "content-type": "application/json",
    "x-arc-api-key": apiKey,
  },
  body: JSON.stringify({
    agentId: "agt_01",
    apiId: "api_01",
    amountUsdc,
    recipientAddress,
    idempotencyKey,
    memoLabel: "Arc Suite real settlement smoke",
    memo: {
      source: "github_actions_settlement_smoke",
      purpose: "x402_api_payment",
      simulation: false,
    },
  }),
})

const payload = await response.json().catch(() => ({}))
if (!response.ok || !payload.ok) {
  console.error(JSON.stringify({
    status: response.status,
    ok: payload.ok ?? false,
    error: payload.error ?? "settlement_smoke_failed",
    message: payload.message ?? response.statusText,
    details: sanitizeDetails(payload.details),
  }, null, 2))
  process.exit(1)
}

const transaction = payload.result?.transaction
const settlement = payload.result?.settlement
console.log(JSON.stringify({
  status: "confirmed",
  amountUsdc,
  settlementId: settlement?.id,
  txHash: transaction?.txHash,
  explorerUrl: transaction?.explorerUrl,
}, null, 2))

function sanitizeDetails(details) {
  if (!details || typeof details !== "object") return details ?? null
  const clone = { ...details }
  delete clone.providerReceipt
  delete clone.entitySecret
  delete clone.apiKey
  return clone
}
