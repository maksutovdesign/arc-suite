import {
  ArrowRight, CircleDollarSign, FileCheck2, Gauge, HandCoins,
  ListChecks, LockKeyhole, MessageSquare, Network, ShieldCheck, WalletCards,
} from "lucide-react"
import { SiteHeader } from "../SiteHeader"

export const metadata = {
  title: "Builder and Grant Review - Kestrel",
  description: "Review Kestrel's USDC spending controls, testnet demo, Arc Send pilot, evidence and proposed next steps.",
}

const sourceUrl = "https://github.com/maksutovdesign/arc-suite/pull/1"
const feedbackUrl = "https://x.com/maksutovdesign/status/2110120548806398299"
const ciUrl = "https://github.com/maksutovdesign/arc-suite/actions/runs/38471776141"
const snapshotRevision = "fb7bd63"
const docsBase = `https://github.com/maksutovdesign/arc-suite/blob/${snapshotRevision}/docs`

const reviewerSteps = [
  ["01", "Inspect spending controls", "Open Money Movement and inspect network, amount, recipient and policy states. Connecting a wallet is optional for this review.", "/money"],
  ["02", "Inspect the evidence", "Open Proof Center. Distinguish an intent, a submitted transaction and a confirmed transfer; a receipt is a separate claim.", "/proof-center"],
  ["03", "Check the measurements", "Open Grant Evidence and read the source, sample limits and verification status alongside the figures.", "/grant-evidence"],
  ["04", "Share one failure case", "Tell us how your agent handles a timeout after payment, a duplicate request or a provider that does not deliver.", feedbackUrl],
] as const

const integrationMatrix = [
  { name: "USDC spending policy", status: "Implemented", detail: "Amount caps, recipient allowlists and wallet-signed authorization before supported execution paths.", icon: CircleDollarSign },
  { name: "Arc mainnet Send", status: "Gated pilot", detail: "A narrow Arc-to-Arc USDC Send path in review. Mainnet requires explicit execution flags and a recipient allowlist. No mainnet payment has been independently verified.", icon: HandCoins },
  { name: "Circle Wallets", status: "Configuration-ready", detail: "The existing server-controlled settlement path targets Arc Testnet. Credentials and operator configuration are required for execution.", icon: WalletCards },
  { name: "Bridge / Unified Balance", status: "Testnet demo", detail: "App Kit route and recovery surfaces are implemented for the existing testnet workflow. Completed mainnet integrations are not claimed.", icon: Network },
  { name: "Swap", status: "Configuration-ready", detail: "Server-only signer and Kit Key support is implemented. Execution stays blocked when the required configuration is missing.", icon: Network },
  { name: "Payment evidence", status: "Implemented", detail: "Public-field JSON export and a read-only direct Send verifier. The verifier checks RPC transaction facts, not policy authenticity or API delivery.", icon: FileCheck2 },
  { name: "Provider fulfillment", status: "Unverified", detail: "The demo includes provider receipt structures. A real external provider's delivery linked to an Arc mainnet payment remains to be demonstrated.", icon: ShieldCheck },
  { name: "Collected fee revenue", status: "Unverified", detail: "Direct Send models no Kestrel developer fee. Collected revenue remains unverified; estimates and accrued amounts must be reported separately.", icon: Gauge },
] as const

const reviewerConsole = [
  { title: "Money Movement", detail: "Inspect the bounded Send workflow and its spending controls.", href: "/money", icon: HandCoins, external: false },
  { title: "Proof Center", detail: "Review intent, network and transaction references without treating every record as a verified payment.", href: "/proof-center", icon: FileCheck2, external: false },
  { title: "Public evidence", detail: "Read sampled figures, data sources and unverified revenue status.", href: "/grant-evidence", icon: Gauge, external: false },
  { title: "Wallet readiness", detail: "Inspect the existing Circle Wallet configuration and transfer guardrails.", href: "/wallets", icon: WalletCards, external: false },
  { title: "Code in review", detail: "Inspect the current draft PR and the exact changes under review.", href: sourceUrl, icon: ListChecks, external: true },
  { title: "Builder feedback", detail: "Compare notes on budgets, retries and receipts in the public discussion.", href: feedbackUrl, icon: MessageSquare, external: true },
] as const

const roadmap = [
  ["Proposed milestone 1", "Reviewable Send pilot", "Publish a reviewer-accessible deployment, document recipient and amount limits, then preserve one separately authorized transaction and a durable evidence record."],
  ["Proposed milestone 2", "One paid API workflow", "Bind a provider response to the paid request, handle timeouts and duplicate requests, and distinguish payment confirmation from successful delivery."],
  ["Proposed milestone 3", "External builder validation", "Work with a target of two external teams, record their actual attempts and failure cases, and publish reproducible integration guidance."],
] as const

