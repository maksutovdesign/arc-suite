export type MoneyProofIntent = {
  walletAddress: string
  recipient: string
  amount: string
  token: string
}

type Network = { chain: string; chainId: number; environment: string }
export type ExportableMoneyProof = {
  id?: string
  operation: string
  state: string
  traceId: string
  recordedAt: string
  txHashes: string[]
  explorerUrls: string[]
  intent?: MoneyProofIntent
  networks?: { source: Network; destination: Network }
  policy?: { decision?: string; provider?: string; reason?: string; screeningChain?: string; screeningBasis?: string } | null
  feeBreakdown?: { kestrelRevenueUsdc: number; totalFeeUsdc: number; destinationAmountUsdc: number }
}

// Select public evidence fields explicitly. Raw SDK payloads and reusable execution
// grants are deliberately excluded from a file intended for review or sharing.
export function createMoneyProofExport(proof: ExportableMoneyProof) {
  const network = (value: Network) => ({ chain: value.chain, chainId: value.chainId, environment: value.environment })
  return {
    schemaVersion: "kestrel-money-proof/1",
    evidenceSource: "browser-record",
    independentlyVerified: false,
    verificationNote: "Check the transaction on the recorded network. This export does not verify settlement, policy signatures or provider fulfillment.",
    id: proof.id ?? null,
    operation: proof.operation,
    state: proof.state,
    traceId: proof.traceId,
    recordedAt: proof.recordedAt,
    intent: proof.intent ? {
      walletAddress: proof.intent.walletAddress,
      recipient: proof.intent.recipient,
      amount: proof.intent.amount,
      token: proof.intent.token,
    } : null,
    networks: proof.networks ? { source: network(proof.networks.source), destination: network(proof.networks.destination) } : null,
    txHashes: proof.txHashes,
    explorerUrls: proof.explorerUrls,
    policy: proof.policy ? {
      decision: proof.policy.decision,
      provider: proof.policy.provider,
      reason: proof.policy.reason,
      screeningChain: proof.policy.screeningChain,
      screeningBasis: proof.policy.screeningBasis,
    } : null,
    feeEstimate: proof.feeBreakdown ? {
      estimatedKestrelFeeUsdc: proof.feeBreakdown.kestrelRevenueUsdc,
      estimatedTotalFeesUsdc: proof.feeBreakdown.totalFeeUsdc,
      estimatedDestinationAmount: proof.feeBreakdown.destinationAmountUsdc,
    } : null,
  }
}

export function downloadMoneyProof(proof: ExportableMoneyProof) {
  const blob = new Blob([JSON.stringify(createMoneyProofExport(proof), null, 2) + "\n"], { type: "application/json" })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = `kestrel-money-proof-${proof.traceId.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 80) || "record"}.json`
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000)
}
