# Kestrel product roadmap — 22 July 2026

Kestrel is an independent agent money control plane built on Arc. Arc is the infrastructure and supported network, not the product identity.

## 1. Urgent brand correction

The previous Arc Suite identity conflicted with the Arc Brand Guidelines published on 16 July 2026. The product now uses the independent Kestrel name and mark. The official Arc logo is no longer the primary product mark; public surfaces use “Built on Arc” as the infrastructure signature.

Source: [Arc Brand Guidelines](https://community.arc.io/public/blogs/arc-brand-guidelines-and-partner-toolkit-is-live-2026-07-16).

## 2. App Kit as the product core

The primary product flow is Money Movement:

- one available USDC balance across supported networks;
- Send, Bridge, Swap and Unified Balance behind one interface;
- routing and settlement on Arc;
- preflight route and fee estimation;
- explicit wallet confirmation;
- transaction hashes, explorer links, trace ID and recovery state retained as proof.

The implementation uses `@circle-fin/app-kit` and `@circle-fin/adapter-viem-v2` with an EIP-6963 user-controlled browser wallet. Source: [App Kit docs](https://docs.arc.io/app-kit).

## 3. Real monetization

The first pricing model is a disclosed 75 bps execution fee for eligible Bridge, Swap and Unified Balance Spend operations. The interface shows the split before signature:

- 90% to the Kestrel fee recipient;
- 10% to Arc;
- provider, Gateway, gas and forwarding fees shown separately when returned by App Kit.

Sources: [Unified Balance fees](https://docs.arc.io/app-kit/concepts/unified-balance-fees), [Swap fees](https://docs.arc.io/app-kit/concepts/swap-fees).

## 4. Stronger grant package

Kestrel addresses agentic economy, treasury management and stablecoin FX. The grant package must be evaluated by production evidence rather than breadth of UI:

- three design partners;
- 1,000 testnet operations;
- 10,000 USDC cumulative testnet volume;
- more than 99% proof completeness;
- more than 95% terminal execution success;
- p95 quote latency below three seconds;
- resumable mint recovery below ten minutes;
- fee revenue and active-wallet reporting.

Source: [Circle Developer Grants](https://community.arc.io/en/public/blogs/circle-developer-grants-program-relaunches-2026-05-14).

## 5. Ordered implementation plan

1. Independent Kestrel identity with “Built on Arc”.
2. Live App Kit Money Movement flow.
3. Developer fees, complete fee breakdown and transaction proof.
4. Turnkey policy signing for backend and agent wallets.
5. One provider-neutral compliance adapter with one production provider.
6. Goldsky event ingestion and reconciliation.
7. Live Pyth/Chainlink freshness and deviation checks.
8. LI.FI fallback routing and Stellar CCTP corridors.
9. Pilot onboarding, measured transaction volume and revenue validation.

The repository currently completes items 1–3 at integration-code level. Items 4–9 require provider credentials, funded testnet wallets or external pilot participation and remain measurable production milestones.