const knownLimits = [
  "The existing demo uses Arc Testnet. A production web deployment does not establish mainnet payment activity.",
  "No real Arc mainnet payment, external provider fulfillment or collected Kestrel fee revenue has been independently verified in this review snapshot.",
  "Money proof exports are browser records, not a durable public archive. RPC verification does not establish policy signatures, Kestrel provenance or API fulfillment.",
  "Mainnet compliance uses a labeled Ethereum identity signal; native Arc screening is not claimed.",
  "Workspace catalog counters and seed data are not independently verified adoption. Local timeout tests do not establish that the production database or alert delivery has recovered.",
  "The milestones below are a proposed development sequence. Budget, delivery dates and grant acceptance have not been agreed.",
] as const

export default function GrantPage() {
  return (
    <main>
      <SiteHeader idPrefix="grant-brand" />
      <section className="grant-shell">
        <section className="grant-hero">
          <div>
            <p className="kicker">Grant review package</p>
            <h1>Spending controls for agents paying with USDC.</h1>
            <p>
              Kestrel helps teams set spending limits and review what happened to a payment.
              Start with the testnet demo, inspect the narrow Arc mainnet Send pilot in review,
              and help us test the failure cases that matter to your application.
            </p>
            <div className="agentic-actions">
              <a className="button primary" href="#reviewer-console">Start the review <ArrowRight size={17} /></a>
              <a className="button secondary" href={sourceUrl} target="_blank" rel="noreferrer">Code in review</a>
              <a className="button secondary" href={feedbackUrl} target="_blank" rel="noreferrer">Share feedback <MessageSquare size={16} /></a>
            </div>
          </div>
          <aside className="grant-summary-card" aria-label="Product stage">
            <span><ShieldCheck size={16} /> Product stage</span>
            <strong>Testnet demo. Mainnet Send in review.</strong>
            <p>No verified mainnet payment yet. This review does not require a payment.</p>
            <a href="#known-limits">Read the current limits <ArrowRight size={15} /></a>
          </aside>
        </section>

        <section className="grant-section" id="reviewer-console">
          <div className="submission-section-head"><p className="kicker">Reviewer console</p><h2>One place to understand Kestrel.</h2></div>
          <div className="grant-console-grid">
            {reviewerConsole.map(({ title, detail, href, icon: Icon, external }) => (
              <a href={href} key={title} target={external ? "_blank" : undefined} rel={external ? "noreferrer" : undefined}>
                <Icon size={19} /><strong>{title}</strong><span>{detail}</span><ArrowRight size={15} />
              </a>
            ))}
          </div>
        </section>

        <section className="grant-section">
          <div className="submission-section-head"><p className="kicker">First review</p><h2>Inspect the workflow, then challenge one assumption.</h2></div>
          <div className="grant-reviewer-grid">
            {reviewerSteps.map(([index, title, detail, href]) => (
              <div key={title}>
                <i>{index}</i><strong>{title}</strong><span>{detail}</span>
                <a href={href} target={href.startsWith("https:") ? "_blank" : undefined} rel={href.startsWith("https:") ? "noreferrer" : undefined}>
                  {index === "04" ? "Join the discussion" : "Open this step"} <ArrowRight size={15} />
                </a>
              </div>
            ))}
          </div>
        </section>

        <section className="grant-proof-band">
          <div>
            <p className="kicker">Review snapshot · 14 October 2026</p><h2>Evidence you can inspect.</h2>
            <p>Revision {snapshotRevision} passed 60 unit tests, contract checks, lint and builds for four workspaces,
              13 local API checks and an isolated data-fallback check. These are engineering checks;
              they do not prove real payment activity or customer adoption.</p>
          </div>
          <div className="grant-proof-links">
            <a href={ciUrl} target="_blank" rel="noreferrer">CI results <ArrowRight size={15} /></a>
            <a href={`${docsBase}/arc-mainnet-send-pilot.md`} target="_blank" rel="noreferrer">Send verification scope <ArrowRight size={15} /></a>
            <a href={`${docsBase}/pilot-data-reliability.md`} target="_blank" rel="noreferrer">Data-source behavior <ArrowRight size={15} /></a>
          </div>
        </section>

        <section className="grant-section" id="circle-fit">
          <div className="submission-section-head"><p className="kicker">Circle and Arc fit</p><h2>Integration status matrix.</h2></div>
          <div className="grant-matrix">
            {integrationMatrix.map(({ name, status, detail, icon: Icon }) => (
              <article key={name}>
                <div><Icon size={19} /><span className={`grant-status grant-status-${status.toLowerCase().replaceAll(" ", "-")}`}>{status}</span></div>
                <strong>{name}</strong><p>{detail}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="grant-limits" id="known-limits">
          <div><p className="kicker">Known limits</p><h2>What remains to be demonstrated.</h2></div>
          <ul>{knownLimits.map((item) => <li key={item}><LockKeyhole size={16} /><span>{item}</span></li>)}</ul>
        </section>

        <section className="grant-section" id="roadmap">
          <div className="submission-section-head"><p className="kicker">Proposed roadmap</p><h2>From controlled Send to a useful paid API workflow.</h2></div>
          <div className="grant-roadmap">
            {roadmap.map(([stage, title, detail]) => <article key={title}><span>{stage}</span><strong>{title}</strong><p>{detail}</p></article>)}
          </div>
        </section>
      </section>
    </main>
  )
}
