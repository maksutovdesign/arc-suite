# Arc Suite Hackathon Submission

## Track

**Agentic Economy**

## Short Pitch

Arc Suite is an operating layer for autonomous AI-agent commerce on Arc. It shows one complete USDC workflow: an AI agent requests a paid x402 API, receives a signed offer, passes policy and compliance checks, settles on Arc Testnet, receives a signed receipt, updates reputation and leaves a proof page with the transaction hash and policy chain.

## Links

- **GitHub:** [github.com/maksutovdesign/arc-suite](https://github.com/maksutovdesign/arc-suite)
- **Grant update:** [`docs/submission/grant-update.md`](docs/submission/grant-update.md)
- **Demo video:** [arc-suite-agentic-workflow-demo.mov](https://github.com/maksutovdesign/arc-suite/releases/download/v2026.06.28-real-arc-settlement/arc-suite-agentic-workflow-demo.mov)
- **Release package:** [v2026.06.30-agentic-proof-package](https://github.com/maksutovdesign/arc-suite/releases/tag/v2026.06.30-agentic-proof-package)
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
   `Agent intent -> x402 offer -> Treasury budget -> Shield screening -> Billing usage -> Arc settlement -> Reputation update`.
4. Inspect the signed offer, agent payment authorization and signed provider receipt.
5. Click **Latest proof** or the generated proof link to verify the generated run:
   - Arc Testnet transaction hash
   - x402 receipt JSON
   - provider signing key id, algorithm and payload hash
   - policy chain
   - agent job id
   - validation evidence
   - artifact signatures

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

## Why Arc Suite

Most demos stop at either a payment button, an API marketplace or a dashboard. Arc Suite connects the whole economic loop: who the agent is, what job it wants, whether it is allowed, how it pays, what transaction proves settlement and how that result changes future trust.
