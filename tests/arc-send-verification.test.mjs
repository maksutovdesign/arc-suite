import assert from "node:assert/strict"
import { spawnSync } from "node:child_process"
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import test from "node:test"
import { ARC_RPC_URL, TRANSFER_TOPIC, USDC_ERC20, USDC_SYSTEM_EMITTER, createArcReadRpc, inspectArcTransaction, parseArcSendProof, probeArcMainnet, verifyArcSend } from "../scripts/arc-send-verification.mjs"

// Synthetic fixtures only: none of these hashes are claimed as real evidence.
const sender = `0x${"1".repeat(40)}`
const recipient = `0x${"2".repeat(40)}`
const hash = `0x${"a".repeat(64)}`
const blockHash = `0x${"b".repeat(64)}`
const topicAddress = (address) => `0x${address.slice(2).padStart(64, "0")}`
const word = (value) => `0x${value.toString(16).padStart(64, "0")}`
const nativeAmount = 100_000_000_000_000_000n
const erc20Amount = 100_000n
function fixture(erc20 = false) {
  const network = { chain: "Arc", chainId: 5042, environment: "mainnet" }
  const proof = { schemaVersion: "kestrel-money-proof/1", operation: "send", networks: { source: network, destination: network }, intent: { walletAddress: sender, recipient, amount: "0.1", token: "USDC" }, txHashes: [hash] }
  const tx = { hash, chainId: "0x13b2", from: sender, to: erc20 ? USDC_ERC20 : recipient, value: erc20 ? "0x0" : `0x${nativeAmount.toString(16)}`, input: erc20 ? `0xa9059cbb${topicAddress(recipient).slice(2)}${word(erc20Amount).slice(2)}` : "0x", blockHash, blockNumber: "0x10" }
  const log = { address: USDC_SYSTEM_EMITTER, topics: [TRANSFER_TOPIC, topicAddress(sender), topicAddress(recipient)], data: word(nativeAmount), transactionHash: hash, blockHash, blockNumber: "0x10", removed: false }
  const receipt = { transactionHash: hash, from: sender, to: tx.to, status: "0x1", blockHash, blockNumber: "0x10", logs: [log], gasUsed: "0x5208", effectiveGasPrice: "0x4a817c800" }
  if (erc20) receipt.logs.push({ ...log, address: USDC_ERC20, data: word(erc20Amount) })
  const block = { hash: blockHash, number: "0x10", transactions: [hash] }
  const calls = []
  const rpc = async (method, params = []) => {
    calls.push({ method, params })
    const results = { eth_chainId: "0x13b2", eth_getTransactionByHash: tx, eth_getTransactionReceipt: receipt, eth_getBlockByNumber: block }
    assert.ok(method in results, "read-only RPC methods only")
    return results[method]
  }
  return { proof, tx, receipt, log, block, rpc, calls }
}

test("native Send verifies exact amount, canonical block and receipt gas without verifying policy or fulfillment", async () => {
  const f = fixture()
  const report = await verifyArcSend(f.proof, { rpc: f.rpc })
  assert.equal(report.verified, true)
  assert.equal(report.status, "confirmed_send")
  assert.equal(report.observation.route, "native")
  assert.equal(report.observation.actualGasUsdc, "0.00042")
  assert.equal(report.policySignatureVerified, false)
  assert.equal(report.providerFulfillmentVerified, false)
  assert.deepEqual(f.calls[0], { method: "eth_chainId", params: [] })
})

test("ERC-20 Send handles six-decimal calldata and eighteen-decimal system log without double counting", async () => {
  const f = fixture(true)
  const report = await verifyArcSend(f.proof, { rpc: f.rpc })
  assert.equal(report.verified, true)
  assert.equal(report.observation.route, "erc20")
  assert.equal(report.observation.matchingSystemTransfers, 1)
  f.log.data = word(erc20Amount)
  assert.equal((await verifyArcSend(f.proof, { rpc: f.rpc })).verified, false, "six-decimal values in the native stream cannot pass")
})

test("testnet, missing metadata, self-transfers and invalid amounts fail before any network request", async () => {
  const mutations = [
    (p) => { p.networks.source.chainId = 5042002 },
    (p) => { p.networks = null },
    (p) => { p.intent.recipient = sender },
    (p) => { p.intent.amount = "0" },
    (p) => { p.intent.amount = "1e-1" },
    (p) => { p.intent.amount = "0.0000001" },
    (p) => { p.operation = "bridge" },
  ]
  for (const mutate of mutations) {
    const f = fixture(); mutate(f.proof)
    await assert.rejects(verifyArcSend(f.proof, { rpc: f.rpc }))
    assert.equal(f.calls.length, 0)
  }
})

