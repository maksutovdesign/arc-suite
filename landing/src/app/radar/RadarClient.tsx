"use client"

import { useMemo, useState } from "react"
import {
  BadgeCheck,
  BarChart3,
  Boxes,
  BrainCircuit,
  Building2,
  Eye,
  Globe2,
  Landmark,
  Link2,
  LockKeyhole,
  Network,
  Radar,
  ReceiptText,
  Search,
  ShieldCheck,
  Sparkles,
  WalletCards,
} from "lucide-react"

type BuilderCategory = "privacy" | "payments" | "agentic" | "fx" | "defi" | "infra" | "prediction" | "regional" | "other"
type Signal = "high" | "medium" | "low"

type Builder = {
  handle: string
  project: string
  description: string
  category: BuilderCategory
  stack: string[]
  traction: string
  signal: Signal
  amplifiedBy: string
  suiteFit: string[]
}

const categoryMeta: Record<BuilderCategory, { label: string; tone: string; icon: typeof Radar }> = {
  privacy: { label: "Privacy", tone: "gap", icon: LockKeyhole },
  payments: { label: "Payments", tone: "active", icon: ReceiptText },
  agentic: { label: "Agentic", tone: "active", icon: BrainCircuit },
  fx: { label: "FX", tone: "active", icon: Globe2 },
  defi: { label: "DeFi/RWA", tone: "crowded", icon: Landmark },
  infra: { label: "Infra", tone: "active", icon: Boxes },
  prediction: { label: "Prediction", tone: "thin", icon: BarChart3 },
  regional: { label: "Regional", tone: "active", icon: Network },
  other: { label: "Other", tone: "thin", icon: Sparkles },
}

