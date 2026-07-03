"use client"

import { useMemo, useState } from "react"
import {
  BadgeCheck,
  Boxes,
  Braces,
  Fuel,
  Handshake,
  Landmark,
  LockKeyhole,
  Network,
  Radar,
  ReceiptText,
  ShieldCheck,
  Store,
  WalletCards,
  Workflow,
} from "lucide-react"
import { LatestProofLink } from "./LatestProofLink"
import { RequestPilotForm } from "./RequestPilotForm"
import { SiteHeader } from "./SiteHeader"
import { trackLandingConversion } from "@/lib/analytics"
import type { PilotSummary } from "@/lib/backend/schema"

const productDetails = [
  {
    key: "treasury",
    name: "Arc Treasury",
    eyebrow: "Spend control",
    icon: Landmark,
    title: "Operator-grade spend control for AI-agent wallets.",
    text: "Set budgets, daily caps, alert thresholds and wallet rules before agents start buying data, compute, storage or API calls with USDC.",
    image: "/screenshots/treasury-dashboard-20260603.png",
    imageAlt: "Arc Treasury dashboard with managed USDC, spend charts, budget alerts and agent wallet controls",
    stats: [
      ["$3,072.93", "managed USDC"],
      ["$1,527.07", "monthly spend"],
      ["3", "active alerts"],
    ],
    bullets: ["Monthly and daily limits", "Critical budget alerts", "Wallet-level reporting"],
  },
  {
    key: "reputation",
    name: "Arc Reputation",
    eyebrow: "Trust layer",
    icon: BadgeCheck,
    title: "A live trust score for autonomous economic behavior.",
    text: "Score agents from 0-1000 using payment success, volume consistency, response time, dispute history and account age.",
    image: "/screenshots/reputation-leaderboard.png",
    imageAlt: "Arc Reputation leaderboard with trust scores, tiers, score deltas and live events",
    stats: [
      ["961", "top score"],
      ["6", "demo agents"],
      ["5", "risk dimensions"],
    ],
    bullets: ["Queryable trust profile", "Score deltas and tiers", "Access-ready risk signal"],
  },
  {
    key: "marketplace",
    name: "Arc Marketplace",
    eyebrow: "x402 access",
    icon: Store,
    title: "A pay-per-use API market that can gate requests by trust.",
    text: "Help agents discover x402 APIs with pricing, uptime, provider profiles, request volume, Chainlink-powered oracle categories and integration-ready detail pages.",
    image: "/screenshots/marketplace-browse.png",
    imageAlt: "Arc Marketplace browse page with x402 API cards, filters, pricing, uptime and provider data",
    stats: [
      ["143", "APIs listed"],
      ["58", "providers"],
      ["99.72%", "avg uptime"],
    ],
    bullets: ["x402 API discovery", "Oracle-powered API categories", "USDC-native access path"],
  },
  {
    key: "provider",
    name: "Arc Provider",
    eyebrow: "Receipt trust center",
    icon: Braces,
    title: "Provider-side proof that paid agent requests are safe to fulfill.",
    text: "Give API providers a receipt registry with signing key metadata, paid job history, settlement references and proof links for every agentic x402 purchase.",
    image: "",
    imageAlt: "Arc Provider trust center showing provider signing keys, paid receipt registry and Arc proof links",
    stats: [
      ["12", "recent receipts"],
      ["ed25519", "provider signing"],
      ["100%", "proof-linked jobs"],
    ],
    bullets: ["Provider signing metadata", "Paid job reconciliation", "Proof-linked fulfillment"],
  },
  {
    key: "shield",
    name: "Arc Shield",
    eyebrow: "Compliance & risk",
    icon: ShieldCheck,
    title: "Address screening and auditable policy decisions before value moves.",
    text: "Use Circle Compliance Engine and Chainlink on Arc signals to classify wallet, market, reserve and route risk before value moves.",
    image: "/screenshots/shield-console.png",
    imageAlt: "Arc Shield compliance dashboard with wallet screening, policy decision and audit log",
    stats: [
      ["3", "policy outcomes"],
      ["30", "checks / 10 min"],
      ["100%", "auditable decisions"],
    ],
    bullets: ["Circle address screening", "Chainlink market and CCIP evidence", "Allow, review and block policy"],
  },
  {
    key: "flow",
    name: "Arc Flow",
    eyebrow: "Payment orchestration",
    icon: Workflow,
    title: "One policy-gated path from intent to settlement proof.",
    text: "Orchestrate Shield screening, Chainlink oracle/CCIP evidence, reputation and budget access checks, Circle wallet execution readiness, Arc settlement references and the resulting reputation update under one run ID.",
    image: "",
    imageAlt: "Arc Flow pipeline showing screening, access policy, settlement reference and reputation update",
    stats: [
      ["4", "atomic stages"],
      ["1", "auditable run ID"],
      ["P0", "launch priority"],
    ],
    bullets: ["Fail-closed compliance gate", "Oracle-aware policy evidence", "End-to-end execution history"],
  },
  {
    key: "billing",
    name: "Arc Billing",
    eyebrow: "x402 metering",
    icon: ReceiptText,
    title: "Usage-based billing for APIs that software can buy autonomously.",
    text: "Meter every API call, deduct prepaid USDC credits atomically, issue invoices and aggregate nanopayments into settlement-ready provider batches.",
    image: "",
    imageAlt: "Arc Billing console with prepaid balances, usage metering, invoices and nanopayment batches",
    stats: [
      ["402", "payment-native HTTP"],
      ["6 dp", "USDC metering"],
      ["1", "atomic usage ledger"],
    ],
    bullets: ["Prepaid agent balances", "Plans, usage and invoices", "Batched provider settlement"],
  },
  {
    key: "escrow",
    name: "Arc Escrow",
    eyebrow: "Programmable deals",
    icon: Handshake,
    title: "Milestone contracts for autonomous commercial relationships.",
    text: "Create agent-to-agent agreements, hold value against delivery milestones, open disputes and release or refund USDC through confirmed Circle contract execution.",
    image: "",
    imageAlt: "Arc Escrow console showing locked value, agent deals, milestones and dispute events",
    stats: [
      ["3", "milestone states"],
      ["2", "financial outcomes"],
      ["100%", "event-audited"],
    ],
    bullets: ["Milestone state machine", "Release, refund and disputes", "Arc onchain event receipts"],
  },
  {
    key: "gas",
    name: "Arc Gas",
    eyebrow: "Gas sponsorship",
    icon: Fuel,
    title: "Agent-level gas policy for every sponsored transaction.",
    text: "Route transactions through Circle Gas Station or Paymaster modes, enforce per-agent USDC limits and preserve every sponsor or deny decision for reporting.",
    image: "",
    imageAlt: "Arc Gas dashboard showing sponsorship limits, payment modes and transaction reporting",
    stats: [
      ["2", "Circle gas modes"],
      ["3", "limit layers"],
      ["100%", "decision-audited"],
    ],
    bullets: ["Per-agent gas limits", "Gas Station and Paymaster modes", "Sponsored transaction ledger"],
  },
  {
    key: "interop",
    name: "Arc Interop",
    eyebrow: "CCIP route",
    icon: Network,
    title: "Cross-chain route evidence for Arc treasury and collateral flows.",
    text: "Show how Arc Suite prepares CCIP route runs with Chainlink router metadata, Arc Testnet selector, message status and proof hashes before settlement finalization.",
    image: "",
    imageAlt: "Arc Interop console showing Arc Testnet to Ethereum Sepolia CCIP route status, selector, router and proof hash",
    stats: [
      ["CCIP", "route-ready"],
      ["303409...", "Arc selector"],
      ["1", "proof envelope"],
    ],
    bullets: ["Arc to Sepolia route view", "Router and selector evidence", "Proof hash before finalization"],
  },
  {
    key: "wallets",
    name: "Arc Wallet OS",
    eyebrow: "Wallet lifecycle",
    icon: WalletCards,
    title: "One operating system for team, client and agent wallets.",
    text: "Manage developer-controlled, user-controlled and modular Circle wallets with custody-aware roles, recovery paths, signing policies and an auditable lifecycle.",
    image: "",
    imageAlt: "Arc Wallet OS dashboard with custody models, signing policy, roles and lifecycle events",
    stats: [
      ["3", "custody models"],
      ["4", "workspace roles"],
      ["100%", "lifecycle-audited"],
    ],
    bullets: ["Circle wallet registry", "Roles, recovery and signing policy", "Provider-confirmed lifecycle"],
  },
  {
    key: "radar",
    name: "Arc Radar",
    eyebrow: "Builder intelligence",
    icon: Radar,
    title: "A live map of Arc builders, primitives, traction and open gaps.",
    text: "Turn ecosystem research into a product asset: map active builders, detect crowded categories, identify privacy gaps and show where Arc Suite can become the operating layer.",
    image: "",
    imageAlt: "Arc Radar dashboard showing Arc builder categories, primitives, opportunity gaps and Arc Suite fit",
    stats: [
      ["17", "mapped builders"],
      ["9", "categories"],
      ["1", "privacy wedge"],
    ],
    bullets: ["Builder and primitive map", "Opportunity gap analysis", "Arc Suite integration fit"],
  },
  {
    key: "private",
    name: "Arc Private",
    eyebrow: "Private payments",
    icon: LockKeyhole,
    title: "Private, compliant USDC payment intents for agents and APIs.",
    text: "Preserve sensitive commercial context while exposing policy-safe proof: screened, paid, within limits and selectively revealable to operators, providers and auditors.",
    image: "",
    imageAlt: "Arc Private console showing encrypted payment intent, policy decision, scoped proof and USDC settlement status",
    stats: [
      ["4", "proof scopes"],
      ["1", "privacy wedge"],
      ["P0", "strategic gap"],
    ],
    bullets: ["Private payment intents", "Selective disclosure model", "Shield and Flow ready"],
  },
  {
    key: "blueprints",
    name: "Arc Blueprints",
    eyebrow: "Builder templates",
    icon: Boxes,
    title: "Reference templates for the strongest Arc builder patterns.",
    text: "Convert Radar research into repeatable implementation paths for checkout, agent x402, escrow, FX/RWA, machine payments and private invoices.",
    image: "",
    imageAlt: "Arc Blueprints console showing template cards, module stacks, build cadence and Circle primitive map",
    stats: [
      ["6", "templates"],
      ["14d", "pilot path"],
      ["1", "repeatable method"],
    ],
    bullets: ["Payments and x402 templates", "Circle primitive map", "Pilot launch cadence"],
  },
]

