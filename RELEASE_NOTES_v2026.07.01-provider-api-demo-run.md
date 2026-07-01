# v2026.07.01-provider-api-demo-run

Arc Suite turns the Provider Trust Center from a static page into a provider-facing API and demo action.

## Added

- `GET /api/provider/receipts` for provider-side receipt reconciliation.
- `GET /api/provider/keys` for provider signing key status and receipt counts.
- `GET /api/provider/fulfillment-policy` for the required provider fulfillment gates.
- `POST /api/provider/demo-run` to create a signed provider receipt and open the resulting proof.
- Provider page action: **Create provider receipt**.
- Shared Provider Trust service used by both `/provider` and the Provider API routes.

## Improved

- Arc Reputation now uses timeout-protected API calls and parallel data loading.
- Production monitor now checks Provider page, receipts API, keys API and fulfillment policy API.
- README and hackathon notes now describe the provider-side demo path.

## Verification

- `npm run build --workspace=landing`
- `npm run build --workspace=reputation`
- `git diff --check`
- `npm run monitor:prod`

## Production

- Provider page: https://arcsuite-app.vercel.app/provider
- Receipts API: https://arcsuite-app.vercel.app/api/provider/receipts
- Keys API: https://arcsuite-app.vercel.app/api/provider/keys
- Fulfillment policy API: https://arcsuite-app.vercel.app/api/provider/fulfillment-policy

Production monitor: 26 checks passed, 0 failures. One non-blocking warning remains on Treasury page latency.
