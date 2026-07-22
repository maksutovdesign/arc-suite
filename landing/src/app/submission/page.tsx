import {
  ArrowUpRight,
  BadgeCheck,
  CircleDollarSign,
  FileCheck2,
  Link2,
  Play,
  ReceiptText,
  ShieldCheck,
  Workflow,
} from "lucide-react"

import { LatestProofLink } from "../LatestProofLink"
import { SiteHeader } from "../SiteHeader"

export const metadata = {
  title: "Submission - Kestrel",
  description: "Kestrel submission page with demo video, live proof, architecture and reviewer links.",
}

const latestProofUrl = "https://arcsuite-app.vercel.app/proof?id=flow_agentic_01a50e12e6c4"
const explorerUrl =
  "https://testnet.arcscan.app/tx/0x41210539368a78f6bbc08b088a95430dc0f64e9379ad9226173fc3ce565d733b"

const reviewerLinks = [
  ["Judge Mode", "One-page reviewer flow", "https://arcsuite-app.vercel.app/judge"],
  ["Agentic Workflow", "Run the policy-to-proof demo", "https://arcsuite-app.vercel.app/agentic-workflow"],
  ["Latest Proof", "Settlement evidence, x402 receipt and policy chain", latestProofUrl],
  ["Proof Archive", "Recent workflow receipts and settlement evidence", "https://arcsuite-app.vercel.app/proofs"],
  ["Flow Console", "Operator view behind the workflow", "https://arcsuite-app.vercel.app/flow"],
] as const

const proofFacts = [
  ["Amount", "0.003 USDC"],
  ["API", "api_02 · GPT-4o Proxy"],
  ["Settlement ID", "set_a70296d1-87f9-4753-8935-7e330a2fc3d2"],
  ["Settlement ref", "0x412105...5d733b"],
  ["Network", "Arc Testnet"],
] as const

const reviewScript = [
  ["01", "Open Judge Mode", "Start from the one-page evaluator path."],
  ["02", "Run workflow", "Trigger the agentic API purchase and wait for reputation update."],
  ["03", "Open latest proof", "Check that api_02 appears in offer, flow, job and receipt."],
  ["04", "Verify Arcscan", "Open Arcscan when a tx hash is available and confirm the configured settlement evidence."],
] as const

const workflowSteps = [
  { label: "Agent identity", detail: "ERC-8004-ready agent profile and reputation surface", icon: BadgeCheck },
  { label: "x402 offer", detail: "Signed offer, price, provider and payment authorization", icon: ReceiptText },
  { label: "Policy checks", detail: "Treasury budget, Shield screening and access decision", icon: ShieldCheck },
  { label: "Settlement path", detail: "Circle Wallets transfer path with Arcscan proof when configured", icon: CircleDollarSign },
  { label: "Receipt and reputation", detail: "Provider receipt, validation artifact and score update", icon: FileCheck2 },
] as const

const trackFit = [
  ["Agentic Economy", "Agents can discover, pay for and prove API usage with USDC."],
  ["Circle primitives", "Wallets, compliance screening, x402-style receipts and USDC settlement readiness."],
  ["Arc proof", "The workflow ends in settlement evidence: Arcscan transaction when configured, otherwise an explicit readiness state."],
  ["Operator readiness", "Flow, Proof, Billing, Shield, Wallet OS and monitoring show how it becomes an MVP."],
] as const

export default function SubmissionPage() {
  return (
    <main>
      <SiteHeader idPrefix="submission-brand" />
      <section className="submission-shell">
        <div className="submission-hero">
          <div>
            <p className="kicker">Kestrel submission</p>
            <h1>One verified agentic USDC workflow for Arc and Circle reviewers.</h1>
            <p>
              Kestrel packages identity, x402 offer, policy checks, Circle Wallets settlement readiness,
              signed receipt, reputation update and proof into one reviewer-ready flow.
            </p>
            <div className="agentic-actions">
              <a className="button primary" href="/judge">
                <Play size={17} /> Open judge mode
              </a>
              <a className="button secondary" href="/agentic-workflow">
                <Play size={17} /> Run workflow
              </a>
              <LatestProofLink fallbackHref={latestProofUrl} />
              <a className="button secondary" href={explorerUrl} target="_blank" rel="noreferrer">
                <ArrowUpRight size={17} /> Verify reference
              </a>
            </div>
          </div>
          <aside className="submission-card" aria-label="Submission package">
            <span><FileCheck2 size={16} /> Submission package</span>
            <span className="submission-note"><FileCheck2 size={16} /> Source repository available on request</span>
            <span className="submission-note"><FileCheck2 size={16} /> Release notes available on request</span>
            <span className="submission-note"><FileCheck2 size={16} /> Recorded demo available on request</span>
            <LatestProofLink fallbackHref={latestProofUrl} label="Latest production proof" mode="card" />
            <a href={explorerUrl} target="_blank" rel="noreferrer"><Link2 size={16} /> Arcscan proof</a>
          </aside>
        </div>

        <section className="submission-section">
          <div className="submission-section-head">
            <p className="kicker">Reviewer script</p>
            <h2>Exactly what to click during review.</h2>
          </div>
          <div className="submission-review-script">
            {reviewScript.map(([index, title, detail]) => (
              <div key={title}>
                <i>{index}</i>
                <strong>{title}</strong>
                <span>{detail}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="submission-section">
          <div className="submission-section-head">
            <p className="kicker">What to review</p>
            <h2>Five minutes, one path, one proof.</h2>
          </div>
          <div className="submission-link-grid">
            {reviewerLinks.map(([title, detail, href]) => (
              <a href={href} key={title} target="_blank" rel="noreferrer">
                <strong>{title}</strong>
                <span>{detail}</span>
                <ArrowUpRight size={15} />
              </a>
            ))}
          </div>
        </section>

        <section className="submission-proof">
          <div>
            <p className="kicker">Settlement proof</p>
            <h2>Arc settlement evidence when Circle Wallets are configured.</h2>
            <p>
              The production smoke can attach the same settlement path used by the backend:
              policy gate, Circle token lookup, Arc Testnet transfer when enabled, Supabase audit and proof link.
            </p>
          </div>
          <div className="submission-proof-grid">
            {proofFacts.map(([label, value]) => (
              <div key={label}>
                <span>{label}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
        </section>

        <section className="submission-section">
          <div className="submission-section-head">
            <p className="kicker">Architecture</p>
            <h2>The complete agent commerce loop.</h2>
          </div>
          <div className="submission-workflow">
            {workflowSteps.map((step, index) => {
              const Icon = step.icon
              return (
                <div key={step.label}>
                  <i>{String(index + 1).padStart(2, "0")}</i>
                  <Icon size={20} />
                  <strong>{step.label}</strong>
                  <span>{step.detail}</span>
                </div>
              )
            })}
          </div>
        </section>

        <section className="submission-section">
          <div className="submission-section-head">
            <p className="kicker">Track fit</p>
            <h2>Why this fits the Agentic Economy track.</h2>
          </div>
          <div className="submission-fit">
            {trackFit.map(([title, detail]) => (
              <div key={title}>
                <Workflow size={18} />
                <strong>{title}</strong>
                <p>{detail}</p>
              </div>
            ))}
          </div>
        </section>
      </section>
    </main>
  )
}
