export const MONEY_NETWORKS = {
  Arc: { chainId: 5042, environment: "mainnet", explorerBaseUrl: "https://explorer.arc.io" },
  Arc_Testnet: { chainId: 5042002, environment: "testnet", explorerBaseUrl: "https://testnet.arcscan.app" },
  Base_Sepolia: { chainId: 84532, environment: "testnet", explorerBaseUrl: "https://sepolia.basescan.org" },
  Ethereum_Sepolia: { chainId: 11155111, environment: "testnet", explorerBaseUrl: "https://sepolia.etherscan.io" },
  Arbitrum_Sepolia: { chainId: 421614, environment: "testnet", explorerBaseUrl: "https://sepolia.arbiscan.io" },
} as const

export type MoneyNetworkChain = keyof typeof MONEY_NETWORKS

export function moneyProofNetworks(sourceChain: MoneyNetworkChain, destinationChain: MoneyNetworkChain) {
  return {
    source: { chain: sourceChain, ...MONEY_NETWORKS[sourceChain] },
    destination: { chain: destinationChain, ...MONEY_NETWORKS[destinationChain] },
  }
}
