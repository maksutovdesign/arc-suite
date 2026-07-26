# Arc ecosystem audit — 26 July 2026

This audit covers official Arc, Arc House, Circle Developer and Circle Gateway materials available through 26 July 2026. Public X posts are treated as discovery signals; product decisions use the corresponding official announcement or documentation as the source of truth.

## Executive conclusion

Arc is moving from testnet primitives and ecosystem logos toward production payment architecture:

1. App Kit is the preferred application surface for Send, Bridge, Swap and Unified Balance.
2. Gateway lifecycle state, webhooks, forwarding and recovery are production requirements.
3. USDC and EURC settlement is expanding into consumer balances, FX and card-linked activity.
4. Card settlement and B2B obligation netting make reconciliation a core product feature.
5. Arc remains infrastructure; an independent product brand must lead.

Kestrel already has the right base: independent branding, App Kit flows, a signed server policy, compliance screening, developer fees, transaction proof and memo-aware settlement. The next differentiation is a settlement control plane rather than another transfer interface.

## Updates and product impact

### 22 July — Wirex card settlement

Wirex One plans to use Arc for eligible non-U.S. card settlement in USDC and EURC. The useful architecture is the full lifecycle: authorization, clearing, stablecoin settlement, pending/settled state, custody or account abstraction, compliance and reconciliation.

Kestrel action:

- add a provider-neutral card-settlement boundary;
- model USDC and EURC settlement assets;
- retain provider reference, Gateway transfer ID, transaction hash and memo;
- do not claim a live Wirex integration until partner/API access exists.