const builders: Builder[] = [
  {
    handle: "@circle",
    project: "Circle Agent Stack",
    description: "Agent Wallets, Marketplace, CLI, Skills and Gateway Nanopayments form the native economic loop for USDC-powered agents.",
    category: "agentic",
    stack: ["Agent Wallets", "x402", "Gateway", "CLI", "Marketplace"],
    traction: "Official Circle product · immediately available",
    signal: "high",
    amplifiedBy: "Circle",
    suiteFit: ["Money Movement", "Marketplace", "Shield", "Proof Center"],
  },
  {
    handle: "@agentcash",
    project: "AgentCash / Merit",
    description: "Agent discovery and payment across x402 and MPP, with open provider tooling and wallet-based buyer identity.",
    category: "agentic",
    stack: ["x402", "MPP", "OpenAPI", "llms.txt", "USDC"],
    traction: "Reports 765K transactions and ~$40K 2026 revenue",
    signal: "high",
    amplifiedBy: "Circle ecosystem event",
    suiteFit: ["Marketplace", "Billing", "Shield", "Proof Center"],
  },
  {
    handle: "@AIsa_AI",
    project: "AIsa",
    description: "Unified model, data and API gateway where agents discover resources and pay per call through Nanopayments or MPP.",
    category: "agentic",
    stack: ["Nanopayments", "MPP", "Models", "Data APIs"],
    traction: "100+ paid endpoints · 1M+ reported calls",
    signal: "high",
    amplifiedBy: "@Arc, Circle Agent Stack",
    suiteFit: ["Marketplace", "Billing", "Shield", "Proof Center"],
  },
  {
    handle: "@crossmint",
    project: "Crossmint Agent Payments",
    description: "User-owned wallets delegate scoped spend, counterparties and time windows to agents, with stablecoin and card execution.",
    category: "infra",
    stack: ["Agent wallets", "Onchain policy", "x402", "Cards"],
    traction: "Production agent-payment infrastructure",
    signal: "high",
    amplifiedBy: "External market",
    suiteFit: ["Wallets", "Shield", "Money Movement", "Proof Center"],
  },
  {
    handle: "@Cobo_Global",
    project: "Cobo Agentic Wallet",
    description: "Cryptographically enforced transaction controls for autonomous agents across a broad multichain wallet surface.",
    category: "infra",
    stack: ["Agent wallet", "Policy enforcement", "MCP", "Multichain"],
    traction: "Public product and open SDK positioning",
    signal: "medium",
    amplifiedBy: "External market",
    suiteFit: ["Wallets", "Shield", "Execution Control"],
  },
  {
    handle: "@vyperlang",
    project: "Vyper Agentic Payments",
    description: "Open ERC-8004 identity and x402 workflows with escrow, subscriptions, split payments and spending limits on Arc.",
    category: "agentic",
    stack: ["ERC-8004", "x402", "Escrow", "Subscriptions"],
    traction: "Official Arc technical spotlight · open source",
    signal: "high",
    amplifiedBy: "@Arc",
    suiteFit: ["Reputation", "Escrow", "Billing", "Proof Center"],
  },
  {
    handle: "@BlockradarHQ",
    project: "Blockradar",
    description: "Wallet-as-a-Service for fintechs with AML, gasless transactions, treasury sweeps and multichain payment orchestration.",
    category: "infra",
    stack: ["WaaS", "AML", "Sweeps", "Gateway", "USDC/EURC"],
    traction: "Reports $600M volume · 150K wallets · 700K transactions",
    signal: "high",
    amplifiedBy: "Circle grant recipient",
    suiteFit: ["Treasury", "Shield", "Flow", "Proof Center"],
  },
  {
    handle: "@wirexapp",
    project: "Wirex One",
    description: "Planned non-U.S. card settlement on Arc with USDC and EURC underneath consumer and BaaS payment flows.",
    category: "payments",
    stack: ["Card settlement", "USDC", "EURC", "BaaS"],
    traction: "Official Arc partner spotlight · pre-launch",
    signal: "high",
    amplifiedBy: "@Arc",
    suiteFit: ["Money Movement", "Treasury", "Shield", "Billing"],
  },
  {
    handle: "@cyclesmoney",
    project: "Cycles",
    description: "Multilateral obligation netting for invoices, payroll and supplier payments with residual USDC settlement on Arc.",
    category: "payments",
    stack: ["B2B clearing", "Obligation netting", "USDC", "Arc"],
    traction: "Official Arc partner spotlight",
    signal: "high",
    amplifiedBy: "@Arc",
    suiteFit: ["Treasury", "Billing", "Flow", "Escrow"],
  },
  {
    handle: "@pulsarmoney",
    project: "Pulsar",
    description: "Consumer stablecoin money movement across balances, payments, cards and FX with Arc-native settlement.",
    category: "payments",
    stack: ["App Kit", "USDC", "EURC", "StableFX", "Paymaster"],
    traction: "Official Arc partner spotlight",
    signal: "high",
    amplifiedBy: "@Arc",
    suiteFit: ["Money Movement", "Wallets", "Gas", "Shield"],
  },
  {
    handle: "@Torin_559",
    project: "NexusYield Protocol",
    description: "Confidential yield and RWA liquidity with TEE-shielded payments.",
    category: "privacy",
    stack: ["TEE", "EIP-712 views", "Nanopay/Fastpay", "Arc primitives"],
    traction: "Low public engagement, high strategic relevance",
    signal: "medium",
    amplifiedBy: "Tagged Arc/Circle team for feedback",
    suiteFit: ["Private", "Flow", "Shield"],
  },
  {
    handle: "@BenyaminStyles",
    project: "Arclet",
    description: "USDC checkout links, invoices, tip jars and content unlocks.",
    category: "payments",
    stack: ["Arc App Kit", "USDC bridge", "CCTP"],
    traction: "Community video demo",
    signal: "medium",
    amplifiedBy: "Community",
    suiteFit: ["Billing", "Flow", "Private"],
  },
  {
    handle: "@Audu70",
    project: "ArcPay",
    description: "Cross-chain USDC payments using Circle wallets and CCTP.",
    category: "payments",
    stack: ["Circle Wallets", "CCTP"],
    traction: "Live demo, low public engagement",
    signal: "medium",
    amplifiedBy: "Self/community",
    suiteFit: ["Flow", "Wallets", "Shield"],
  },
  {
    handle: "@Xylonet_",
    project: "XyloNet / PayX",
    description: "Stablecoin DeFi and social tipping/escrow payments to public creator handles.",
    category: "payments",
    stack: ["CCTP V2", "ERC-4626", "Liquidity pools"],
    traction: "Arc feature, 500+ likes",
    signal: "high",
    amplifiedBy: "@arc",
    suiteFit: ["Escrow", "Billing", "Shield"],
  },
  {
    handle: "@tlay_io",
    project: "TLAY",
    description: "Machine-to-machine nanopayments with embedded device wallets.",
    category: "payments",
    stack: ["Circle Nanopayments", "Gateway", "Arc Testnet"],
    traction: "Builder Spotlight, 400+ likes",
    signal: "high",
    amplifiedBy: "@arc, @samconnerone",
    suiteFit: ["Billing", "Wallets", "Gas"],
  },
  {
    handle: "@mrcoc0x",
    project: "AuraGate",
    description: "x402 marketplace where AI agents discover APIs and pay per request.",
    category: "agentic",
    stack: ["x402", "USDC receipts", "Arc"],
    traction: "30+ services, 500+ paid testnet calls",
    signal: "high",
    amplifiedBy: "Hackathon/community context",
    suiteFit: ["Marketplace", "Billing", "Reputation"],
  },
  {
    handle: "@ProoVra",
    project: "ProoVra",
    description: "Proof-based escrow and settlement for AI agents.",
    category: "agentic",
    stack: ["Arc", "Proof receipts", "Conditional settlement"],
    traction: "Hackathon thread",
    signal: "medium",
    amplifiedBy: "Hackathon/community",
    suiteFit: ["Escrow", "Flow", "Reputation"],
  },
  {
    handle: "@0xMASTER82",
    project: "ArcSwap",
    description: "Stablecoin FX DEX for USDC/EURC swaps and liquidity pools.",
    category: "fx",
    stack: ["Arc stablecoin primitives", "Solidity"],
    traction: "Launch post and public source reference",
    signal: "medium",
    amplifiedBy: "Community",
    suiteFit: ["Shield", "Flow", "Treasury"],
  },
  {
    handle: "@stablecorp",
    project: "QCAD on Arc",
    description: "CAD stablecoin and onchain CAD/USD FX flows.",
    category: "fx",
    stack: ["StableFX", "Arc primitives"],
    traction: "Arc spotlight, 900+ likes",
    signal: "high",
    amplifiedBy: "@arc",
    suiteFit: ["Treasury", "Flow", "Shield"],
  },
  {
    handle: "@Hydra12351",
    project: "LumenFi",
    description: "Stablecoin-native DeFi dashboard for balances, swaps, lending and bridge onboarding.",
    category: "defi",
    stack: ["Arc primitives", "Bridge"],
    traction: "Testnet prototype",
    signal: "low",
    amplifiedBy: "Self/community",
    suiteFit: ["Treasury", "Shield", "Wallets"],
  },
  {
    handle: "@synthra_finance",
    project: "Synthra",
    description: "Spot trading, concentrated liquidity and perpetual markets on Arc.",
    category: "defi",
    stack: ["Arc", "CL", "Perps"],
    traction: "Builder Spotlight",
    signal: "high",
    amplifiedBy: "@arc",
    suiteFit: ["Shield", "Gas", "Execution Control"],
  },
  {
    handle: "@TowerExchange",
    project: "Tower Exchange",
    description: "Stablecoin DEX aggregator for better prices across Arc liquidity.",
    category: "defi",
    stack: ["Arc", "Aggregator routing", "Synthra integration"],
    traction: "Arc spotlight",
    signal: "high",
    amplifiedBy: "@arc",
    suiteFit: ["Flow", "Shield", "Execution Control"],
  },
  {
    handle: "@goldskyio",
    project: "Goldsky",
    description: "Real-time indexing and data streaming for Arc builders.",
    category: "infra",
    stack: ["Arc indexing", "Data streaming"],
    traction: "Builders Fund spotlight, 900+ likes",
    signal: "high",
    amplifiedBy: "@arc",
    suiteFit: ["Execution Control", "Ops Health", "Radar"],
  },
  {
    handle: "@0x_zax",
    project: "ArcFunTerminal",
    description: "CCTP V2 bridge and recovery engine for failed or burned transfers.",
    category: "infra",
    stack: ["CCTP V2", "Recovery engine", "9 chains"],
    traction: "Thread/video, 100+ likes on stronger posts",
    signal: "high",
    amplifiedBy: "Tagged Arc/Circle team",
    suiteFit: ["Execution Control", "Flow", "Wallets"],
  },
  {
    handle: "@Iblamehsan",
    project: "Arcpredict",
    description: "Sports prediction market experiments on Arc testnet.",
    category: "prediction",
    stack: ["Arc primitives", "USDC bets"],
    traction: "Low-signal beta screenshots",
    signal: "low",
    amplifiedBy: "Self/community",
    suiteFit: ["Escrow", "Shield", "Private"],
  },
  {
    handle: "@JerryOjumah",
    project: "Nigeria Arc chapter",
    description: "Regional organizer and Lagos meetup lead.",
    category: "regional",
    stack: ["Arc Architects", "Community enablement"],
    traction: "Repeated Bobbilee amplification",
    signal: "high",
    amplifiedBy: "@bobbilee",
    suiteFit: ["Radar", "Builder CRM", "Pilot pipeline"],
  },
  {
    handle: "@BrazillianCare",
    project: "Brazil Arc chapter",
    description: "Brazil meetup and regional builder activity.",
    category: "regional",
    stack: ["Arc Architects", "Regional chapter"],
    traction: "Meetup/chapter visibility",
    signal: "medium",
    amplifiedBy: "@bobbilee",
    suiteFit: ["Radar", "Builder CRM", "Pilot pipeline"],
  },
]