test("transaction selection must be explicit and present in the export", () => {
  const f = fixture()
  const second = `0x${"c".repeat(64)}`
  f.proof.txHashes.push(second)
  assert.throws(() => parseArcSendProof(f.proof), /Select/)
  assert.equal(parseArcSendProof(f.proof, second).txHash, second)
  assert.throws(() => parseArcSendProof(f.proof, `0x${"d".repeat(64)}`), /Select/)
})

test("pending transactions and reverted receipts cannot become confirmed evidence", async () => {
  const f = fixture()
  const rpc = (method, params) => method === "eth_getTransactionReceipt" ? null : f.rpc(method, params)
  const pending = await verifyArcSend(f.proof, { rpc })
  assert.equal(pending.verified, false)
  assert.equal(pending.status, "pending_or_not_found")
  f.receipt.status = "0x0"
  const reverted = await verifyArcSend(f.proof, { rpc: f.rpc })
  assert.equal(reverted.verified, false)
  assert.equal(reverted.checks.receiptSucceeded, false)
})

test("mismatched sender, recipient, value, call, receipt identity or canonical block fail verification", async () => {
  const mutations = [
    (f) => { f.tx.from = recipient },
    (f) => { f.tx.to = sender },
    (f) => { f.tx.value = "0x1" },
    (f) => { f.tx.input = "0x1234" },
    (f) => { f.tx.chainId = "0x1" },
    (f) => { f.receipt.to = sender },
    (f) => { f.receipt.transactionHash = blockHash },
    (f) => { f.block.hash = hash },
    (f) => { f.block.transactions = [] },
  ]
  for (const mutate of mutations) {
    const f = fixture(); mutate(f)
    assert.equal((await verifyArcSend(f.proof, { rpc: f.rpc })).verified, false)
  }
})

test("fake emitter, unrelated logs and extra outgoing transfers cannot prove the authorized Send", async () => {
  const mutations = [
    (f) => { f.log.address = sender },
    (f) => { f.log.topics[2] = topicAddress(sender) },
    (f) => { f.log.transactionHash = blockHash },
    (f) => { f.log.removed = true },
    (f) => { f.receipt.logs.push({ ...f.log, data: word(1n) }) },
  ]
  for (const mutate of mutations) {
    const f = fixture(); mutate(f)
    const report = await verifyArcSend(f.proof, { rpc: f.rpc })
    assert.equal(report.verified, false)
    assert.equal(report.checks.exactUsdcTransfer, false)
  }
})

test("wrong RPC chain is rejected before transaction queries", async () => {
  const f = fixture()
  let calls = 0
  await assert.rejects(verifyArcSend(f.proof, { rpc: async () => { calls++; return "0x1" } }), /5042/)
  assert.equal(calls, 1)
  assert.equal((await probeArcMainnet(f.rpc)).transactionVerified, false)
})

test("RPC client permits reads at a fixed endpoint, rejects redirects, and refuses signing or broadcasting", async () => {
  const requests = []
  const rpc = createArcReadRpc(async (url, options) => {
    requests.push({ url, options })
    const body = JSON.parse(options.body)
    return new Response(JSON.stringify({ jsonrpc: "2.0", id: body.id, result: "0x13b2" }), { status: 200 })
  })
  await probeArcMainnet(rpc)
  assert.equal(requests[0].url, ARC_RPC_URL)
  assert.equal(requests[0].options.redirect, "error")
  await assert.rejects(rpc("eth_sendRawTransaction", ["0xsecret"]), /read-only/)
  await assert.rejects(rpc("personal_sign", []), /read-only/)
  assert.equal(requests.length, 1)
  const invalid = createArcReadRpc(async () => new Response(JSON.stringify({ jsonrpc: "2.0", id: 999, result: "0x13b2" })))
  await assert.rejects(probeArcMainnet(invalid), /could not complete/)
})

