# Questbook update — 26 July 2026

Applied to the Circle 2026 Cohort 2 proposal on 26 July 2026.

## Positioning

Project name and DBA: **Kestrel**

One-line description:

> Kestrel is an independent agent money control plane built on Arc, combining App Kit money movement, policy-gated USDC settlement, x402 payments, receipts, reputation and verifiable proof.

Arc is described as infrastructure and the application uses the “Built on Arc” signature. No proposal field uses Arc as the Kestrel product identity.

## Current implementation represented in the proposal

- Circle App Kit for Send, Bridge and Unified Balance routes.
- Swap fail-closed until a server-side Circle Wallets or Turnkey adapter is configured.
- Wallet-signed intent, server policy, Circle compliance screening and disclosed fees.
- Signed Circle/Gateway webhook verification, notification deduplication and transfer reconciliation.
- Confirmed 0.003 USDC Arc Testnet settlement and Arcscan-linked proof.
- Card-linked USDC/EURC settlement and B2B residual settlement described as provider-neutral architecture.
- No claim of a live Wirex integration without partner access.
- 10 repository tests, ArcEscrow compilation, four application builds and 21 production smoke checks.

## Circle products

Current:

- USDC
- App Kits
- Contracts
- Gateway
- Wallets

Planned:

- USDC
- EURC
- Agent Stack
- App Kits
- CCTP
- Contracts
- Gateway
- Paymaster
- StableFX
- Wallets

## Updated milestones

1. Server App Kit execution + balance state.
2. Gateway reconciliation + card settlement pilot.
3. B2B netting + external providers.
4. Public pilot + measurable grant evidence.

The proposal now targets design partners, testnet operations and volume, terminal execution success, quote latency, proof completeness and fee revenue rather than additional disconnected demo surfaces.

## 26 July product delivery addendum

The repository now includes the product surfaces needed to collect those milestones:

- a server-side App Kit execution boundary with short-lived signed execution grants;
- Arc Testnet Swap with the Kit Key kept outside the browser;
- a complete Kestrel / Arc / provider / Gateway / forwarding / gas fee ledger;
- a unified Proof Center;
- a production Control Center;
- three end-to-end pilot scenarios;
- a public `/grant-evidence` page and `/api/grant/evidence` endpoint.

The evidence API explicitly separates implemented, configured and measured state. Demo fallback data is not counted as live operation volume or fee revenue.