const opportunityGaps = [
  ["Agent mandate proof", "High priority", "Wallet caps exist, but organizations still need portable evidence connecting intent, policy, approval, execution and delivered result."],
  ["Nanopayment operations", "New", "High-frequency authorizations need session budgets, replay controls, batch reconciliation and provider-level exception metrics."],
  ["Machine-readable distribution", "New", "OpenAPI, llms.txt, MCP and payment metadata are becoming the storefront agents use to discover and buy services."],
  ["Card settlement operations", "New", "Authorization, clearing, Arc settlement and reconciliation need one observable state machine for card-linked USDC/EURC flows."],
  ["B2B obligation netting", "New", "Recurring invoices and supplier payments can settle only residual obligations instead of moving every gross leg."],
  ["Private payments", "Nearly empty", "Selective disclosure, private invoices and auditor view keys are the clearest wedge."],
  ["Agent receipts", "Emerging", "x402 payments are active, but private or compliance-aware receipts are still underbuilt."],
  ["Builder operations", "Fragmented", "Builders have demos, but few have billing, wallet policy, monitoring and execution control."],
  ["Regional GTM", "Growing", "Nigeria and Brazil chapters are visible but not yet connected to a builder operating layer."],
]

const suiteFit = [
  ["Payments builders", "Billing, Flow, Wallet OS, Private"],
  ["Agentic marketplaces", "Marketplace, Billing, Reputation, Escrow"],
  ["DeFi and FX apps", "Shield, Treasury, Flow, Gas"],
  ["Infrastructure tools", "Execution Control, Ops Health, Radar"],
  ["Regional chapters", "Radar, Pilot CRM, demo workspace"],
]

