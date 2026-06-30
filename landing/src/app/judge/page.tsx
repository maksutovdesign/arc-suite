import { ArrowRight, BadgeCheck, Play, Workflow } from "lucide-react"

import { AgenticWorkflowClient } from "../agentic-workflow/AgenticWorkflowClient"
import { LatestProofLink } from "../LatestProofLink"
import { SiteHeader } from "../SiteHeader"

export const metadata = {
  title: "Judge Demo - Arc Suite",
  description: "A hackathon-ready Arc Suite demo path for reviewers and grant evaluators.",
}

const highlights = [
  "One-click agentic workflow demo",
  "x402 signed offer, authorization and receipt",
  "Policy chain before value movement",
  "Proof page with tx hash, job id and validation evidence",
]

const latestProofUrl = "/proof?id=flow_agentic_01a50e12e6c4"

export default function JudgePage() {
  return (
    <main>
      <SiteHeader idPrefix="judge-brand" />
      <section className="judge-shell">
        <div className="judge-hero">
          <div>
            <p className="kicker">Judge mode</p>
            <h1>Review Arc Suite as one end-to-end agentic commerce workflow.</h1>
            <p>
              Start here for the grant or hackathon review: run an AI agent API purchase, inspect the
              x402 receipt, then open the proof page that ties policy, settlement and reputation to the
              same workflow id.
            </p>
            <div className="agentic-actions">
              <a className="button primary" href="#run-demo"><Play size={17} /> Run workflow</a>
              <LatestProofLink fallbackHref={latestProofUrl} />
            </div>
          </div>
          <div className="judge-card" aria-label="Demo flow">
            <span><Workflow size={16} /> Review path</span>
            <ol>
              <li>Click Run agentic workflow.</li>
              <li>Wait until the pipeline reaches Reputation update.</li>
              <li>Open latest proof and confirm api_02 / GPT-4o Proxy appears in the signed offer.</li>
              <li>Open Arcscan from the proof page and verify the live settlement transaction.</li>
            </ol>
          </div>
        </div>

        <div className="judge-highlights">
          {highlights.map((item) => (
            <div key={item}>
              <BadgeCheck size={18} />
              <span>{item}</span>
            </div>
          ))}
        </div>

        <div className="judge-next" id="run-demo">
          <span>Live demo surface</span>
          <a href="/agentic-workflow">Open full page <ArrowRight size={15} /></a>
          <LatestProofLink fallbackHref={latestProofUrl} label="Open latest proof" mode="inline" />
        </div>
      </section>
      <AgenticWorkflowClient />
    </main>
  )
}
