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
  link: string
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
    handle: "@Torin_559",
    project: "NexusYield Protocol",
    description: "Confidential yield and RWA liquidity with TEE-shielded payments.",
    category: "privacy",
    stack: ["TEE", "EIP-712 views", "Nanopay/Fastpay", "Arc primitives"],
    traction: "Low public engagement, high strategic relevance",
    signal: "medium",
    link: "https://x.com/Torin_559/status/2068986635740676216",
    amplifiedBy: "Tagged Arc/Circle team for feedback",
    suiteFit: ["Arc Private", "Arc Flow", "Arc Shield"],
  },
  {
    handle: "@BenyaminStyles",
    project: "Arclet",
    description: "USDC checkout links, invoices, tip jars and content unlocks.",
    category: "payments",
    stack: ["Arc App Kit", "USDC bridge", "CCTP"],
    traction: "Community video demo",
    signal: "medium",
    link: "https://x.com/eeeman33/status/2069306429769404499",
    amplifiedBy: "Community",
    suiteFit: ["Arc Billing", "Arc Flow", "Arc Private"],
  },
  {
    handle: "@Audu70",
    project: "ArcPay",
    description: "Cross-chain USDC payments using Circle wallets and CCTP.",
    category: "payments",
    stack: ["Circle Wallets", "CCTP"],
    traction: "Live demo, low public engagement",
    signal: "medium",
    link: "https://x.com/Audu70/status/2068993695265804439",
    amplifiedBy: "Self/community",
    suiteFit: ["Arc Flow", "Wallet OS", "Arc Shield"],
  },
  {
    handle: "@Xylonet_",
    project: "XyloNet / PayX",
    description: "Stablecoin DeFi and social tipping/escrow payments to X handles.",
    category: "payments",
    stack: ["CCTP V2", "ERC-4626", "Liquidity pools"],
    traction: "Arc feature, 500+ likes",
    signal: "high",
    link: "https://x.com/arc/status/2065464145391005865",
    amplifiedBy: "@arc",
    suiteFit: ["Arc Escrow", "Arc Billing", "Arc Shield"],
  },
  {
    handle: "@tlay_io",
    project: "TLAY",
    description: "Machine-to-machine nanopayments with embedded device wallets.",
    category: "payments",
    stack: ["Circle Nanopayments", "Gateway", "Arc Testnet"],
    traction: "Builder Spotlight, 400+ likes",
    signal: "high",
    link: "https://x.com/arc/status/2059637090023829974",
    amplifiedBy: "@arc, @samconnerone",
    suiteFit: ["Arc Billing", "Wallet OS", "Arc Gas"],
  },
  {
    handle: "@mrcoc0x",
    project: "AuraGate",
    description: "x402 marketplace where AI agents discover APIs and pay per request.",
    category: "agentic",
    stack: ["x402", "USDC receipts", "Arc"],
    traction: "30+ services, 500+ paid testnet calls",
    signal: "high",
    link: "https://x.com/mrcoc0x/status/2069244822171603433",
    amplifiedBy: "Hackathon/community context",
    suiteFit: ["Marketplace", "Arc Billing", "Arc Reputation"],
  },
  {
    handle: "@ProoVra",
    project: "ProoVra",
    description: "Proof-based escrow and settlement for AI agents.",
    category: "agentic",
    stack: ["Arc", "Proof receipts", "Conditional settlement"],
    traction: "Hackathon thread",
    signal: "medium",
    link: "https://x.com/Armanibanks100",
    amplifiedBy: "Hackathon/community",
    suiteFit: ["Arc Escrow", "Arc Flow", "Arc Reputation"],
  },
  {
    handle: "@0xMASTER82",
    project: "ArcSwap",
    description: "Stablecoin FX DEX for USDC/EURC swaps and liquidity pools.",
    category: "fx",
    stack: ["Arc stablecoin primitives", "Solidity"],
    traction: "Launch post and GitHub",
    signal: "medium",
    link: "https://x.com/0xMASTER82/status/2069022352873009269",
    amplifiedBy: "Community",
    suiteFit: ["Arc Shield", "Arc Flow", "Treasury"],
  },
  {
    handle: "@stablecorp",
    project: "QCAD on Arc",
    description: "CAD stablecoin and onchain CAD/USD FX flows.",
    category: "fx",
    stack: ["StableFX", "Arc primitives"],
    traction: "Arc spotlight, 900+ likes",
    signal: "high",
    link: "https://x.com/arc/status/2057446320164454420",
    amplifiedBy: "@arc",
    suiteFit: ["Treasury", "Arc Flow", "Arc Shield"],
  },
  {
    handle: "@Hydra12351",
    project: "LumenFi",
    description: "Stablecoin-native DeFi dashboard for balances, swaps, lending and bridge onboarding.",
    category: "defi",
    stack: ["Arc primitives", "Bridge"],
    traction: "Testnet prototype",
    signal: "low",
    link: "https://x.com/Hydra12351/status/2069169521613734100",
    amplifiedBy: "Self/community",
    suiteFit: ["Treasury", "Arc Shield", "Wallet OS"],
  },
  {
    handle: "@synthra_finance",
    project: "Synthra",
    description: "Spot trading, concentrated liquidity and perpetual markets on Arc.",
    category: "defi",
    stack: ["Arc", "CL", "Perps"],
    traction: "Builder Spotlight",
    signal: "high",
    link: "https://x.com/arc",
    amplifiedBy: "@arc",
    suiteFit: ["Arc Shield", "Arc Gas", "Execution Control"],
  },
  {
    handle: "@TowerExchange",
    project: "Tower Exchange",
    description: "Stablecoin DEX aggregator for better prices across Arc liquidity.",
    category: "defi",
    stack: ["Arc", "Aggregator routing", "Synthra integration"],
    traction: "Arc spotlight",
    signal: "high",
    link: "https://x.com/TowerExchange",
    amplifiedBy: "@arc",
    suiteFit: ["Arc Flow", "Arc Shield", "Execution Control"],
  },
  {
    handle: "@goldskyio",
    project: "Goldsky",
    description: "Real-time indexing and data streaming for Arc builders.",
    category: "infra",
    stack: ["Arc indexing", "Data streaming"],
    traction: "Builders Fund spotlight, 900+ likes",
    signal: "high",
    link: "https://x.com/arc/status/2059348849995722969",
    amplifiedBy: "@arc",
    suiteFit: ["Execution Control", "Ops Health", "Arc Radar"],
  },
  {
    handle: "@0x_zax",
    project: "ArcFunTerminal",
    description: "CCTP V2 bridge and recovery engine for failed or burned transfers.",
    category: "infra",
    stack: ["CCTP V2", "Recovery engine", "9 chains"],
    traction: "Thread/video, 100+ likes on stronger posts",
    signal: "high",
    link: "https://x.com/0x_zax/status/2068920578954629153",
    amplifiedBy: "Tagged Arc/Circle team",
    suiteFit: ["Execution Control", "Arc Flow", "Wallet OS"],
  },
  {
    handle: "@Iblamehsan",
    project: "Arcpredict",
    description: "Sports prediction market experiments on Arc testnet.",
    category: "prediction",
    stack: ["Arc primitives", "USDC bets"],
    traction: "Low-signal beta screenshots",
    signal: "low",
    link: "https://x.com/Iblamehsan/status/2069422877514850605",
    amplifiedBy: "Self/community",
    suiteFit: ["Arc Escrow", "Arc Shield", "Arc Private"],
  },
  {
    handle: "@JerryOjumah",
    project: "Nigeria Arc chapter",
    description: "Regional organizer and Lagos meetup lead.",
    category: "regional",
    stack: ["Arc Architects", "Community enablement"],
    traction: "Repeated Bobbilee amplification",
    signal: "high",
    link: "https://x.com/bobbilee",
    amplifiedBy: "@bobbilee",
    suiteFit: ["Arc Radar", "Builder CRM", "Pilot pipeline"],
  },
  {
    handle: "@BrazillianCare",
    project: "Brazil Arc chapter",
    description: "Brazil meetup and regional builder activity.",
    category: "regional",
    stack: ["Arc Architects", "Regional chapter"],
    traction: "Meetup/chapter visibility",
    signal: "medium",
    link: "https://x.com/bobbilee",
    amplifiedBy: "@bobbilee",
    suiteFit: ["Arc Radar", "Builder CRM", "Pilot pipeline"],
  },
]