Source: [Arc × Wirex](https://community.arc.io/public/blogs/arc-x-wirex-card-settlement-infrastructure-on-arc-2026-07-22).

### 20 July — Synthra market infrastructure

Synthra combines spot, concentrated liquidity and perpetual markets on Arc Testnet. This strengthens the case for route-quality controls, market-data freshness and post-trade proof, but Kestrel should remain an execution and policy layer rather than become a DEX.

Source: [Arc House content](https://community.arc.io/public/content).

### 17 July — Cycles multilateral clearing

Cycles nets B2B obligations and settles only residual USDC on Arc. This creates a high-value Kestrel roadmap item: invoice, payroll and supplier obligations grouped into a clearing window, with approval and proof attached to the residual settlement.

Source: [Arc × Cycles](https://community.arc.io/public/blogs/arc-cycles-multilateral-clearing-and-settlement-on-arc-2026-07-17).

### 16 July — Arc brand rules

The product brand must lead; Arc is infrastructure. Kestrel and “Built on Arc” comply with this direction.

Source: [Arc Brand Guidelines](https://community.arc.io/public/blogs/arc-brand-guidelines-and-partner-toolkit-is-live-2026-07-16).

### 13 July — grant evidence from real products

The grant-recipient update emphasizes users, stores, revenue, geographic corridors and operational integrations. A broad demo is weaker than measurable use: active wallets, settled volume, terminal success, proof completeness, revenue and design partners.

Source: [Arc as a catalyst for Circle grant recipients](https://www.arc.io/blog/arc-as-a-catalyst-for-circle-grant-recipients-in-africa-and-the-global-south).

### 9 July — Pulsar consumer money movement

Pulsar combines USDC/EURC balances, payments, FX, card activity, App Kits, CCTP, Paymaster and StableFX. The product lesson is to hide chain mechanics and begin with the user’s money action.

Source: [Arc × Pulsar](https://community.arc.io/en/public/blogs/arc-x-pulsar-consumer-stablecoin-money-movement-on-arc-2026-07-09).

### 7 July — App Kit implementation constraints

- Send, Bridge and Unified Balance can run in browser or server environments.
- Swap is server-side only at present and its Kit Key must remain secret.
- Production integrations should use custom RPC endpoints.
- Browser wallets, Circle developer-controlled wallets, private-key adapters and Turnkey are supported in different execution models.
- Smart contract accounts need approval/delegate handling for Unified Balance.
- Custom developer fees return 90% to the application and 10% to Circle.

Kestrel risk: the current browser-based Swap surface must not expose a Kit Key. Move live Swap execution behind a server wallet adapter before enabling it in production.

Source: [App Kit FAQs](https://community.arc.io/public/blogs/app-kit-faqs-2026-07-07).

### 2 July — Pyth price feeds

Pyth enables price freshness and deviation checks for FX, collateral and pricing-sensitive settlement. Kestrel already has a readiness slot; the next step requires Arc contract addresses and selected feed IDs.

Source: [Arc × Pyth](https://community.arc.io/public/blogs/arc-pyth-real-time-market-data-for-pricing-sensitive-apps-on-arc-2026-07-02).

### 30 June — Gateway webhooks and Chainlink

Gateway webhook events now provide authoritative deposit and mint lifecycle updates:

- `gateway.deposit.finalized`;
- `gateway.mint.forwarded`;
- `gateway.mint.finalized`.

Notifications can arrive out of order and be retried, so ingestion must verify Circle signatures and deduplicate by `notificationId`. Kestrel’s signed webhook inbox already did both; this sprint adds Gateway `transferId` and finalized-state mapping so those events reconcile execution records correctly.

Chainlink adds another route for data and cross-chain evidence. Use it where CCIP or verified offchain data is required, not as a substitute for native Circle USDC routing.

Sources: [Gateway webhooks](https://developers.circle.com/gateway/webhooks), [Gateway event schemas](https://developers.circle.com/gateway/references/webhook-events), [Arc × Chainlink](https://community.arc.io/home/blogs/arc-x-chainlink-data-and-cross-chain-infrastructure-for-arc-builders-2026-06-30).

### June — Unified Balance production model

The official technical series establishes four important rules:

- confirmed balance is spendable; pending balance is visible but not spendable;
- funds in motion are separate from pending deposits;
- estimate and execute the exact same route;
- resumable mint failures need attestation context and fast recovery.

Kestrel already estimates routes, displays fees, tracks recoverability and keeps proof. The next implementation should add a first-class confirmed/pending/in-motion balance model and persist resumable Unified Balance state.

Sources: [Pending and funds in motion](https://www.arc.io/blog/unified-balance-kit-designing-for-pending-and-funds-in-motion-states), [Safeguards and recovery](https://www.arc.io/blog/unified-balance-kit-production-safeguards-and-recovery-patterns-for-spend), [Gateway-to-App-Kit migration](https://www.arc.io/blog/from-gateway-primitives-to-unified-balance-kit-methods).

## Gap analysis

| Capability | Kestrel state | Next action |
| --- | --- | --- |
| Independent brand | Implemented | Keep “Built on Arc”; do not restore Arc as product identity |
| App Kit core | Implemented | Move production Swap to a server adapter |
| Signed execution policy | Implemented | Add asset and settlement-purpose fields |
| Developer fees | Implemented | Validate fee behavior per supported route |
| Gateway webhook security | Implemented | Register production subscription and monitored addresses |
| Gateway lifecycle mapping | Implemented in this sprint | Verify with signed test notifications |
| Card settlement lifecycle | Architecture added in this sprint | Obtain provider/partner access and build adapter |
| USDC/EURC settlement | Partial | Add asset-aware policy, ledger and proof |
| Confirmed/pending/in-motion balance | Partial | Add `getBalances({ includePending: true })` UI and storage |
| Multilateral netting | Research | Build obligation ledger and residual-settlement prototype |
| Transaction memos | Implemented offchain | Validate native Arc memo encoding on the live route |
| Pyth/Chainlink/Goldsky | Readiness only | Configure one provider at a time and prove freshness/reconciliation |
| Grant evidence | Partial | Recruit design partners and publish measured operation metrics |

## Ordered implementation

### Sprint 1 — started

- Map Gateway `transferId` and finalized events in the signed Circle webhook inbox.
- Add card-settlement readiness to integration health.
- Add Wirex, Cycles and Pulsar to Kestrel Radar.
- Add a card settlement lifecycle surface to Money Movement.

### Sprint 2

- Remove browser-side Kit Key usage and move Swap execution to a server-controlled Circle Wallets or Turnkey adapter.
- Add confirmed, pending and funds-in-motion Unified Balance state.
- Persist resumable mint context with expiry and an operator recovery action.
- Add USDC/EURC and settlement-purpose fields to signed policy intent and proof.

### Sprint 3

- Build an obligation ledger and calculate residual settlements for invoices, payroll and suppliers.
- Register Gateway webhook subscriptions for funded pilot wallets.
- Connect Goldsky for independent event reconciliation.
- Add Pyth freshness/deviation guard to EURC/USDC quoting.

### External dependencies

- Wirex or another card/BaaS provider partnership and API/webhook specification;
- supported-region and licensing review;
- Circle production credentials and funded wallets;
- Turnkey or Circle Wallets server signer;
- pilot counterparties and measurable transaction volume.

