import { ArrowUpRight, FileCheck2, ReceiptText, ShieldCheck } from "lucide-react"

import { buildAgenticDemoProof, buildAgenticProofFromStored, shortHash } from "@/lib/agentic-demo-proof"
import { getSupabaseRecentAgenticProofs } from "@/lib/backend/supabase"
import { SiteHeader } from "../SiteHeader"

export const metadata = {
  title: "Proof Archive - Kestrel",
  description: "Recent Kestrel agentic workflow proofs with settlement evidence and x402 receipts.",
}

export const dynamic = "force-dynamic"

export default async function ProofArchivePage() {
  const storedProofs = await getSupabaseRecentAgenticProofs(12)
  const proofs = storedProofs.length > 0
    ? storedProofs.map(buildAgenticProofFromStored)
    : [buildAgenticDemoProof()]

  return (
    <main>
      <SiteHeader idPrefix="proofs-brand" />
      <section className="proof-shell">
        <div className="proof-hero proof-archive-hero">
          <div>
            <p className="kicker">Proof archive</p>
            <h1>Every agentic workflow should leave a receipt trail.</h1>
            <p>
              Recent Kestrel workflows are collected here with policy status, x402 receipt evidence,
              settlement evidence and Arcscan links when a live Arc Testnet transfer is available.
            </p>
          </div>
          <div className="proof-verdict">
            <span><FileCheck2 size={16} /> {proofs.length} proof{proofs.length === 1 ? "" : "s"} indexed</span>
            <strong>{storedProofs.length > 0 ? "LIVE SUPABASE" : "DEMO FALLBACK"}</strong>
            <small>Latest workflow: {proofs[0]?.workflowId}</small>
          </div>
        </div>

        <section className="proof-panel proof-archive-list">
          <div className="flow-panel-title">
            <div>
              <span>Recent proofs</span>
              <h2>Policy, receipt and settlement history</h2>
            </div>
            <ReceiptText size={21} />
          </div>
          <div className="proof-archive-grid">
            {proofs.map((proof) => {
              const proofUrl = `/proof?id=${encodeURIComponent(proof.workflowId)}`
              return (
                <article className="proof-archive-card" key={proof.workflowId}>
                  <div className="proof-archive-topline">
                    <span>{proof.proofSource === "supabase" ? "Live proof" : "Demo proof"}</span>
                    <em>{formatProofDate(proof.generatedAt)}</em>
                  </div>
                  <h3>{proof.apiName}</h3>
                  <p>{proof.agentName} paid {proof.amount} to {proof.provider} after policy and reputation gates.</p>
                  <div className="proof-archive-facts">
                    <div>
                      <span>Workflow</span>
                      <strong>{proof.workflowId}</strong>
                    </div>
                    <div>
                      <span>Job</span>
                      <strong>{proof.agentJob.id}</strong>
                    </div>
                    <div>
                      <span>Receipt</span>
                      <strong>{shortHash(proof.agentJob.receiptHash ?? proof.receipt.digest)}</strong>
                    </div>
                    <div>
                      <span>Settlement</span>
                      <strong>{shortHash(proof.txHash)}</strong>
                    </div>
                  </div>
                  <div className="proof-archive-actions">
                    <a href={proofUrl}>Open proof <ArrowUpRight size={14} /></a>
                    {proof.flowRun.explorerUrl ? (
                      <a href={proof.flowRun.explorerUrl} target="_blank" rel="noreferrer">
                        Arcscan <ArrowUpRight size={14} />
                      </a>
                    ) : (
                      <span><ShieldCheck size={14} /> Settlement pending</span>
                    )}
                  </div>
                </article>
              )
            })}
          </div>
        </section>
      </section>
    </main>
  )
}

function formatProofDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
  }).format(new Date(value))
}
