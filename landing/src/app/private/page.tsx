import Link from "next/link"
import {
  BadgeCheck,
  CircleDollarSign,
  Eye,
  FileCheck2,
  KeyRound,
  LockKeyhole,
  Route,
  ShieldCheck,
  Workflow,
} from "lucide-react"

import { EcosystemNav } from "../EcosystemNav"

export const metadata = {
  title: "Kestrel Private — Private Stablecoin Payments",
  description: "Privacy-ready payment policy layer for Kestrel and private USDC commerce.",
}

const pipeline = [
  {
    icon: ShieldCheck,
    label: "Policy screen",
    title: "Screen first",
    text: "Kestrel Shield checks address risk, workspace limits and agent reputation before any private payment intent can be prepared.",
    state: "Required",
  },
  {
    icon: LockKeyhole,
    label: "Private intent",
    title: "Encrypt details",
    text: "Amount, counterparty and invoice context are represented as a private payment intent while policy-safe metadata stays auditable.",
    state: "Privacy layer",
  },
  {
    icon: CircleDollarSign,
    label: "USDC execution",
    title: "Prepare Arc path",
    text: "Kestrel Flow can route the approved payment to Circle wallets, a settlement-ready Arc Testnet path and provider reconciliation.",
    state: "Arc ready",
  },
  {
    icon: FileCheck2,
    label: "Selective proof",
    title: "Reveal only what is needed",
    text: "Operators, auditors or counterparties receive scoped proof: paid, allowed, within policy, or under review.",
    state: "View-key model",
  },
]

const useCases = [
  ["Private invoices", "Payment links and invoices where recipients can prove payment without exposing full counterparty context."],
  ["Agent x402 receipts", "API calls where the provider sees enough to serve the request while the buyer preserves commercial privacy."],
  ["Escrow milestones", "Milestone release/refund flows with private work value and auditable policy status."],
  ["RWA and FX desks", "Stablecoin settlement workflows where amounts, counterparties and compliance artifacts need different visibility levels."],
]

const revealPolicy = [
  ["Operator", "Full workspace audit trail", "Internal spend control and incident response"],
  ["Provider", "Paid / unpaid receipt", "Fulfillment without exposing the agent treasury"],
  ["Auditor", "Policy pass, chain, timestamp", "Compliance evidence without commercial leakage"],
  ["Public", "Minimal settlement evidence", "Forward-compatible explorer proof"],
]

const integrationFit = [
  ["Shield", "Screens address and risk before intent encryption"],
  ["Flow", "Runs the policy-gated execution path"],
  ["Billing", "Creates private x402 usage receipts"],
  ["Escrow", "Locks and releases value by private milestone state"],
  ["Wallet OS", "Controls signing policy and recovery scope"],
  ["Radar", "Tracks why privacy is the ecosystem gap"],
]

export default function PrivatePage() {
  return (
    <main>
      <EcosystemNav current="private" />
      <section className="private-shell">
        <div className="private-hero">
          <div>
            <p className="kicker">Private stablecoin payments</p>
            <h1>Privacy for agent payments without losing policy control.</h1>
            <p>
              Kestrel Private is the missing wedge from the builder map: private, compliant
              USDC payment intents for agents, APIs, invoices and escrow flows. The
              product keeps sensitive payment context private while exposing the exact
              proof each party needs to trust the transaction.
            </p>
            <div className="radar-actions">
              <Link className="button primary" href="#pipeline"><LockKeyhole size={16} /> View privacy pipeline</Link>
              <Link className="button secondary" href="/radar"><Eye size={16} /> Open Radar gap</Link>
            </div>
          </div>

          <div className="private-proof-card" aria-label="Kestrel Private proof preview">
            <div className="private-proof-top">
              <span>ARC PRIVATE / PAYMENT INTENT</span>
              <strong>POLICY-SAFE</strong>
            </div>
            <div className="private-proof-receipt">
              <div>
                <span>Private invoice</span>
                <strong>INV-ARC-2048</strong>
              </div>
              <div>
                <span>Amount</span>
                <strong>128.40 USDC</strong>
              </div>
              <div>
                <span>Payer</span>
                <strong>•••• 7F2A</strong>
              </div>
              <div>
                <span>Provider</span>
                <strong>•••• 91C0</strong>
              </div>
            </div>
            <div className="private-proof-grid">
              <div><span>Screening</span><strong>PASS</strong></div>
              <div><span>Budget</span><strong>OK</strong></div>
              <div><span>Reveal</span><strong>SCOPED</strong></div>
            </div>
            <div className="private-proof-hash">
              <span>Settlement evidence</span>
              <strong>0x9c4e...71b2</strong>
            </div>
          </div>
        </div>

        <div className="private-thesis">
          <article>
            <span>Builder signal</span>
            <strong>Privacy is sparse</strong>
            <p>Radar found many payment, DeFi and x402 builders, but almost no general-purpose private payment UX.</p>
          </article>
          <article>
            <span>Kestrel wedge</span>
            <strong>Compliance plus privacy</strong>
            <p>Kestrel already has Shield, Flow, Billing, Escrow and Wallets; Private turns them into a differentiated lane.</p>
          </article>
          <article>
            <span>MVP shape</span>
            <strong>Selective disclosure</strong>
            <p>Start with private intents and proof views, then connect to future Arc privacy primitives when available.</p>
          </article>
        </div>

        <section className="private-section" id="pipeline">
          <div className="section-heading compact">
            <p className="kicker">Reference flow</p>
            <h2>Screen, encrypt, settle, reveal.</h2>
            <p>
              The first MVP should not promise impossible privacy. It should make a
              forward-compatible pattern visible: policy-safe metadata, private
              commercial context and scoped proof for each participant.
            </p>
          </div>
          <div className="private-pipeline">
            {pipeline.map((step, index) => {
              const Icon = step.icon
              return (
                <article key={step.label}>
                  <div className="private-step-index">{String(index + 1).padStart(2, "0")}</div>
                  <Icon size={22} />
                  <span>{step.label}</span>
                  <h3>{step.title}</h3>
                  <p>{step.text}</p>
                  <strong>{step.state}</strong>
                </article>
              )
            })}
          </div>
        </section>

        <section className="private-section private-split">
          <article className="private-panel">
            <div className="private-panel-title">
              <div>
                <span>Use cases</span>
                <h2>Where private payments matter first</h2>
              </div>
              <Route size={22} />
            </div>
            <div className="private-usecase-list">
              {useCases.map(([title, text]) => (
                <div key={title}>
                  <BadgeCheck size={17} />
                  <span><strong>{title}</strong><small>{text}</small></span>
                </div>
              ))}
            </div>
          </article>

          <article className="private-panel">
            <div className="private-panel-title">
              <div>
                <span>Selective disclosure</span>
                <h2>Different parties need different proof</h2>
              </div>
              <KeyRound size={22} />
            </div>
            <div className="private-reveal-table">
              {revealPolicy.map(([party, proof, purpose]) => (
                <div key={party}>
                  <strong>{party}</strong>
                  <span>{proof}</span>
                  <small>{purpose}</small>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="private-section private-fit">
          <div className="section-heading compact">
            <p className="kicker">Suite integration</p>
            <h2>Kestrel Private makes existing modules more defensible.</h2>
          </div>
          <div className="private-fit-grid">
            {integrationFit.map(([name, text]) => (
              <article key={name}>
                <Workflow size={19} />
                <h3>Arc {name}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </section>
      </section>
    </main>
  )
}
