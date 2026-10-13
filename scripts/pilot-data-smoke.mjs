import assert from "node:assert/strict"
import { spawn } from "node:child_process"
import { createServer } from "node:http"

// All requests and credentials in this check belong to disposable localhost fixtures.
const port = Number(process.env.KESTREL_PILOT_DATA_TEST_PORT ?? "3211")
const apiKey = "local-pilot-data-test-only"
let stall = false
const fixture = createServer((request, response) => {
  if (stall) {
    response.writeHead(200, { "Content-Type": "application/json" })
    response.write("[")
    return
  }
  const table = new URL(request.url, "http://localhost").pathname.split("/").at(-1)
  const rows = {
    workspaces: [{ id: "fixture", name: "Fixture pilot", mode: "pilot" }],
    agents: [{
      id: "agt_02", workspace_id: "fixture", name: "Fixture agent", address: "0xfixture",
      status: "active", network: "Arc Testnet", balance_usdc: 0, monthly_budget_usdc: 1,
      monthly_spent_usdc: 0, daily_limit_usdc: 1, daily_spent_usdc: 0, tx_count: 0,
    }],
    api_providers: [{ id: "provider-1", name: "One", verified: false }, { id: "provider-2", name: "Two", verified: false }],
    api_listings: [7, 11, 13].map((count, index) => ({
      id: `api-${index}`, provider_id: "provider-1", name: `API ${index}`,
      category: "Data feeds", price_usdc: 0, pricing_unit: "request", uptime_pct: 99,
      request_count: count, min_reputation_score: 0,
    })),
  }[table] ?? []
  response.writeHead(200, { "Content-Type": "application/json" })
  response.end(JSON.stringify(rows))
})
await new Promise((resolve) => fixture.listen(0, "127.0.0.1", resolve))
const fixturePort = fixture.address().port
const server = spawn(process.execPath, [new URL("../node_modules/next/dist/bin/next", import.meta.url).pathname,
  "start", "landing", "-H", "127.0.0.1", "-p", String(port)], {
  env: {
    ...process.env,
    NODE_ENV: "production",
    ARC_API_KEY: apiKey,
    SUPABASE_URL: `http://127.0.0.1:${fixturePort}`,
    NEXT_PUBLIC_SUPABASE_URL: "",
    SUPABASE_SERVICE_ROLE_KEY: "local-fixture-only",
    ARC_WORKSPACE_ID: "fixture",
    KESTREL_MAINNET_EXECUTION_ENABLED: "false",
    KESTREL_MONEY_EXECUTION_ENABLED: "false",
    ARC_AGENTIC_LIVE_SETTLEMENT: "false",
  },
  stdio: ["ignore", "pipe", "pipe"],
})
let serverOutput = ""
server.stdout.on("data", (chunk) => { serverOutput += chunk.toString() })
server.stderr.on("data", (chunk) => { serverOutput += chunk.toString() })
const base = `http://127.0.0.1:${port}`

try {
  for (let attempt = 0; ; attempt += 1) {
    if (server.exitCode !== null) throw new Error(`Test server exited: ${serverOutput}`)
    try {
      const response = await fetch(`${base}/api/health`, { signal: AbortSignal.timeout(1_000) })
      if (response.ok) break
    } catch { /* Wait for the local Next server. */ }
    if (attempt === 30) throw new Error("Local test server did not become ready")
    await new Promise((resolve) => setTimeout(resolve, 200))
  }

  const measured = await readSummary()
  assert.equal(measured.dataSource, "supabase")
  assert.equal(measured.marketplace.apisListed, 3)
  assert.equal(measured.marketplace.providers, 2)
  assert.equal(measured.marketplace.requests, 31)
  console.log("PASS pilot summary uses actual catalog counts without marketing minimums")

  stall = true
  const started = Date.now()
  const fallback = await readSummary()
  assert.equal(fallback.dataSource, "seed")
  assert.ok(Date.now() - started < 8_000, "stalled JSON must not hold the summary open")
  console.log("PASS stalled Supabase JSON returns explicitly labeled seed fallback within the read deadline")
} finally {
  server.kill("SIGTERM")
  fixture.closeAllConnections()
  await new Promise((resolve) => fixture.close(resolve))
}

async function readSummary() {
  const response = await fetch(`${base}/api/pilot/summary`, {
    headers: { "x-arc-api-key": apiKey },
    signal: AbortSignal.timeout(10_000),
  })
  assert.equal(response.status, 200)
  return response.json()
}
