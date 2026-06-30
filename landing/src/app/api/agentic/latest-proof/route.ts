import { NextResponse } from "next/server"

import { buildAgenticDemoProof, buildAgenticProofFromStored } from "@/lib/agentic-demo-proof"
import { getSupabaseLatestAgenticProof } from "@/lib/backend/supabase"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  const stored = await getSupabaseLatestAgenticProof()
  const proof = stored ? buildAgenticProofFromStored(stored) : buildAgenticDemoProof()

  return NextResponse.json(
    {
      amount: proof.amount,
      apiId: proof.api.id,
      apiName: proof.apiName,
      explorerUrl: proof.flowRun.explorerUrl,
      generatedAt: proof.generatedAt,
      ok: true,
      proofSource: proof.proofSource,
      proofUrl: `/proof?id=${encodeURIComponent(proof.workflowId)}`,
      provider: proof.provider,
      providerKeyId: proof.receipt.providerKeyId,
      providerSignatureAlgorithm: proof.receipt.signatureAlgorithm,
      receiptDigest: proof.agentJob.receiptHash ?? proof.receipt.digest,
      settlementId: proof.settlementId,
      stored: proof.stored,
      txHash: proof.txHash || null,
      workflowId: proof.workflowId,
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  )
}