test("CLI rejects invalid exported metadata without writing a verification or needing RPC", async () => {
  const dir = await mkdtemp(join(tmpdir(), "kestrel-verification-test-"))
  try {
    const input = join(dir, "proof.json")
    const output = join(dir, "verification.json")
    const f = fixture(); f.proof.networks = null
    await writeFile(input, JSON.stringify(f.proof))
    const cli = new URL("../scripts/verify-arc-send.mjs", import.meta.url)
    const result = spawnSync(process.execPath, [cli.pathname, "--proof", input, "--out", output], { encoding: "utf8", timeout: 5_000 })
    assert.equal(result.status, 1)
    assert.match(result.stderr, /explicitly identify Arc mainnet/)
    await assert.rejects(readFile(output), { code: "ENOENT" })
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})


test("hash-only inspection confirms observed native and ERC-20 transfers without asserting intent or provenance", async () => {
  for (const erc20 of [false, true]) {
    const f = fixture(erc20)
    const report = await inspectArcTransaction(hash, { rpc: f.rpc })
    assert.equal(report.verified, true)
    assert.deepEqual(report.transfer, { sender, recipient, amountUsdc: "0.1" })
    assert.equal(report.intentCompared, false)
    assert.equal(report.kestrelProvenanceVerified, false)
    assert.equal(report.policySignatureVerified, false)
    assert.equal(report.providerFulfillmentVerified, false)
    assert.equal("intent" in report, false)
    assert.equal(report.readOnly, true)
  }
})

test("hash-only native inspection preserves full eighteen-decimal precision", async () => {
  const f = fixture()
  f.tx.value = "0x1"
  f.log.data = word(1n)
  const report = await inspectArcTransaction(hash, { rpc: f.rpc })
  assert.equal(report.verified, true)
  assert.equal(report.transfer.amountUsdc, "0.000000000000000001")
})

test("hash-only inspection declines contract calls, zero sends, self sends and malformed ERC-20 inputs", async () => {
  for (const mutate of [
    f => { f.tx.input = "0x1234" },
    f => { f.tx.value = "0x0" },
    f => { f.tx.to = sender },
    f => { f.tx.to = `0x${"0".repeat(40)}` },
    f => { f.tx.to = USDC_ERC20; f.tx.value = "0x0"; f.tx.input = `0xa9059cbb${"f".repeat(128)}` },
  ]) {
    const f = fixture(); mutate(f)
    const report = await inspectArcTransaction(hash, { rpc: f.rpc })
    assert.equal(report.verified, false)
    assert.equal(report.status, "unsupported_transfer")
    assert.equal(report.transfer, null)
  }
})

test("hash-only inspection cannot confirm reverted, forged-event or non-canonical transactions", async () => {
  for (const mutate of [
    f => { f.receipt.status = "0x0" },
    f => { f.log.address = sender },
    f => { f.receipt.transactionHash = blockHash },
    f => { f.block.transactions = [] },
    f => { f.tx.chainId = "0x1" },
  ]) {
    const f = fixture(); mutate(f)
    const report = await inspectArcTransaction(hash, { rpc: f.rpc })
    assert.equal(report.verified, false)
    assert.equal(report.status, "verification_failed")
  }
})

test("hash-only validation precedes RPC and a missing receipt remains unverified", async () => {
  const f = fixture()
  for (const invalid of [null, "", "https://rpc.example", "0x123", "0x"+"g".repeat(64)]) {
    await assert.rejects(inspectArcTransaction(invalid, { rpc: f.rpc }), /transaction hash/)
  }
  assert.equal(f.calls.length, 0)
  const report = await inspectArcTransaction(hash, { rpc: (method, args) => method === "eth_getTransactionReceipt" ? null : f.rpc(method, args) })
  assert.equal(report.status, "pending_or_not_found")
  assert.equal(report.verified, false)
  assert.equal(report.transfer, null)
})

test("RPC transport carries a shared request cancellation signal", async () => {
  const controller = new AbortController()
  let requestSignal
  const rpc = createArcReadRpc(async (_url, options) => {
    requestSignal = options.signal
    const body = JSON.parse(options.body)
    return new Response(JSON.stringify({ jsonrpc: "2.0", id: body.id, result: "0x13b2" }))
  }, { signal: controller.signal })
  await probeArcMainnet(rpc)
  assert.equal(requestSignal.aborted, false)
  controller.abort()
  assert.equal(requestSignal.aborted, true)
})


test("RPC transport rejects oversized JSON bodies with or without a declared length", async () => {
  for (const headers of [{}, { "Content-Length": String(3 * 1024 * 1024) }]) {
    const rpc = createArcReadRpc(async () => new Response(" ".repeat(2 * 1024 * 1024 + 1), { headers }))
    await assert.rejects(probeArcMainnet(rpc), /exceeded the read limit/)
  }
})

test("RPC callers cannot substitute an arbitrary endpoint", () => {
  assert.throws(() => createArcReadRpc(fetch, { rpcUrl: "https://example.com" }), /fixed Arc mainnet/)
})
