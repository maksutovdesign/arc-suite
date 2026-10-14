import assert from "node:assert/strict"
import { createRequire } from "node:module"
import test from "node:test"

const requireLanding = createRequire(new URL("../landing/package.json", import.meta.url))
const { AppKit } = await import(requireLanding.resolve("@circle-fin/app-kit"))

test("installed App Kit distinguishes Arc mainnet from existing testnet", () => {
  const kit = new AppKit({ disableErrorReporting: true })
  const chains = kit.getSupportedChains()
  const mainnet = chains.find((chain) => chain.chain === "Arc")
  const testnet = chains.find((chain) => chain.chain === "Arc_Testnet")
  assert.ok(mainnet, "SDK must recognize Arc mainnet before integration can enable it")
  assert.equal(mainnet.chainId, 5042)
  assert.equal(mainnet.isTestnet, false)
  assert.ok(testnet, "SDK must retain support for existing testnet operations")
  assert.equal(testnet.chainId, 5042002)
  assert.equal(testnet.isTestnet, true)
})
