# Arc Suite Grant Update

## Short Submission Text

Arc Suite is an operating layer for autonomous AI-agent commerce on Arc. The demo now focuses on one complete, reviewable workflow: an AI agent requests a paid x402 API, receives a signed offer, passes Treasury budget policy, Reputation access and Shield compliance checks, settles USDC on Arc Testnet through Circle Wallets, receives a signed provider receipt, updates reputation and leaves a proof page with the transaction hash, policy chain and validation artifacts.

The latest release includes a recorded demo, a real Arc Testnet USDC settlement, a reviewer submission page, Judge Mode, Agentic Workflow, Proof and Flow operator screens.

## Reviewer Links

- Live app: https://arcsuite-app.vercel.app
- Submission page: https://arcsuite-app.vercel.app/submission
- Judge Mode: https://arcsuite-app.vercel.app/judge
- Agentic Workflow: https://arcsuite-app.vercel.app/agentic-workflow
- Proof page: https://arcsuite-app.vercel.app/proof
- Latest production proof: https://arcsuite-app.vercel.app/proof?id=flow_agentic_01a50e12e6c4
- Flow operator console: https://arcsuite-app.vercel.app/flow
- Repository: https://github.com/maksutovdesign/arc-suite
- Release: https://github.com/maksutovdesign/arc-suite/releases/tag/v2026.06.30-marketplace-paid-workflow
- Demo video: https://github.com/maksutovdesign/arc-suite/releases/download/v2026.06.28-real-arc-settlement/arc-suite-agentic-workflow-demo.mov
- Arc Testnet proof: https://testnet.arcscan.app/tx/0x41210539368a78f6bbc08b088a95430dc0f64e9379ad9226173fc3ce565d733b

## Real Settlement Proof

- Amount: `0.003 USDC`
- Network: `Arc Testnet`
- API: `api_02` / `GPT-4o Proxy`
- Settlement ID: `set_a70296d1-87f9-4753-8935-7e330a2fc3d2`
- Transaction hash: `0x41210539368a78f6bbc08b088a95430dc0f64e9379ad9226173fc3ce565d733b`
- Path: `policy check -> Circle Wallets token lookup -> Arc Testnet USDC transfer -> Supabase audit -> proof link`

## What Changed In This Update

1. Added a reviewer-ready submission page with demo video, release, proof and demo flow links.
2. Added a one-click Agentic Workflow demo: agent intent, signed x402 offer, payment authorization, policy chain, Arc settlement and reputation update.
3. Added ERC-8004-compatible agent identity and ERC-8183-compatible job envelope records.
4. Added a Proof page that ties transaction hash, x402 receipt, policy gates and validation artifacts to one workflow ID.
5. Added a live-settlement backend path for Agentic Workflow behind `ARC_AGENTIC_LIVE_SETTLEMENT=true`, with safe fallback when Circle or Supabase is unavailable.
6. Added recent Arc settlement visibility on the Proof page so reviewers can see the latest Supabase-recorded settlement operations.

## Suggested Review Script

1. Open the submission page.
2. Watch the demo video.
3. Open Judge Mode.
4. Click `Run agentic workflow`.
5. Open the generated Proof page or the latest production proof.
6. Check the policy chain, receipt JSON, settlement ID and transaction hash.
7. Open the Arcscan transaction link.
8. Open Flow to see how the workflow maps to the operator console.

## Why This Fits The Agentic Economy Track

Arc Suite is not just a payment button. It shows the control plane an agent economy needs:

- Who is the agent?
- What paid API or service is it requesting?
- Is the payment allowed by budget, reputation and compliance policy?
- Did value actually move on Arc?
- Which signed receipt proves the provider was paid?
- How does the completed payment change future trust?

That loop is the product: identity, policy, settlement, receipt and reputation in one auditable agent-commerce workflow.

## Next Milestones

1. Enable live Agentic Workflow settlement in production once the reviewer wallet budget is topped up.
2. Add Circle webhook reconciliation for settlement status updates.
3. Replace simulated x402 signatures with provider-owned keys.
4. Add provider API cards that can be purchased directly from Marketplace.
5. Add a compact operator dashboard for the last live settlements, policy denials and reputation changes.
