# Arc mainnet Send pilot

Money Movement supports a bounded USDC Send pilot on Arc mainnet (chain ID 5042). The default remains testnet with execution disabled. The existing agentic settlement, Gateway seller and escrow paths retain their testnet behavior.

## Configuration

```dotenv
KESTREL_MONEY_NETWORK=mainnet
KESTREL_MAINNET_EXECUTION_ENABLED=false
KESTREL_MONEY_EXECUTION_ENABLED=false
KESTREL_MONEY_ALLOWED_RECIPIENTS=<explicit recipient allowlist>
KESTREL_MAX_MONEY_MOVEMENT_USDC=<approved per-operation cap>
KESTREL_FEE_RECIPIENT=<policy fee address>
CIRCLE_API_KEY=<server-side screening credential>
```

Both execution flags must be explicitly enabled before a reviewed pilot can run. Mainnet requires a nonempty valid recipient allowlist, permits Arc-to-Arc USDC Send only, and rejects mixed networks. Policy is rechecked at execution time. Screening uses a labeled Ethereum mainnet identity signal; this does not establish native Arc screening.

Browser-wallet Send does not need a server private key. Wallet preparation reads account, chain and a single native USDC balance. Adding or switching Arc occurs only when the owner clicks the setup button and confirms in the wallet. Account/network changes invalidate old quotes. Mainnet amount and recipient are explicit inputs.

## Evidence

Send models zero Kestrel developer fee. Gas is estimated separately. Grant metrics distinguish recent sampled volume and estimated fees from unverified collected revenue (`null`).

Money proofs record source/destination chain names, IDs and environments. JSON downloads select public intent, policy summary, network and transaction references while omitting raw SDK payloads and reusable execution grants. Missing metadata on older records remains unknown. Proof Center does not join receipts from unrelated workflows or present demo transaction references as verified settlement.

Proofs currently live in browser localStorage or the immediate server response. Downloads are not a durable public archive and do not independently establish policy signatures, chain finality, provider fulfillment or Kestrel provenance.

## Read-only verification

```sh
npm run readiness:mainnet
npm run verify:arc-send -- --probe
npm run verify:arc-send -- --proof /absolute/path/proof.json --out /absolute/path/verification.json
```

`readiness:mainnet` checks exposed deployment configuration through GET requests. It does not verify funding or a real payment. Set `KESTREL_READINESS_BASE_URL` to the deployment origin to override its default.

`verify:arc-send` reads the fixed official Arc mainnet RPC. It verifies a direct native Send or direct ERC-20 transfer between distinct addresses against transaction data, a successful receipt, exact USDC system Transfer logs and canonical block inclusion. It uses 18-decimal system events without double-counting the parallel six-decimal ERC-20 event. Relayer and smart-account routes are unsupported. Select `--tx` when the export records multiple hashes.

The report labels its RPC-observation trust model and binds itself to the source file by SHA-256. It does not verify policy approval, identity, API fulfillment, fee revenue or the authenticity of the browser export. A probe success checks chain identity only. Exit codes: 0 for verified Send/probe success, 2 for pending or mismatched transaction evidence, 1 for input/RPC/I/O errors. Output files are not overwritten.

## Validation and rollout

Unit coverage includes network separation, mainnet gating, allowlists, emergency disable, public export field selection, wallet readiness races, rejection handling and direct Send verification. No real mainnet operation has been verified by this change. Keep execution disabled until the wallet, recipient, cap and funding have been reviewed; then preserve a checked transaction and appropriate fulfillment evidence before claiming a working mainnet product.

References: [Arc network configuration](https://docs.arc.io/arc/references/connect-to-arc), [USDC system events](https://docs.arc.io/arc/references/usdc-system-events), [App Kit supported chains](https://docs.arc.io/app-kit/references/supported-blockchains).
