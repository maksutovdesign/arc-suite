# v2026.06.30-provider-trust-center

Arc Suite adds a new Provider Trust Center layer for agentic API providers, giving Marketplace, Billing, and Proof a shared place to verify receipts, settlement references, and provider reliability.

## Added

- New `/provider` product page with a Provider Trust Center narrative for x402/API providers.
- Live-style receipt verification panel showing offer id, receipt id, policy result, settlement hash, and proof bundle linkage.
- Provider metrics for paid providers, signed receipts, live settlements, and recorded value.
- Provider key registry UI with signing keys, rotation status, and reputation impact.
- Fulfillment policy panel for policy-safe delivery, metering, settlement, and proof archiving.
- Receipt registry table connecting API usage to provider, receipt, settlement, and proof links.
- Provider integration cards for Marketplace, Billing, and Proof.
- Provider API endpoints for receipts, signing keys and fulfillment policy.
- Provider demo-run endpoint and UI action that creates a signed receipt and opens its proof.

## Updated

- Added Arc Provider to the product ecosystem navigation.
- Updated the landing page from 12 to 13 suite products.
- Extended the reviewer package with a Provider Trust card.
- Updated README and hackathon documentation with the new `/provider` demo link.
- Added Provider page and Provider API coverage to the production monitor.
- Added a timeout/fallback layer to Arc Reputation data loading so production latency warnings do not block the monitor.

## Verification

- `npm run build --workspace=landing`
- `git diff --check`
- `npm run monitor:prod`

Production monitor now checks Provider page, receipts, keys and fulfillment policy endpoints.

## Production URL

- https://arcsuite-app.vercel.app/provider
- https://arcsuite-app.vercel.app/api/provider/receipts
- https://arcsuite-app.vercel.app/api/provider/keys
- https://arcsuite-app.vercel.app/api/provider/fulfillment-policy
