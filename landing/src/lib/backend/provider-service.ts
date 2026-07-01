import {
  buildAgenticDemoProof,
  buildAgenticProofFromStored,
  shortHash,
  type AgenticWorkflowProof,
} from "@/lib/agentic-demo-proof"
import { getSupabaseRecentAgenticProofs } from "./supabase"

export type ProviderReceiptSummary = {
  amount: string
  apiId: string
  apiName: string
  billingEventId: string
  generatedAt: string
  proofSource: AgenticWorkflowProof["proofSource"]
  proofUrl: string
  provider: string
  providerKeyId: string
  receiptDigest: string
  receiptId: string
  settlementId: string
  shortReceiptDigest: string
  shortTxHash: string
  signatureAlgorithm: string
  txHash: string | null
  verified: boolean
  workflowId: string
}

export type ProviderKeySummary = {
  algorithm: string
  keyId: string
  lastReceiptAt: string | null
  receipts: number
  rotationSlot: string
  status: "active" | "stale"
}

export type ProviderFulfillmentPolicy = {
  description: string
  key: string
  required: boolean
  title: string
}

export type ProviderTrustOverview = {
  generatedAt: string
  keys: ProviderKeySummary[]
  metrics: {
    providersPaid: number
    recordedValueUsdc: number
    signedReceipts: number
    verifiedSettlements: number
  }
  policies: ProviderFulfillmentPolicy[]
  receipts: ProviderReceiptSummary[]
}

export async function getProviderTrustOverview(limit = 12): Promise<ProviderTrustOverview> {
  const storedProofs = await getSupabaseRecentAgenticProofs(limit)
  const proofs = storedProofs.length > 0
    ? storedProofs.map(buildAgenticProofFromStored)
    : [buildAgenticDemoProof()]

  return buildProviderTrustOverview(proofs)
}

export function buildProviderTrustOverview(proofs: AgenticWorkflowProof[]): ProviderTrustOverview {
  const receipts = proofs.map(toProviderReceipt)
  const providersPaid = new Set(receipts.map((receipt) => receipt.provider)).size
  const signedReceipts = proofs.filter((proof) => proof.receipt.signature).length
  const verifiedSettlements = proofs.filter((proof) => proof.txHash).length
  const recordedValueUsdc = proofs.reduce((sum, proof) => sum + proof.flowRun.amountUsdc, 0)

  return {
    generatedAt: new Date().toISOString(),
    keys: toProviderKeys(receipts),
    metrics: {
      providersPaid,
      recordedValueUsdc,
      signedReceipts,
      verifiedSettlements,
    },
    policies: providerFulfillmentPolicies(),
    receipts,
  }
}

function toProviderReceipt(proof: AgenticWorkflowProof): ProviderReceiptSummary {
  const receiptDigest = proof.agentJob.receiptHash ?? proof.receipt.digest

  return {
    amount: proof.amount,
    apiId: proof.api.id,
    apiName: proof.apiName,
    billingEventId: proof.billingEvent,
    generatedAt: proof.generatedAt,
    proofSource: proof.proofSource,
    proofUrl: `/proof?id=${encodeURIComponent(proof.workflowId)}`,
    provider: proof.provider,
    providerKeyId: proof.receipt.providerKeyId,
    receiptDigest,
    receiptId: proof.receipt.receiptId,
    settlementId: proof.settlementId,
    shortReceiptDigest: shortHash(receiptDigest),
    shortTxHash: shortHash(proof.txHash),
    signatureAlgorithm: proof.receipt.signatureAlgorithm,
    txHash: proof.txHash || null,
    verified: proof.receipt.verified,
    workflowId: proof.workflowId,
  }
}

function toProviderKeys(receipts: ProviderReceiptSummary[]): ProviderKeySummary[] {
  const grouped = new Map<string, ProviderReceiptSummary[]>()
  for (const receipt of receipts) {
    const existing = grouped.get(receipt.providerKeyId) ?? []
    existing.push(receipt)
    grouped.set(receipt.providerKeyId, existing)
  }

  return Array.from(grouped.entries()).map(([keyId, keyReceipts], index) => {
    const lastReceiptAt = keyReceipts
      .map((receipt) => receipt.generatedAt)
      .sort()
      .at(-1) ?? null

    return {
      algorithm: keyReceipts[0]?.signatureAlgorithm ?? "ed25519-provider-sim",
      keyId,
      lastReceiptAt,
      receipts: keyReceipts.length,
      rotationSlot: String(index + 1).padStart(2, "0"),
      status: "active",
    }
  })
}

export function providerFulfillmentPolicies(): ProviderFulfillmentPolicy[] {
  return [
    {
      description: "Marketplace price, API terms and capability are hashed before the agent authorizes spend.",
      key: "offer_signed",
      required: true,
      title: "Offer signed",
    },
    {
      description: "Treasury confirms budget, reputation threshold and policy limits before provider fulfillment.",
      key: "budget_locked",
      required: true,
      title: "Budget locked",
    },
    {
      description: "Provider signs the receipt payload with a visible key id and settlement reference.",
      key: "receipt_signed",
      required: true,
      title: "Receipt signed",
    },
    {
      description: "The proof URL links policy chain, receipt, settlement hash and reputation update.",
      key: "proof_linked",
      required: true,
      title: "Proof linked",
    },
  ]
}
