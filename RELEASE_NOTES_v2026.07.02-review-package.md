# v2026.07.02 Review Package

This release adds a focused grant-review package for Arc Suite so evaluators can understand the product, Circle integration status, and end-to-end agentic commerce workflow without navigating the full product surface.

## Highlights

- Added `/grant`, a concise reviewer page for grant and hackathon evaluation.
- Added a clear Reviewer Mode path: Judge Mode, workflow run, proof review, and console inspection.
- Added a Circle and Arc integration matrix covering USDC, Circle Wallets, x402/Gateway, CCTP, Paymaster/Gas, and Contracts.
- Added a Known Limits section that explains current settlement-ready paths, pending Arc mainnet deployment, and provider signature scope without inflated claims.
- Added `/grant` to marketing and review navigation.
- Updated the main landing reviewer package links to point to `/grant`.
- Softened the remaining Judge Mode settlement language to “configured settlement evidence.”
- Added `/grant` to the production monitor and updated the submission monitor check to match the safer settlement language.

## Verification

- `npm run lint --workspace=landing`
- `npm run build --workspace=landing`
