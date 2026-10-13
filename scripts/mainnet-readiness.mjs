// Configuration-only probe. All requests are GET; this script never signs or sends funds.
const baseUrl = new URL(process.env.KESTREL_READINESS_BASE_URL ?? "https://arcsuite-app.vercel.app")
if (baseUrl.protocol !== "https:" && !(baseUrl.protocol === "http:" && ["localhost", "127.0.0.1"].includes(baseUrl.hostname))) {
  throw new Error("Use HTTPS or a local development server.")
}
if (baseUrl.username || baseUrl.password || baseUrl.search || baseUrl.hash || baseUrl.pathname !== "/") {
  throw new Error("Readiness URL must be an origin without credentials, path or query parameters.")
}

const paths = ["/api/health", "/api/money/preflight", "/api/money/execute"]
const responses = await Promise.all(paths.map(async (path) => {
  try {
    const response = await fetch(new URL(path, baseUrl), {
      method: "GET", redirect: "error", signal: AbortSignal.timeout(15_000),
      headers: { "User-Agent": "kestrel-readiness/1.0" },
    })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    return { path, payload: await response.json(), error: null }
  } catch (error) {
    return { path, payload: null, error: error instanceof Error ? error.message : "request_failed" }
  }
}))
const [health, policy, server] = responses.map((response) => response.payload)
const checks = {
  health: health?.ok === true && health?.service === "kestrel-pilot-api",
  network: policy?.network === "mainnet",
  executionPolicy: policy?.enabled === true,
  arcOnly: Array.isArray(policy?.allowedChains) && policy.allowedChains.length === 1 && policy.allowedChains[0] === "Arc",
  sendOnly: Array.isArray(policy?.allowedOperations) && policy.allowedOperations.length === 1 && policy.allowedOperations[0] === "send",
  recipientAllowlist: policy?.allowlistRequired === true,
  boundedAmount: Number.isFinite(policy?.maxAmountUsdc) && policy.maxAmountUsdc > 0,
  screening: policy?.complianceConfigured === true,
}
const configurationReady = responses.every((response) => !response.error) && Object.values(checks).every(Boolean)
console.log(JSON.stringify({
  checkedAt: new Date().toISOString(), baseUrl: baseUrl.origin,
  configurationOnly: true, configurationReady, checks,
  serverSignerConfigured: server?.enabled === true,
  missing: policy?.missing ?? [],
  errors: responses.filter((response) => response.error).map(({ path, error }) => ({ path, error })),
  remainingVerification: ["wallet funding and ownership", "Arc chain ID and RPC", "signed transaction confirmation", "durable public proof"],
}, null, 2))
process.exitCode = configurationReady ? 0 : 2
