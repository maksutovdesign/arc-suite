import { ArrowUpRight, Building2, Code2, Landmark, PlayCircle } from "lucide-react"

import { SiteHeader } from "../SiteHeader"

export const metadata = {
  title: "Pilot Scenarios - Kestrel",
  description: "Three end-to-end Kestrel pilot scenarios for x402, treasury settlement and B2B payments.",
}

const scenarios = [
  {
    id: "x402-api",
    icon: Code2,
    label: "Agent buys an API",
    audience: "AI agent platforms and API providers",
    action: "/agentic-workflow",
    steps: ["Discover priced x402 offer", "Check budget and reputation", "Screen recipient risk", "Settle USDC on Arc", "Sign provider receipt", "Publish proof envelope"],
    evidence: ["offer digest", "policy decision", "receipt signature", "settlement reference"],
  },
  {
    id: "treasury",
    icon: Landmark,
    label: "Treasury moves USDC",
    audience: "Stablecoin treasury and agent operators",
    action: "/money",
    steps: ["Select Send, Bridge, Swap or Unified Balance", "Estimate complete fee ledger", "Sign policy intent", "Execute through App Kit", "Track recovery state", "Record transaction proof"],
    evidence: ["wallet authorization", "fee split", "route result", "explorer URL"],
  },
  {
    id: "b2b",
    icon: Building2,
    label: "B2B controlled payout",
    audience: "Marketplaces, platforms and card settlement teams",
    action: "/escrow",
    steps: ["Create commercial obligation", "Attach milestone policy", "Screen counterparties", "Approve release", "Settle net obligation", "Reconcile memo and proof"],
    evidence: ["deal terms", "approval trail", "release state", "reconciliation memo"],
  },
] as const

export default function PilotsPage() {
  return (
    <main>
      <SiteHeader demoHref="/dashboard" idPrefix="pilots-brand" variant="console" />
      <section className="control-shell">
        <header className="control-hero">
          <div>
            <p className="kicker">Production pilot catalog</p>
            <h1>Three workflows designed to produce evidence.</h1>
            <p>Each pilot begins with a real money action and ends with a measurable terminal state. Demo data is labeled; onchain claims require a transaction artifact.</p>
          </div>
          <div className="control-readiness"><PlayCircle size={20} /><span><strong>3 scenarios ready</strong><small>x402 · treasury · B2B settlement</small></span></div>
        </header>

        <section className="pilot-grid">
          {scenarios.map((scenario, scenarioIndex) => {
            const Icon = scenario.icon
            return (
              <article key={scenario.id}>
                <div className="pilot-card-head"><Icon size={22} /><span>0{scenarioIndex + 1}</span></div>
                <p>{scenario.audience}</p>
                <h2>{scenario.label}</h2>
                <ol>{scenario.steps.map((step) => <li key={step}>{step}</li>)}</ol>
                <div className="pilot-evidence">{scenario.evidence.map((item) => <span key={item}>{item}</span>)}</div>
                <a href={scenario.action}>Launch scenario <ArrowUpRight size={14} /></a>
              </article>
            )
          })}
        </section>

        <section className="control-panel pilot-success">
          <div className="control-panel-head"><div><span>Shared success criteria</span><h2>What every pilot must measure</h2></div><PlayCircle size={20} /></div>
          <div>
            <span>terminal success rate</span><span>USDC volume</span><span>quote latency</span><span>policy denials</span><span>proof completeness</span><span>Kestrel fee revenue</span>
          </div>
        </section>
      </section>
    </main>
  )
}
