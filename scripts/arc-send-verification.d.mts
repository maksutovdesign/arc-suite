export type ArcReadRpc = ((method: string, params?: unknown[]) => Promise<unknown>) & { rpcUrl?: string }
export type ArcTransactionInspection = {
  schemaVersion: string
  checkedAt: string
  verificationMethod: string
  rpcUrl: string
  readOnly: boolean
  verified: boolean
  status: "pending_or_not_found" | "unsupported_transfer" | "confirmed_send" | "verification_failed"
  network: { chain: string; chainId: number; environment: string }
  transactionHash: string
  explorerUrl: string
  transfer: { sender: string; recipient: string; amountUsdc: string } | null
  checks: Record<string, boolean>
  observation: { route: "native" | "erc20" | null; blockNumber: string | null; blockHash: string | null; receiptStatus: string | null; actualGasUsdc: string | null; matchingSystemTransfers: number } | null
  intentCompared: boolean
  kestrelProvenanceVerified: boolean
  policySignatureVerified: boolean
  providerFulfillmentVerified: boolean
  limitations: string
}
export const ARC_RPC_URL: string
export const ARC_FALLBACK_RPC_URL: string
export const ARC_CHAIN_ID: bigint
export const USDC_ERC20: string
export const USDC_SYSTEM_EMITTER: string
export const TRANSFER_TOPIC: string
export function createArcReadRpc(fetchImpl?: typeof fetch, options?: { signal?: AbortSignal; rpcUrl?: string }): ArcReadRpc
export function inspectArcTransaction(txHash: string, options: { rpc: ArcReadRpc; checkedAt?: string }): Promise<ArcTransactionInspection>
export function probeArcMainnet(rpc: ArcReadRpc): Promise<{ rpcUrl: string; chainId: number; readOnly: boolean; transactionVerified: boolean }>
