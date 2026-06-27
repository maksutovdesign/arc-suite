# Arc Suite Hackathon Submission

## Track

**Agentic Economy**

## Short Pitch

Arc Suite is an operating layer for autonomous AI-agent commerce on Arc. It shows one complete USDC workflow: an AI agent requests a paid x402 API, receives a signed offer, passes policy and compliance checks, settles on Arc Testnet, receives a signed receipt, updates reputation and leaves a proof page with the transaction hash and policy chain.

## Links

- **GitHub:** [github.com/maksutovdesign/arc-suite](https://github.com/maksutovdesign/arc-suite)
- **Main landing:** [arcsuite-app.vercel.app](https://arcsuite-app.vercel.app)
- **Agentic workflow demo:** [arcsuite-app.vercel.app/agentic-workflow](https://arcsuite-app.vercel.app/agentic-workflow)
- **Proof page:** [arcsuite-app.vercel.app/proof](https://arcsuite-app.vercel.app/proof)
- **Flow operator console:** [arcsuite-app.vercel.app/flow](https://arcsuite-app.vercel.app/flow)

## Demo Flow

1. Open the **Agentic Workflow Demo**.
2. Click **Run agentic workflow**.
3. Watch the pipeline move through:
   `Agent intent -> x402 offer -> Treasury budget -> Shield screening -> Billing usage -> Arc settlement -> Reputation update`.
4. Inspect the signed offer, agent payment authorization and signed provider receipt.
5. Open the **Proof Page** to verify:
   - Arc Testnet transaction hash
   - x402 receipt JSON
   - policy chain
   - agent job id
   - validation evidence
   - artifact signatures

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
- Signed x402 offer, payment authorization and provider receipt simulation.
- Proof page for judges, providers and auditors.
- Supabase-ready schema for agent identities, jobs, artifacts and validations.

## Why Arc Suite

Most demos stop at either a payment button, an API marketplace or a dashboard. Arc Suite connects the whole economic loop: who the agent is, what job it wants, whether it is allowed, how it pays, what transaction proves settlement and how that result changes future trust.
