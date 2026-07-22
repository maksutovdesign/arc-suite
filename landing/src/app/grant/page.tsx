import {
  ArrowRight,
  BadgeCheck,
  CircleDollarSign,
  FileCheck2,
  Gauge,
  HandCoins,
  Layers3,
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
  title: "Grant Review Package - Kestrel",
  description: "A measurable grant package for Kestrel: App Kit execution, monetization, proof, milestones and production roadmap.",
}

const latestProofUrl = "/proof?id=flow_agentic_01a50e12e6c4"
const demoUrl = "https://arcsuite-app.vercel.app/judge"
const releaseUrl = "https://github.com/maksutovdesign/arc-suite/releases/tag/v2026.07.22-kestrel-app-kit"
const videoUrl = "https://drive.google.com/file/d/1TpkfepfGCEXDfh-YWIfGLRGuohHAJmjP/view?usp=sharing"

const reviewerSteps = [
  ["01", "Open Judge Mode", "Start from the guided one-page reviewer flow."],
  ["02", "Run workflow", "Trigger policy check, x402 offer, receipt and reputation update."],
  ["03", "Open proof", "Review settlement evidence, signed receipt and policy chain."],
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
    name: "Transaction memos",
    status: "Demo-ready",
    detail: "Proof records now include invoice, agent, customer and batch references so a transaction hash can be reconciled by downstream systems.",
    icon: FileCheck2,
  },
  {
    name: "Unified Balance Kit",
    status: "Integrated",
    detail: "The Money Movement console uses App Kit estimateSpend/spend with auto-allocation, forwarding, custom fees and resumable error handling.",
    icon: HandCoins,
  },
  {
    name: "Swap Kit / liquidity",
    status: "Integrated",
    detail: "The App Kit adapter estimates and executes USDC/EURC swaps with slippage, approve strategy and a disclosed developer fee.",
    icon: Network,
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
    status: "Integrated",
    detail: "App Kit Bridge uses CCTP for supported Arc Testnet routes and preserves retryable step state, hashes and explorer URLs.",
    icon: Network,
  },
  {
    name: "Paymaster / Gas",
    status: "Planned",
    detail: "Kestrel Gas models sponsored transactions, per-agent limits and USDC-funded execution policies.",
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
  ["Review proof", "Proof pages connect workflow id, policy checks, x402 receipt and settlement evidence."],
  ["Monitoring", "Production monitor, Sentry runtime and Ops Health surface are active."],
  ["Network resilience", arcNetworkResilience.summary],
  ["Application layer", "Wallet OS now models Arc-native money movement as one operational account instead of raw wallet/chain mechanics."],
  ["Transaction memos", "Proof pages now attach business context to payment evidence: invoice, agent, customer and batch references."],
  ["App Kit core", "The Money Movement console imports the official App Kit SDK and exposes live estimate/execute paths for Unified Balance, Bridge, Swap and Send."],
  ["Signed execution policy", "Every live execution now requires a fresh wallet signature, recipient allowlist approval, Circle compliance screening, amount-cap validation and a server-issued policy proof."],
  ["Monetization", "A 75 bps developer fee is disclosed before signature, with the 90% Kestrel / 10% Arc split shown explicitly."],
  ["Circle Wallet execution", "Wallet OS exposes source wallet, token lookup and balance readiness before any policy-gated transfer is attempted."],
  ["Roadmap", "Grant unlocks live Arc deployment, Circle Wallets expansion, CCTP and contract work."],
] as const

const ecosystemSignals = [
  [
    "Arc x Chainlink",
    "Kestrel maps this into Interop: CCIP route evidence, oracle risk hashes, feed freshness and proof-gated settlement states.",
  ],
  [
    "Arc x Pulsar",
    "Wallet OS follows the same app-layer pattern: one account surface for USDC/EURC balances, payments, FX-ready routes and hidden gas/CCTP state.",
  ],
  [
    "Transaction memos",
    "Proof now treats memo context as first-class evidence, so settlement evidence can map back to invoices, jobs, customers and batches.",
  ],
  [
    "Stablecoin Kits",
    "Kestrel uses the official App Kit SDK for Unified Balance, Swap, Bridge and Send while keeping low-level routing complexity behind one product flow.",
  ],
  [
    "Arc x Tradable / Uniswap",
    "The roadmap now includes private-credit style deal lifecycle, compliance evidence and liquidity-aware stablecoin routes for provider settlement.",
  ],
  [
    "Arc status / load testing",
    "Ops and Interop separate network congestion from product failure, so jobs can retry or defer settlement without damaging agent reputation.",
  ],
] as const

const arcDocsAlignment = [
  [
    "Transaction memos",
    "Proof now treats a payment as more than a hash: invoiceRef, jobId, agentId, providerId, batchRef and policy state are attached to the same proof envelope.",
    "/proof",
    FileCheck2,
  ],
  [
    "Gateway -> Unified Balance",
    "Wallet OS maps Gateway deposit, balance, spend, forwarding and tx-hash capture into one operator-facing account surface.",
    "/wallets",
    HandCoins,
  ],
  [
    "Stablecoin Kits",
    "Flow and Wallet OS model bridge, swap, forwarded spend, failed trace and latest on-chain transaction hash states as product-level evidence.",
    "/flow",
    Layers3,
  ],
  [
    "CCIP / Chainlink on Arc",
    "Interop exposes route, router, selector, oracleRiskHash, feed freshness, RPC health and artifact-gating status before settlement finalization.",
    "/interop",
    RadioTower,
  ],
  [
    "Network resilience",
    "Ops and Interop separate Arc Testnet congestion, retries and deferred settlement from product failures and reputation penalties.",
    "/ops",
    ShieldCheck,
  ],
] as const

