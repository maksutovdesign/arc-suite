import { BrandMark } from "../BrandMark"

const roadmap = [
  ["0-3 months", "Pilot-ready MVP", "Live Arc/Circle integration, auth, policy engine v1, score API, x402 gate demo, and basic billing."],
  ["3-6 months", "Trust network", "Production reputation model, webhooks, provider verification, SDKs, docs, audit trail, and alpha customers."],
  ["6-9 months", "Marketplace growth", "Provider onboarding, search and ranking, analytics, paid discovery, usage-based pricing, and SLAs."],
  ["9-12 months", "Enterprise layer", "Multi-team governance, compliance reports, policy templates, risk controls, security review, and scaled pilots."],
]

const kpis = [
  ["Active agents", "Primary product adoption signal"],
  ["Managed USDC", "Economic value under control"],
  ["Score queries", "Developer and provider usage"],
  ["Gated requests", "Proof that reputation drives access"],
  ["Marketplace volume", "Network monetization surface"],
  ["MRR / usage revenue", "Commercial conversion"],
]

export default function InvestorPage() {
  return (
    <main>
      <nav className="nav">
        <a className="brand" href="/" aria-label="Arc Suite home">
          <BrandMark idPrefix="investor-brand" />
          <span className="brand-name">Arc Suite</span>
        </a>
        <div className="nav-cluster">
          <div className="nav-links" aria-label="Investor navigation">
            <a href="/">Product</a>
            <a href="#roadmap">Roadmap</a>
            <a href="#ask">Funding ask</a>
            <a href="/analytics">Analytics</a>
          </div>
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

      <section className="investor-hero">
        <p className="kicker">Investor page</p>
        <h1>The control plane for autonomous USDC commerce.</h1>
        <p>
          Arc Suite is a connected infrastructure product for AI agents that spend,
          earn trust, and access x402 services. The wedge is not a dashboard; it is
          an enforcement loop that gets stronger as agents and API providers join.
        </p>
      </section>

      <section className="metrics investor-metrics">
        <div className="metric">
          <strong>3</strong>
          <span>shipped MVP apps</span>
        </div>
        <div className="metric">
          <strong>23+</strong>
          <span>product flows and routes</span>
        </div>
        <div className="metric">
          <strong>25,482</strong>
          <span>demo agent transactions</span>
        </div>
        <div className="metric">
          <strong>24.8M</strong>
          <span>marketplace request volume</span>
        </div>
      </section>

      <section className="section split">
        <div>
          <p className="kicker">Investment thesis</p>
          <h2>As software starts paying software, trust and access become infrastructure.</h2>
        </div>
        <div className="text-stack">
          <p>
            Autonomous agents need spend limits, wallets, reporting, reputation, and
            service access rules. API providers need a signal before they serve the
            request. Arc Suite connects both sides of that market.
          </p>
          <p>
            The system compounds: more agents create more behavior, better behavior
            data improves the trust layer, and a stronger trust layer makes the
            marketplace more useful.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="section-heading">
          <p className="kicker">Business model</p>
          <h2>Monetize at three control points.</h2>
        </div>
        <div className="product-grid business-grid">
          <article className="product">
            <span>01</span>
            <h3>Operator SaaS</h3>
            <p>Subscription by workspace, agent count, budget policies, reports, exports, and compliance features.</p>
          </article>
          <article className="product">
            <span>02</span>
            <h3>Reputation API</h3>
            <p>Paid score, history and batch queries, webhooks, risk flags, and enterprise SLA for services gating agents.</p>
          </article>
          <article className="product">
            <span>03</span>
            <h3>Marketplace take-rate</h3>
            <p>Commission or revenue share on x402 API consumption, paid placement, verified provider pages, and analytics.</p>
          </article>
        </div>
      </section>

      <section className="section" id="roadmap">
        <div className="section-heading">
          <p className="kicker">Roadmap</p>
          <h2>12 months from MVP to infrastructure product.</h2>
        </div>
        <div className="roadmap">
          {roadmap.map(([period, title, text]) => (
            <article className="roadmap-item" key={period}>
              <span>{period}</span>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-heading compact">
          <p className="kicker">KPI model</p>
          <h2>Measure the full loop, not just page views.</h2>
        </div>
        <div className="kpi-grid">
          {kpis.map(([name, text]) => (
            <div className="kpi" key={name}>
              <strong>{name}</strong>
              <span>{text}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="section split funding" id="ask">
        <div>
          <p className="kicker">Funding ask</p>
          <h2>Pre-seed / strategic angel + ecosystem pilots.</h2>
        </div>
        <div className="text-stack">
          <p>
            Round size is TBD. The near-term objective is to convert the demo suite
            into a pilot-ready product within six months.
          </p>
          <ul className="fund-list">
            <li>45% product and engineering</li>
            <li>25% integrations and security</li>
            <li>20% GTM and ecosystem pilots</li>
            <li>10% legal, operations, and infrastructure</li>
          </ul>
        </div>
      </section>
    </main>
  )
}