const closestReferences = [
  ["Circle Agent Stack", "The native platform Kestrel should extend: use its wallets and payment rails, then add organizational policy, reconciliation and portable proof."],
  ["AgentCash / AIsa", "The strongest evidence that paid API discovery and per-call agent commerce can produce real transaction counts and revenue."],
  ["Crossmint / Cobo", "The wallet-control benchmark: bounded delegation must be enforced below the prompt and revocable by the owner."],
  ["Wirex One", "Card-linked USDC/EURC settlement makes reconciliation and pending-versus-settled state part of the core product architecture."],
  ["Cycles", "The strongest B2B settlement reference: net obligations first, then settle residual USDC on Arc."],
  ["Pulsar", "The closest consumer money-movement reference across balances, FX, cards and Arc-native settlement."],
  ["NexusYield", "Closest privacy reference. Different stack via TEE; complementary to Fairblock-style private payments."],
  ["AuraGate", "Closest agentic x402 reference. Public marketplace today; private receipts could be the upgrade path."],
  ["Arclet / ArcPay", "Closest payment UX templates. They can become private checkout and private invoice references."],
]

export function RadarClient() {
  const [activeCategory, setActiveCategory] = useState<BuilderCategory | "all">("all")

  const filteredBuilders = useMemo(() => {
    if (activeCategory === "all") return builders
    return builders.filter((builder) => builder.category === activeCategory)
  }, [activeCategory])

  const categoryCounts = useMemo(() => {
    return Object.keys(categoryMeta).map((key) => {
      const category = key as BuilderCategory
      return {
        ...categoryMeta[category],
        category,
        count: builders.filter((builder) => builder.category === category).length,
      }
    })
  }, [])

  const primitives = ["App Kit", "Agent Stack", "x402 / MPP", "Gateway webhooks", "USDC/EURC", "Nanopayments", "CCTP", "StableFX"]

  return (
    <section className="radar-shell">
      <div className="radar-hero">
        <div>
          <p className="kicker">Arc builder intelligence</p>
          <h1>Where Arc builders are active, and where the gap is still open.</h1>
          <p>
            Updated 26 July 2026. Kestrel Radar combines official Arc and Circle releases,
            public builder signals, competing agent-payment products and grant traction into a product map: builder categories,
            primitives, traction signals, opportunity gaps and the exact place Kestrel can
            become the operating layer for payment, agent and stablecoin apps.
          </p>
          <div className="radar-actions">
            <a className="button primary" href="#builder-map"><Radar size={16} /> Explore builders</a>
            <a className="button secondary" href="#gaps"><LockKeyhole size={16} /> View gaps</a>
          </div>
        </div>
        <div className="radar-signal-card" aria-label="Kestrel Radar signal summary">
          <div className="radar-orbit">
            <i />
            <i />
            <i />
            <strong>Private payments</strong>
          </div>
          <div className="radar-signal-grid">
            <Metric label="Mapped builders" value={String(builders.length)} />
            <Metric label="High-signal refs" value={String(builders.filter((builder) => builder.signal === "high").length)} />
            <Metric label="Privacy refs" value={String(builders.filter((builder) => builder.category === "privacy").length)} />
            <Metric label="Primary wedge" value="Kestrel Private" />
          </div>
        </div>
      </div>

      <div className="radar-method">
        <div><Search size={18} /><span>Source scope</span><strong>Arc/Circle releases, grants, builders, X signals and competing payment platforms</strong></div>
        <div><BadgeCheck size={18} /><span>Signal model</span><strong>Visibility, amplification, primitives, demo quality, strategic fit</strong></div>
        <div><Eye size={18} /><span>Research stance</span><strong>Public visibility only; low-signal builders are marked, not hidden</strong></div>
      </div>

      <section className="radar-section" id="builder-map">
        <div className="section-heading compact">
          <p className="kicker">Builder map</p>
          <h2>Settlement is becoming the product, not the back-office layer.</h2>
          <p>
            Agent Stack, AgentCash, AIsa, Wirex, Cycles and Pulsar move the signal from one-off
            transfers toward repeated API purchases, card volume, recurring obligations,
            USDC/EURC balances and operational reconciliation.
          </p>
        </div>

        <div className="radar-category-grid">
          <button className={activeCategory === "all" ? "is-active" : ""} onClick={() => setActiveCategory("all")} type="button">
            <Network size={18} /><span>All builders</span><strong>{builders.length}</strong>
          </button>
          {categoryCounts.map((item) => {
            const Icon = item.icon
            return (
              <button
                className={activeCategory === item.category ? "is-active" : ""}
                data-tone={item.tone}
                key={item.category}
                onClick={() => setActiveCategory(item.category)}
                type="button"
              >
                <Icon size={18} /><span>{item.label}</span><strong>{item.count}</strong>
              </button>
            )
          })}
        </div>

        <div className="radar-builder-table">
          <div className="radar-builder-head">
            <span>Builder</span>
            <span>Project</span>
            <span>Stack</span>
            <span>Kestrel fit</span>
            <span>Signal</span>
          </div>
          {filteredBuilders.map((builder) => {
            const meta = categoryMeta[builder.category]
            return (
              <article className="radar-builder-row" key={`${builder.handle}-${builder.project}`}>
                <div>
                  <span>{builder.handle}</span>
                  <small>{meta.label} · {builder.amplifiedBy}</small>
                </div>
                <div>
                  <strong>{builder.project}</strong>
                  <p>{builder.description}</p>
                  <small>{builder.traction}</small>
                </div>
                <div className="radar-tags">
                  {builder.stack.map((tag) => <span key={tag}>{tag}</span>)}
                </div>
                <div className="radar-tags is-suite">
                  {builder.suiteFit.map((tag) => <span key={tag}>{tag}</span>)}
                </div>
                <div>
                  <em className={`radar-signal is-${builder.signal}`}>{builder.signal}</em>
                </div>
              </article>
            )
          })}
        </div>
      </section>

      <section className="radar-section radar-split" id="gaps">
        <div>
          <p className="kicker">Opportunity gaps</p>
          <h2>The strongest wedge is mandate-to-proof settlement control.</h2>
          <p>
            Wallets, payment protocols and FX rails are shipping quickly. The underbuilt layer is
            what happens around settlement: organizational mandate, approval, provider trust,
            pending state, reconciliation, netting, private receipts and operational recovery.
          </p>
          <div className="radar-gap-list">
            {opportunityGaps.map(([title, state, text]) => (
              <article key={title}>
                <span>{state}</span>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </div>
        <div className="radar-primitive-panel">
          <div className="shield-preview-top"><span>PRIMITIVE USAGE</span><strong>KESTREL FIT</strong></div>
          {primitives.map((primitive, index) => (
            <div className="radar-primitive-row" key={primitive}>
              <span>{primitive}</span>
              <div><i style={{ width: `${92 - index * 7}%` }} /></div>
              <strong>{index < 3 ? "core" : index < 6 ? "active" : "emerging"}</strong>
            </div>
          ))}
          <div className="radar-private-callout">
            <LockKeyhole size={18} />
            <div>
              <span>Next flagship layer</span>
              <strong>Mandate → Settlement → Proof</strong>
              <p>Agent budgets, provider trust, Gateway lifecycle events, reconciliation and portable evidence.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="radar-section">
        <div className="section-heading compact">
          <p className="kicker">Where Kestrel fits</p>
          <h2>Not another DEX. The operating layer around builders.</h2>
        </div>
        <div className="radar-fit-grid">
          {suiteFit.map(([segment, fit]) => (
            <article key={segment}>
              <WalletCards size={20} />
              <h3>{segment}</h3>
              <p>{fit}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="radar-section radar-reference-grid">
        <article className="radar-research-card">
          <Building2 size={22} />
          <p className="kicker">Closest references</p>
          <h2>The products defining Kestrel&apos;s strategic neighborhood.</h2>
          {closestReferences.map(([name, text]) => (
            <div className="radar-reference" key={name}>
              <strong>{name}</strong>
              <p>{text}</p>
            </div>
          ))}
        </article>
        <article className="radar-research-card">
          <ShieldCheck size={22} />
          <p className="kicker">Investor thesis</p>
          <h2>Kestrel is an ecosystem-aware control plane.</h2>
          <p>
            The ecosystem is already crowded in simple payments, DeFi and FX. Kestrel
            differentiates by combining risk, billing, wallet policy, execution monitoring
            and a privacy-ready settlement roadmap into one builder operating layer.
          </p>
          <a href="/investors"><Link2 size={16} /> Open investor page</a>
        </article>
      </section>
    </section>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  )
}
