# Public Arc mainnet USDC verifier

Kestrel's `/verify` tool inspects an existing transaction by hash without connecting a wallet or creating a payment. The public GET endpoint is `/api/verify/arc?tx=0x…` (one 32-byte hash). It uses fixed endpoints listed in Arc’s documentation (`https://rpc.mainnet.arc.io`, with `https://rpc.drpc.mainnet.arc.io` as a fallback), checks chain ID 5042, and allows only transaction, receipt, block and chain-ID reads. No API key, signer, payment flag, database or RPC URL supplied by the visitor is used.

## What a confirmed result means

The tool recognizes a positive direct native USDC send with empty calldata, or a direct `transfer(address,uint256)` to the USDC ERC-20 interface at `0x3600000000000000000000000000000000000000`. Sender and recipient must be distinct and nonzero. It derives observed sender, recipient and amount from the transaction; it does **not** compare an independently supplied spending intent.

All eight checks must pass: requested transaction hash, transaction chain ID, successful receipt, matching sender, receipt target, supported direct route, matching canonical block containing the transaction, and exactly one matching outgoing system USDC transfer. Canonical inclusion is the observation of the configured RPC at check time, not an independent consensus proof.

The system event emitter `0xfffffffffffffffffffffffffffffffffffffffe` uses 18-decimal amounts for native and ERC-20 USDC movement. ERC-20 calldata uses six decimals. The parallel ERC-20 event is not added to the system event. Gas is computed separately from receipt `gasUsed × effectiveGasPrice`, using 18 decimals. Native transfer amounts retain all 18 decimals.

References: [network configuration](https://docs.arc.io/arc/references/connect-to-arc), [USDC system events](https://docs.arc.io/arc/references/usdc-system-events).

## Limits and privacy

- Unsupported contract workflows, other tokens, zero-value sends, burns and self-transfers do not become confirmed direct transfers. This is not a general transaction simulator or x402 verifier.
- Missing transaction/receipt gives `pending_or_not_found`. Failed checks give `verification_failed`. RPC errors give HTTP 503 without a successful result; unsupported direct routes remain unverified.
- The JSON report explicitly leaves independently supplied intent, wallet ownership, Kestrel provenance, policy signature, provider fulfillment and revenue unverified. A third-party example does not establish Kestrel payment activity or customer usage.
- The visitor's public hash is sent to Kestrel's API and the selected Arc RPC provider. The tool does not store reports in a database; normal hosting/RPC request logs may exist. JSON download is a local snapshot, not a signed attestation, permanent archive or guarantee against a later reorganization.
- Requests have a shared 12-second deadline. The primary attempt is capped at five seconds; on failure only, the secondary receives the remaining time. Valid negative observations are returned without trying another provider. The report names the endpoint actually used; there is no cross-provider consensus check. Individual RPC calls also retain a 15-second maximum. JSON responses are limited to 2 MiB. Instance-local guards permit at most two active checks and 30 starts per minute. These are best-effort bounds, not a distributed abuse-control guarantee.
- The tool is independent of the money-execution routes. Publishing it does not enable Arc mainnet payments or change the existing testnet execution policy.

## Reproduce the public example

The UI's example is an already-existing third-party native transfer, not initiated by Kestrel:

- [Transaction](https://explorer.arc.io/tx/0x53d435334ec0422c11865e9e6bc4f413cfdcb03aefcb2ce718ebce2bb556349d)
- Amount: 2.01 USDC; block: 25,910,191; receipt gas cost: 0.00042 USDC.
- A live RPC check on 14 October 2026 passed all eight checks. The dated [observation snapshot](./evidence/arc-verifier-example-2026-10-14.json) preserves scope and provenance limits. The page always re-queries RPC when the example is verified; the snapshot is not substituted for live data.

```sh
node --input-type=module - <<'JS'
import { createArcReadRpc, inspectArcTransaction } from './scripts/arc-send-verification.mjs'
const result = await inspectArcTransaction(
  '0x53d435334ec0422c11865e9e6bc4f413cfdcb03aefcb2ce718ebce2bb556349d',
  { rpc: createArcReadRpc() }
)
console.log(JSON.stringify(result, null, 2))
JS
```

Unit tests use synthetic fixtures, including native precision, ERC-20 duplication, wrong chain/block/events, missing/reverted receipts, invalid inputs, transport limits and load guards. Local API smoke checks cover the rendered verifier page and invalid-input rejection without relying on live RPC in CI. A separate manual check must verify the live example through the built API before release. CLI proof comparison remains available through `npm run verify:arc-send` and retains its existing intent-based scope.

## Pre-release checks — 14 October 2026

The local production build passed TypeScript and generated 75 pages. Landing lint, 78 unit tests and 16 local API smoke checks passed. Manual requests through the built API confirmed the public example (2.01 USDC), kept an unknown all-zero hash `pending_or_not_found`, and rejected malformed input with HTTP 400. The browser confirmed the example, downloaded a valid JSON report, cleared stale results after editing the hash, and displayed the unknown hash as unverified. A transient primary-RPC timeout was observed; the fixed secondary also returned an unverified pending result, with its actual URL in the report. These checks do not assert deployment to the public production URL or Microgrants acceptance.
