# Kestrel Application Resubmission Copy

Use this copy when resubmitting the formal Questbook application. It keeps the project strong without overstating Arc mainnet status.

## One-Line Description

Kestrel is AI agent infrastructure for programmable USDC commerce: agent identity, App Kit money movement, x402 API offers, policy checks, Arc settlement paths, receipts, reputation updates, and reviewer-ready proof. Built on Arc.

## Project Abstract

AI agents are starting to act as economic participants, but there is no unified infrastructure for them to safely manage budgets, prove trustworthiness, buy services, and leave auditable payment evidence. Existing agent frameworks focus on intelligence and orchestration, while the financial layer remains fragmented: wallets, spending controls, compliance checks, API payments, receipts, and reputation signals are usually separate.

Kestrel solves this with a connected product layer for autonomous agent commerce. Treasury manages USDC budgets and policies. Reputation tracks trust and validation signals. Marketplace lets agents discover and request paid API access. Money Movement, Flow, Billing, Shield, Provider, Wallets, and Proof turn that into a full workflow: agent identity, App Kit route, x402-style offer, policy check, Chainlink-on-Arc risk signal, settlement, signed receipt, and proof archive.

The project is already deployed as a production web MVP on Vercel with Supabase-backed APIs, Sentry monitoring, GitHub Actions, production health checks, and a reviewer package. Grant funding will move the system from production demo infrastructure into deeper Arc deployment: real Circle Wallets expansion, Arc contracts, CCTP/CCIP support, on-chain reputation, Chainlink data/risk signals, and external API provider onboarding.

## Solution

Kestrel provides one end-to-end workflow instead of disconnected dashboards:

1. An agent selects a paid API.
2. Marketplace creates a signed x402-style offer.
3. Treasury checks budget and spending policy.
4. Shield applies compliance and risk screening.
5. Flow prepares the settlement-ready Arc/Circle path and records settlement evidence when configured.
6. Provider creates a signed receipt.
7. Reputation updates the agent trust signal.
8. Proof stores the policy chain, receipt, workflow id, settlement reference, and validation artifacts.

This gives reviewers and future providers a concrete artifact: one agent request, one policy chain, one receipt, and one proof trail.

## Why Now

The missing pieces are now coming together: USDC as programmable money, Circle App Kit and Wallets, Arc as a stablecoin-focused settlement layer, and x402-style HTTP payment flows for machine-to-machine API access. Kestrel focuses on the application layer that makes those primitives usable by autonomous agents and API providers.

## Current Status

Kestrel is live as a production web MVP:

- Deployed product surfaces on Vercel.
- Supabase-backed API layer for agents, access decisions, analytics, leads, proofs, provider receipts, operations, and workspace security.
- Sentry runtime monitoring and production health checks.
- GitHub Actions CI, scheduled production monitor, and execution worker.
- Reviewer pages: `/grant`, `/submission`, `/judge`, `/agentic-workflow`, `/proof`, `/proofs`, and `/provider`.
- Demo workflow for policy-gated x402-style API purchase and proof generation.

The project is not claiming full Arc mainnet production deployment yet. It is grant-ready and settlement-ready, with Arc Testnet references and proof evidence when Circle/Arc configuration is available.

## Circle Product Usage

Currently integrated or represented in the working architecture:

- USDC for budgets, prices, receipts, proof records, and payment amounts.
- Circle Wallets path for developer-controlled agent wallet creation and settlement evidence.
- Circle Compliance-style screening through Arc Shield policy flows.
- x402/Gateway architecture for machine-to-machine paid API access.
- Chainlink-on-Arc evidence model for market data, Proof of Reserve and CCIP route checks.

Planned with grant support:

- CCTP and Chainlink CCIP for cross-chain USDC, treasury and collateral workflows.
- Paymaster/Gas sponsorship controls.
- Contracts for escrow, reputation, and settlement logic.
- Broader Wallets integration for real agent wallet lifecycle and recovery.

## Roadmap

### Milestone 1: Arc Deployment + Circle Wallets (Weeks 1-4)

- Deploy core Treasury, Reputation, Marketplace, Flow, Proof, and Provider infrastructure to Arc-ready production paths.
- Expand Circle Developer Controlled Wallet integration for real agent wallet creation, balance reads, and transaction history.
- Replace remaining demo fallback data with live wallet and settlement records where credentials and network access are available.

### Milestone 2: On-Chain Reputation + x402 Payments + Oracle Risk (Weeks 5-9)

- Deploy reputation smart contract components on Arc.
- Store and update agent trust scores with auditable on-chain references.
- Complete x402-style payment flow for paid API calls with provider receipts and access gating.
- Attach Chainlink market data, Proof of Reserve and CCIP route evidence to Shield and Flow policy decisions.
- Connect low-score agent rejection to Marketplace access control.

### Milestone 3: CCTP / CCIP + Public Beta (Weeks 10-14)

- Add CCTP support for Arc to Ethereum/Base USDC movement.
- Add Chainlink CCIP-aware workflow proofs for cross-chain treasury and collateral routes.
- Add developer documentation, API reference, and onboarding guides.
- Onboard initial external API providers.
- Launch public beta with a clear provider and agent workflow.

## Grant Use

The grant will fund the transition from a production web MVP to deeper Arc deployment. Funds will support smart contract development, Circle Wallets integration, CCTP/CCIP work, Chainlink data/risk evidence, infrastructure, security review, monitoring, testing, and developer/provider onboarding.
