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

The 13 October production monitor run [38465161059](https://github.com/maksutovdesign/arc-suite/actions/runs/38465161059) recorded both embedding-policy assertion failures and request timeouts. The mainnet pilot branch contains the embedding-policy probe correction and the shared-host header fix described below. Local timeout tests establish fallback behavior; they do not establish recovery of the production database, repair alert delivery configuration or prove that every production page now meets its latency budget. Production must be checked after a reviewed rollout.

## Product embedding policy on the shared host

A read-only production check on 14 October found that `/treasury` returned the landing page's `frame-ancestors 'self' https://maksutovdesign.ru` policy alongside `X-Frame-Options: DENY`. The outer Next.js host applied its general header rule to the proxied product response, so product-level configuration alone did not preserve the intended CSP.

The landing host now applies product-specific headers after its general rules for `/treasury`, `/reputation` and `/marketplace`, including nested pages, assets and APIs. These routes receive `frame-ancestors 'none'` and `X-Frame-Options: DENY`. Other landing pages retain their explicit portfolio embedding allowance; landing API cache rules remain unchanged. Next.js documents the last matching header's precedence in its [headers reference](https://nextjs.org/docs/app/api-reference/config/next-config-js/headers).

`tests/zone-embedding.test.ts` exercises the actual exported header configuration with Next.js's path matcher. It covers all three product roots, nested routes and similarly named non-product paths. An additional local production-server check returned HTTP 200 with the expected CSP and X-Frame-Options for proxied Treasury and Reputation, and the expected landing policy for `/` and `/grant`. Marketplace timed out after 20 seconds on both attempts against its current upstream, so its live proxied response remains unverified. The configuration tests cover its header rule, but do not prove upstream availability. None of these checks assert that the fix has been deployed to production.
