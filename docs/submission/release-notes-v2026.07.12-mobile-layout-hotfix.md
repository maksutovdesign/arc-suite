# v2026.07.12-mobile-layout-hotfix

Production hotfix for reviewer-facing layout quality.

## Updated

- Fixed product landing metric cards so large USDC values and signing hashes do not wrap awkwardly.
- Updated Treasury mobile views with compact USDC formatting across dashboard, reports, agents, budgets and transactions.
- Reworked mobile alert and budget action rows so controls stay inside cards.
- Simplified mobile chart legends to prevent category labels from clipping.
- Tightened settings and workspace security cards to avoid hidden API key and status text.

## Verification

- Landing production deploy completed and aliased to https://arcsuite-app.vercel.app.
- Treasury production deploy completed and aliased to https://treasury-umber.vercel.app.
- Production monitor: 31 checks, 0 failures, 0 warnings.
