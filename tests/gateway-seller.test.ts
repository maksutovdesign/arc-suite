import assert from "node:assert/strict"
import test from "node:test"

import { getGatewaySellerConfiguration } from "../landing/src/lib/backend/gateway-seller.ts"

const VALID_ADDRESS = "0x1111111111111111111111111111111111111111"

function configureEnv(overrides: Record<string, string | undefined> = {}) {
  for (const key of ["KESTREL_GATEWAY_SELLER_ENABLED", "KESTREL_GATEWAY_SELLER_ADDRESS", "KESTREL_GATEWAY_FACILITATOR_URL"]) {
    delete process.env[key]
  }
  for (const [key, value] of Object.entries(overrides)) {
    if (value === undefined) delete process.env[key]
    else process.env[key] = value
  }
}

test("gateway seller is disabled by default (fail closed)", () => {
  configureEnv()
  const config = getGatewaySellerConfiguration()
  assert.equal(config.enabled, false)
  assert.equal(config.sellerAddress, null)
  assert.ok(config.missing.length > 0)
})

test("gateway seller requires the enabled flag to be exactly \"true\"", () => {
  configureEnv({ KESTREL_GATEWAY_SELLER_ENABLED: "yes", KESTREL_GATEWAY_SELLER_ADDRESS: VALID_ADDRESS })
  assert.equal(getGatewaySellerConfiguration().enabled, false)
})

test("gateway seller rejects a malformed seller address", () => {
  configureEnv({ KESTREL_GATEWAY_SELLER_ENABLED: "true", KESTREL_GATEWAY_SELLER_ADDRESS: "not-an-address" })
  const config = getGatewaySellerConfiguration()
  assert.equal(config.enabled, false)
  assert.equal(config.sellerAddress, null)
})

test("gateway seller enables only with both a true flag and a valid address", () => {
  configureEnv({ KESTREL_GATEWAY_SELLER_ENABLED: "true", KESTREL_GATEWAY_SELLER_ADDRESS: VALID_ADDRESS })
  const config = getGatewaySellerConfiguration()
  assert.equal(config.enabled, true)
  assert.equal(config.sellerAddress, VALID_ADDRESS)
  assert.equal(config.network, "eip155:5042002")
  assert.deepEqual(config.missing, [])
})

test("gateway seller defaults to the testnet facilitator when unset", () => {
  configureEnv({ KESTREL_GATEWAY_SELLER_ENABLED: "true", KESTREL_GATEWAY_SELLER_ADDRESS: VALID_ADDRESS })
  assert.equal(getGatewaySellerConfiguration().facilitatorUrl, "https://gateway-api-testnet.circle.com")
})

test("gateway seller honors a custom facilitator URL", () => {
  configureEnv({
    KESTREL_GATEWAY_SELLER_ENABLED: "true",
    KESTREL_GATEWAY_SELLER_ADDRESS: VALID_ADDRESS,
    KESTREL_GATEWAY_FACILITATOR_URL: "https://gateway-api.circle.com",
  })
  assert.equal(getGatewaySellerConfiguration().facilitatorUrl, "https://gateway-api.circle.com")
})
