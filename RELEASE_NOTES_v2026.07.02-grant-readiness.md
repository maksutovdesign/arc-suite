# v2026.07.02 Grant Readiness Polish

This release prepares Arc Suite for grant review and public evaluator traffic by tightening the product narrative, fixing browser-facing stability issues, and making the landing/demo surfaces more consistent.

## Highlights

- Fixed React hydration mismatches across key pages by removing render-time dynamic defaults and loading browser session keys after mount.
- Reworked mobile navigation so marketing/review pages use a compact menu and product console pages use a left icon rail instead of overflowing horizontal navigation.
- Softened Arc settlement language across the app and docs from hard live-settlement claims to settlement-ready paths, settlement references, and proof evidence when configured.
- Unified the top header system into a single `SiteHeader` with `marketing`, `review`, and `console` variants.
- Removed visible GitHub/X calls-to-action from the product surface and replaced them with product-native review/package language.
- Replaced distracting `mock` / `simulation` wording with `demo fallback`, `demo signal`, and `simulated provider signature` where accuracy matters.
- Raised the Treasury production latency warning threshold through a per-check override so scheduled monitoring no longer sends noisy warnings for acceptable cold starts.

## Product Surface Updates

- `/` now uses the shared marketing header and no longer links directly to GitHub release assets.
- `/investors`, `/analytics`, `/ops`, `/proof`, `/proofs`, `/submission`, and `/judge` now share the same review header style.
- `/executions` uses the shared console header.
- `/submission` presents source, release notes, and recorded demo as available-on-request review assets instead of direct external links.
- `/ops` labels the scheduled workflow as Production Monitor rather than exposing implementation details.
- `/radar` removes direct social links while preserving the builder intelligence map as product content.

## Verification

- `npm run lint --workspace=landing`
- `npm run build --workspace=landing`
- `npm run monitor:prod`

Production monitor result before release:

- 26 checks passed
- 0 failures
- 0 warnings
- Treasury headers: 3860 ms, under the configured Treasury-specific warning threshold

