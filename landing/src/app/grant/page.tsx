import {
  ArrowRight,
  BadgeCheck,
  CircleDollarSign,
  FileCheck2,
  Gauge,
  KeyRound,
  ListChecks,
  LockKeyhole,
  Network,
  Play,
  RadioTower,
  Rocket,
  ShieldCheck,
  Video,
  WalletCards,
} from "lucide-react"

import { LatestProofLink } from "../LatestProofLink"
import { SiteHeader } from "../SiteHeader"
import { arcNetworkResilience } from "../../lib/network-resilience"

export const metadata = {
  title: "Grant Review Package - Arc Suite",
  description: "A concise grant reviewer package for Arc Suite: demo flow, Circle integrations, current status and roadmap.",
}

const latestProofUrl = "/proof?id=flow_agentic_01a50e12e6c4"
const demoUrl = "https://treasury-umber.vercel.app/demo"
const releaseUrl = "https://github.com/maksutovdesign/arc-suite/releases/tag/v2026.07.09-multicurrency-wallet-ux"
const videoUrl = "https://drive.google.com/file/d/1TpkfepfGCEXDfh-YWIfGLRGuohHAJmjP/view?usp=sharing"

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
    detail: "Developer-controlled wallet path prepared for real agent wallet creation, read-only balance checks and settlement evidence.",
    icon: WalletCards,
  },
  {
    name: "Wallet OS / account layer",
    status: "Demo-ready",
    detail: "One agent-facing account surface for USDC spending, EURC invoices, FX-ready routes, card-like controls, CCTP and gas abstraction states.",
    icon: WalletCards,
  },
  {
    name: "x402 / Gateway",
    status: "Demo-ready",
    detail: "Signed offer and receipt architecture for machine-to-machine API payment flows.",
    icon: KeyRound,
  },
  {
    name: "Chainlink on Arc",
    status: "Testnet-ready",
    detail: "Oracle risk signal model uses Arc Testnet CCIP Router 0xdE4E...eab8 and chain selector 3034092155422581607 for reviewable route/data evidence.",
    icon: RadioTower,
  },
  {
    name: "Arc Network Resilience",
    status: "Testnet-ready",
    detail: "Load-aware states keep network congestion, retry scheduling and deferred settlement separate from product failures and agent reputation.",
    icon: ShieldCheck,
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
  ["Network resilience", arcNetworkResilience.summary],
  ["Application layer", "Wallet OS now models Arc-native money movement as one operational account instead of raw wallet/chain mechanics."],
  ["Circle Wallet execution", "Wallet OS exposes source wallet, token lookup and balance readiness before any policy-gated transfer is attempted."],
  ["Roadmap", "Grant unlocks live Arc deployment, Circle Wallets expansion, CCTP and contract work."],
] as const

const ecosystemSignals = [
  [
    "Arc x Chainlink",
    "Arc Suite maps this into Interop: CCIP route evidence, oracle risk hashes, feed freshness and proof-gated settlement states.",
  ],
  [
    "Arc x Pulsar",
    "Wallet OS follows the same app-layer pattern: one account surface for USDC/EURC balances, payments, FX-ready routes and hidden gas/CCTP state.",
  ],
  [
    "Arc status / load testing",
    "Ops and Interop separate network congestion from product failure, so jobs can retry or defer settlement without damaging agent reputation.",
  ],
] as const

