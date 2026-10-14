import assert from "node:assert/strict"
import test from "node:test"
import { createArcVerifierHandler } from "../landing/src/lib/arc-verifier-api.ts"
import type { ArcTransactionInspection } from "../scripts/arc-send-verification.mjs"

const hash = `0x${"a".repeat(64)}`
const request = (query = `tx=${hash}`) => new Request(`http://localhost/api/verify/arc?${query}`)
const report: ArcTransactionInspection = {
  schemaVersion: "kestrel-arc-transaction-inspection/1", checkedAt: "2026-10-14T00:00:00Z",
  verificationMethod: "rpc-observation", rpcUrl: "https://rpc.mainnet.arc.io", readOnly: true,
  verified: false, status: "pending_or_not_found", network: { chain: "Arc", chainId: 5042, environment: "mainnet" },
  transactionHash: hash, explorerUrl: `https://explorer.arc.io/tx/${hash}`, transfer: null, checks: {}, observation: null,
  intentCompared: false, kestrelProvenanceVerified: false, policySignatureVerified: false, providerFulfillmentVerified: false, limitations: "Synthetic test only",
}

test("public verifier rejects invalid, duplicate and extra inputs before inspection", async () => {
  let calls = 0
  const get = createArcVerifierHandler(async () => { calls++; return report })
  for (const query of ["", "tx=invalid", `tx=${hash}&tx=${hash}`, `tx=${hash}&rpc=https://example.com`]) {
    const response = await get(request(query))
    assert.equal(response.status, 400)
    assert.equal(response.headers.get("cache-control"), "no-store")
  }
  assert.equal(calls, 0)
})

test("public verifier returns an uncached observation and passes request cancellation", async () => {
  const controller = new AbortController()
  let observedSignal: AbortSignal | undefined
  const get = createArcVerifierHandler(async (tx, signal) => { assert.equal(tx, hash); observedSignal = signal; return report })
  const response = await get(new Request(`http://localhost/api/verify/arc?tx=${hash.toUpperCase().replace("0X", "0x")}`, { signal: controller.signal }))
  assert.equal(response.status, 200)
  assert.equal(response.headers.get("cache-control"), "no-store")
  assert.deepEqual(await response.json(), report)
  controller.abort()
  assert.equal(observedSignal?.aborted, true)
})

test("public verifier hides upstream errors and releases concurrency slots", async () => {
  const get = createArcVerifierHandler(async () => { throw new Error("upstream internal details") })
  for (let i = 0; i < 3; i++) {
    const response = await get(request())
    assert.equal(response.status, 503)
    assert.doesNotMatch(await response.text(), /internal details/)
  }
})

test("public verifier limits concurrent RPC work without database writes", async () => {
  let release: (() => void) | undefined
  const gate = new Promise<void>((resolve) => { release = resolve })
  const get = createArcVerifierHandler(async () => { await gate; return report })
  const first = get(request()), second = get(request())
  const blocked = await get(request())
  assert.equal(blocked.status, 429)
  assert.equal(blocked.headers.get("retry-after"), "60")
  release!()
  assert.equal((await first).status, 200)
  assert.equal((await second).status, 200)
  assert.equal((await get(request())).status, 200)
})

test("public verifier caps started work per instance-minute", async () => {
  let calls = 0
  const get = createArcVerifierHandler(async () => { calls++; return report })
  for (let i = 0; i < 30; i++) assert.equal((await get(request())).status, 200)
  assert.equal((await get(request())).status, 429)
  assert.equal(calls, 30)
})

test("fixed secondary RPC is used only after a failed primary attempt, and is named in the report", async () => {
  const { inspectArcWithFallback } = await import("../landing/src/lib/arc-verifier-api.ts")
  const calls: string[] = []
  const fakeFetch: typeof fetch = async (input, options) => {
    const url = String(input)
    calls.push(url)
    if (url === "https://rpc.mainnet.arc.io") return new Response("unavailable", { status: 503 })
    assert.equal(url, "https://rpc.drpc.mainnet.arc.io")
    const body = JSON.parse(String(options?.body))
    return Response.json({ jsonrpc: "2.0", id: body.id, result: body.method === "eth_chainId" ? "0x13b2" : null })
  }
  const observed = await inspectArcWithFallback(hash, new AbortController().signal, fakeFetch)
  assert.equal(observed.status, "pending_or_not_found")
  assert.equal(observed.verified, false)
  assert.equal(observed.rpcUrl, "https://rpc.drpc.mainnet.arc.io")
  assert.equal(calls.filter((url) => url === "https://rpc.mainnet.arc.io").length, 1)
})

test("a valid negative RPC observation does not trigger fallback", async () => {
  const { inspectArcWithFallback } = await import("../landing/src/lib/arc-verifier-api.ts")
  const fakeFetch: typeof fetch = async (input, options) => {
    assert.equal(String(input), "https://rpc.mainnet.arc.io")
    const body = JSON.parse(String(options?.body))
    return Response.json({ jsonrpc: "2.0", id: body.id, result: body.method === "eth_chainId" ? "0x13b2" : null })
  }
  assert.equal((await inspectArcWithFallback(hash, new AbortController().signal, fakeFetch)).status, "pending_or_not_found")
})
