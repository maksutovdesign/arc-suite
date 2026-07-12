import {
  ArrowRightLeft,
  AlertTriangle,
  CheckCircle2,
  Clock3,
  FileCheck2,
  Fingerprint,
  Network,
  RadioTower,
  ReceiptText,
  Route,
  ShieldCheck,
} from "lucide-react"

import { EcosystemNav } from "../EcosystemNav"
import { arcNetworkResilience } from "../../lib/network-resilience"

export const metadata = {
  title: "Arc Interop — CCIP Route Demo",
  description: "Chainlink CCIP route demo for Arc Suite cross-chain treasury and collateral workflows.",
}

const routeRun = {
  id: "ccip_arc_sepolia_2048",
  router: "0xdE4E7FED43FAC37EB21aA0643d9852f75332eab8",
  selector: "3034092155422581607",
  source: "Arc Testnet",
  target: "Ethereum Sepolia",
  status: "Route-ready",
  oracleRiskHash: "0xriskc6c0fb7f3421d4b1986f0fbcf8e7b31e2048",
  oracleSignal: "Chainlink CCIP route configured · Arc selector matched",
  receiptState: "receipt_missing -> review",
  validationState: "validation_missing -> review",
  proofHash: "sha256:9db7c7c9e467c79e9f12f4ddf8b912fedc7ce6bf8f6f4dd9a9a648cc8e3f2048",
  messageId: "0xarc2048ccip00000000000000000000000000000000000000000000000091fa",
  rpcLatencyMs: 184,
  feedFreshnessMs: 730,
  deviationBps: 0,
  explorerUrl: "https://testnet.arcscan.app",
}

const routeSteps = [
  ["Policy checked", "Shield confirms address, route and risk inputs before the cross-chain instruction is prepared.", CheckCircle2],
  ["Oracle risk attached", "Chainlink-on-Arc evidence becomes the oracleRiskHash inside the job envelope.", RadioTower],
  ["CCIP route selected", "Arc Testnet selector and router are attached to the route run.", Route],
  ["Receipt required", "Provider receipt must arrive before the job can be treated as fulfilled.", ReceiptText],
  ["Validation required", "Validator evidence closes the loop; missing evidence moves the job to review.", ShieldCheck],
]

const riskRouterSteps = [
  ["Policy", "Treasury, Reputation and Shield clear the request before routing.", "pass"],
  ["Oracle", "Chainlink route/data signal is hashed into the job envelope.", "attached"],
  ["CCIP", "Arc Testnet → Ethereum Sepolia route metadata is prepared.", "ready"],
  ["Receipt", "Missing provider receipt keeps settlement finalization on hold.", "review"],
  ["Validation", "Missing validation evidence blocks trust-score update.", "review"],
]

const failureGates = [
  ["receipt_missing", "Do not finalize settlement proof", "The policy path passed, but provider evidence has not arrived."],
  ["validation_missing", "Do not update reputation", "The job cannot become a positive trust signal without validator evidence."],
  ["dispute_opened", "Route to operator review", "The operator can retry, refund or resolve without exposing private provider logic."],
]

const evidence = [
  ["Source chain", routeRun.source],
  ["Target chain", routeRun.target],
  ["CCIP router", shortAddress(routeRun.router)],
  ["Arc selector", routeRun.selector],
  ["Oracle risk", shortHash(routeRun.oracleRiskHash)],
  ["Message id", shortHash(routeRun.messageId)],
  ["Proof hash", shortHash(routeRun.proofHash)],
]

const routeHistory = [
  ["09:12:00", "policy_passed", "Treasury, Shield and Reputation gates passed."],
  ["09:12:01", "oracle_attached", "Chainlink route signal attached as oracleRiskHash."],
  ["09:12:02", "ccip_route_ready", "Arc Testnet selector and router matched."],
  ["09:12:03", "receipt_required", "Provider receipt required before fulfillment."],
  ["09:12:04", "validation_required", "Validation artifact required before reputation update."],
] as const

const swapRoutes = [
  ["USDC -> EURC", "Stablecoin FX", "0.04% slippage", "quote-ready"],
  ["USDC -> RWA cash leg", "Private credit settlement", "kyb-gated", "policy-ready"],
  ["USDC -> ETH", "Liquidity venue route", "Uniswap-ready", "adapter-ready"],
  ["Gateway balance -> Solana recipient", "Forwarded spend", "useForwarder", "planned"],
] as const

