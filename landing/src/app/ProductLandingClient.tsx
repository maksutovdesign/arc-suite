"use client"

import { useMemo, useState } from "react"
import { BrandMark } from "./BrandMark"
import type { PilotSummary } from "@/lib/backend/schema"

const productDetails = [
  {
    key: "treasury",
    name: "Arc Treasury",
    eyebrow: "Spend control",
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
    title: "A pay-per-use API market that can gate requests by trust.",
    text: "Help agents discover x402 APIs with pricing, uptime, provider profiles, request volume and integration-ready detail pages.",
    image: "/screenshots/marketplace-browse.png",
    imageAlt: "Arc Marketplace browse page with x402 API cards, filters, pricing, uptime and provider data",
    stats: [
      ["143", "APIs listed"],
      ["58", "providers"],
      ["99.72%", "avg uptime"],
    ],
    bullets: ["x402 API discovery", "Provider and SLA context", "USDC-native access path"],
  },
]

const steps = [
  ["Spend", "Agents initiate USDC payments for data, compute, storage, swaps, and API calls."],
  ["Behavior", "Transactions, disputes, failures, latency, and usage patterns become live risk signals."],
  ["Reputation", "Signals roll into a trust score that services can query before serving a request."],
  ["Access", "APIs accept reliable agents and deny risky ones before value is delivered."],
]

const metrics = [
  ["3", "connected products"],
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

const liveDemoUrl = "https://treasury-umber.vercel.app"

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

      return {
        ...product,
        stats: [
          [String(pilotSummary.marketplace.apisListed), "APIs listed"],
          [String(pilotSummary.marketplace.providers), "providers"],
          [`${pilotSummary.marketplace.avgUptimePct}%`, "avg uptime"],
        ],
      }
    })
  }, [pilotSummary])
  const activeProduct = liveProductDetails.find((product) => product.key === activeProductKey) ?? liveProductDetails[0]
  const liveMetrics = pilotSummary
    ? [
        ["3", "connected products"],
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

  return (
    <main>
      <nav className="nav">
        <a className="brand" href="#top" aria-label="Arc Suite home">
          <BrandMark idPrefix="home-brand" />
          <span className="brand-name">Arc Suite</span>
        </a>
        <div className="nav-cluster">
          <div className="nav-links" aria-label="Primary navigation">
            <a href="#system">Product</a>
            <a href="#loop">Loop</a>
            <a href="#proof">Proof</a>
            <a href="/investors">Investors</a>
          </div>
          <a className="nav-demo" href={liveDemoUrl} target="_blank" rel="noreferrer">Demo</a>
          <div className="social-links" aria-label="Social links">
            <a href="https://github.com/maksutovdesign" aria-label="Maksutov Design on GitHub">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 .5a12 12 0 0 0-3.79 23.38c.6.11.82-.26.82-.58v-2.03c-3.34.73-4.04-1.42-4.04-1.42-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.73.08-.73 1.2.09 1.84 1.24 1.84 1.24 1.07 1.83 2.81 1.3 3.5.99.11-.78.42-1.3.76-1.6-2.67-.31-5.47-1.34-5.47-5.94 0-1.31.47-2.39 1.24-3.23-.12-.3-.54-1.53.12-3.18 0 0 1.01-.32 3.3 1.23a11.4 11.4 0 0 1 6.01 0c2.29-1.55 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.77.84 1.23 1.92 1.23 3.23 0 4.62-2.81 5.63-5.49 5.93.43.37.82 1.1.82 2.22v3.29c0 .32.22.69.83.57A12 12 0 0 0 12 .5Z" />
              </svg>
            </a>
            <a href="https://x.com/maksutovdesign" aria-label="Maksutov Design on X">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M18.9 2h3.3l-7.3 8.35L23.5 22h-6.73l-5.27-6.89L5.47 22H2.16l7.8-8.92L1.72 2h6.9l4.76 6.29L18.9 2Zm-1.16 17.95h1.83L7.63 3.94H5.67l12.07 16.01Z" />
              </svg>
            </a>
          </div>
        </div>
      </nav>

      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="kicker">AI agent infrastructure for the onchain economy</p>
          <h1>Control how agents spend, earn trust, and access paid APIs.</h1>
          <p className="hero-text">
            Arc Suite is a connected product system built for autonomous USDC commerce:
            Treasury controls spend, Reputation scores behavior, and Marketplace gates
            x402 API access.
          </p>
          <div className="hero-actions">
            <a className="button primary" href={liveDemoUrl} target="_blank" rel="noreferrer">Launch live demo</a>
            <a className="button secondary" href="#system">Explore the product</a>
            <a className="button secondary" href="/investors">Investor page</a>
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
          <h2>Three apps. One enforcement layer.</h2>
          <p>
            Arc Suite is designed around a shared cast of agents moving through the
            complete economic journey, from wallet spend to trust scoring to service access.
          </p>
        </div>

        <div className="product-switcher">
          <div className="product-tabs" role="tablist" aria-label="Arc Suite products">
            {liveProductDetails.map((product) => (
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
                <span>{product.eyebrow}</span>
                <strong>{product.name}</strong>
              </button>
            ))}
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
              <img src={activeProduct.image} alt={activeProduct.imageAlt} />
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
            proof, not decorative mockups.
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
            Treasury answers: how do I control what my agents spend? Reputation
            answers: which agents can services trust? Marketplace answers: where do
            agents find services to pay for?
          </p>
          <p>
            Together, the suite becomes an operating layer for x402-enabled APIs,
            agent wallets, and autonomous pay-per-use workflows on Arc.
          </p>
        </div>
      </section>

      <section className="cta">
        <p className="kicker">Ready for pilots</p>
        <h2>Turn autonomous agent payments into accountable infrastructure.</h2>
        <div className="cta-actions">
          <a className="button primary" href={liveDemoUrl} target="_blank" rel="noreferrer">Launch live demo</a>
          <a className="button secondary" href="/investors">View investor page</a>
        </div>
      </section>
    </main>
  )
}
