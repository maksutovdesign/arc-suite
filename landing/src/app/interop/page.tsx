import {
  ArrowRightLeft,
  CheckCircle2,
  Clock3,
  Fingerprint,
  Network,
  RadioTower,
  Route,
  ShieldCheck,
} from "lucide-react"

import { EcosystemNav } from "../EcosystemNav"

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
  proofHash: "sha256:9db7c7c9e467c79e9f12f4ddf8b912fedc7ce6bf8f6f4dd9a9a648cc8e3f2048",
  messageId: "0xarc2048ccip00000000000000000000000000000000000000000000000091fa",
}

const routeSteps = [
  ["Policy checked", "Shield confirms address, route and risk inputs before the cross-chain instruction is prepared.", CheckCircle2],
  ["CCIP route selected", "Arc Testnet selector and router are attached to the run envelope.", Route],
  ["Message observed", "The run records message status, target chain and route evidence for operator review.", RadioTower],
  ["Settlement gated", "Flow waits for receipt and validation artifacts before finalizing the job.", ShieldCheck],
]

const evidence = [
  ["Source chain", routeRun.source],
  ["Target chain", routeRun.target],
  ["CCIP router", shortAddress(routeRun.router)],
  ["Arc selector", routeRun.selector],
  ["Message id", shortHash(routeRun.messageId)],
  ["Proof hash", shortHash(routeRun.proofHash)],
]

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
              A route-ready demo for cross-chain treasury, collateral and settlement coordination:
              Arc Testnet prepares the instruction, Chainlink CCIP identifies the route, and Arc Suite
              keeps policy, message and proof evidence in one operator view.
            </p>
          </div>
          <div className="interop-status-card">
            <Network size={24} />
            <span>{routeRun.status}</span>
            <strong>{routeRun.source} → {routeRun.target}</strong>
            <small>Router and selector attached to the job envelope.</small>
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
              <div><dt>Message status</dt><dd>Prepared · awaiting live CCIP adapter</dd></div>
              <div><dt>Proof hash</dt><dd>{routeRun.proofHash}</dd></div>
            </dl>
            <p className="interop-note">
              The page exposes route evidence without exposing private provider logic. Live CCIP reads can replace
              the demo status while preserving the same route envelope.
            </p>
          </section>
        </div>

        <section className="interop-bottom-band">
          <Clock3 size={20} />
          <div>
            <span>Next upgrade</span>
            <strong>Connect live Chainlink CCIP status reads.</strong>
            <p>
              The product surface is ready for live route observation: message id, source chain,
              target chain, status, proof hash and settlement-gating state already have a place in the UI.
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
