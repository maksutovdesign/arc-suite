import {
  ArrowRight,
  BadgeCheck,
  CircleDollarSign,
  FileCheck2,
  Gauge,
  KeyRound,
  LockKeyhole,
  Network,
  Play,
  ShieldCheck,
  WalletCards,
} from "lucide-react"

import { LatestProofLink } from "../LatestProofLink"
import { SiteHeader } from "../SiteHeader"

export const metadata = {
  title: "Grant Review Package - Arc Suite",
  description: "A concise grant reviewer package for Arc Suite: demo flow, Circle integrations, current status and roadmap.",
}

const latestProofUrl = "/proof?id=flow_agentic_01a50e12e6c4"
const demoUrl = "https://treasury-umber.vercel.app/demo"
const releaseUrl = "https://github.com/maksutovdesign/arc-suite/releases/tag/v2026.07.02-grant-readiness"

const reviewerSteps = [
  ["01", "Open Judge Mode", "Start from the guided one-page reviewer flow."],
  ["02", "Run workflow", "Trigger policy check, x402 offer, receipt and reputation update."],
  ["03", "Open proof", "Review settlement reference, signed receipt and policy chain."],
  ["04", "Check console", "Inspect Flow, Treasury, Reputation and Provider views."],
] as const

const integrationMatrix = [
  {
    name: "USDC",
    status: "Implemented",
    detail: "USDC budgets, payment amounts, receipts, proof records and operator dashboards.",
    icon: CircleDollarSign,
  },
  {
    name: "Circle Wallets",
    status: "Demo-ready",
    detail: "Developer-controlled wallet path prepared for real agent wallet creation and settlement evidence.",
    icon: WalletCards,
  },
  {
    name: "x402 / Gateway",
    status: "Demo-ready",
    detail: "Signed offer and receipt architecture for machine-to-machine API payment flows.",
    icon: KeyRound,
  },
  {
    name: "CCTP",
    status: "Planned",
    detail: "Roadmap item for Arc to Ethereum/Base cross-chain USDC movement after mainnet readiness.",
    icon: Network,
  },
  {
    name: "Paymaster / Gas",
    status: "Planned",
    detail: "Arc Gas models sponsored transactions, per-agent limits and USDC-funded execution policies.",
    icon: Gauge,
  },
  {
    name: "Contracts",
    status: "Planned",
    detail: "Escrow, reputation and settlement contracts are ready for Arc deployment when production endpoints are available.",
    icon: FileCheck2,
  },
] as const

const currentStatus = [
  ["Live product", "Production web MVP deployed on Vercel with Supabase-backed APIs."],
  ["Review proof", "Proof pages connect workflow id, policy checks, x402 receipt and settlement reference."],
  ["Monitoring", "Production monitor, Sentry runtime and Ops Health surface are active."],
  ["Roadmap", "Grant unlocks real Arc settlement, Circle Wallets expansion, CCTP and contract deployment."],
] as const

const knownLimits = [
  "Arc mainnet deployment is pending external availability and grant scope.",
  "Some payment rails are settlement-ready demo paths until production Circle credentials are fully configured.",
  "Provider receipts include a simulated provider signature for review until external providers onboard.",
] as const

export default function GrantPage() {
  return (
    <main>
      <SiteHeader idPrefix="grant-brand" />
      <section className="grant-shell">
        <section className="grant-hero">
          <div>
            <p className="kicker">Grant review package</p>
            <h1>Arc Suite is a production web MVP for agentic USDC commerce.</h1>
            <p>
              This page gives reviewers one clean path through the product: run the agentic workflow,
              inspect the proof, confirm Circle integration status, and understand exactly what grant
              funding turns from settlement-ready infrastructure into live Arc deployment.
            </p>
            <div className="agentic-actions">
              <a className="button primary" href="/judge">
                <Play size={17} /> Reviewer mode
              </a>
              <a className="button secondary" href="/agentic-workflow">
                Run workflow
              </a>
              <LatestProofLink fallbackHref={latestProofUrl} />
              <a className="button secondary" href={demoUrl} target="_blank" rel="noreferrer">
                Live demo <ArrowRight size={16} />
              </a>
            </div>
          </div>

          <aside className="grant-summary-card" aria-label="Grant summary">
            <span><BadgeCheck size={16} /> Review status</span>
            <strong>Hackathon and grant ready</strong>
            <p>One product story, one proof path, one technical roadmap.</p>
            <a href={releaseUrl} target="_blank" rel="noreferrer">
              Latest release <ArrowRight size={15} />
            </a>
          </aside>
        </section>

        <section className="grant-section">
          <div className="submission-section-head">
            <p className="kicker">Reviewer mode</p>
            <h2>Four clicks to understand the product.</h2>
          </div>
          <div className="grant-reviewer-grid">
            {reviewerSteps.map(([index, title, detail]) => (
              <div key={title}>
                <i>{index}</i>
                <strong>{title}</strong>
                <span>{detail}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="grant-section">
          <div className="submission-section-head">
            <p className="kicker">Circle and Arc fit</p>
            <h2>Integration status matrix.</h2>
          </div>
          <div className="grant-matrix">
            {integrationMatrix.map((item) => {
              const Icon = item.icon
              return (
                <article key={item.name}>
                  <div>
                    <Icon size={19} />
                    <span className={`grant-status grant-status-${item.status.toLowerCase().replace("ready", "ready")}`}>
                      {item.status}
                    </span>
                  </div>
                  <strong>{item.name}</strong>
                  <p>{item.detail}</p>
                </article>
              )
            })}
          </div>
        </section>

        <section className="grant-proof-band">
          <div>
            <p className="kicker">End-to-end workflow</p>
            <h2>Policy check to proof, with settlement evidence when configured.</h2>
            <p>
              The demo joins Treasury budget enforcement, Shield risk screening, Marketplace access,
              Provider receipt validation and Reputation updates into one auditable operation.
            </p>
          </div>
          <div className="grant-proof-links">
            <a href="/flow">Flow console <ArrowRight size={15} /></a>
            <a href="/provider">Provider receipts <ArrowRight size={15} /></a>
            <a href="/proofs">Proof archive <ArrowRight size={15} /></a>
          </div>
        </section>

        <section className="grant-section">
          <div className="submission-section-head">
            <p className="kicker">Current status</p>
            <h2>What is live today.</h2>
          </div>
          <div className="grant-status-grid">
            {currentStatus.map(([title, detail]) => (
              <div key={title}>
                <ShieldCheck size={18} />
                <strong>{title}</strong>
                <p>{detail}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="grant-limits">
          <div>
            <p className="kicker">Known limits</p>
            <h2>Clear scope, no inflated claims.</h2>
          </div>
          <ul>
            {knownLimits.map((item) => (
              <li key={item}>
                <LockKeyhole size={16} />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>
      </section>
    </main>
  )
}