const opportunityGaps = [
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

  const primitives = ["CCTP", "x402", "Wallets", "App Kit", "Nanopayments", "StableFX", "Paymaster", "Indexing"]

  return (
    <section className="radar-shell">
      <div className="radar-hero">
        <div>
          <p className="kicker">Arc builder intelligence</p>
          <h1>Where Arc builders are active, and where the gap is still open.</h1>
          <p>
            Arc Radar turns ecosystem research into a product map: builder categories,
            primitives, traction signals, opportunity gaps and the exact place Arc Suite can
            become the operating layer for payment, agent and stablecoin apps.
          </p>
          <div className="radar-actions">
            <a className="button primary" href="#builder-map"><Radar size={16} /> Explore builders</a>
            <a className="button secondary" href="#gaps"><LockKeyhole size={16} /> View gaps</a>
          </div>
        </div>
        <div className="radar-signal-card" aria-label="Arc Radar signal summary">
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
            <Metric label="Primary wedge" value="Arc Private" />
          </div>
        </div>
      </div>

      <div className="radar-method">
        <div><Search size={18} /><span>Source scope</span><strong>X, Arc spotlights, Builder Fund, Office Hours, regional chapters</strong></div>
        <div><BadgeCheck size={18} /><span>Signal model</span><strong>Visibility, amplification, primitives, demo quality, strategic fit</strong></div>
        <div><Eye size={18} /><span>Research stance</span><strong>Public visibility only; low-signal builders are marked, not hidden</strong></div>
      </div>

      <section className="radar-section" id="builder-map">
        <div className="section-heading compact">
          <p className="kicker">Builder map</p>
          <h2>Payments and DeFi are active. Privacy remains sparse.</h2>
          <p>
            The map is intentionally practical: every builder is mapped to both an ecosystem
            category and the Arc Suite products that could serve them.
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
            <span>Arc Suite fit</span>
            <span>Signal</span>
          </div>
          {filteredBuilders.map((builder) => {
            const meta = categoryMeta[builder.category]
            return (
              <article className="radar-builder-row" key={`${builder.handle}-${builder.project}`}>
                <div>
                  <a href={builder.link} target="_blank" rel="noreferrer">{builder.handle}</a>
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
          <h2>The strongest wedge is private, compliant stablecoin flow.</h2>
          <p>
            Arc builders are shipping payments, DeFi, FX and infrastructure quickly. The
            underbuilt space is selective disclosure: private invoices, private receipts,
            auditor view keys and policy-gated settlement.
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
          <div className="shield-preview-top"><span>PRIMITIVE USAGE</span><strong>ARC SUITE FIT</strong></div>
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
              <strong>Arc Private</strong>
              <p>Private invoices, private x402 receipts, auditor view keys and policy-aware disclosure.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="radar-section">
        <div className="section-heading compact">
          <p className="kicker">Where Arc Suite fits</p>
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
          <h2>Three projects define the strategic neighborhood.</h2>
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
          <h2>Arc Suite is ecosystem-aware infrastructure.</h2>
          <p>
            The ecosystem is already crowded in simple payments, DeFi and FX. Arc Suite
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
