import assert from "node:assert/strict"
import test from "node:test"
import { ARC_MAINNET_WALLET, assertMoneyWalletContext, readArcWalletReadiness, selectArcMainnet, type WalletReadProvider } from "../landing/src/lib/arc-wallet-readiness.ts"
import { MONEY_NETWORKS } from "../landing/src/lib/money-networks.ts"

const address = `0x${"1".repeat(40)}`
const other = `0x${"2".repeat(40)}`
type Request = { method: string; params?: unknown }
function providerFor(handler: (request: Request) => unknown) {
  const calls: Request[] = []
  const provider = { request: async (request: Request) => { calls.push(request); return handler(request) } } as unknown as WalletReadProvider
  return { provider, calls }
}

test("Arc wallet metadata matches mainnet and native USDC precision", () => {
  assert.equal(Number(BigInt(ARC_MAINNET_WALLET.chainId)), MONEY_NETWORKS.Arc.chainId)
  assert.equal(ARC_MAINNET_WALLET.nativeCurrency.symbol, "USDC")
  assert.equal(ARC_MAINNET_WALLET.nativeCurrency.decimals, 18)
  assert.deepEqual(ARC_MAINNET_WALLET.rpcUrls, ["https://rpc.mainnet.arc.io"])
})

test("readiness reads one native USDC balance exactly, without signatures or payment requests", async () => {
  const { provider, calls } = providerFor(({ method }) => ({ eth_accounts: [address], eth_chainId: "0x13b2", eth_getBalance: "0x1" })[method])
  const status = await readArcWalletReadiness(provider, address)
  assert.equal(status.balanceUsdc, "0.000000000000000001")
  assert.equal(status.hasGasBalance, true)
  assert.equal(status.onArcMainnet, true)
  assert.equal(calls.filter((call) => call.method === "eth_getBalance").length, 1)
  assert.ok(calls.every((call) => ["eth_accounts", "eth_chainId", "eth_getBalance"].includes(call.method)))
})

test("wrong network does not reinterpret its balance as Arc USDC", async () => {
  const { provider, calls } = providerFor(({ method }) => method === "eth_accounts" ? [address] : "0x1")
  const status = await readArcWalletReadiness(provider, address)
  assert.equal(status.onArcMainnet, false)
  assert.equal(status.balanceUsdc, null)
  assert.ok(!calls.some((call) => call.method === "eth_getBalance"))
  await assert.rejects(assertMoneyWalletContext(provider, address, 5042), /Select Arc/)
})

test("zero Arc balance is distinct from a failed balance read", async () => {
  const { provider } = providerFor(({ method }) => ({ eth_accounts: [address], eth_chainId: "0x13b2", eth_getBalance: "0x0" })[method])
  assert.deepEqual(await readArcWalletReadiness(provider, address), { chainId: 5042, onArcMainnet: true, balanceUsdc: "0", hasGasBalance: false })
  const invalid = providerFor(({ method }) => ({ eth_accounts: [address], eth_chainId: "0x13b2", eth_getBalance: "not-a-balance" })[method])
  await assert.rejects(readArcWalletReadiness(invalid.provider, address), /invalid USDC balance/)
})

test("account or network changes during a balance request invalidate readiness", async () => {
  let account = address
  const accountChange = providerFor(({ method }) => {
    if (method === "eth_accounts") return [account]
    if (method === "eth_getBalance") { account = other; return "0x1" }
    return "0x13b2"
  })
  await assert.rejects(readArcWalletReadiness(accountChange.provider, address), /account changed/)
  let chain = "0x13b2"
  const networkChange = providerFor(({ method }) => {
    if (method === "eth_accounts") return [address]
    if (method === "eth_getBalance") { chain = "0x1"; return "0x1" }
    return chain
  })
  await assert.rejects(readArcWalletReadiness(networkChange.provider, address), /network changed/)
})

test("Arc setup adds an unknown network and explicitly selects it before verification", async () => {
  let first = true
  const { provider, calls } = providerFor(({ method }) => {
    if (method === "wallet_switchEthereumChain" && first) { first = false; throw { code: 4902 } }
    if (method === "eth_chainId") return "0x13b2"
    return null
  })
  await selectArcMainnet(provider)
  assert.deepEqual(calls.map((call) => call.method), ["wallet_switchEthereumChain", "wallet_addEthereumChain", "wallet_switchEthereumChain", "eth_chainId"])
  assert.equal((calls[1].params as typeof ARC_MAINNET_WALLET[])[0].rpcUrls[0], "https://rpc.mainnet.arc.io")
})

test("a rejected or unsupported network request does not trigger another prompt", async () => {
  for (const code of [4001, 4200, -32601]) {
    const { provider, calls } = providerFor(() => { throw { code } })
    await assert.rejects(selectArcMainnet(provider))
    assert.equal(calls.length, 1)
  }
  const wrong = providerFor(({ method }) => method === "eth_chainId" ? "0x1" : null)
  await assert.rejects(selectArcMainnet(wrong.provider), /Arc was not selected/)
})
