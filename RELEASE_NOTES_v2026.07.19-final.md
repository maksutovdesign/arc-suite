# v2026.07.19-final — Arc Suite Final Grant Release

This release freezes the reviewer-ready Arc Suite build for the Circle Grants / Questbook submission. It combines the complete agentic USDC workflow, the unified four-application production surface, hardened security defaults, reproducible verification and reviewer-facing proof artifacts.

## Product highlights

- One production domain for Landing, Treasury, Reputation and Marketplace: <https://arcsuite-app.vercel.app>.
- End-to-end agent workflow covering identity, x402-style offer, policy and compliance checks, Circle Wallet execution readiness, Arc settlement evidence, signed provider receipt, reputation update and proof archive.
- Reviewer surfaces for the live workflow, proof trail, grant package, submission package, operations health and judge mode.
- Operational modules for Treasury, Reputation, Marketplace, Billing, Escrow, Shield, Gas, Wallet OS, Execution Control, Interop, Radar, Private and Blueprints.
- Multi-zone navigation and deep links now remain on the canonical production domain.
- Consistent console and content layouts across the product suite.

## Security and reliability

- Baseline Content Security Policy on all four Next.js applications, including `frame-ancestors 'none'`.
- HSTS, clickjacking, MIME-sniffing, permissions and referrer protections verified in production.
- Atomic Supabase rate-limit migration included, with a backwards-compatible path for deployments where the migration has not yet been applied.
- Dependency overrides remove known moderate-or-higher audit findings.
- Production monitoring validates application routes, protected API guards, CORS, proof/provider APIs and security headers.

## Release verification

- Clean `npm ci --install-strategy=hoisted` installation.
- `npm audit --audit-level=moderate`: 0 vulnerabilities.
- ESLint: Landing, Treasury, Reputation and Marketplace passed.
- Unit regression tests: 4 passed.
- ArcEscrow Solidity contract compiled successfully with 14 ABI entries.
- Production builds: all four Next.js workspaces passed.
- Local API smoke checks: 6 passed.
- Production smoke checks: 19 passed.
- Production monitor: 31 passed, 0 failures, 0 warnings.
- GitHub Actions CI and scheduled Production Monitor passed for the release commit.

## Reviewer links

- Production: <https://arcsuite-app.vercel.app>
- Grant review package: <https://arcsuite-app.vercel.app/grant>
- Agentic workflow: <https://arcsuite-app.vercel.app/agentic-workflow>
- Proof: <https://arcsuite-app.vercel.app/proof>
- Submission: <https://arcsuite-app.vercel.app/submission>
- Operations health: <https://arcsuite-app.vercel.app/ops>
- Source: <https://github.com/maksutovdesign/arc-suite>

## Scope note

Arc Suite is a production web MVP with a settlement-ready Arc Testnet path. It records settlement proof when the Circle/Arc execution path is configured. The release does not claim live Arc mainnet settlement.
