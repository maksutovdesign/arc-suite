# Kestrel production sprint — 26 July 2026

## Outcome

Kestrel now has a connected product path from money intent to public grant evidence:

1. App Kit Money Movement for Send, Bridge, Swap and Unified Balance.
2. Wallet-signed policy preflight and Circle compliance screening.
3. Server-side execution grants for operations that must keep signing material and the App Kit key secret.
4. A disclosed fee ledger with Kestrel, Arc, Gateway, provider, forwarding and gas lines.
5. A Proof Center that joins policy, fees, provider receipts and settlement evidence.
6. A Control Center that starts with money, risk, proof and revenue instead of the module catalog.
7. Three pilot scenarios: x402 API purchase, treasury movement and controlled B2B payout.
8. Public, machine-readable grant evidence at `/api/grant/evidence`.

## Production execution boundary

Browser execution remains user-controlled for Send, Bridge and Unified Balance. Swap is restricted to Arc Testnet in the current testnet flow and executes only when the server signer and Kit Key are configured.

Required production variables:

- `KESTREL_MONEY_EXECUTION_ENABLED=true`
- `KESTREL_FEE_RECIPIENT`
- `CIRCLE_API_KEY`
- `KESTREL_EXECUTION_SIGNING_SECRET`
- `CIRCLE_API_KEY`, `CIRCLE_ENTITY_SECRET` and `ARC_SOURCE_WALLET_ADDRESS` for the preferred Circle Wallets adapter;
- or `KESTREL_APP_KIT_PRIVATE_KEY` as an explicitly configured fallback signer;
- `ARC_APP_KIT_KEY` for Swap

Optional fee-model inputs:

- `KESTREL_FORWARDING_FEE_USDC`
- `KESTREL_APP_KIT_GAS_ESTIMATE_USDC`

The API is fail-closed when any required execution credential is missing. Secret values never use a `NEXT_PUBLIC_` prefix.

## Fee model

The default Kestrel developer fee remains 75 bps:

- 90% of the custom fee is attributed to Kestrel;
- 10% is attributed to Arc;
- Gateway, CCTP, swap-provider, forwarding and gas costs remain separate;
- estimated and measured revenue are never mixed.

The UI now shows source debit, destination amount and every modeled deduction before execution.

## Evidence policy

Kestrel uses three explicit evidence states:

- **implemented** — code and UI exist;
- **configured** — required provider credentials are present;
- **measured** — a real stored operation, proof or confirmed settlement exists.

Demo fallback values do not count toward completed operation volume, fee revenue or confirmed settlement metrics.

## Public surfaces

- `/dashboard` — operating overview;
- `/money` — App Kit execution and fees;
- `/proof-center` — unified proof envelope;
- `/pilots` — three pilot workflows;
- `/grant-evidence` — reviewer-facing metrics;
- `/api/grant/evidence` — machine-readable evidence.

## Official implementation references

- [Arc App Kit](https://docs.arc.io/app-kit)
- [Supported blockchains and tokens](https://docs.arc.io/app-kit/references/supported-blockchains)
- [Unified Balance fees](https://docs.arc.io/app-kit/concepts/unified-balance-fees)
- [Swap fees](https://docs.arc.io/app-kit/concepts/swap-fees)
- [Bridge fees](https://docs.arc.io/app-kit/concepts/bridge-fees)
- [Circle developer-controlled wallets](https://developers.circle.com/wallets/dev-controlled)
