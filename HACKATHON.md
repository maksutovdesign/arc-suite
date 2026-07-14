# Arc Suite Hackathon Roadmap

## Track

**Agentic Economy**

## Short Pitch

Arc Suite is working infrastructure for autonomous AI-agent commerce on Arc. It lets teams deploy agents with wallets, programmable USDC budgets, policy checks, reputation scores, paid API access and proof records.

The core demo shows one agent deciding whether it can buy an API: it receives an x402-style offer, checks budget and risk policy, prepares the Circle/Arc settlement path, records receipt evidence, updates reputation and leaves a reviewer-ready proof trail.

## Judge Narrative

**Problem:** AI agents are starting to act as economic participants, but most teams do not have a safe operating layer for agent wallets, spend limits, provider trust, compliance checks and payment proofs.

**Solution:** Arc Suite gives agents a programmable money control plane:

- **Treasury:** USDC budgets, per-agent spend rules and alerts.
- **Reputation:** trust scores and validation history for agents/providers.
- **Marketplace / Provider:** paid API access through x402-style offers and receipts.
- **Shield:** compliance and risk checks before settlement.
- **Flow:** policy-to-payment execution path.
- **Proof:** transaction, receipt, memo and policy evidence in one place.
- **Interop:** Chainlink/CCIP-ready route and oracle risk evidence.

**Why Arc/Circle:** Arc is positioned for stablecoin-native settlement, predictable fees, transaction memos, gas abstraction and app-layer money movement. Circle provides the primitives for USDC, wallets, paymaster/gateway-style payment flows and contracts.

## Links