const nextBuildOrder = [
  ["01", "Independent identity", "Kestrel leads every product surface; Arc appears only as the supported network and the Built on Arc infrastructure signature."],
  ["02", "App Kit execution", "Ship Unified Balance → Swap/Bridge → Arc settlement as one wallet-signed flow with preflight estimates."],
  ["03", "Revenue + proof", "Collect developer fees, disclose the full breakdown and persist hashes, explorer links, trace IDs and recovery state."],
  ["04", "Production controls", "Connect Turnkey policy signing, one compliance provider, Goldsky events and live oracle freshness checks."],
  ["05", "Measured pilots", "Onboard pilot operators and report wallets, volume, execution success, proof completeness, fee revenue and recovery time."],
] as const

const grantMetrics = [
  ["Pilot adoption", "3 design partners", "Operator, API provider and treasury team using the same execution flow."],
  ["Transaction volume", "1,000 testnet operations", "Send, Bridge, Swap and Unified Balance executions with unique trace IDs."],
  ["Settled volume", "10,000 USDC", "Cumulative testnet volume before a production rollout decision."],
  ["Proof completeness", "> 99%", "Settled operations with policy, fee, hash, explorer and receipt evidence."],
  ["Execution reliability", "> 95%", "Operations reaching a terminal state without manual intervention."],
  ["Recovery objective", "< 10 minutes", "Resumable destination-mint failures retried before attestation expiration."],
  ["Revenue signal", "75 bps", "Disclosed fee; 90% of the custom fee routes to Kestrel and 10% to Arc."],
  ["Quote performance", "p95 < 3 seconds", "Route and fee estimate returned before a wallet signature is requested."],
] as const

const reviewerConsole = [
  {
    title: "Money Movement",
    detail: "Estimate and execute Unified Balance, Bridge, Swap or Send with fees and proof.",
    href: "/money",
    icon: HandCoins,
    external: false,
  },
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
    title: "Wallet readiness",
    detail: "Check Circle source wallet, token lookup, readable balance and transfer guardrails.",
    href: "/wallets",
    icon: WalletCards,
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
    title: "Version tag",
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
  ["Weeks 1-4", "Execution beta", "Validate the live App Kit flow, persist transaction proofs, add route telemetry and complete the first 100 wallet-signed testnet operations."],
  ["Weeks 5-8", "Policy and compliance", "Add Turnkey-backed agent signing, a provider-neutral risk adapter and fail-closed checks before quote confirmation."],
  ["Weeks 9-12", "Data and reconciliation", "Stream onchain events through Goldsky, reconcile App Kit operations and expose success, latency, volume and fee dashboards."],
  ["Weeks 13-16", "Pilots and revenue", "Onboard three design partners, cross 1,000 testnet operations and validate the 75 bps execution-fee model."],
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
            <h1>Kestrel is a production control plane for agentic money movement.</h1>
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
            <strong>Production path defined</strong>
            <p>Independent brand, live App Kit adapter, fee model and measurable milestones.</p>
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

        <section className="grant-section">
          <div className="submission-section-head">
            <p className="kicker">Arc docs alignment</p>
            <h2>Mapped to primitives reviewers already care about.</h2>
          </div>
          <div className="grant-console-grid">
            {arcDocsAlignment.map(([title, detail, href, Icon]) => (
              <a href={href as string} key={title as string}>
                <Icon size={19} />
                <strong>{title as string}</strong>
                <span>{detail as string}</span>
                <ArrowRight size={15} />
              </a>
            ))}
          </div>
        </section>

        <section className="grant-section">
          <div className="submission-section-head">
            <p className="kicker">Next build order</p>
            <h2>What we should implement next.</h2>
          </div>
          <div className="grant-reviewer-grid">
            {nextBuildOrder.map(([index, title, detail]) => (
              <div key={title}>
                <i>{index}</i>
                <strong>{title}</strong>
                <span>{detail}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="grant-section" id="grant-metrics">
          <div className="submission-section-head">
            <p className="kicker">Measurable milestones</p>
            <h2>What grant progress will be measured against.</h2>
          </div>
          <div className="grant-status-grid">
            {grantMetrics.map(([title, target, detail]) => (
              <div key={title}>
                <Gauge size={18} />
                <strong>{title}</strong>
                <p><b>{target}</b> · {detail}</p>
              </div>
            ))}
          </div>
          <div className="grant-proof-links">
            <a href="https://docs.arc.io/app-kit" target="_blank" rel="noreferrer">App Kit docs <ArrowRight size={15} /></a>
            <a href="https://docs.arc.io/app-kit/concepts/unified-balance-fees" target="_blank" rel="noreferrer">Unified Balance fees <ArrowRight size={15} /></a>
            <a href="https://community.arc.io/en/public/blogs/circle-developer-grants-program-relaunches-2026-05-14" target="_blank" rel="noreferrer">Circle Developer Grants <ArrowRight size={15} /></a>
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
