import assert from "node:assert/strict"
import test from "node:test"
import { createMoneyProofExport } from "../landing/src/lib/money-proof-export.ts"

test("public proof export excludes SDK payloads and reusable grants without asserting confirmation", () => {
  const proof = {
    operation: "send", state: "submitted", traceId: "trace-1", recordedAt: "2026-10-12T16:00:00Z",
    txHashes: ["0x" + "a".repeat(64)], explorerUrls: [],
    intent: { walletAddress: "0xsender", recipient: "0xrecipient", amount: "0.1", token: "USDC", privateKey: "private-key-must-not-export" },
    networks: {
      source: { chain: "Arc", chainId: 5042, environment: "mainnet" },
      destination: { chain: "Arc", chainId: 5042, environment: "mainnet" },
    },
    policy: { decision: "allow", provider: "Circle", signature: "signature-must-not-export" },
    executionGrant: "grant-must-not-export", raw: { apiKey: "api-key-must-not-export" },
    feeBreakdown: { kestrelRevenueUsdc: 0, totalFeeUsdc: 0.03, destinationAmountUsdc: 0.1 },
  }
  const exported = createMoneyProofExport(proof)
  const serialized = JSON.stringify(exported)
  assert.doesNotMatch(serialized, /must-not-export/)
  assert.equal(exported.independentlyVerified, false)
  assert.equal(exported.state, "submitted")
  assert.equal(exported.networks?.source.chainId, 5042)
  assert.equal(exported.intent?.amount, "0.1")
  assert.equal(exported.feeEstimate?.estimatedKestrelFeeUsdc, 0)
})

test("older proofs retain unknown network and intent rather than receiving mainnet metadata", () => {
  const exported = createMoneyProofExport({ operation: "send", state: "submitted", traceId: "old", recordedAt: "2026-06-01T00:00:00Z", txHashes: [], explorerUrls: [] })
  assert.equal(exported.networks, null)
  assert.equal(exported.intent, null)
  assert.equal(exported.policy, null)
  assert.equal(exported.feeEstimate, null)
  assert.equal(exported.independentlyVerified, false)
})
