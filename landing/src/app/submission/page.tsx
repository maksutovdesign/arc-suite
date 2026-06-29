import {
  ArrowUpRight,
  BadgeCheck,
  CircleDollarSign,
  Code2,
  FileCheck2,
  Film,
  Link2,
  Play,
  ReceiptText,
  ShieldCheck,
  Workflow,
} from "lucide-react"

import { SiteHeader } from "../SiteHeader"

export const metadata = {
  title: "Submission - Arc Suite",
  description: "Arc Suite submission page with demo video, live proof, architecture and reviewer links.",
}

const releaseUrl = "https://github.com/maksutovdesign/arc-suite/releases/tag/v2026.06.28-real-arc-settlement"
const repoUrl = "https://github.com/maksutovdesign/arc-suite"
const demoVideoUrl =
  "https://github.com/maksutovdesign/arc-suite/releases/download/v2026.06.28-real-arc-settlement/arc-suite-agentic-workflow-demo.mov"
const explorerUrl =
  "https://testnet.arcscan.app/tx/0x50a32e787462e2dd5e2c187c0e4d906f11ae0ed2fdda251d660470794c00d639"

const reviewerLinks = [
  ["Judge Mode", "One-page reviewer flow", "https://arcsuite-app.vercel.app/judge"],
  ["Agentic Workflow", "Run the policy-to-proof demo", "https://arcsuite-app.vercel.app/agentic-workflow"],
  ["Proof Page", "Tx hash, x402 receipt and policy chain", "https://arcsuite-app.vercel.app/proof"],
  ["Flow Console", "Operator view behind the workflow", "https://arcsuite-app.vercel.app/flow"],
] as const

const proofFacts = [
  ["Amount", "0.003 USDC"],
  ["Settlement ID", "set_04643b0a-ec0f-4007-be94-aaaf45f6e0a7"],
  ["Tx hash", "0x50a32e...00d639"],
  ["Network", "Arc Testnet"],
] as const

const workflowSteps = [
  { label: "Agent identity", detail: "ERC-8004-ready agent profile and reputation surface", icon: BadgeCheck },
  { label: "x402 offer", detail: "Signed offer, price, provider and payment authorization", icon: ReceiptText },
  { label: "Policy checks", detail: "Treasury budget, Shield screening and access decision", icon: ShieldCheck },
  { label: "Arc settlement", detail: "Circle Wallets transfer with Arcscan transaction proof", icon: CircleDollarSign },
  { label: "Receipt and reputation", detail: "Provider receipt, validation artifact and score update", icon: FileCheck2 },
] as const

const trackFit = [
  ["Agentic Economy", "Agents can discover, pay for and prove API usage with USDC."],
  ["Circle primitives", "Wallets, compliance screening, x402-style receipts and USDC settlement."],
  ["Arc proof", "The workflow ends in a live Arc Testnet transaction, not a simulated toast."],
  ["Operator readiness", "Flow, Proof, Billing, Shield, Wallet OS and monitoring show how it becomes an MVP."],
] as const

export default function SubmissionPage() {
  return (
    <main>
      <SiteHeader idPrefix="submission-brand" />
      <section className="submission-shell">
        <div className="submission-hero">
          <div>
            <p className="kicker">Arc Suite submission</p>
            <h1>One verified agentic USDC workflow for Arc and Circle reviewers.</h1>
            <p>
              Arc Suite packages identity, x402 offer, policy checks, Circle Wallets settlement,
              signed receipt, reputation update and proof into one reviewer-ready flow.
            </p>
            <div className="agentic-actions">
              <a className="button primary" href={demoVideoUrl} target="_blank" rel="noreferrer">
                <Film size={17} /> Watch demo video
              </a>
              <a className="button secondary" href="/judge">
                <Play size={17} /> Open judge mode
              </a>
              <a className="button secondary" href={explorerUrl} target="_blank" rel="noreferrer">
                <ArrowUpRight size={17} /> Verify tx
              </a>
            </div>
          </div>
          <aside className="submission-card" aria-label="Submission package">
            <span><FileCheck2 size={16} /> Submission package</span>
            <a href={releaseUrl} target="_blank" rel="noreferrer"><Code2 size={16} /> GitHub release</a>
            <a href={repoUrl} target="_blank" rel="noreferrer"><Code2 size={16} /> Source repository</a>
            <a href={demoVideoUrl} target="_blank" rel="noreferrer"><Film size={16} /> Recorded demo</a>
            <a href={explorerUrl} target="_blank" rel="noreferrer"><Link2 size={16} /> Arcscan proof</a>
          </aside>
        </div>

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
            <p className="kicker">Live settlement proof</p>
            <h2>Real Arc Testnet USDC transfer through Circle Wallets.</h2>
            <p>
              The production smoke confirmed the same settlement path used by the backend:
              policy gate, Circle token lookup, Arc Testnet transfer, Supabase audit and proof link.
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
