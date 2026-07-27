import assert from "node:assert/strict"
import test from "node:test"

import {
  getMoneyPolicyConfiguration,
  policyValidationError,
  validateMoneyAuthorization,
  type MoneyAuthorization,
} from "../landing/src/lib/backend/money-policy.ts"
import { deterministicIdempotencyKey } from "../landing/src/lib/backend/idempotency.ts"

const FEE_RECIPIENT = "0x1111111111111111111111111111111111111111"
const ALLOWED = "0x2222222222222222222222222222222222222222"
const OTHER = "0x3333333333333333333333333333333333333333"

function configureEnv(overrides: Record<string, string | undefined> = {}) {
  const base: Record<string, string | undefined> = {
    KESTREL_MONEY_EXECUTION_ENABLED: "true",
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