- **GitHub:** [github.com/maksutovdesign/arc-suite](https://github.com/maksutovdesign/arc-suite)
- **Grant update:** [`docs/submission/grant-update.md`](docs/submission/grant-update.md)
- **Demo video:** [arc-suite-agentic-workflow-demo.mov](https://github.com/maksutovdesign/arc-suite/releases/download/v2026.06.28-real-arc-settlement/arc-suite-agentic-workflow-demo.mov)
- **Release package:** [v2026.07.14-gateway-memos](https://github.com/maksutovdesign/arc-suite/releases/tag/v2026.07.14-gateway-memos)
- **Main landing:** [arcsuite-app.vercel.app](https://arcsuite-app.vercel.app)
- **Submission page:** [arcsuite-app.vercel.app/submission](https://arcsuite-app.vercel.app/submission)
- **Judge mode:** [arcsuite-app.vercel.app/judge](https://arcsuite-app.vercel.app/judge)
- **Agentic workflow demo:** [arcsuite-app.vercel.app/agentic-workflow](https://arcsuite-app.vercel.app/agentic-workflow)
- **Proof page:** [arcsuite-app.vercel.app/proof](https://arcsuite-app.vercel.app/proof)
- **Proof archive:** [arcsuite-app.vercel.app/proofs](https://arcsuite-app.vercel.app/proofs)
- **Provider trust center:** [arcsuite-app.vercel.app/provider](https://arcsuite-app.vercel.app/provider)
- **Latest proof API:** [arcsuite-app.vercel.app/api/agentic/latest-proof](https://arcsuite-app.vercel.app/api/agentic/latest-proof)
- **Flow operator console:** [arcsuite-app.vercel.app/flow](https://arcsuite-app.vercel.app/flow)
- **Latest production proof:** [arcsuite-app.vercel.app/proof?id=flow_agentic_01a50e12e6c4](https://arcsuite-app.vercel.app/proof?id=flow_agentic_01a50e12e6c4)
- **Live Arc Testnet proof:** [0x41210539368a78f6bbc08b088a95430dc0f64e9379ad9226173fc3ce565d733b](https://testnet.arcscan.app/tx/0x41210539368a78f6bbc08b088a95430dc0f64e9379ad9226173fc3ce565d733b)

## Demo Flow

1. Open **Judge Mode**.
2. Click **Run agentic workflow**.
3. Watch the pipeline move through:
   `Agent intent -> x402 offer -> Treasury budget -> Shield screening -> Billing usage -> settlement-ready Arc path -> Reputation update`.
4. Inspect the signed offer, agent payment authorization and signed provider receipt.
5. Click **Latest proof** or the generated proof link to verify the generated run:
   - Arc Testnet transaction hash when configured
   - x402 receipt JSON
   - provider signing key id, algorithm and payload hash
   - policy chain
   - agent job id
   - validation evidence
   - artifact signatures

## Three-Minute Video Script

0:00-0:20 - Open `/grant` or `/judge`, state the pitch: Arc Suite is infrastructure for AI agents that need to spend USDC safely.

0:20-0:55 - Run `/agentic-workflow`: show agent intent, x402 offer, budget check, Shield risk check and settlement-ready path.

0:55-1:25 - Open `/proof`: show transaction reference, receipt JSON, transaction memo context, policy chain and validation artifacts.

1:25-1:55 - Open `/provider`: show provider-side receipt, signing key and proof link.

1:55-2:25 - Open `/treasury` or `/flow`: show budgets, alerts and operator controls.

2:25-2:45 - Open `/interop`: show Chainlink/CCIP route evidence, oracle risk hash and network resilience state.

2:45-3:00 - Close with roadmap: real Circle wallet execution, stronger x402 provider onboarding and live Arc settlement proofs.

## Real Settlement Proof

On June 30, 2026 the production settlement smoke confirmed a real API-specific Arc Testnet USDC transfer through the Circle Wallets path:

- **Amount:** `0.003 USDC`
- **API:** `api_02` / `GPT-4o Proxy`
- **Settlement ID:** `set_a70296d1-87f9-4753-8935-7e330a2fc3d2`
- **Transaction hash:** `0x41210539368a78f6bbc08b088a95430dc0f64e9379ad9226173fc3ce565d733b`
- **Explorer:** [testnet.arcscan.app/tx/0x412105...5d733b](https://testnet.arcscan.app/tx/0x41210539368a78f6bbc08b088a95430dc0f64e9379ad9226173fc3ce565d733b)
- **Recorded demo:** [arc-suite-agentic-workflow-demo.mov](https://github.com/maksutovdesign/arc-suite/releases/download/v2026.06.28-real-arc-settlement/arc-suite-agentic-workflow-demo.mov)

## What It Proves

- AI agents can buy services with USDC while staying inside operator policy.
- x402 can be represented as signed offers and receipts, not just a pricing label.
- Arc settlement can be linked to the same workflow id, agent job id and proof artifact.
- Circle wallet/compliance primitives can sit behind an operator-grade product surface.
- Reputation becomes a live access signal after payment, not a static profile.

## Agentic Economy Features

- Autonomous x402 API purchase flow.
- ERC-8004-compatible agent identity surface.
- ERC-8183-compatible job envelope with input, policy, output, receipt and validation hashes.
- Treasury budget and prepaid balance controls.
- Reputation-gated access decisions.
- Circle-powered compliance screening through Arc Shield.
- Arc Testnet USDC settlement proof.
- Signed x402 offer, payment authorization and provider receipt simulation with provider signing metadata.
- Proof page and proof archive for judges, providers and auditors.
- Provider Trust Center for API providers to reconcile signed receipts, provider keys, paid jobs and proof links.
- Provider demo-run action that creates a signed receipt, records a proof and opens the provider-side proof URL.
- Supabase-ready schema for agent identities, jobs, artifacts and validations.

## Hackathon Roadmap

### Checkpoint 1 - Coherent agentic demo

Goal: make the project instantly understandable to judges.

Deliverables:

- One clear reviewer entry point: `/grant` and `/judge`.
- One-click agent workflow: agent intent -> x402 offer -> budget policy -> risk check -> proof.
- Proof page with receipt, policy chain, transaction memo context and validation artifacts.
- Provider page that explains how an API seller reconciles paid jobs.
- README and `HACKATHON.md` aligned around the Agentic Economy track.
- No broken mobile layout, clipped metrics or empty proof pages on the reviewer path.

Success criteria:

- A judge can understand the product in under three minutes.
- The demo shows autonomous agent decisioning, not just dashboards.
- Every claim points to a visible screen, API response or proof artifact.

### Checkpoint 2 - Circle/Arc execution depth

Goal: strengthen the technical core behind the demo.

Deliverables:

- Circle Developer Controlled Wallet readiness: source wallet, token lookup, balance state and transfer guardrails.
- Real or gated Arc Testnet USDC settlement record when credentials/faucet path are stable.
- Supabase write path for transaction hash, status, receipt and policy result.
- Treasury, Proof and Reputation all read from the same workflow/proof record.
- Network resilience states: `network_congested`, `retry_scheduled`, `deferred_settlement`, `settlement_recorded`.
- Interop evidence: CCIP route card, Chainlink router/selector metadata, oracle risk hash and RPC health.

Success criteria:

- A workflow has one durable job id from intent through proof.
- Settlement, receipt and validation are separate states, so missing artifacts do not look like success.
- The product remains honest: "settlement-ready" unless a real tx hash is shown.

### Final Submission - Polished product package

Goal: present Arc Suite as a focused, working product.

Deliverables:

- 3-minute demo video.
- GitHub repo with clean README, latest release and hackathon roadmap.
- Production deployment at `https://arcsuite-app.vercel.app`.
- `/grant` page with demo, release, known limits, Circle products used and roadmap.
- Production monitor green.
- Short X/community post that explains the agentic workflow.

Success criteria:

- The judge sees a real use case: AI agent buys an API with programmable USDC controls.
- Circle/Arc usage is explicit: USDC, Wallets, payment/settlement path, contracts/proof model, Paymaster/Gateway/CCTP roadmap.
- The scope is tight enough to finish well.

## Must-Have Scope

- Agent identity and job envelope.
- Wallet/budget policy.
- Provider x402-style offer and receipt.
- Risk/compliance check before payment.
- Settlement-ready Arc path with tx hash when configured.
- Proof page with memo/reconciliation data.
- Reputation update after successful workflow.
- Mobile-safe reviewer path.

## De-Scope For Hackathon

- Full mainnet launch.
- Full provider marketplace economics.
- Heavy privacy implementation.
- Complex multi-chain production routing.
- Large admin CRM.

These remain roadmap items, not blockers for the Agentic Economy submission.

## Why Arc Suite

Most demos stop at either a payment button, an API marketplace or a dashboard. Arc Suite connects the whole economic loop: who the agent is, what job it wants, whether it is allowed, how it pays, what transaction proves settlement and how that result changes future trust.