const steps = [
  ["Spend", "Agents initiate USDC payments for data, compute, storage, swaps, and API calls."],
  ["Behavior", "Transactions, disputes, failures, latency, and usage patterns become live risk signals."],
  ["Reputation", "Signals roll into a trust score that services can query before serving a request."],
  ["Access", "APIs accept reliable agents and deny risky ones before value is delivered."],
]

const metrics = [
  ["14", "connected products"],
  ["25,482", "agent transactions in demo"],
  ["24.8M", "marketplace request volume"],
  ["99.72%", "average uptime in marketplace stats"],
]

const treasuryResults = [
  ["Managed USDC", "$3,072.93", "Across all demo wallets"],
  ["Monthly spend", "$1,527.07", "of $4,400 total budget"],
  ["Active alerts", "3", "2 critical, 1 warning"],
  ["Avg tx cost", "$0.061", "Across agent activity"],
]

const reputationScores = [
  ["DataHarvester-Pro", 961, "+14", "Platinum"],
  ["IoT-Gateway-01", 944, "+8", "Platinum"],
  ["TradeBot-Alpha", 812, "-23", "Gold"],
  ["ContentGen-v2", 789, "+31", "Gold"],
  ["ResearchAssist", 634, "+5", "Silver"],
  ["AuditBot-Corp", 150, "+150", "New"],
]

const marketplaceResults = [
  ["APIs listed", "143", "Marketplace stat"],
  ["Providers", "58", "Verified and unverified"],
  ["Requests", "24.8M", "Total request volume"],
  ["Avg uptime", "99.72%", "Across API catalog"],
]

const categoryMix = [
  ["Finance", 31],
  ["AI / LLM", 27],
  ["Data feeds", 24],
  ["Compute", 18],
  ["Oracles", 15],
]

const formatUsd = (value: number) =>
  new Intl.NumberFormat("en-US", {
    currency: "USD",
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
    style: "currency",
  }).format(value)

const formatCompact = (value: number) =>
  new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 1,
    notation: "compact",
  }).format(value)

