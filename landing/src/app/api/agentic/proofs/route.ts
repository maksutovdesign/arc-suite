import { NextRequest, NextResponse } from "next/server"

import { buildAgenticDemoProof, buildAgenticProofFromStored } from "@/lib/agentic-demo-proof"
import { getSupabaseRecentAgenticProofs } from "@/lib/backend/supabase"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const limit = clampLimit(request.nextUrl.searchParams.get("limit"))
  const apiId = request.nextUrl.searchParams.get("apiId")?.trim() || null
  const stored = await getSupabaseRecentAgenticProofs(limit)
  const proofs = (stored.length > 0 ? stored.map(buildAgenticProofFromStored) : [buildAgenticDemoProof()])
    .filter((proof) => !apiId || proof.api.id === apiId)

  return NextResponse.json(
    {
      ok: true,
      proofs: proofs.map((proof) => ({
        amount: proof.amount,
        apiId: proof.api.id,
        apiName: proof.apiName,
        explorerUrl: proof.flowRun.explorerUrl,
        generatedAt: proof.generatedAt,
        jobId: proof.agentJob.id,
        proofSource: proof.proofSource,
        proofUrl: `/proof?id=${encodeURIComponent(proof.workflowId)}`,
        provider: proof.provider,
        providerKeyId: proof.receipt.providerKeyId,
        providerSignatureAlgorithm: proof.receipt.signatureAlgorithm,
        receiptDigest: proof.agentJob.receiptHash ?? proof.receipt.digest,
        settlementId: proof.settlementId,
        txHash: proof.txHash || null,
        workflowId: proof.workflowId,
      })),
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  )
}

function clampLimit(value: string | null) {
  const parsed = Number.parseInt(value ?? "12", 10)
  if (!Number.isFinite(parsed)) return 12
  return Math.min(Math.max(parsed, 1), 24)
}
