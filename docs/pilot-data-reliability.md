# Pilot data reliability

Supabase REST reads have a five-second deadline that includes response body decoding. When the deadline expires, the request is aborted and the existing caller handles unavailable data. The deadline does not retry reads, apply to database writes or RPC mutations, or enable wallet execution.

The pilot summary exposes `dataSource: "supabase" | "seed"`. The landing page shows fallback status when the summary uses seed data. The grant evidence JSON includes this source as `measurement.pilotDataSource`, independently of the sources for proofs, settlements and analytics.

Marketplace summary counts come from the selected dataset without a minimum count: API listings and providers are counted, and stored request counters are summed. These workspace counters do not independently establish real users, paid usage or mainnet activity. Seed data remains demonstration data.

## Verification

```sh
npm run test:unit
npm run build --workspace=landing
npm run test:api
npm run test:pilot-data
```

`test:pilot-data` starts disposable localhost Supabase and Next.js fixtures with dummy credentials and payment flags disabled. It checks a small catalog (3 APIs, 2 providers, 31 stored requests) and then a stalled JSON response, which must yield an explicitly labeled seed fallback within the read deadline. It does not contact production or perform payments.

The 13 October production monitor run [38465161059](https://github.com/maksutovdesign/arc-suite/actions/runs/38465161059) recorded both embedding-policy assertion failures and request timeouts. The mainnet pilot branch contains the embedding-policy probe correction. Local timeout tests establish fallback behavior; they do not establish recovery of the production database, repair alert delivery configuration or prove that every production page now meets its latency budget. Production must be checked after a reviewed rollout.