const story = [
  {
    title: "Operators set policy",
    text: "Teams define budgets, daily caps, auto-pause rules, alert thresholds, and reporting boundaries for every agent wallet.",
  },
  {
    title: "Agents transact",
    text: "Agents pay for API calls, swaps, compute, storage, data feeds, and bridge actions using USDC-native workflows.",
  },
  {
    title: "The system scores risk",
    text: "Payment success, disputes, response time, volume consistency, and age produce a live reputation profile.",
  },
  {
    title: "Services enforce access",
    text: "x402 APIs query the trust layer before fulfillment, so risky agents can be denied before value is delivered.",
  },
]

const liveDemoUrl = "https://treasury-umber.vercel.app/demo"
const latestProofUrl = "/proof?id=flow_agentic_01a50e12e6c4"
const realSettlementExplorerUrl =
  "https://testnet.arcscan.app/tx/0x41210539368a78f6bbc08b088a95430dc0f64e9379ad9226173fc3ce565d733b"

type ProductLandingClientProps = {
  initialApiStatus: "live" | "fallback"
  initialPilotSummary: PilotSummary | null
}

export function ProductLandingClient({ initialApiStatus, initialPilotSummary }: ProductLandingClientProps) {
  const [activeProductKey, setActiveProductKey] = useState(productDetails[0].key)
  const pilotSummary = initialPilotSummary
  const apiStatus = initialApiStatus
  const liveProductDetails = useMemo(() => {
    if (!pilotSummary) return productDetails
    return productDetails.map((product) => {
      if (product.key === "treasury") {
        return {
          ...product,
          stats: [
            [formatUsd(pilotSummary.treasury.managedUsdc), "managed USDC"],
            [formatUsd(pilotSummary.treasury.monthlySpentUsdc), "monthly spend"],
            [String(pilotSummary.treasury.activeAlerts), "active alerts"],
          ],
        }
      }

      if (product.key === "reputation") {
        return {
          ...product,
          stats: [
            [String(pilotSummary.reputation.topScore), "top score"],
            [String(pilotSummary.reputation.agentsScored), "scored agents"],
            [String(pilotSummary.reputation.dimensions), "risk dimensions"],
          ],
        }
      }

      if (product.key === "marketplace") {
        return {
          ...product,
          stats: [
            [String(pilotSummary.marketplace.apisListed), "APIs listed"],
            [String(pilotSummary.marketplace.providers), "providers"],
            [`${pilotSummary.marketplace.avgUptimePct}%`, "avg uptime"],
          ],
        }
      }

      return product
    })
  }, [pilotSummary])
  const activeProduct = liveProductDetails.find((product) => product.key === activeProductKey) ?? liveProductDetails[0]
  const liveMetrics = pilotSummary
    ? [
        ["14", "connected products"],
        [formatCompact(pilotSummary.marketplace.requests), "marketplace request volume"],
        [`${pilotSummary.marketplace.avgUptimePct}%`, "average uptime from API"],
        [apiStatus === "live" ? "Live" : "Fallback", "pilot API status"],
      ]
    : metrics
  const liveTreasuryResults = pilotSummary
    ? [
        ["Managed USDC", formatUsd(pilotSummary.treasury.managedUsdc), "Across pilot wallets"],
        ["Monthly spend", formatUsd(pilotSummary.treasury.monthlySpentUsdc), `of ${formatUsd(pilotSummary.treasury.monthlyBudgetUsdc)} total budget`],
        ["Active alerts", String(pilotSummary.treasury.activeAlerts), `${pilotSummary.treasury.criticalAlerts} critical`],
        ["Avg tx cost", formatUsd(pilotSummary.treasury.avgTxCostUsdc), "Across completed agent activity"],
      ]
    : treasuryResults
  const liveReputationScores = pilotSummary
    ? pilotSummary.reputation.leaderboard.map((item) => [item.name, item.score, item.delta, item.tier] as const)
    : reputationScores
  const liveMarketplaceResults = pilotSummary
    ? [
        ["APIs listed", String(pilotSummary.marketplace.apisListed), "Marketplace stat"],
        ["Providers", String(pilotSummary.marketplace.providers), "Verified and unverified"],
        ["Requests", formatCompact(pilotSummary.marketplace.requests), "Total request volume"],
        ["Avg uptime", `${pilotSummary.marketplace.avgUptimePct}%`, "Across API catalog"],
      ]
    : marketplaceResults
  const liveCategoryMix = pilotSummary
    ? pilotSummary.marketplace.categoryMix.map((item) => [item.label, item.value] as const)
    : categoryMix
  const tradeBotBudget = pilotSummary?.treasury.tradeBotBudget
  const navLinks = [
    { href: "#system", label: "Product" },
    { href: "#loop", label: "Loop" },
    { href: "/proofs", label: "Proof" },
    { href: "/grant", label: "Grant" },
    { href: "/investors", label: "Investors", onClick: () => trackLandingConversion({ eventName: "investors_click", placement: "nav" }) },
  ]

  return (
    <main>
      <SiteHeader
        ariaLabel="Primary navigation"
        demoHref={liveDemoUrl}
        idPrefix="home-brand"
        links={navLinks}
        onDemoClick={() => trackLandingConversion({ eventName: "demo_click", placement: "nav" })}
        variant="marketing"
      />

      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="kicker">AI agent infrastructure for the onchain economy</p>
          <h1>Control how agents spend, earn trust, and access paid APIs.</h1>
          <p className="hero-text">
            Arc Suite is a connected product system built for autonomous USDC commerce:
            Treasury controls spend, Shield screens counterparties, Reputation scores behavior,
            Marketplace sells x402 API access, Provider verifies signed receipts, Billing meters usage, Escrow governs delivery,
            Gas sponsors execution, Wallet OS governs custody, Radar maps the builder ecosystem,
            Interop adds CCIP route evidence, Chainlink on Arc adds market and reserve signals, Private protects sensitive payment context, Blueprints turns patterns into templates,
            and Flow runs the complete policy pipeline.
          </p>
          <div className="hero-actions">
            <a
              className="button primary"
              href={liveDemoUrl}
              onClick={() => trackLandingConversion({ eventName: "demo_click", placement: "hero" })}
              target="_blank"
              rel="noreferrer"
            >
              Launch live demo
            </a>
            <a className="button secondary" href="/agentic-workflow">Agentic workflow</a>
            <a className="button secondary" href="#system">Explore the product</a>
            <a
              className="button secondary"
              href="/investors"
              onClick={() => trackLandingConversion({ eventName: "investors_click", placement: "hero" })}
            >
              Investor page
            </a>
          </div>
        </div>

        <div className="terminal" aria-label="Arc Suite enforcement loop preview">
          <div className="terminal-top">
            <span />
            <span />
            <span />
            <strong>agent.access.check</strong>
          </div>
          <div className="terminal-body">
            <div className="command">$ arc reputation query TradeBot-Alpha</div>
            <div className="result-grid">
              <div>
                <span>Trust score</span>
                <strong className="yellow">812</strong>
              </div>
              <div>
                <span>Required</span>
                <strong>850</strong>
              </div>
              <div>
                <span>Budget used</span>
                <strong className="red">95%</strong>
              </div>
            </div>
            <div className="deny">premium_data_api: access denied</div>
            <div className="trace">
              {"spend breach risk -> dispute activity -> score decay -> API gate"}
            </div>
          </div>
        </div>
      </section>

      <section className="metrics" id="proof" aria-label="Product proof metrics">
        {liveMetrics.map(([value, label]) => (
          <div className="metric" key={label}>
            <strong>{value}</strong>
            <span>{label}</span>
          </div>
        ))}
      </section>

      <section className="section demo-proof-section" aria-label="Recorded demo and Arc settlement proof package">
        <div className="demo-proof-copy">
          <p className="kicker">Reviewer package</p>
          <h2>Recorded demo plus Arc settlement evidence when configured.</h2>
          <p>
            The final submission is built around one auditable operation: an agent receives an x402 offer,
            passes policy and oracle-risk checks, follows a settlement-ready Circle Wallets path, and leaves a proof
            artifact with receipt, Chainlink signal, settlement reference and reputation context.
          </p>
        </div>
        <div className="demo-proof-card">
          <div>
            <span>Recorded walkthrough</span>
            <strong>Agentic workflow demo</strong>
            <a href="/grant">Open grant package</a>
          </div>
          <div>
            <span>API-specific proof</span>
            <strong>api_02 · GPT-4o Proxy</strong>
            <LatestProofLink fallbackHref={latestProofUrl} label="Open latest proof" mode="inline" />
          </div>
          <div>
            <span>Proof archive</span>
            <strong>Receipt history</strong>
            <a href="/proofs">Open archive</a>
          </div>
          <div>
            <span>Provider trust</span>
            <strong>Signed receipt center</strong>
            <a href="/provider">Open Provider</a>
          </div>
          <div>
            <span>Chainlink on Arc</span>
            <strong>CCIP + oracle signal</strong>
            <a href="/proof">Open proof chain</a>
          </div>
          <div>
            <span>Settlement evidence</span>
            <strong>0.003 USDC path</strong>
            <a href={realSettlementExplorerUrl} target="_blank" rel="noreferrer">Open Arcscan reference</a>
          </div>
          <div>
            <span>Release package</span>
            <strong>v2026.06.30</strong>
            <a href="/grant">Open package notes</a>
          </div>
        </div>
      </section>

      <section className="section split story-section">
        <div>
          <p className="kicker">Product story</p>
          <h2>A control layer for agents with wallets.</h2>
          <p className="story-lede">
            Arc Suite is designed for the moment when autonomous software becomes an
            economic actor. The product does not stop at visibility; it turns every
            payment into a signal that can shape future access.
          </p>
        </div>
        <div className="story-steps">
          {story.map((item, index) => (
            <article className="story-step" key={item.title}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <div>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="section" id="system">
        <div className="section-heading">
          <p className="kicker">The product system</p>
          <h2>Fourteen connected products. One economic operating layer.</h2>
          <p>
            Arc Suite is designed around a shared cast of agents moving through the
            complete economic journey, from wallet spend to trust scoring to service access.
          </p>
        </div>

        <div className="product-switcher">
          <div className="product-tabs" role="tablist" aria-label="Arc Suite products">
            {liveProductDetails.map((product) => {
              const ProductIcon = product.icon
              return (
                <button
                  aria-controls={`panel-${product.key}`}
                  aria-selected={activeProduct.key === product.key}
                  className={activeProduct.key === product.key ? "is-active" : ""}
                  id={`tab-${product.key}`}
                  key={product.key}
                  onClick={() => setActiveProductKey(product.key)}
                  role="tab"
                  type="button"
                >
                  <span className="product-tab-head">
                    <i className="product-tab-icon" aria-hidden="true">
                      <ProductIcon size={18} strokeWidth={1.85} />
                    </i>
                    <span>{product.eyebrow}</span>
                  </span>
                  <strong>{product.name}</strong>
                </button>
              )
            })}
          </div>

          <article
            aria-labelledby={`tab-${activeProduct.key}`}
            className="product-panel"
            id={`panel-${activeProduct.key}`}
            role="tabpanel"
          >
            <div className="product-panel-copy">
              <p className="kicker">{activeProduct.eyebrow}</p>
              <h3>{activeProduct.title}</h3>
              <p>{activeProduct.text}</p>
              <div className="product-panel-stats">
                {activeProduct.stats.map(([value, label]) => (
                  <div key={label}>
                    <strong>{value}</strong>
                    <span>{label}</span>
                  </div>
                ))}
              </div>
              <ul>
                {activeProduct.bullets.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>

            <div className="product-panel-shot">
              <div className="shot-chrome">
                <span />
                <span />
                <span />
                <strong>{activeProduct.name}</strong>
              </div>
              {activeProduct.key === "shield" ? (
                <div className="shield-product-preview" aria-label={activeProduct.imageAlt}>
                  <div className="shield-preview-top">
                    <span>ARC SHIELD / SCREENING</span>
                    <strong>MONITOR MODE</strong>
                  </div>
                  <div className="shield-preview-address">
                    <span>Wallet address</span>
                    <code>0x7fb4...9999</code>
                  </div>
                  <div className="shield-preview-decision">
                    <span>Policy decision</span>
                    <strong>BLOCK</strong>
                    <p>Circle&apos;s Sanctions Blocklist</p>
                  </div>
                  <div className="shield-preview-row">
                    <span>Risk score</span>
                    <b>BLOCKLIST</b>
                  </div>
                  <div className="shield-preview-row">
                    <span>Actions</span>
                    <b>DENY · REVIEW</b>
                  </div>
                  <a href="/shield">Open live console</a>
                </div>
              ) : activeProduct.key === "provider" ? (
                <div className="provider-product-preview" aria-label={activeProduct.imageAlt}>
                  <div className="shield-preview-top"><span>ARC PROVIDER / RECEIPTS</span><strong>VERIFIED</strong></div>
                  <div className="provider-preview-hero">
                    <span>Latest paid API</span>
                    <strong>GPT-4o Proxy</strong>
                    <small>OpenAI Gateway · 0.018 USDC</small>
                  </div>
                  <div className="provider-preview-grid">
                    <div><span>Provider key</span><strong>pk_live_ed25519</strong></div>
                    <div><span>Algorithm</span><strong>ed25519</strong></div>
                    <div><span>Receipt</span><strong>rcpt_84de</strong></div>
                    <div><span>Settlement</span><strong>0x4121...</strong></div>
                  </div>
                  {[
                    ["Receipt signed", "provider key slot 03", "PASS"],
                    ["Payment observed", "Arc Testnet settlement ref", "PASS"],
                    ["Fulfillment gate", "serve after proof link", "READY"],
                  ].map(([label, detail, status]) => (
                    <div className="provider-preview-row" key={label}>
                      <span><b>{label}</b><small>{detail}</small></span>
                      <strong>{status}</strong>
                    </div>
                  ))}
                  <a href="/provider">Open trust center</a>
                </div>
              ) : activeProduct.key === "flow" ? (
                <div className="flow-product-preview" aria-label={activeProduct.imageAlt}>
                  <div className="shield-preview-top"><span>ARC FLOW / RUN</span><strong>POLICY PIPELINE</strong></div>
                  {[
                    ["01", "Shield screening", "PASSED"],
                    ["02", "Access policy", "PASSED"],
                    ["03", "Arc settlement", "CONFIRMED"],
                    ["04", "Reputation update", "+3"],
                  ].map(([index, label, status]) => (
                    <div className="flow-preview-step" key={label}>
                      <i>{index}</i><span>{label}</span><b>{status}</b>
                    </div>
                  ))}
                  <div className="flow-preview-receipt"><span>Arc Testnet receipt</span><code>0x84de...3a921</code></div>
                  <a href="/agentic-workflow">Open workflow demo</a>
                </div>
              ) : activeProduct.key === "billing" ? (
                <div className="billing-product-preview" aria-label={activeProduct.imageAlt}>
                  <div className="shield-preview-top"><span>ARC BILLING / x402</span><strong>METERED</strong></div>
                  <div className="billing-preview-balance"><span>Prepaid balance</span><strong>49.973 USDC</strong></div>
                  {[
                    ["Market Data Pro", "12 units", "0.0324"],
                    ["GPT Inference", "1 request", "0.0180"],
                    ["Weather Oracle", "20 calls", "0.0060"],
                  ].map(([label, units, amount]) => (
                    <div className="billing-preview-row" key={label}>
                      <span><b>{label}</b><small>{units}</small></span>
                      <strong>{amount} USDC</strong>
                    </div>
                  ))}
                  <div className="flow-preview-receipt"><span>Settlement batch</span><code>3 events · READY</code></div>
                  <a href="/billing">Open live console</a>
                </div>
              ) : activeProduct.key === "escrow" ? (
                <div className="billing-product-preview escrow-product-preview" aria-label={activeProduct.imageAlt}>
                  <div className="shield-preview-top"><span>ARC ESCROW / DEAL</span><strong>ACTIVE</strong></div>
                  <div className="billing-preview-balance"><span>Locked value</span><strong>9.00 USDC</strong></div>
                  {[
                    ["Schema delivery", "RELEASED", "3.00"],
                    ["Live data stream", "SUBMITTED", "6.00"],
                    ["Production handoff", "PENDING", "3.00"],
                  ].map(([label, status, amount]) => (
                    <div className="billing-preview-row" key={label}>
                      <span><b>{label}</b><small>{status}</small></span>
                      <strong>{amount} USDC</strong>
                    </div>
                  ))}
                  <div className="flow-preview-receipt"><span>Contract events</span><code>3 audited</code></div>
                  <a href="/escrow">Open live console</a>
                </div>
              ) : activeProduct.key === "gas" ? (
                <div className="gas-product-preview" aria-label={activeProduct.imageAlt}>
                  <div className="shield-preview-top"><span>ARC GAS / POLICY</span><strong>SPONSORING</strong></div>
                  <div className="gas-preview-metrics">
                    <div><span>Sponsored gas</span><strong>0.184 USDC</strong></div>
                    <div><span>Sponsored tx</span><strong>23</strong></div>
                    <div><span>Denied tx</span><strong>2</strong></div>
                  </div>
                  <div className="gas-preview-policy">
                    <div><span>Agent policy</span><strong>DataHarvester-Pro</strong></div>
                    <div className="gas-preview-mode"><i /> Gas Station · developer sponsored</div>
                    <div className="gas-preview-limit"><span>Daily usage</span><b>0.042 / 0.250 USDC</b></div>
                    <div className="gas-preview-bar"><i /></div>
                  </div>
                  {[
                    ["Escrow release", "0.008 USDC", "SPONSORED"],
                    ["Marketplace call", "0.004 USDC", "SPONSORED"],
                    ["Contract deploy", "0.120 USDC", "DENIED"],
                  ].map(([action, amount, status]) => (
                    <div className="gas-preview-row" key={action}>
                      <span><b>{action}</b><small>{amount}</small></span>
                      <strong className={status === "DENIED" ? "is-denied" : ""}>{status}</strong>
                    </div>
                  ))}
                  <a href="/gas">Open live console</a>
                </div>
              ) : activeProduct.key === "interop" ? (
                <div className="interop-product-preview" aria-label={activeProduct.imageAlt}>
                  <div className="shield-preview-top"><span>ARC INTEROP / CCIP</span><strong>ROUTE-READY</strong></div>
                  <div className="interop-preview-route">
                    <div><span>Source</span><strong>Arc Testnet</strong><small>USDC treasury instruction</small></div>
                    <i aria-hidden="true" />
                    <div><span>Target</span><strong>Ethereum Sepolia</strong><small>Collateral / provider route</small></div>
                  </div>
                  <div className="interop-preview-grid">
                    <div><span>Selector</span><strong>303409...</strong></div>
                    <div><span>Router</span><strong>0xdE4E...</strong></div>
                    <div><span>Envelope</span><strong>1 proof</strong></div>
                  </div>
                  {[
                    ["Policy checked", "Shield confirms route risk", "PASS"],
                    ["CCIP route selected", "router metadata attached", "READY"],
                    ["Message observed", "proof hash prepared", "PENDING"],
                  ].map(([label, detail, status]) => (
                    <div className="interop-preview-row" key={label}>
                      <span><b>{label}</b><small>{detail}</small></span>
                      <strong>{status}</strong>
                    </div>
                  ))}
                  <a href="/interop">Open route demo</a>
                </div>
              ) : activeProduct.key === "wallets" ? (
                <div className="wallet-product-preview" aria-label={activeProduct.imageAlt}>
                  <div className="shield-preview-top"><span>ARC WALLET OS / REGISTRY</span><strong>3 CUSTODY MODELS</strong></div>
                  <div className="wallet-preview-summary">
                    <div><span>Wallets</span><strong>6</strong></div>
                    <div><span>Active</span><strong>5</strong></div>
                    <div><span>Pending ops</span><strong>1</strong></div>
                  </div>
                  <div className="wallet-preview-grid">
                    <div className="wallet-preview-list">
                      {[
                        ["Treasury Operator", "Developer-controlled", "ACTIVE"],
                        ["Client Commerce", "User-controlled", "ACTIVE"],
                        ["Agent Smart Account", "Modular", "PENDING"],
                      ].map(([name, custody, status], index) => (
                        <div className={index === 0 ? "is-active" : ""} key={name}>
                          <span><b>{name}</b><small>{custody}</small></span>
                          <em>{status}</em>
                        </div>
                      ))}
                    </div>
                    <div className="wallet-preview-policy">
                      <span>Signing policy</span>
                      <strong>2 approvals required</strong>
                      <p><i /> Arc Shield required</p>
                      <p><i /> Reputation ≥ 750</p>
                      <p><i /> 250 USDC daily limit</p>
                    </div>
                  </div>
                  <div className="flow-preview-receipt"><span>Latest lifecycle event</span><code>SIGN · CONFIRMED</code></div>
                  <a href="/wallets">Open live console</a>
                </div>
              ) : activeProduct.key === "radar" ? (
                <div className="radar-product-preview" aria-label={activeProduct.imageAlt}>
                  <div className="shield-preview-top"><span>ARC RADAR / RESEARCH</span><strong>BUILDER MAP</strong></div>
                  <div className="radar-preview-grid">
                    <div><span>Builders</span><strong>17</strong></div>
                    <div><span>Categories</span><strong>9</strong></div>
                    <div><span>Privacy refs</span><strong>1</strong></div>
                  </div>
                  {[
                    ["Payments", "crowded", "5 refs"],
                    ["Agentic x402", "active", "2 refs"],
                    ["Infrastructure", "high signal", "2 refs"],
                    ["Privacy", "open gap", "1 ref"],
                  ].map(([label, state, count]) => (
                    <div className="radar-preview-row" key={label}>
                      <span><b>{label}</b><small>{state}</small></span>
                      <strong>{count}</strong>
                    </div>
                  ))}
                  <div className="radar-preview-gap">
                    <span>Strategic wedge</span>
                    <strong>Private, compliant stablecoin payments</strong>
                  </div>
                  <a href="/radar">Open builder radar</a>
                </div>
              ) : activeProduct.key === "private" ? (
                <div className="private-product-preview" aria-label={activeProduct.imageAlt}>
                  <div className="shield-preview-top"><span>ARC PRIVATE / INTENT</span><strong>SCOPED PROOF</strong></div>
                  <div className="private-preview-receipt">
                    <div><span>Encrypted intent</span><strong>pi_4f91...a7</strong></div>
                    <div><span>Visible proof</span><strong>paid · screened</strong></div>
                    <div><span>Provider scope</span><strong>fulfill only</strong></div>
                    <div><span>Auditor scope</span><strong>policy chain</strong></div>
                  </div>
                  <div className="private-preview-grid">
                    <div><span>Scopes</span><strong>4</strong></div>
                    <div><span>Shield</span><strong>PASS</strong></div>
                    <div><span>Settlement</span><strong>READY</strong></div>
                  </div>
                  {[
                    ["Commercial context", "masked from provider", "PRIVATE"],
                    ["Compliance evidence", "screened address + limit", "VISIBLE"],
                    ["Payment proof", "selectively revealable", "SCOPED"],
                  ].map(([label, detail, status]) => (
                    <div className="private-preview-row" key={label}>
                      <span><b>{label}</b><small>{detail}</small></span>
                      <strong>{status}</strong>
                    </div>
                  ))}
                  <div className="private-preview-hash"><span>Disclosure hash</span><strong>sha256:77ac...91f0</strong></div>
                  <a href="/private">Open private payments</a>
                </div>
              ) : activeProduct.key === "blueprints" ? (
                <div className="blueprints-product-preview" aria-label={activeProduct.imageAlt}>
                  <div className="shield-preview-top"><span>ARC BLUEPRINTS / TEMPLATES</span><strong>6 PATTERNS</strong></div>
                  <div className="blueprint-preview-stack">
                    {["Checkout", "x402 API", "Escrow", "FX Desk", "M2M", "Private invoice"].map((item, index) => (
                      <div key={item}>
                        <i>{String(index + 1).padStart(2, "0")}</i>
                        <span>{item}</span>
                        <strong>{index < 2 ? "P0" : "MVP"}</strong>
                      </div>
                    ))}
                  </div>
                  <div className="blueprint-preview-band">
                    <span>Repeatable path</span>
                    <strong>{"Radar -> Blueprint -> API -> Pilot"}</strong>
                  </div>
                  <a href="/blueprints">Open blueprints</a>
                </div>
              ) : (
                <img src={activeProduct.image} alt={activeProduct.imageAlt} />
              )}
            </div>
          </article>
        </div>
      </section>

      <section className="section screenshots-section">
        <div className="section-heading compact">
          <p className="kicker">Real application screenshots</p>
          <h2>The interface is already designed and implemented.</h2>
          <p>
            These are real screenshots captured from the running Arc Suite apps:
            Treasury, Reputation and Marketplace. The landing uses them as product
            proof, not decorative screens.
          </p>
        </div>

        <div className="real-screenshots">
          <article className="real-shot shot-wide">
            <div className="shot-chrome">
              <span />
              <span />
              <span />
              <strong>Arc Treasury · Dashboard</strong>
            </div>
            <img
              src="/screenshots/treasury-dashboard-20260603.png"
              alt="Arc Treasury dashboard showing budget alerts, managed USDC, monthly spend, charts, agent budgets and recent transactions"
            />
            <div className="shot-caption">
              <h3>Budget control for agent wallets</h3>
              <p>Spend charts, critical alerts, per-agent budgets and transaction history in one operator view.</p>
            </div>
          </article>

          <article className="real-shot">
            <div className="shot-chrome">
              <span />
              <span />
              <span />
              <strong>Arc Reputation · Leaderboard</strong>
            </div>
            <img
              src="/screenshots/reputation-leaderboard.png"
              alt="Arc Reputation leaderboard with agent trust scores, 30-day deltas, score breakdown and live events"
            />
            <div className="shot-caption">
              <h3>Trust scoring that services can query</h3>
              <p>Leaderboard, tiers, score deltas, live events and dimensional breakdowns.</p>
            </div>
          </article>

          <article className="real-shot">
            <div className="shot-chrome">
              <span />
              <span />
              <span />
              <strong>Arc Marketplace · Browse</strong>
            </div>
            <img
              src="/screenshots/marketplace-browse.png"
              alt="Arc Marketplace browse page with x402 API cards, filters, provider data, pricing and request metrics"
            />
            <div className="shot-caption">
              <h3>x402 API discovery</h3>
              <p>API cards expose pricing, uptime, request volume, tags and integration paths.</p>
            </div>
          </article>

          <article className="real-shot shot-wide api-detail-shot">
            <div className="shot-chrome">
              <span />
              <span />
              <span />
              <strong>Arc Marketplace · API detail</strong>
            </div>
            <img
              src="/screenshots/marketplace-api.png"
              alt="Arc Marketplace API detail page with endpoint, pricing, provider profile, reviews and integration snippets"
            />
            <div className="shot-caption">
              <h3>Integration-ready detail pages</h3>
              <p>Every API can show endpoint metadata, SLA stats, code snippets, reviews and provider trust context.</p>
            </div>
          </article>

        </div>
      </section>

      <section className="section infrastructure-section">
        <div className="section-heading">
          <p className="kicker">Execution infrastructure</p>
          <h2>The suite now operates wallets, gas and provider jobs.</h2>
          <p>
            The newest control plane turns product intent into observable provider
            operations with policy checks, leased jobs, retries and signed Circle webhooks.
          </p>
        </div>

        <div className="infrastructure-grid">
          <article>
            <span>01 · Wallet OS</span>
            <h3>Custody-aware wallet operations</h3>
            <p>Manage developer, user and modular wallets with roles, recovery paths and signing policy.</p>
            <div><strong>3</strong><small>custody models</small></div>
            <a href="/wallets">Open Wallet OS</a>
          </article>
          <article>
            <span>02 · Arc Gas</span>
            <h3>Agent-level sponsorship policy</h3>
            <p>Approve or deny sponsored transactions under per-transaction, daily and monthly USDC limits.</p>
            <div><strong>2</strong><small>Circle gas modes</small></div>
            <a href="/gas">Open Arc Gas</a>
          </article>
          <article>
            <span>03 · Execution Control</span>
            <h3>One queue across four products</h3>
            <p>Reconcile Wallet OS, Gas, Escrow and Billing operations with idempotent jobs and webhook delivery.</p>
            <div><strong>4</strong><small>connected workflows</small></div>
            <a href="/executions">Open Execution Control</a>
          </article>
        </div>
      </section>

      <section className="section execution-story-section">
        <div className="execution-story-copy">
          <p className="kicker">Provider lifecycle</p>
          <h2>Every external operation has a visible state.</h2>
          <p>
            Arc Suite separates policy approval from provider completion. That makes
            pending work, retries, failures and final onchain receipts explicit instead
            of hiding them behind a loading spinner.
          </p>
          <a className="button secondary" href="/executions">Inspect execution jobs</a>
        </div>
        <div className="execution-story-flow" aria-label="Execution provider lifecycle">
          {[
            ["Policy", "Approved", "Shield, budget and signing rules pass"],
            ["Queue", "Leased", "A worker owns the idempotent job"],
            ["Circle", "Pending", "Provider operation is reconciled"],
            ["Webhook", "Verified", "Signed delivery updates the job"],
            ["Receipt", "Confirmed", "Transaction hash and state are stored"],
          ].map(([label, state, detail], index) => (
            <div key={label}>
              <i>{String(index + 1).padStart(2, "0")}</i>
              <span><b>{label}</b><small>{detail}</small></span>
              <strong>{state}</strong>
            </div>
          ))}
        </div>
      </section>

      <section className="section results-section">
        <div className="section-heading compact">
          <p className="kicker">Results from the pitch deck</p>
          <h2>The landing page now carries the same numbers as the investor story.</h2>
          <p>
            These figures are demo metrics from the Arc Suite repository and pitchdeck.
            They are presented as product proof, not claimed revenue.
          </p>
        </div>

        <div className="result-panels">
          <article className="result-panel">
            <div className="panel-heading">
              <span>Treasury</span>
              <h3>Spend under management</h3>
            </div>
            <div className="result-metric-grid">
              {liveTreasuryResults.map(([label, value, sub]) => (
                <div key={label}>
                  <strong>{value}</strong>
                  <span>{label}</span>
                  <small>{sub}</small>
                </div>
              ))}
            </div>
            <div className="budget-visual" aria-label="TradeBot budget usage">
              <div>
                <span>TradeBot monthly budget</span>
                <strong>
                  {tradeBotBudget
                    ? `${formatUsd(tradeBotBudget.spentUsdc)} / ${formatUsd(tradeBotBudget.limitUsdc)}`
                    : "$476.89 / $500"}
                </strong>
              </div>
              <i><b style={{ width: `${tradeBotBudget?.usedPct ?? 95}%` }} /></i>
              <small>
                {tradeBotBudget
                  ? `${tradeBotBudget.usedPct}% used · wallet balance ${formatUsd(tradeBotBudget.walletBalanceUsdc)} · daily cap ${formatUsd(tradeBotBudget.dailySpentUsdc)} / ${formatUsd(tradeBotBudget.dailyLimitUsdc)}`
                  : "95% used · wallet balance $23.11 · daily cap $29.80 / $30"}
              </small>
            </div>
          </article>

          <article className="result-panel">
            <div className="panel-heading">
              <span>Reputation</span>
              <h3>Agent trust leaderboard</h3>
            </div>
            <div className="score-bars">
              {liveReputationScores.map(([name, score, delta, tier]) => (
                <div className="score-bar" key={name}>
                  <div>
                    <span>{name}</span>
                    <small>{tier} · {delta} 30d</small>
                  </div>
                  <i><b style={{ width: `${Number(score) / 10}%` }} /></i>
                  <strong>{score}</strong>
                </div>
              ))}
            </div>
          </article>

          <article className="result-panel marketplace-results">
            <div className="panel-heading">
              <span>Marketplace</span>
              <h3>x402 API catalog</h3>
            </div>
            <div className="result-metric-grid">
              {liveMarketplaceResults.map(([label, value, sub]) => (
                <div key={label}>
                  <strong>{value}</strong>
                  <span>{label}</span>
                  <small>{sub}</small>
                </div>
              ))}
            </div>
            <div className="category-chart" aria-label="Marketplace category mix">
              {liveCategoryMix.map(([label, value]) => (
                <div key={label}>
                  <span>{label}</span>
                  <i><b style={{ width: `${(Number(value) / 31) * 100}%` }} /></i>
                  <strong>{value}</strong>
                </div>
              ))}
            </div>
            <a className="marketplace-proof-link" href="/proofs">Open Marketplace receipt history</a>
          </article>
        </div>
      </section>

      <section className="section api-section">
        <div className="section-heading compact">
          <p className="kicker">Pilot API</p>
          <h2>The landing is now connected to a backend contract.</h2>
          <p>
            The same pilot schema can move from seeded data to Postgres or Supabase.
            Today it exposes agents, transactions, reputation, and access checks over HTTP.
          </p>
        </div>

        <div className="api-panel">
          <div className="api-status">
            <span className={apiStatus === "live" ? "status-dot live" : "status-dot"} />
            <div>
              <strong>{apiStatus === "live" ? "Live API connected" : "Using static fallback"}</strong>
              <small>{pilotSummary ? pilotSummary.workspace.updatedAt : "Server-side pilot summary unavailable"}</small>
            </div>
          </div>

          <div className="endpoint-grid">
            {(pilotSummary?.endpoints ?? [
              { method: "GET", path: "/api/health", description: "API health and schema version" },
              { method: "GET", path: "/api/pilot/summary", description: "Landing-ready pilot metrics" },
              { method: "POST", path: "/api/access/check", description: "x402 access decision" },
            ]).map((endpoint) => (
              <div className="endpoint-row" key={`${endpoint.method}-${endpoint.path}`}>
                <span>{endpoint.method}</span>
                <code>{endpoint.path}</code>
                <small>{endpoint.description}</small>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section loop-section" id="loop">
        <div className="section-heading compact">
          <p className="kicker">Enforcement loop</p>
          <h2>Spend drives behavior. Behavior drives reputation. Reputation gates access.</h2>
        </div>

        <div className="loop-grid">
          {steps.map(([title, text], index) => (
            <div className="loop-step" key={title}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <h3>{title}</h3>
              <p>{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section architecture">
        <div className="section-heading compact">
          <p className="kicker">System design</p>
          <h2>The suite connects operators, agents, wallets, trust, and paid APIs.</h2>
        </div>

        <div className="architecture-map" aria-label="Arc Suite architecture map">
          <div className="map-node operators">
            <span>Operators</span>
            <strong>Policies, budgets, reports</strong>
          </div>
          <div className="map-node agents">
            <span>AI agents</span>
            <strong>Wallets, spend, requests</strong>
          </div>
          <div className="map-core">
            <div>
              <span>Flow</span>
              <b>Policy orchestration</b>
            </div>
            <div>
              <span>Treasury</span>
              <b>Spend controls</b>
            </div>
            <div>
              <span>Reputation</span>
              <b>Trust score</b>
            </div>
            <div>
              <span>Marketplace</span>
              <b>x402 access</b>
            </div>
            <div>
              <span>Billing</span>
              <b>Metering & invoices</b>
            </div>
            <div>
              <span>Escrow</span>
              <b>Milestones & disputes</b>
            </div>
          </div>
          <div className="map-node arc">
            <span>Arc / Circle</span>
            <strong>USDC, wallets, settlement</strong>
          </div>
          <div className="map-node apis">
            <span>x402 APIs</span>
            <strong>Data, compute, AI, storage</strong>
          </div>
        </div>
      </section>

      <section className="section split">
        <div>
          <p className="kicker">Built for Arc and Circle</p>
          <h2>USDC-native infrastructure for software that pays software.</h2>
        </div>
        <div className="text-stack">
          <p>
            Flow answers: how does a payment move safely from intent to settlement? Escrow answers: how is value released against delivery? Billing answers: how is every API call priced, invoiced and netted? Treasury answers: how do I control what my agents spend? Reputation
            answers: which agents can services trust? Marketplace answers: where do
            agents find services to pay for?
          </p>
          <p>
            Together, the suite becomes an operating layer for x402-enabled APIs,
            agent wallets, and autonomous pay-per-use workflows on Arc.
          </p>
        </div>
      </section>

      <section className="section lead-section" id="request-pilot">
        <div className="section-heading compact">
          <p className="kicker">Request pilot</p>
          <h2>Start with a demo workspace, then move into a live pilot.</h2>
        </div>
        <div className="lead-layout">
          <div className="lead-proof">
            <div>
              <span>Tracked session</span>
              <strong>Lead → analytics</strong>
              <p>Each request is linked to the visitor session that clicked Demo, Investors, or ran an access check.</p>
            </div>
            <div>
              <span>CRM status</span>
              <strong>New lead</strong>
              <p>Saved in Supabase with interest, company context, message, and source path for operator follow-up.</p>
            </div>
          </div>
          <RequestPilotForm />
        </div>
      </section>

      <section className="cta">
        <p className="kicker">Ready for pilots</p>
        <h2>Turn autonomous agent payments into accountable infrastructure.</h2>
        <div className="cta-actions">
          <a
            className="button primary"
            href={liveDemoUrl}
            onClick={() => trackLandingConversion({ eventName: "demo_click", placement: "bottom_cta" })}
            target="_blank"
            rel="noreferrer"
          >
            Launch live demo
          </a>
          <a
            className="button secondary"
            href="/investors"
            onClick={() => trackLandingConversion({ eventName: "investors_click", placement: "bottom_cta" })}
          >
            View investor page
          </a>
        </div>
      </section>
    </main>
  )
}