export default function InteropPage() {
  return (
    <main>
      <EcosystemNav current="interop" />
      <section className="analytics-shell interop-shell">
        <div className="interop-hero">
          <div>
            <p className="kicker">Chainlink CCIP route demo</p>
            <h1>Arc Interop</h1>
            <p>
              A route-ready demo for cross-chain treasury, collateral and settlement coordination.
              Arc Suite checks policy, attaches Chainlink risk evidence, prepares the CCIP route,
              and only finalizes the job when receipt and validation artifacts are present.
            </p>
          </div>
          <div className="interop-status-card">
            <Network size={24} />
            <span>{routeRun.status}</span>
            <strong>{routeRun.source} → {routeRun.target}</strong>
            <small>Router, selector and oracleRiskHash attached to the job envelope.</small>
          </div>
        </div>

        <section className="interop-route-card">
          <div className="interop-route-head">
            <div>
              <span>Route run</span>
              <h2>{routeRun.id}</h2>
            </div>
            <strong>{routeRun.status}</strong>
          </div>

          <div className="interop-route-visual" aria-label="Arc Testnet to Ethereum Sepolia CCIP route">
            <div>
              <span>Source</span>
              <strong>Arc Testnet</strong>
              <small>USDC treasury instruction</small>
            </div>
            <ArrowRightLeft aria-hidden="true" size={28} />
            <div>
              <span>Target</span>
              <strong>Ethereum Sepolia</strong>
              <small>Collateral / provider route</small>
            </div>
          </div>

          <div className="interop-evidence-grid">
            {evidence.map(([label, value]) => (
              <div key={label}>
                <span>{label}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
        </section>

        <section className="interop-risk-router" aria-label="Arc Interop Risk Router">
          <div className="interop-panel-head">
            <ShieldCheck size={20} />
            <div>
              <span>Arc Interop & Risk Router</span>
              <h2>Policy → Oracle → CCIP → Receipt → Validation</h2>
            </div>
          </div>
          <div className="interop-router-flow">
            {riskRouterSteps.map(([label, detail, state], index) => (
              <article className={`is-${state}`} key={label}>
                <i>{String(index + 1).padStart(2, "0")}</i>
                <strong>{label}</strong>
                <span>{detail}</span>
                <code>{state}</code>
              </article>
            ))}
          </div>
          <div className="interop-router-hash">
            <div>
              <span>oracleRiskHash</span>
              <strong>{routeRun.oracleRiskHash}</strong>
            </div>
            <div>
              <span>Risk input</span>
              <strong>{routeRun.oracleSignal}</strong>
            </div>
          </div>
        </section>

        <section className="interop-route-card">
          <div className="interop-route-head">
            <div>
              <span>Interop v2 readiness</span>
              <h2>Route status, feed freshness and RPC health.</h2>
            </div>
            <strong>Adapter-ready</strong>
          </div>
          <div className="interop-evidence-grid">
            <div><span>CCIP status</span><strong>prepared</strong></div>
            <div><span>Feed freshness</span><strong>{routeRun.feedFreshnessMs} ms</strong></div>
            <div><span>Deviation</span><strong>{routeRun.deviationBps} bps</strong></div>
            <div><span>RPC latency</span><strong>{routeRun.rpcLatencyMs} ms</strong></div>
            <div><span>Explorer</span><strong>Arcscan-ready</strong></div>
            <div><span>History</span><strong>{routeHistory.length} states</strong></div>
          </div>
          <div className="interop-proof-list">
            {routeHistory.map(([time, state, detail]) => (
              <div key={state}>
                <dt>{time} · {state}</dt>
                <dd>{detail}</dd>
              </div>
            ))}
          </div>
        </section>

        <section className="interop-route-card">
          <div className="interop-route-head">
            <div>
              <span>Swap and liquidity routing</span>
              <h2>Uniswap and Stablecoin Kit paths as route evidence.</h2>
            </div>
            <strong>FX-ready</strong>
          </div>
          <div className="interop-evidence-grid">
            {swapRoutes.map(([pair, purpose, signal, status]) => (
              <div key={pair}>
                <span>{purpose}</span>
                <strong>{pair}</strong>
                <small>{signal} · {status}</small>
              </div>
            ))}
          </div>
          <p className="interop-note">
            Arc Suite treats swaps as auditable money movement: quote, route, memo, transaction hash
            and proof status can be attached to the same job envelope as API payments.
          </p>
        </section>

        <div className="interop-grid">
          <section className="interop-panel">
            <div className="interop-panel-head">
              <Route size={20} />
              <div>
                <span>Execution path</span>
                <h2>Policy before routing, proof before finalization.</h2>
              </div>
            </div>
            <div className="interop-steps">
              {routeSteps.map(([title, text, Icon], index) => (
                <article key={title as string}>
                  <i>{String(index + 1).padStart(2, "0")}</i>
                  <Icon aria-hidden="true" size={18} />
                  <div>
                    <strong>{title as string}</strong>
                    <p>{text as string}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="interop-panel">
            <div className="interop-panel-head">
              <Fingerprint size={20} />
              <div>
                <span>Proof envelope</span>
                <h2>What the reviewer can verify.</h2>
              </div>
            </div>
            <dl className="interop-proof-list">
              <div><dt>Router</dt><dd>{routeRun.router}</dd></div>
              <div><dt>Selector</dt><dd>{routeRun.selector}</dd></div>
              <div><dt>Oracle risk</dt><dd>{routeRun.oracleRiskHash}</dd></div>
              <div><dt>Message status</dt><dd>Prepared · awaiting live CCIP adapter</dd></div>
              <div><dt>Receipt state</dt><dd>{routeRun.receiptState}</dd></div>
              <div><dt>Validation state</dt><dd>{routeRun.validationState}</dd></div>
              <div><dt>Proof hash</dt><dd>{routeRun.proofHash}</dd></div>
            </dl>
            <p className="interop-note">
              The page exposes route evidence without exposing private provider logic. Live CCIP reads can replace
              the demo status while preserving the same route envelope.
            </p>
          </section>
        </div>

        <section className="interop-failure-panel">
          <div className="interop-panel-head">
            <AlertTriangle size={20} />
            <div>
              <span>Artifact gates</span>
              <h2>Policy pass does not settle a route by itself.</h2>
            </div>
          </div>
          <div className="interop-failure-grid">
            {failureGates.map(([state, action, detail]) => (
              <article key={state}>
                <code>{state}</code>
                <strong>{action}</strong>
                <span>{detail}</span>
              </article>
            ))}
          </div>
        </section>

        <section className="interop-failure-panel">
          <div className="interop-panel-head">
            <Clock3 size={20} />
            <div>
              <span>Arc Network Resilience</span>
              <h2>Load-aware settlement states.</h2>
            </div>
          </div>
          <p className="interop-note">
            {arcNetworkResilience.summary} During planned Arc Testnet load testing, congestion or delayed
            block production should become an execution state, not a false product failure.
          </p>
          <div className="interop-failure-grid">
            {arcNetworkResilience.states.map((item) => (
              <article key={item.state}>
                <code>{item.state}</code>
                <strong>{item.action}</strong>
                <span>{item.detail}</span>
              </article>
            ))}
          </div>
          <div className="interop-router-hash">
            <div>
              <span>Status source</span>
              <strong>{arcNetworkResilience.statusPageUrl}</strong>
            </div>
            <div>
              <span>Monitor policy</span>
              <strong>{arcNetworkResilience.monitorPolicy[0]}</strong>
            </div>
          </div>
        </section>

        <section className="interop-bottom-band">
          <FileCheck2 size={20} />
          <div>
            <span>Reviewer takeaway</span>
            <strong>Interop is part of the same proof system.</strong>
            <p>
              The product surface is ready for live route observation: message id, source chain,
              target chain, Chainlink router, Arc selector, oracle risk hash and artifact-gating state
              already have a place in the UI.
            </p>
          </div>
        </section>
      </section>
    </main>
  )
}

function shortAddress(value: string) {
  return `${value.slice(0, 8)}...${value.slice(-4)}`
}

function shortHash(value: string) {
  return `${value.slice(0, 14)}...${value.slice(-8)}`
}
