import { Activity, ArrowUpRight, CircleDollarSign, FileCheck2, Gauge, ShieldCheck, Users, WalletCards } from "lucide-react"

import { getGrantEvidence } from "@/lib/backend/grant-evidence"
import { SiteHeader } from "../SiteHeader"

export const metadata = {
  title: "Control Center - Kestrel",
  description: "Kestrel production overview for money movement, risk, proof and grant evidence.",
}

export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  const evidence = await getGrantEvidence()
  const metrics = [
    ["Managed USDC", money(evidence.metrics.managedUsdc), "Treasury balance under policy", WalletCards],
    ["Measured volume", money(evidence.metrics.operationVolumeUsdc), "Completed App Kit and Arc operations", CircleDollarSign],
    ["Executions", String(evidence.metrics.moneyExecutions), `${evidence.metrics.executionSuccessRatePct}% terminal success`, Activity],
    ["Proofs", String(evidence.metrics.indexedProofs), "Stored reviewer-verifiable envelopes", FileCheck2],
    ["Agents", String(evidence.metrics.activeAgents), "Wallet and reputation profiles", Users],
    ["Fee revenue", money(evidence.metrics.kestrelFeeRevenueUsdc), "Measured 90% Kestrel share", Gauge],
  ] as const

  return (
    <main>
      <SiteHeader demoHref="/treasury" idPrefix="dashboard-brand" variant="console" />
      <section className="control-shell">
        <header className="control-hero">
          <div>
            <p className="kicker">Production control center</p>
            <h1>One surface for money, policy and proof.</h1>
            <p>Kestrel now starts with the operator’s real question: what can move, what is blocked, what earned revenue and what can be proven.</p>
          </div>
          <div className="control-readiness">
            <ShieldCheck size={20} />
            <span><strong>{evidence.source === "live" ? "Live evidence connected" : "Pilot evidence mode"}</strong><small>Generated {date(evidence.generatedAt)}</small></span>
          </div>
        </header>

        <section className="control-metrics" aria-label="Kestrel operating metrics">
          {metrics.map(([label, value, detail, Icon]) => (
            <article key={label}>
              <Icon size={18} />
              <span>{label}</span>
              <strong>{value}</strong>
              <small>{detail}</small>
            </article>
          ))}
        </section>

        <div className="control-grid">
          <section className="control-panel">
            <div className="control-panel-head"><div><span>Operate</span><h2>Execution cockpit</h2></div><Activity size={20} /></div>
            <div className="control-action-grid">
              <a href="/money"><strong>Money Movement</strong><span>Send, Bridge, Swap and Unified Balance with disclosed fees.</span><em>Execute <ArrowUpRight size={13} /></em></a>
              <a href="/proof-center"><strong>Proof Center</strong><span>Policy, fee, receipt, route and transaction evidence.</span><em>Verify <ArrowUpRight size={13} /></em></a>
              <a href="/shield"><strong>Risk & compliance</strong><span>Circle screening, oracle signals and fail-closed decisions.</span><em>Inspect <ArrowUpRight size={13} /></em></a>
              <a href="/executions"><strong>Execution jobs</strong><span>Provider operations, retries, webhooks and terminal state.</span><em>Monitor <ArrowUpRight size={13} /></em></a>
            </div>
          </section>

          <aside className="control-panel">
            <div className="control-panel-head"><div><span>Readiness</span><h2>Production boundaries</h2></div><ShieldCheck size={20} /></div>
            <div className="control-status-list">
              <Status label="Browser App Kit" ready={evidence.readiness.appKitBrowser} />
              <Status label="Server App Kit signer" ready={evidence.readiness.appKitServer} />
              <Status label="Server Swap" ready={evidence.readiness.swapServer} />
              <Status label="Circle compliance" ready={evidence.readiness.compliance} />
              <Status label="Confirmed Arc settlement" ready={evidence.readiness.arcSettlement} />
              <Status label="Live proof archive" ready={evidence.readiness.proofArchive} />
            </div>
          </aside>
        </div>

        <section className="control-panel control-milestones">
          <div className="control-panel-head"><div><span>Grant delivery</span><h2>Evidence-producing milestones</h2></div><FileCheck2 size={20} /></div>
          <div className="control-milestone-grid">
            {evidence.milestones.map((item, index) => (
              <a href={item.evidence} key={item.id}>
                <i>{String(index + 1).padStart(2, "0")}</i>
                <span><strong>{item.label}</strong><small>{item.status}</small></span>
                <ArrowUpRight size={15} />
              </a>
            ))}
          </div>
        </section>
      </section>
    </main>
  )
}

function Status({ label, ready }: { label: string; ready: boolean }) {
  return <div><i className={ready ? "is-ready" : ""} /><span>{label}</span><strong>{ready ? "ready" : "configuration"}</strong></div>
}

function money(value: number) {
  return `${value.toLocaleString("en-US", { maximumFractionDigits: 6 })} USDC`
}

function date(value: string) {
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value))
}
