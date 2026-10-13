import assert from "node:assert/strict"
import test from "node:test"

import {
  getMoneyPolicyConfiguration,
  complianceChainFor,
  moneyAuthorizationMessage,
  policyValidationError,
  validateMoneyAuthorization,
  type MoneyAuthorization,
} from "../landing/src/lib/backend/money-policy.ts"
import { deterministicIdempotencyKey } from "../landing/src/lib/backend/idempotency.ts"
import { moneyProofNetworks } from "../landing/src/lib/money-networks.ts"

const FEE_RECIPIENT = "0x1111111111111111111111111111111111111111"
const ALLOWED = "0x2222222222222222222222222222222222222222"
const OTHER = "0x3333333333333333333333333333333333333333"

function configureEnv(overrides: Record<string, string | undefined> = {}) {
  const base: Record<string, string | undefined> = {
    KESTREL_MONEY_EXECUTION_ENABLED: "true",
    KESTREL_MONEY_NETWORK: undefined,
    KESTREL_MAINNET_EXECUTION_ENABLED: undefined,
    CIRCLE_API_KEY: "test-key",
    KESTREL_FEE_RECIPIENT: FEE_RECIPIENT,
    KESTREL_MAX_MONEY_MOVEMENT_USDC: "100",
    KESTREL_MONEY_ALLOWED_RECIPIENTS: `${ALLOWED},${FEE_RECIPIENT}`,
  }
  for (const [key, value] of Object.entries({ ...base, ...overrides })) {
    if (value === undefined) delete process.env[key]
    else process.env[key] = value
  }
}

function authorization(overrides: Partial<MoneyAuthorization> = {}): MoneyAuthorization {
  return {
    walletAddress: ALLOWED,
    operation: "send",
    sourceChain: "Arc_Testnet",
    destinationChain: "Arc_Testnet",
    amount: "10",
    token: "USDC",
    recipient: ALLOWED,
    feeRecipient: FEE_RECIPIENT,
    issuedAt: new Date().toISOString(),
    nonce: "00000000-0000-4000-8000-000000000000",
    ...overrides,
  }
}

test("validateMoneyAuthorization accepts a well-formed authorization", () => {
  const { input, error } = validateMoneyAuthorization(authorization())
  assert.equal(error, null)
  assert.ok(input)
  assert.equal(input!.recipient, ALLOWED)
})

test("validateMoneyAuthorization rejects malformed fields", () => {
  assert.ok(validateMoneyAuthorization(authorization({ amount: "10.1234567" })).error, "too many decimals")
  assert.ok(validateMoneyAuthorization(authorization({ amount: "0" })).error, "zero amount")
  assert.ok(validateMoneyAuthorization(authorization({ recipient: "0x123" })).error, "short address")
  assert.ok(validateMoneyAuthorization(authorization({ nonce: "not-a-uuid" })).error, "bad nonce")
  assert.ok(validateMoneyAuthorization(authorization({ operation: "wire" as never })).error, "bad operation")
})

test("policyValidationError enforces the per-transaction USDC cap", () => {
  configureEnv()
  const config = getMoneyPolicyConfiguration()
  assert.equal(config.maxAmountUsdc, 100)
  assert.equal(policyValidationError(authorization({ amount: "100" }), config), null, "at the cap is allowed")
  assert.match(
    policyValidationError(authorization({ amount: "100.000001" }), config) ?? "",
    /exceeds/i,
    "just over the cap is blocked",
  )
})

test("policyValidationError enforces the recipient allowlist", () => {
  configureEnv()
  const config = getMoneyPolicyConfiguration()
  assert.equal(config.allowlistRequired, true)
  assert.equal(policyValidationError(authorization({ recipient: ALLOWED }), config), null)
  assert.match(policyValidationError(authorization({ recipient: OTHER }), config) ?? "", /allowlist/i)
})

test("policyValidationError enforces the fee recipient", () => {
  configureEnv()
  const config = getMoneyPolicyConfiguration()
  assert.match(policyValidationError(authorization({ feeRecipient: OTHER }), config) ?? "", /fee recipient/i)
})

test("policyValidationError enforces the signature TTL", () => {
  configureEnv()
  const config = getMoneyPolicyConfiguration()
  const stale = new Date(Date.now() - (config.signatureTtlSeconds + 60) * 1000).toISOString()
  assert.match(policyValidationError(authorization({ issuedAt: stale }), config) ?? "", /expired/i)
})

test("policyValidationError enforces chain rules per operation", () => {
  configureEnv({ KESTREL_MONEY_ALLOWED_RECIPIENTS: undefined })
  const config = getMoneyPolicyConfiguration()
  assert.match(
    policyValidationError(authorization({ operation: "send", sourceChain: "Arc_Testnet", destinationChain: "Base_Sepolia" }), config) ?? "",
    /same source and destination/i,
  )
  assert.match(
    policyValidationError(authorization({ operation: "bridge", sourceChain: "Arc_Testnet", destinationChain: "Arc_Testnet" }), config) ?? "",
    /different source and destination/i,
  )
  assert.match(
    policyValidationError(authorization({ operation: "swap", sourceChain: "Base_Sepolia", destinationChain: "Base_Sepolia" }), config) ?? "",
    /Arc Testnet/i,
  )
})

