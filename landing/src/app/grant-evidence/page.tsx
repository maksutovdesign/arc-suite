import { ArrowUpRight, FileJson2, Target } from "lucide-react"

import { getGrantEvidence } from "@/lib/backend/grant-evidence"
import { SiteHeader } from "../SiteHeader"

export const metadata = {
  title: "Grant Evidence - Kestrel",
  description: "Public Kestrel grant metrics, milestones and verifiable evidence links.",
}

export const dynamic = "force-dynamic"

export default async function GrantEvidencePage() {
  const evidence = await getGrantEvidence()
  return (
    <main>
      <SiteHeader demoHref="/dashboard" idPrefix="grant-evidence-brand" variant="review" />
      <section className="control-shell">
        <header className="control-hero">
          <div>
            <p className="kicker">Public grant evidence</p>
            <h1>Milestones backed by measurable product state.</h1>
            <p>This page separates implemented capability, live configuration and measured usage so reviewers can see exactly what exists today.</p>
          </div>
          <a className="control-readiness grant-json-link" href="/api/grant/evidence"><FileJson2 size={20} /><span><strong>Open machine-readable evidence</strong><small>Live JSON · no authentication required</small></span></a>
        </header>

        <section className="grant-evidence-metrics">
          <Metric label="Money executions" value={evidence.metrics.moneyExecutions} />
          <Metric label="Measured volume" value={`${evidence.metrics.operationVolumeUsdc} USDC`} />
          <Metric label="Fee revenue" value={`${evidence.metrics.kestrelFeeRevenueUsdc} USDC`} />
          <Metric label="Success rate" value={`${evidence.metrics.executionSuccessRatePct}%`} />
          <Metric label="Confirmed settlements" value={evidence.metrics.confirmedArcSettlements} />
          <Metric label="Indexed proofs" value={evidence.metrics.indexedProofs} />
        </section>

        <section className="control-panel">
          <div className="control-panel-head"><div><span>Delivery ledger</span><h2>Grant milestones</h2></div><Target size={20} /></div>
          <div className="grant-milestone-list">
            {evidence.milestones.map((item, index) => (
              <a href={item.evidence} key={item.id}>
                <i>{String(index + 1).padStart(2, "0")}</i>
                <span><strong>{item.label}</strong><small>{item.status}</small></span>
                <ArrowUpRight size={15} />
              </a>
            ))}
          </div>
        </section>

        <p className="grant-evidence-note">Evidence generated {new Date(evidence.generatedAt).toISOString()}. Demo fallback values are never counted as completed money operations or fee revenue.</p>
      </section>
    </main>
  )
}

function Metric({ label, value }: { label: string; value: number | string }) {
  return <article><span>{label}</span><strong>{value}</strong></article>
}