const reviewerConsole = [
  {
    title: "Live demo",
    detail: "Open the working operator demo and inspect the product surface.",
    href: demoUrl,
    icon: Play,
    external: true,
  },
  {
    title: "Latest proof",
    detail: "Review x402 offer, policy chain, receipt and settlement evidence.",
    href: latestProofUrl,
    icon: FileCheck2,
    external: false,
  },
  {
    title: "Circle products",
    detail: "USDC is implemented; Wallets, x402/Gateway, Chainlink on Arc, CCTP, Paymaster and Contracts are staged by scope.",
    href: "#circle-fit",
    icon: CircleDollarSign,
    external: false,
  },
  {
    title: "Known limits",
    detail: "Clear review language for demo-ready rails and pending Arc mainnet deployment.",
    href: "#known-limits",
    icon: LockKeyhole,
    external: false,
  },
  {
    title: "Roadmap",
    detail: "Three milestone path from Arc deployment to on-chain reputation and public beta.",
    href: "#roadmap",
    icon: Rocket,
    external: false,
  },
  {
    title: "Release",
    detail: "Interop and Risk Router release with Chainlink/CCIP-ready route evidence.",
    href: releaseUrl,
    icon: ListChecks,
    external: true,
  },
  {
    title: "Video",
    detail: "Recorded product walkthrough for the formal grant submission.",
    href: videoUrl,
    icon: Video,
    external: true,
  },
] as const

const roadmap = [
  ["Weeks 1-4", "Arc deployment + Circle Wallets", "Deploy the core Treasury, Reputation and Marketplace infrastructure to Arc-ready production paths and expand real wallet creation/balance reads."],
  ["Weeks 5-8", "Multicurrency Wallet OS", "Connect the agent account layer to live balances, USDC/EURC account views, FX-ready routes, card-like spend controls and hidden gas/CCTP status."],
  ["Weeks 9-12", "On-chain reputation + x402 + oracle risk", "Move reputation score storage and API access gating toward on-chain records, complete the x402 payment loop and attach Chainlink data/CCIP route evidence to policy decisions."],
  ["Weeks 13-16", "CCTP / CCIP + public beta", "Add cross-chain USDC and interoperability support, provider onboarding, public docs and the first external API/provider integrations."],
] as const

const knownLimits = [
  "Arc mainnet deployment is pending external availability and grant scope.",
  "Some payment rails are settlement-ready demo paths until production Circle credentials are fully configured.",
  "Provider receipts include a demo provider signature for review until external providers onboard.",
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
              inspect the proof, confirm Circle integration status, and see how Arc-native money movement
              becomes an application layer for agents: balances, payments, FX routes, hidden gas and policy controls.
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

        <section className="grant-section" id="reviewer-console">
          <div className="submission-section-head">
            <p className="kicker">Reviewer console</p>
            <h2>One place for the grant review.</h2>
          </div>
          <div className="grant-console-grid">
            {reviewerConsole.map((item) => {
              const Icon = item.icon
              return (
                <a
                  href={item.href}
                  key={item.title}
                  target={item.external ? "_blank" : undefined}
                  rel={item.external ? "noreferrer" : undefined}
                >
                  <Icon size={19} />
                  <strong>{item.title}</strong>
                  <span>{item.detail}</span>
                  <ArrowRight size={15} />
                </a>
              )
            })}
          </div>
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

        <section className="grant-section" id="circle-fit">
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
              Chainlink oracle/CCIP readiness, Provider receipt validation and Reputation updates
              into one auditable operation. Wallet OS turns the same primitives into one account-style
              interface instead of exposing raw settlement mechanics to every operator.
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
            <p className="kicker">Ecosystem fit</p>
            <h2>Built around the latest Arc direction.</h2>
          </div>
          <div className="grant-status-grid">
            {ecosystemSignals.map(([title, detail]) => (
              <div key={title}>
                <RadioTower size={18} />
                <strong>{title}</strong>
                <p>{detail}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="grant-section" id="roadmap">
          <div className="submission-section-head">
            <p className="kicker">Roadmap</p>
            <h2>What the grant unlocks.</h2>
          </div>
          <div className="grant-roadmap">
            {roadmap.map(([time, title, detail]) => (
              <article key={title}>
                <span>{time}</span>
                <strong>{title}</strong>
                <p>{detail}</p>
              </article>
            ))}
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

        <section className="grant-limits" id="known-limits">
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