test("validateMoneyAuthorization defaults token to USDC when omitted", () => {
  const raw = authorization()
  const { token: _omit, ...withoutToken } = raw as MoneyAuthorization & { token?: string }
  const { input, error } = validateMoneyAuthorization(withoutToken)
  assert.equal(error, null)
  assert.equal(input!.token, "USDC")
})

test("validateMoneyAuthorization allows EURC only for bridge", () => {
  assert.equal(validateMoneyAuthorization(authorization({ operation: "bridge", sourceChain: "Arc_Testnet", destinationChain: "Base_Sepolia", token: "EURC" })).error, null)
  assert.match(validateMoneyAuthorization(authorization({ operation: "send", token: "EURC" })).error ?? "", /bridge-only/i)
  assert.match(validateMoneyAuthorization(authorization({ operation: "spend", token: "EURC" })).error ?? "", /bridge-only/i)
  assert.match(validateMoneyAuthorization(authorization({ operation: "swap", token: "EURC" })).error ?? "", /bridge-only/i)
})

test("validateMoneyAuthorization rejects unsupported tokens", () => {
  assert.ok(validateMoneyAuthorization(authorization({ token: "DAI" as never })).error)
})

test("moneyAuthorizationMessage reflects the authorized token", () => {
  const usdcMessage = moneyAuthorizationMessage(authorization({ token: "USDC" }))
  const eurcMessage = moneyAuthorizationMessage(authorization({ operation: "bridge", sourceChain: "Arc_Testnet", destinationChain: "Base_Sepolia", token: "EURC" }))
  assert.match(usdcMessage, /Amount: 10 USDC/)
  assert.match(eurcMessage, /Amount: 10 EURC/)
})

test("deterministicIdempotencyKey is stable and UUID-v4 shaped", () => {
  const uuidV4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
  const a = deterministicIdempotencyKey("escrow:ms_1:release")
  const b = deterministicIdempotencyKey("escrow:ms_1:release")
  const c = deterministicIdempotencyKey("escrow:ms_1:refund")
  assert.equal(a, b, "same seed → same key")
  assert.notEqual(a, c, "different seed → different key")
  assert.match(a, uuidV4)
  assert.match(c, uuidV4)
})

test("mainnet pilot requires explicit activation and a recipient allowlist", () => {
  configureEnv({ KESTREL_MONEY_NETWORK: "mainnet" })
  assert.equal(getMoneyPolicyConfiguration().enabled, false)
  configureEnv({ KESTREL_MONEY_NETWORK: "mainnet", KESTREL_MAINNET_EXECUTION_ENABLED: "true", KESTREL_MONEY_ALLOWED_RECIPIENTS: undefined })
  assert.equal(getMoneyPolicyConfiguration().enabled, false)
  configureEnv({ KESTREL_MONEY_NETWORK: "mainnet", KESTREL_MAINNET_EXECUTION_ENABLED: "true" })
  const config = getMoneyPolicyConfiguration()
  assert.equal(config.enabled, true)
  assert.equal(policyValidationError(authorization({ sourceChain: "Arc", destinationChain: "Arc" }), config), null)
  assert.match(policyValidationError(authorization(), config) ?? "", /configured network/i)
  assert.match(policyValidationError(authorization({ sourceChain: "Arc", destinationChain: "Arc_Testnet" }), config) ?? "", /cannot be mixed/i)
  assert.match(policyValidationError(authorization({ operation: "swap", sourceChain: "Arc", destinationChain: "Arc" }), config) ?? "", /only permits USDC Send/i)
  assert.match(policyValidationError(authorization({ recipient: OTHER, sourceChain: "Arc", destinationChain: "Arc" }), config) ?? "", /allowlist/i)
})

test("network changes and emergency disable invalidate previous authorizations", () => {
  configureEnv()
  const mainnetIntent = authorization({ sourceChain: "Arc", destinationChain: "Arc" })
  assert.match(policyValidationError(mainnetIntent, getMoneyPolicyConfiguration()) ?? "", /configured network/i)
  configureEnv({ KESTREL_MONEY_EXECUTION_ENABLED: "false" })
  assert.match(policyValidationError(authorization(), getMoneyPolicyConfiguration()) ?? "", /disabled/i)
  configureEnv({ KESTREL_MONEY_NETWORK: "typo" })
  assert.equal(getMoneyPolicyConfiguration().enabled, false)
})

test("signed intents and proof metadata distinguish Arc mainnet from testnet", () => {
  const mainnet = authorization({ sourceChain: "Arc", destinationChain: "Arc" })
  assert.equal(validateMoneyAuthorization(mainnet).error, null)
  assert.notEqual(moneyAuthorizationMessage(mainnet), moneyAuthorizationMessage(authorization()))
  const mainnetProof = moneyProofNetworks("Arc", "Arc")
  const testnetProof = moneyProofNetworks("Arc_Testnet", "Arc_Testnet")
  assert.equal(mainnetProof.source.chainId, 5042)
  assert.equal(mainnetProof.destination.environment, "mainnet")
  assert.equal(testnetProof.source.chainId, 5042002)
  assert.equal(testnetProof.destination.environment, "testnet")
  assert.equal(complianceChainFor("Arc").chain, "ETH")
  assert.equal(complianceChainFor("Arc").basis, "cross-chain-evm-identity")
})
