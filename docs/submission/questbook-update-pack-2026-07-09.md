# Questbook Update Pack - 2026-07-09

Use this copy to update the formal Questbook application. It reflects the current product state after the Arc Interop & Risk Router release and avoids overclaiming live Arc mainnet settlement.

## Project abstract

Arc Suite is an operating layer for autonomous agent commerce on Arc and Circle. It gives AI agents the missing economic control plane: USDC budgets, policy checks, reputation, x402-style paid API access, provider receipts, proof records and operator monitoring.

The product is live as a production web MVP on Vercel with Supabase-backed APIs, Sentry monitoring, production health checks and a reviewer-ready demo flow. The current release adds Arc Interop & Risk Router: a Chainlink/CCIP-ready route layer that connects policy, oracle risk, cross-chain route evidence, provider receipt state and validation artifacts in one proof envelope.

The latest Wallet OS update also reflects Arc's application-layer direction shown by the Arc x Pulsar update: balances, payments, FX, CCTP and gas abstraction hidden behind a simple money movement experience. Arc Suite applies that same idea to autonomous agents through an Arc Account Layer: one operational account with USDC spending, EURC invoice rails, FX-ready routes, card-like spend controls, custody status and policy checks. The July update also adds Transaction Memo evidence, Unified Balance Kit readiness, and Swap Kit route states so proof records can map payments back to invoices, agents, customers and batches.

## Current status and traction

- Production web MVP deployed at https://arcsuite-app.vercel.app
- Grant reviewer console: https://arcsuite-app.vercel.app/grant
- Agentic workflow demo: https://arcsuite-app.vercel.app/agentic-workflow
- Proof page: https://arcsuite-app.vercel.app/proof
- Arc Interop & Risk Router: https://arcsuite-app.vercel.app/interop
- Arc Account Layer / Wallet OS: https://arcsuite-app.vercel.app/wallets
- Provider trust center: https://arcsuite-app.vercel.app/provider
- Supabase-backed API and proof records
- Sentry runtime monitoring and production health checks
- Reviewer-facing mobile layout hotfix: compact Treasury metrics, stable chart legends and no clipped action buttons on mobile.
- GitHub release: https://github.com/maksutovdesign/arc-suite/releases/tag/v2026.07.12-mobile-layout-hotfix
- Demo video: https://drive.google.com/file/d/1TpkfepfGCEXDfh-YWIfGLRGuohHAJmjP/view?usp=sharing

## Fresh Arc ecosystem alignment

Arc Suite has been updated around recent ecosystem signals:

- **Arc x Chainlink:** Arc now has a public path for market data, proof-of-reserve style signals and CCIP interoperability on testnet. Arc Suite maps this into Arc Interop: route evidence, Chainlink CCIP router metadata, oracle risk hashes, route status history and proof-gated settlement states.
- **Arc x Pulsar:** Arc is highlighting products where Arc is the settlement layer behind a real app experience, not only developer infrastructure. Arc Suite applies that app-layer pattern to agents through Wallet OS: one operational account surface for USDC spending, EURC invoice rails, FX-ready routes, card-like controls, CCTP status and gas abstraction.
- **Transaction memos:** Arc memos make transaction hashes reconcilable by adding invoice, payout, customer, account and workflow context. Arc Suite now shows memo-style business context in Proof records.
- **Stablecoin Kits:** Gateway, Unified Balance Kit and Swap Kit updates map directly to Arc Suite's Wallet OS and Flow roadmap: unified balances, forwarded spend, cross-chain swap routing, status tracking and latest transaction hash capture.
- **Arc x Tradable / Arc x Uniswap:** Private credit, deal lifecycle, compliance controls and liquidity/swap infrastructure strengthen Arc Suite's next roadmap layer: escrow, provider settlement, RWA-style workflows and liquidity-aware stablecoin routes.
- **Arc Testnet load testing:** Arc has surfaced network resilience as a real product requirement. Arc Suite now models congestion-aware states such as `network_congested`, `retry_scheduled`, `deferred_settlement` and `settlement_recorded` so temporary network conditions do not get confused with agent failure or compliance failure.

