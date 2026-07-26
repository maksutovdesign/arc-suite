const baseUrl = (process.env.KESTREL_X402_BASE_URL || "https://arcsuite-app.vercel.app").replace(/\/$/, "")
const secret = process.env.KESTREL_X402_BATCH_SECRET || process.env.CRON_SECRET
const count = Number(process.env.KESTREL_X402_BATCH_SIZE || "25")

if (!secret) {
  throw new Error("KESTREL_X402_BATCH_SECRET or CRON_SECRET is required.")
}

if (!Number.isInteger(count) || count < 1 || count > 25) {
  throw new Error("KESTREL_X402_BATCH_SIZE must be an integer between 1 and 25.")
}

const response = await fetch(`${baseUrl}/api/procurement/batch`, {
  body: JSON.stringify({ count }),
  headers: {
    "content-type": "application/json",
    "x-kestrel-execution-secret": secret,
  },
  method: "POST",
  signal: AbortSignal.timeout(290_000),
})
const payload = await response.json().catch(() => ({}))

if (!response.ok || !payload.batch) {
  console.error(JSON.stringify({
    error: payload.error || "paid_provider_batch_failed",
    message: payload.message || response.statusText,
    missing: payload.missing || [],
    status: response.status,
  }, null, 2))
  process.exit(1)
}

const batch = payload.batch
console.log(JSON.stringify({
  batchId: batch.batchId,
  fee: batch.fee,
  proofCompletenessPct: batch.proofCompletenessPct,
  providerSpendUsdc: batch.providerSpendUsdc,
  requestedOperations: batch.requestedOperations,
  stored: batch.stored,
  successfulOperations: batch.successfulOperations,
}, null, 2))

if (
  batch.successfulOperations !== batch.requestedOperations
  || batch.proofCompletenessPct !== 100
  || !batch.stored
) {
  process.exit(2)
}
