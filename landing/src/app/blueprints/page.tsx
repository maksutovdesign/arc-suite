import Link from "next/link"
import {
  BadgeCheck,
  Boxes,
  CircleDollarSign,
  Code2,
  FileCheck2,
  GitBranch,
  Handshake,
  LockKeyhole,
  ReceiptText,
  ShieldCheck,
  Workflow,
  Zap,
} from "lucide-react"

import { EcosystemNav } from "../EcosystemNav"

export const metadata = {
  title: "Arc Blueprints — Builder Templates",
  description: "Reference templates for Arc builders using Circle wallets, x402, CCTP, escrow, gas and private payment flows.",
}

const blueprints = [
  {
    icon: ReceiptText,
    name: "USDC Checkout",
    category: "Payments",
    source: "Arclet / ArcPay pattern",
    modules: ["Billing", "Wallet OS", "Flow", "Private"],
    steps: ["Create payment intent", "Screen recipient", "Collect USDC", "Issue scoped receipt"],
    status: "Ready for MVP",
  },
  {
    icon: Zap,
    name: "Agent x402 API",
    category: "Agentic",
    source: "AuraGate / ProoVra pattern",
    modules: ["Marketplace", "Billing", "Reputation", "Escrow"],
    steps: ["Discover API", "Check reputation", "Meter request", "Settle provider"],
    status: "High priority",
  },
  {
    icon: Handshake,
    name: "Milestone Escrow",
    category: "B2B",
    source: "KarwanBuild / PayX pattern",
    modules: ["Escrow", "Shield", "Flow", "Execution"],
    steps: ["Create deal", "Fund milestone", "Submit proof", "Release or refund"],
    status: "Built surface",
  },
  {
    icon: CircleDollarSign,
    name: "Stablecoin FX Desk",
    category: "FX / RWA",
    source: "ArcSwap / QCAD pattern",
    modules: ["Treasury", "Shield", "Flow", "Radar"],
    steps: ["Quote pair", "Check limits", "Execute settlement", "Record audit"],
    status: "Opportunity",
  },
  {
    icon: Boxes,
    name: "Machine Payments",
    category: "M2M",
    source: "TLAY pattern",
    modules: ["Wallet OS", "Gas", "Billing", "Ops"],
    steps: ["Provision wallet", "Apply gas policy", "Meter usage", "Monitor device"],
    status: "Infra fit",
  },
  {
    icon: LockKeyhole,
    name: "Private Invoice",
    category: "Privacy",
    source: "NexusYield gap expansion",
    modules: ["Private", "Shield", "Flow", "Billing"],
    steps: ["Screen payer", "Encrypt context", "Settle USDC", "Reveal proof"],
    status: "Differentiated",
  },
]

const buildTracks = [
  ["Day 1", "Static template", "Product page, data model, fixture data and smoke coverage."],
  ["Day 3", "Live API path", "Supabase tables, API route, scoped workspace key and audit rows."],
  ["Day 7", "Settlement path", "Circle wallet or provider execution, idempotency and webhook reconciliation."],
  ["Day 14", "Pilot handoff", "Demo workspace, analytics event, investor proof and release note."],
]

const primitives = [
  ["Circle Wallets", "Custody, signing, recovery and wallet lifecycle"],
  ["x402 / Gateway", "Pay-per-request API access and receipts"],
  ["CCTP / StableFX", "Cross-chain and multi-currency settlement patterns"],
  ["Gas Station / Paymaster", "Sponsored transactions and agent-level gas controls"],
  ["Compliance Engine", "Screening signal before private or public value movement"],
  ["Supabase", "Audit log, sessions, leads, monitor and pilot state"],
]

export default function BlueprintsPage() {
  return (
    <main>
      <EcosystemNav current="blueprints" />
      <section className="blueprints-shell">
        <div className="blueprints-hero">
          <div>
            <p className="kicker">Builder reference templates</p>
            <h1>Turn ecosystem signal into repeatable product templates.</h1>
            <p>
              Arc Blueprints converts Radar research into buildable templates for the
              strongest public Arc patterns: payments, agentic x402, escrow, stablecoin
              FX, machine payments and private invoices.
            </p>
            <div className="radar-actions">
              <Link className="button primary" href="#templates"><Boxes size={16} /> View templates</Link>
              <Link className="button secondary" href="/radar"><GitBranch size={16} /> Source: Radar</Link>
            </div>
          </div>
          <div className="blueprints-stack-card" aria-label="Arc Blueprint template stack">
            <div className="private-proof-top"><span>ARC BLUEPRINTS / TEMPLATE STACK</span><strong>6 PATTERNS</strong></div>
            {["Policy", "Wallet", "Meter", "Settle", "Receipt"].map((item, index) => (
              <div className="blueprint-stack-row" key={item}>
                <i>{String(index + 1).padStart(2, "0")}</i>
                <span>{item}</span>
                <strong>{index === 4 ? "Proof" : "Module"}</strong>
              </div>
            ))}
          </div>
        </div>

        <section className="blueprints-section" id="templates">
          <div className="section-heading compact">
            <p className="kicker">Templates</p>
            <h2>Six reference flows from the Arc builder map.</h2>
            <p>
              Each blueprint names the observed ecosystem pattern, the Kestrel modules
              that implement it, and the shortest path from static demo to pilot-ready MVP.
            </p>
          </div>
          <div className="blueprints-grid">
            {blueprints.map((blueprint) => {
              const Icon = blueprint.icon
              return (
                <article key={blueprint.name}>
                  <div className="blueprint-card-top">
                    <Icon size={22} />
                    <span>{blueprint.category}</span>
                  </div>
                  <h3>{blueprint.name}</h3>
                  <p>{blueprint.source}</p>
                  <div className="blueprint-modules">
                    {blueprint.modules.map((module) => <span key={module}>{module}</span>)}
                  </div>
                  <ol>
                    {blueprint.steps.map((step) => <li key={step}>{step}</li>)}
                  </ol>
                  <strong>{blueprint.status}</strong>
                </article>
              )
            })}
          </div>
        </section>

        <section className="blueprints-section blueprints-split">
          <article className="private-panel">
            <div className="private-panel-title">
              <div>
                <span>Build cadence</span>
                <h2>Every template follows the same launch path.</h2>
              </div>
              <Code2 size={22} />
            </div>
            <div className="blueprint-track-list">
              {buildTracks.map(([time, title, text]) => (
                <div key={time}>
                  <strong>{time}</strong>
                  <span>{title}</span>
                  <p>{text}</p>
                </div>
              ))}
            </div>
          </article>
          <article className="private-panel">
            <div className="private-panel-title">
              <div>
                <span>Primitive map</span>
                <h2>Circle and Arc primitives become implementation blocks.</h2>
              </div>
              <ShieldCheck size={22} />
            </div>
            <div className="blueprint-primitive-list">
              {primitives.map(([name, text]) => (
                <div key={name}>
                  <BadgeCheck size={16} />
                  <span><strong>{name}</strong><small>{text}</small></span>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="blueprints-section blueprint-proof-band">
          <FileCheck2 size={24} />
          <div>
            <p className="kicker">Investor proof</p>
            <h2>Blueprints make Kestrel feel expandable, not scattered.</h2>
            <p>
              The project now has a visible mechanism for adding new products from ecosystem demand:
              Radar finds the pattern, Blueprints standardizes it, then Flow, Billing, Shield,
              Private, Wallet OS and Ops turn it into a pilotable module.
            </p>
          </div>
          <Workflow size={24} />
        </section>
      </section>
    </main>
  )
}
