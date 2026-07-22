# Questbook Update Pack — 2026-07-19 Final Release

## Recommended project description

Kestrel is an independent operating layer for autonomous commerce built on Arc and Circle. It gives AI agents the economic control plane they need to buy services with USDC safely: identity, budgets, x402-style offers, App Kit routing, policy and compliance checks, settlement evidence, signed provider receipts, reputation updates and reviewer-verifiable proof records.

The product is live as a production web MVP at <https://arcsuite-app.vercel.app>. Landing, Treasury, Reputation and Marketplace now run through one canonical domain with shared navigation and deep links. The reviewer flow demonstrates an agent requesting a paid API, receiving an offer, passing policy checks, following a settlement-ready Arc Testnet path, receiving a provider receipt and producing an auditable proof trail.

The final grant release also includes Supabase-backed APIs, Sentry integration, production health monitoring, protected API guards, Content Security Policy across all applications, automated contract compilation, local API checks and scheduled production verification. The release was verified with zero known npm audit vulnerabilities, four successful application builds, 19 production smoke checks and 31 production monitor checks.

## Current product status

- Production web MVP: <https://arcsuite-app.vercel.app>
- Grant reviewer package: <https://arcsuite-app.vercel.app/grant>
- End-to-end agentic workflow: <https://arcsuite-app.vercel.app/agentic-workflow>
- Live proof record: <https://arcsuite-app.vercel.app/proof>
- Submission package: <https://arcsuite-app.vercel.app/submission>
- Treasury: <https://arcsuite-app.vercel.app/treasury>
- Reputation: <https://arcsuite-app.vercel.app/reputation>
- Marketplace: <https://arcsuite-app.vercel.app/marketplace>
- Source code: <https://github.com/maksutovdesign/arc-suite>
- Current release: <https://github.com/maksutovdesign/arc-suite/releases/tag/v2026.07.22-kestrel-app-kit>
- Demo video: <https://drive.google.com/file/d/1TpkfepfGCEXDfh-YWIfGLRGuohHAJmjP/view?usp=sharing>

## What the grant release delivers

- USDC-denominated agent budgets, payments, receipts and proof records.
- x402-style paid API offer and receipt architecture for machine-to-machine purchases.
- Policy, compliance and access checks before an agent can spend.
- Circle Developer Controlled Wallet execution-readiness checks for source wallet, balance, token lookup and transfer guardrails.
- Settlement-ready Arc Testnet workflow with transaction evidence recorded when configured.
- Provider receipts, proof archive, reputation events and operator monitoring.
- Treasury controls, Reputation scoring and Marketplace discovery in one multi-zone production experience.
- Wallet OS, Billing, Escrow, Shield, Gas, Execution Control and Interop reviewer modules.
- Security headers, atomic rate-limit migration, dependency auditing and scheduled production monitoring.

## Evidence from the final verification

- Clean reproducible dependency install.
- 0 npm audit vulnerabilities.
- 4/4 application lint checks passed.
- 4/4 application production builds passed.
- 4 unit regression tests passed.
- ArcEscrow contract compiled successfully with 14 ABI entries.
- 6/6 local API smoke checks passed.
- 19/19 production smoke checks passed.
- 31/31 production monitor checks passed with no warnings or failures.

## Next milestones

1. Activate live Circle Developer Controlled Wallet creation and USDC testnet transfers from the application.
2. Expand Arc settlement evidence with explorer-linked transaction status and route adapters.
3. Connect Gateway, CCTP, Paymaster, Unified Balance and swap-routing capabilities to Wallet OS.
4. Complete provider self-service onboarding and paid API listing publication.
5. Move reputation and escrow records from the current web MVP path to production-grade Arc contracts.

## Accuracy note for reviewers

Kestrel is a production web MVP with an Arc Testnet path. It records settlement proof when the Circle/App Kit execution path is configured. We do not claim live Arc mainnet settlement or fully autonomous production money movement without the corresponding transaction evidence.

## One-line pitch

Kestrel turns autonomous agents into accountable economic actors: an agent can request an API, pass policy, pay in USDC, receive a signed receipt, update reputation and leave a verifiable proof trail.
