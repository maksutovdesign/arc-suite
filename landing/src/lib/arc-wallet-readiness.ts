import type { EIP1193Provider } from "viem"

export type WalletReadProvider = Pick<EIP1193Provider, "request">
export const ARC_MAINNET_WALLET = {
  chainId: "0x13b2",
  chainName: "Arc",
  nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 18 },
  rpcUrls: ["https://rpc.mainnet.arc.io"],
  blockExplorerUrls: ["https://explorer.arc.io"],
} as const

export type ArcWalletReadiness = {
  chainId: number
  onArcMainnet: boolean
  balanceUsdc: string | null
  hasGasBalance: boolean
}

function chainNumber(value: unknown) {
  if (typeof value !== "string" || !/^0x[0-9a-f]+$/i.test(value)) throw new Error("The wallet returned an invalid network ID.")
  const id = Number(BigInt(value))
  if (!Number.isSafeInteger(id) || id <= 0) throw new Error("The wallet returned an invalid network ID.")
  return id
}

export async function assertMoneyWalletContext(provider: WalletReadProvider, address: string, expectedChainId?: number) {
  if (!/^0x[0-9a-f]{40}$/i.test(address)) throw new Error("The wallet address is invalid.")
  const accounts = await provider.request({ method: "eth_accounts" })
  if (!Array.isArray(accounts) || typeof accounts[0] !== "string" || accounts[0].toLowerCase() !== address.toLowerCase()) {
    throw new Error("The wallet account changed. Reconnect and review the operation again.")
  }
  const chainId = chainNumber(await provider.request({ method: "eth_chainId" }))
  if (expectedChainId !== undefined && chainId !== expectedChainId) throw new Error("Select Arc mainnet in your wallet before continuing.")
  return chainId
}

export async function readArcWalletReadiness(provider: WalletReadProvider, address: string): Promise<ArcWalletReadiness> {
  const chainId = await assertMoneyWalletContext(provider, address)
  const onArcMainnet = chainId === 5042
  let balanceUsdc: string | null = null
  let hasGasBalance = false
  if (onArcMainnet) {
    const raw = await provider.request({ method: "eth_getBalance", params: [address as `0x${string}`, "latest"] })
    if (typeof raw !== "string" || !/^0x[0-9a-f]{1,64}$/i.test(raw)) throw new Error("The wallet returned an invalid USDC balance.")
    const balance = BigInt(raw)
    const scale = BigInt("1000000000000000000")
    const fraction = (balance % scale).toString().padStart(18, "0").replace(/0+$/, "")
    balanceUsdc = `${balance / scale}${fraction ? `.${fraction}` : ""}`
    hasGasBalance = balance > BigInt(0)
  }
  // Do not present a balance read on one account/network as another account's
  // readiness if the owner changed the wallet while the request was pending.
  const currentChainId = await assertMoneyWalletContext(provider, address)
  if (currentChainId !== chainId) throw new Error("The wallet network changed. Check the wallet again.")
  return { chainId, onArcMainnet, balanceUsdc, hasGasBalance }
}

export async function selectArcMainnet(provider: WalletReadProvider) {
  try {
    await provider.request({ method: "wallet_switchEthereumChain", params: [{ chainId: ARC_MAINNET_WALLET.chainId }] })
  } catch (error) {
    // An explicit rejection or unsupported method must not open a second prompt.
    if (!error || typeof error !== "object" || !("code" in error) || error.code !== 4902) throw error
    await provider.request({ method: "wallet_addEthereumChain", params: [{
      ...ARC_MAINNET_WALLET,
      rpcUrls: [...ARC_MAINNET_WALLET.rpcUrls],
      blockExplorerUrls: [...ARC_MAINNET_WALLET.blockExplorerUrls],
    }] })
    // EIP-3085 does not guarantee selection after a successful add.
    await provider.request({ method: "wallet_switchEthereumChain", params: [{ chainId: ARC_MAINNET_WALLET.chainId }] })
  }
  if (chainNumber(await provider.request({ method: "eth_chainId" })) !== 5042) {
    throw new Error("Arc was not selected. Choose Arc mainnet in your wallet and check again.")
  }
}