Reference links:

- Arc x Chainlink: https://community.arc.io/home/blogs/arc-x-chainlink-data-and-cross-chain-infrastructure-for-arc-builders-2026-06-30
- Arc x Pulsar: https://community.arc.io/home/blogs/arc-x-pulsar-consumer-stablecoin-money-movement-on-arc-2026-07-09
- Transaction memos: https://docs.arc.io/arc/concepts/transaction-memos
- Arc status page: https://status.arc.io/

## Circle and Arc usage

Implemented or demo-ready:

- USDC-denominated budgets, payment amounts, receipts and proof records.
- Circle Wallets execution path now includes a read-only readiness layer for source wallet, Arc Testnet USDC token lookup, readable balance and transfer guardrails before policy-gated settlement.
- x402-style signed offer and receipt architecture for machine-to-machine API purchases.
- Arc Testnet settlement-ready path with proof recording when the Circle/Arc path is configured.
- Chainlink-on-Arc route evidence model using Arc Testnet CCIP Router `0xdE4E7FED43FAC37EB21aA0643d9852f75332eab8` and chain selector `3034092155422581607`.
- Arc Account Layer: USDC spending base, EURC invoice rail, FX-ready quote route, card-like spend controls, hidden CCTP status and gas abstraction state.
- Transaction Memo-style proof context: invoice reference, agent/customer reference, batch reference and emitted-on-success state.
- Unified Balance Kit and Swap Kit readiness states: Gateway deposit, balance, forwarded spend, routed swap, latest transaction hash capture and failure trace handling.

Planned next:

- Live Circle Wallet creation and USDC testnet transfers from the app; read-only Circle wallet balance readiness is now surfaced in Wallet OS.
- CCTP / CCIP route status adapters.
- Circle Gateway and Paymaster integration for production-grade agent funding and sponsored execution.
- Arc contracts for reputation, escrow and settlement records.

## Updated roadmap

### Milestone 1 - Real Circle Wallet execution

Create agent wallets through Circle Developer Controlled Wallets, read live balances, execute USDC testnet transfers, record tx hashes and statuses in Supabase, and surface the evidence in Treasury, Proof and Reputation.

### Milestone 2 - Arc Interop v2

Expand Arc Interop into a full route module: CCIP route run UI, Chainlink feed freshness/deviation, RPC health, explorer links and route status history.

### Milestone 3 - Arc Account Layer / Wallet OS

Connect the Wallet OS surface to live Circle Wallet balances and future EURC/Gateway/Unified Balance Kit/Swap Kit/CCTP/Paymaster adapters so one agent account can display spending budget, invoice currency, payment activity, FX route, gas state, transaction memo context and policy controls without exposing custody or settlement complexity to the operator.

### Milestone 4 - Provider onboarding

Turn the provider page into a working flow: provider creates an API listing, sets a price, publishes an x402 offer, agent buys access and the provider receipt appears in Proof.

### Milestone 5 - Arc Network Resilience

Add resilience states for Arc Testnet conditions: `network_congested`, `retry_scheduled`, `deferred_settlement`, `settlement_recorded`. This keeps agent reputation and access-control decisions separate from temporary testnet congestion or load testing.

## Careful language for reviewers

Preferred wording:

- "settlement-ready Arc Testnet path"
- "records Arc settlement proof when configured"
- "Circle Wallets execution path prepared for live wallet creation and transfers"
- "Chainlink/CCIP-ready route evidence"
- "demo-ready x402 payment architecture"

Avoid:

- "live on Arc mainnet"
- "fully settled on Arc" unless a real transaction hash is shown
- "production Circle settlement" unless the production credentials and transfer path are active

## One-line narrative

Arc Suite turns autonomous agents into accountable economic actors: an agent can request an API, pass policy, pay in USDC, receive a provider receipt, produce a proof record and update reputation without relying on a human operator for every transaction.
