# Kestrel Grant Update

## Short Submission Text

Kestrel is an independent agent money control plane built on Arc. The demo focuses on one complete, reviewable workflow: an AI agent requests a paid x402 API, receives a signed offer, passes Treasury budget policy, Reputation access and Shield compliance checks, follows an Arc Testnet settlement path through Circle Wallets or App Kit, receives a signed provider receipt, updates reputation and leaves a proof page with the settlement reference, policy chain and validation artifacts.

The latest release includes a recorded demo, Arc Testnet settlement evidence when configured, a reviewer submission page, Judge Mode, Agentic Workflow, Proof and Flow operator screens.

## Reviewer Links

- Live app: https://arcsuite-app.vercel.app
- Submission page: https://arcsuite-app.vercel.app/submission
- Judge Mode: https://arcsuite-app.vercel.app/judge
- Agentic Workflow: https://arcsuite-app.vercel.app/agentic-workflow
- Proof page: https://arcsuite-app.vercel.app/proof
- Proof archive: https://arcsuite-app.vercel.app/proofs
- Latest production proof API: https://arcsuite-app.vercel.app/api/agentic/latest-proof
- Flow operator console: https://arcsuite-app.vercel.app/flow
- Repository: https://github.com/maksutovdesign/arc-suite
- Interop / Risk Router: https://arcsuite-app.vercel.app/interop
- Release: https://github.com/maksutovdesign/arc-suite/releases/tag/v2026.07.22-kestrel-app-kit
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
4. Added a Proof page that ties settlement reference, x402 receipt, policy gates and validation artifacts to one workflow ID.
5. Added a live-settlement backend path for Agentic Workflow behind `ARC_AGENTIC_LIVE_SETTLEMENT=true`, with safe fallback when Circle or Supabase is unavailable.
6. Added recent Arc settlement visibility on the Proof page so reviewers can see the latest Supabase-recorded settlement operations.
7. Added a Proof Archive and `/api/agentic/proofs`, making recent Marketplace purchase receipts queryable and visible.
8. Added provider signing metadata to x402-style receipts: provider key id, signing algorithm and verification payload hash.
9. Added Kestrel Provider Trust Center for API providers to reconcile signed receipts, provider keys, paid jobs and proof links.
10. Added Arc Interop & Risk Router with Chainlink-on-Arc CCIP route evidence, `oracleRiskHash`, artifact gates and a reviewer-readable cross-chain route envelope.
11. Added Arc Network Resilience framing so load testing, congestion, retry and deferred settlement are handled as explicit execution states instead of product failures.
12. Fixed the reviewer-facing mobile layout: compact Treasury metrics, non-wrapping USDC values, safer chart legends and mobile action rows that stay inside cards.

## Suggested Review Script

1. Open the submission page.
2. Watch the demo video.
3. Open Judge Mode.
4. Click `Run agentic workflow`.
5. Open the generated Proof page, latest proof API or Proof Archive.
6. Check the policy chain, receipt JSON, settlement ID and settlement reference.
7. Open the Arcscan transaction link.
8. Open Flow to see how the workflow maps to the operator console.

## Why This Fits The Agentic Economy Track

Kestrel is not just a payment button. It shows the control plane an agent economy needs:

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
3. Replace demo provider signing metadata with provider-owned keys.
4. Add provider API cards that can be purchased directly from Marketplace.
5. Add live CCIP route status, Chainlink feed freshness/deviation and Arc network status adapters.
