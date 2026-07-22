"use client"

import {
  Activity,
  AlertTriangle,
  BellRing,
  CheckCircle2,
  Database,
  FileCheck2,
  PauseCircle,
  RadioTower,
  RefreshCw,
  Search,
  ShieldCheck,
  XCircle,
} from "lucide-react"
import { type ReactNode, useCallback, useEffect, useRef, useState } from "react"

import type { OracleRiskSignal, OracleRiskSignalSummary, OracleRiskSignalType, ShieldScreening, ShieldSummary } from "@/lib/backend/schema"
import { demoShieldPayload } from "../demoWorkspace"

const API_KEY_STORAGE = "arc_shield_key"
const DEFAULT_TEST_ADDRESS = "0x7fb49965753A9eC3646fd5d004ee5AeD6Cc89999"

type ShieldPayload = {
  configuration: {
    configured: boolean
    auditStorage: boolean
    arcNativeScreening: boolean
    supportedChains: string[]
  }
  screenings: ShieldScreening[]
  summary: ShieldSummary
  watchlist?: RiskWatchlistItem[]
}

type OraclePayload = {
  auditStorage: boolean
  signals: OracleRiskSignal[]
  sourceStatus: "supabase" | "demo"
  summary: OracleRiskSignalSummary
}

type OracleAdapterEvidence = {
  currentObservation: "simulated_observation"
  targetObservation: "live_observation"
  status: "adapter_ready"
  source: string
  feedFreshnessMs: number
  feedFreshnessStatus: "fresh" | "stale"
  deviationBps: number
  deviationStatus: "within_policy" | "outside_policy"
  lastUpdate: string
  nextStep: string
}

type RiskWatchlistItem = {
  id: string
  address: string
  agent: string
  chain: string
  currentRisk: string
  initialDecision: ShieldScreening["decision"]
  lastDecision: ShieldScreening["decision"]
  lastCheckedAt: string
  nextAction: string
  previousRisk: string
  reason: string
  status: "active" | "frozen" | "review"
}

export function ShieldDashboardClient() {
  const [apiKey, setApiKey] = useState("")
  const [address, setAddress] = useState(DEFAULT_TEST_ADDRESS)
  const [chain, setChain] = useState("ETH-SEPOLIA")
  const [payload, setPayload] = useState<ShieldPayload | null>(demoShieldPayload)
  const [latest, setLatest] = useState<ShieldScreening | null>(demoShieldPayload.screenings[0] ?? null)
  const [oraclePayload, setOraclePayload] = useState<OraclePayload | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isRecordingOracle, setIsRecordingOracle] = useState(false)
  const [isScreening, setIsScreening] = useState(false)
  const hasLoadedStoredKey = useRef(false)

  const loadOracleSignals = useCallback(async (nextKey = apiKey) => {
    const key = nextKey.trim()
    if (!key) return

    const response = await fetch("/api/oracle/signals?limit=20", {
      cache: "no-store",
      headers: { "x-arc-api-key": key },
    })
    if (response.status === 401) throw new Error("Invalid API key or missing read scope.")
    if (!response.ok) throw new Error("Chainlink risk signal data is unavailable.")

    setOraclePayload(await response.json() as OraclePayload)
  }, [apiKey])

  const loadScreenings = useCallback(async (nextKey = apiKey) => {
    const key = nextKey.trim()
    if (!key) {
      setError("Enter an Arc API key to load the compliance audit log.")
      return
    }

    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/shield/screenings?limit=100", {
        cache: "no-store",
        headers: { "x-arc-api-key": key },
      })
      if (response.status === 401) throw new Error("Invalid API key or missing read scope.")
      if (!response.ok) throw new Error("Kestrel Shield data is unavailable.")

      const nextPayload = await response.json() as ShieldPayload
      setPayload(nextPayload)
      setLatest(nextPayload.screenings[0] ?? null)
      await loadOracleSignals(key)
      window.sessionStorage.setItem(API_KEY_STORAGE, key)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load Kestrel Shield.")
    } finally {
      setIsLoading(false)
    }
  }, [apiKey, loadOracleSignals])

  useEffect(() => {
    if (hasLoadedStoredKey.current) return
    hasLoadedStoredKey.current = true
    const stored = readStoredApiKey().trim()
    if (!stored) return
    const handle = window.setTimeout(() => {
      setApiKey(stored)
      void loadScreenings(stored)
    }, 0)
    return () => window.clearTimeout(handle)
  }, [loadScreenings])

  async function runScreening() {
    const key = apiKey.trim()
    if (!key) {
      setError("Enter an Arc API key with write scope before screening.")
      return
    }

    setIsScreening(true)
    setError(null)
    try {
      const response = await fetch("/api/shield/screenings", {
        body: JSON.stringify({ address: address.trim(), chain }),
        headers: {
          "Content-Type": "application/json",
          "x-arc-api-key": key,
        },
        method: "POST",
      })
      const result = await response.json() as {
        message?: string
        screening?: ShieldScreening
      }
      if (!response.ok && !result.screening) {
        throw new Error(result.message ?? "Screening failed.")
      }
      if (result.screening) setLatest(result.screening)
      if (!response.ok) setError(result.message ?? "Provider screening needs attention.")
      await loadScreenings(key)
    } catch (screeningError) {
      setError(screeningError instanceof Error ? screeningError.message : "Screening failed.")
    } finally {
      setIsScreening(false)
    }
  }

  async function recordOracleSignal(signalType: OracleRiskSignalType) {
    const key = apiKey.trim()
    if (!key) {
      setError("Enter an Arc API key with write scope before recording Chainlink evidence.")
      return
    }

    setIsRecordingOracle(true)
    setError(null)
    try {
      const response = await fetch("/api/oracle/signals", {
        body: JSON.stringify({ signalType }),
        headers: {
          "Content-Type": "application/json",
          "x-arc-api-key": key,
        },
        method: "POST",
      })
      const result = await response.json() as {
        message?: string
        signal?: OracleRiskSignal
      }
      if (!response.ok || !result.signal) {
        throw new Error(result.message ?? "Chainlink evidence recording failed.")
      }
      await loadOracleSignals(key)
    } catch (signalError) {
      setError(signalError instanceof Error ? signalError.message : "Chainlink evidence recording failed.")
    } finally {
      setIsRecordingOracle(false)
    }
  }

  function clearSession() {
    window.sessionStorage.removeItem(API_KEY_STORAGE)
    setApiKey("")
    setPayload(null)
    setLatest(null)
    setOraclePayload(null)
    setError(null)
  }

  const summary = payload?.summary ?? emptySummary
  const screenings = payload?.screenings ?? []
  const oracleSignals = oraclePayload?.signals ?? []
  const latestOracleSignal = oracleSignals[0] ?? null
  const latestOracleAdapter = latestOracleSignal ? readOracleAdapter(latestOracleSignal) : null
  const watchlist = payload?.watchlist ?? demoShieldPayload.watchlist ?? []
  const frozenWatchCount = watchlist.filter((item) => item.status === "frozen").length
  const reviewWatchCount = watchlist.filter((item) => item.status === "review").length

  return (
    <section className="analytics-shell shield-shell">
      <div className="shield-heading">
        <div>
          <p className="kicker">Compliance & risk engine</p>
          <h1>Kestrel Shield</h1>
          <p>
            Screen wallet addresses with Circle Compliance Engine, convert provider
            recommendations into explicit policy decisions, and keep an immutable operator trail.
          </p>
        </div>
        <div className="shield-status-stack">
          <StatusLine
            icon={<Activity size={16} />}
            label="Circle provider"
            value={payload?.configuration.configured ? "Configured" : "Unknown until connected"}
            tone={payload?.configuration.configured ? "allow" : "neutral"}
          />
          <StatusLine
            icon={<Database size={16} />}
            label="Audit storage"
            value={payload?.configuration.auditStorage ? "Supabase live" : "Migration required"}
            tone={payload?.configuration.auditStorage ? "allow" : "review"}
          />
          <StatusLine
            icon={<RadioTower size={16} />}
            label="Chainlink on Arc"
            value={oraclePayload?.auditStorage ? "Evidence stored" : "Evidence-ready"}
            tone="allow"
          />
        </div>
      </div>

      <div className="shield-authbar">
        <label>
          <span>Arc API key</span>
          <input
            autoComplete="off"
            placeholder="arc_live_..."
            type="password"
            value={apiKey}
            onChange={(event) => setApiKey(event.target.value)}
          />
        </label>
        <button className="button secondary" disabled={isLoading} onClick={() => void loadScreenings()} type="button">
          <RefreshCw size={16} />
          {isLoading ? "Loading" : "Connect"}
        </button>
        <button className="button ghost" onClick={clearSession} type="button">Clear</button>
      </div>
      {!apiKey.trim() && <div className="demo-mode-banner">Demo workspace is loaded in read-only mode. Connect an Arc API key to run live Circle screening checks.</div>}

      {error && <div className="analytics-error">{error}</div>}

      <div className="shield-kpi-grid">
        <ShieldMetric icon={<ShieldCheck size={18} />} label="Screened" value={summary.total} tone="neutral" />
        <ShieldMetric icon={<CheckCircle2 size={18} />} label="Allowed" value={summary.allowed} tone="allow" />
        <ShieldMetric icon={<AlertTriangle size={18} />} label="Review" value={summary.review} tone="review" />
        <ShieldMetric icon={<XCircle size={18} />} label="Blocked" value={summary.blocked} tone="block" />
        <ShieldMetric icon={<BellRing size={18} />} label="Risk alerts" value={frozenWatchCount + reviewWatchCount} tone={frozenWatchCount ? "block" : reviewWatchCount ? "review" : "neutral"} />
      </div>

      <div className="shield-workspace">
        <section className="shield-panel shield-screen-panel">
          <div className="shield-panel-head">
            <div>
              <span>New screening</span>
              <h2>Assess a wallet address</h2>
            </div>
            <Search size={20} />
          </div>
          <div className="shield-form-grid">
            <label className="shield-address-field">
              <span>Wallet address</span>
              <input value={address} onChange={(event) => setAddress(event.target.value)} />
            </label>
            <label>
              <span>Circle chain</span>
              <select value={chain} onChange={(event) => setChain(event.target.value)}>
                {(payload?.configuration.supportedChains ?? fallbackChains).map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="shield-form-footer">
            <button className="button primary" disabled={!apiKey.trim() || isScreening} onClick={() => void runScreening()} type="button">
              <ShieldCheck size={17} />
              {isScreening ? "Screening..." : "Run screening"}
            </button>
            <button className="button secondary" onClick={() => setAddress(DEFAULT_TEST_ADDRESS)} type="button">
              Load sanctions test
            </button>
          </div>
          <p className="shield-footnote">
            Circle currently does not list Arc Testnet in the standalone screening chain enum.
            Kestrel Shield stores supported-chain results as cross-chain identity signals; Arc settlement enforcement remains monitor-only.
          </p>
        </section>

        <section className={`shield-panel shield-decision ${latest ? `is-${latest.decision}` : ""}`}>
          <div className="shield-panel-head">
            <div>
              <span>Latest decision</span>
              <h2>{latest ? latest.decision.toUpperCase() : "Waiting for screening"}</h2>
            </div>
            {latest ? <DecisionIcon decision={latest.decision} /> : <ShieldCheck size={22} />}
          </div>
          {latest ? (
            <>
              <p className="shield-decision-reason">{latest.decisionReason}</p>
              <dl className="shield-detail-list">
                <div><dt>Provider result</dt><dd>{latest.providerResult ?? latest.providerStatus}</dd></div>
                <div><dt>Risk score</dt><dd>{latest.riskScore}</dd></div>
                <div><dt>Rule</dt><dd>{latest.ruleName ?? "No matched rule"}</dd></div>
                <div><dt>Actions</dt><dd>{latest.actions.join(", ") || "None"}</dd></div>
              </dl>
              <div className="shield-tags">
                {(latest.riskCategories.length ? latest.riskCategories : ["NO RISK CATEGORY"]).map((category) => (
                  <span key={category}>{category}</span>
                ))}
              </div>
            </>
          ) : (
            <p className="shield-empty-copy">
              Connect with a workspace key, then run an address through the policy engine.
            </p>
          )}
        </section>

        <section className="shield-panel shield-oracle-panel">
          <div className="shield-panel-head">
            <div>
              <span>Oracle risk signal</span>
              <h2>Chainlink evidence for Arc policy</h2>
            </div>
            <RadioTower size={20} />
          </div>
          <div className="shield-oracle-actions">
            <button className="button secondary" disabled={!apiKey.trim() || isRecordingOracle} onClick={() => void recordOracleSignal("ccip_route")} type="button">
              <FileCheck2 size={16} />
              {isRecordingOracle ? "Recording" : "Record CCIP signal"}
            </button>
            <button className="button ghost" disabled={!apiKey.trim() || isRecordingOracle} onClick={() => void recordOracleSignal("market_data")} type="button">
              Market feed
            </button>
            <button className="button ghost" disabled={!apiKey.trim() || isRecordingOracle} onClick={() => void recordOracleSignal("proof_of_reserve")} type="button">
              PoR
            </button>
          </div>
          <dl className="shield-detail-list">
            <div><dt>Data layer</dt><dd>Data Feeds / Data Streams</dd></div>
            <div><dt>Interoperability</dt><dd>CCIP Router 0xdE4E...eab8</dd></div>
            <div><dt>Arc selector</dt><dd>3034092155422581607</dd></div>
            <div><dt>Audit storage</dt><dd>{oraclePayload?.auditStorage ? "Supabase live" : "Demo fallback until migration"}</dd></div>
          </dl>
          {latestOracleSignal && (
            <div className="shield-oracle-latest">
              <span>Latest signal</span>
              <strong>{signalLabel(latestOracleSignal.signalType)} · {latestOracleSignal.result}</strong>
              <p>{latestOracleSignal.subject}</p>
              <code>{latestOracleSignal.digest.slice(0, 22)}...{latestOracleSignal.digest.slice(-8)}</code>
            </div>
          )}
          {latestOracleAdapter && (
            <div className="shield-oracle-adapter">
              <div>
                <span>Adapter</span>
                <strong>{formatObservationStatus(latestOracleAdapter.currentObservation)} → {formatObservationStatus(latestOracleAdapter.targetObservation)}</strong>
              </div>
              <div>
                <span>Source</span>
                <strong>{latestOracleAdapter.source}</strong>
              </div>
              <div>
                <span>Freshness</span>
                <strong>{formatFreshness(latestOracleAdapter.feedFreshnessMs)} · {latestOracleAdapter.feedFreshnessStatus}</strong>
              </div>
              <div>
                <span>Deviation</span>
                <strong>{latestOracleAdapter.deviationBps} bps · {latestOracleAdapter.deviationStatus.replace("_", " ")}</strong>
              </div>
              <div>
                <span>Last update</span>
                <strong>{formatDate(latestOracleAdapter.lastUpdate)}</strong>
              </div>
            </div>
          )}
          <div className="shield-oracle-list">
            {oracleSignals.slice(0, 3).map((signal) => (
              <div key={signal.id}>
                <span>{signalLabel(signal.signalType)}</span>
                <strong>{signal.value}</strong>
                <small>{formatDate(signal.observedAt)}</small>
              </div>
            ))}
          </div>
          <p className="shield-footnote">
            Kestrel Shield can attach Chainlink market data, proof-of-reserve or CCIP route evidence
            to the same audit trail as Circle screening before an agent request is fulfilled.
          </p>
        </section>

        <section className="shield-panel shield-monitor-panel">
          <div className="shield-panel-head">
            <div>
              <span>Continuous monitoring</span>
              <h2>Risk Watchlist</h2>
            </div>
            <PauseCircle size={20} />
          </div>
          <div className="shield-monitor-summary">
            <div>
              <span>Watched addresses</span>
              <strong>{watchlist.length}</strong>
            </div>
            <div>
              <span>Frozen policies</span>
              <strong>{frozenWatchCount}</strong>
            </div>
            <div>
              <span>Manual reviews</span>
              <strong>{reviewWatchCount}</strong>
            </div>
          </div>
          <div className="shield-watchlist">
            {watchlist.map((item) => (
              <article className={`shield-watch-item is-${item.status}`} key={item.id}>
                <div>
                  <span>{item.agent}</span>
                  <strong>{item.previousRisk} -&gt; {item.currentRisk}</strong>
                  <code>{shortAddress(item.address)} · {item.chain}</code>
                </div>
                <div>
                  <RiskBadge status={item.status} />
                  <small>{formatDate(item.lastCheckedAt)}</small>
                </div>
                <p>{item.reason}</p>
                <footer>{item.nextAction}</footer>
              </article>
            ))}
          </div>
          <p className="shield-footnote">
            Kestrel Shield keeps previously allowed counterparties under watch. If a later
            provider update changes the risk profile, the policy layer can freeze spending,
            require manual review, or keep settlement enabled.
          </p>
        </section>
      </div>

      <section className="shield-panel shield-audit">
        <div className="shield-panel-head">
          <div>
            <span>Audit log</span>
            <h2>Recent compliance decisions</h2>
          </div>
          <strong>{screenings.length} loaded</strong>
        </div>
        <div className="shield-table-wrap">
          <table className="shield-table">
            <thead>
              <tr>
                <th>Decision</th>
                <th>Address</th>
                <th>Chain</th>
                <th>Risk</th>
                <th>Rule</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {screenings.length === 0 ? (
                <tr><td className="shield-table-empty" colSpan={6}>No stored screenings yet.</td></tr>
              ) : screenings.map((screening) => (
                <tr key={screening.id}>
                  <td><DecisionBadge decision={screening.decision} /></td>
                  <td><code>{shortAddress(screening.address)}</code></td>
                  <td>{screening.chain}</td>
                  <td>{screening.riskScore}</td>
                  <td>{screening.ruleName ?? "No match"}</td>
                  <td>{formatDate(screening.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  )
}

function ShieldMetric({ icon, label, value, tone }: {
  icon: ReactNode
  label: string
  value: number
  tone: "allow" | "review" | "block" | "neutral"
}) {
  return (
    <div className={`shield-metric is-${tone}`}>
      <div>{icon}<span>{label}</span></div>
      <strong>{value}</strong>
    </div>
  )
}

function StatusLine({ icon, label, value, tone }: {
  icon: ReactNode
  label: string
  value: string
  tone: "allow" | "review" | "neutral"
}) {
  return <div className={`shield-status is-${tone}`}>{icon}<span>{label}</span><strong>{value}</strong></div>
}

function DecisionIcon({ decision }: { decision: ShieldScreening["decision"] }) {
  if (decision === "allow") return <CheckCircle2 size={24} />
  if (decision === "block") return <XCircle size={24} />
  return <AlertTriangle size={24} />
}

function DecisionBadge({ decision }: { decision: ShieldScreening["decision"] }) {
  return <span className={`shield-badge is-${decision}`}>{decision}</span>
}

function RiskBadge({ status }: { status: RiskWatchlistItem["status"] }) {
  const label = status === "frozen" ? "freeze" : status
  return <span className={`shield-badge is-${status === "active" ? "allow" : status === "frozen" ? "block" : "review"}`}>{label}</span>
}

function readStoredApiKey() {
  if (typeof window === "undefined") return ""
  return window.sessionStorage.getItem(API_KEY_STORAGE)
    ?? window.sessionStorage.getItem("arc_ops_health_key")
    ?? ""
}

function shortAddress(address: string) {
  return `${address.slice(0, 8)}...${address.slice(-6)}`
}

function signalLabel(type: OracleRiskSignalType) {
  if (type === "market_data") return "Data Feed"
  if (type === "proof_of_reserve") return "Proof of Reserve"
  return "CCIP route"
}

function readOracleAdapter(signal: OracleRiskSignal): OracleAdapterEvidence | null {
  const adapter = signal.evidence.oracleAdapter
  if (!adapter || typeof adapter !== "object" || Array.isArray(adapter)) return null
  const candidate = adapter as Partial<OracleAdapterEvidence>
  if (
    candidate.currentObservation !== "simulated_observation"
    || candidate.targetObservation !== "live_observation"
    || candidate.status !== "adapter_ready"
    || typeof candidate.source !== "string"
    || typeof candidate.feedFreshnessMs !== "number"
    || typeof candidate.deviationBps !== "number"
    || typeof candidate.lastUpdate !== "string"
  ) {
    return null
  }

  return {
    currentObservation: candidate.currentObservation,
    deviationBps: candidate.deviationBps,
    deviationStatus: candidate.deviationStatus === "outside_policy" ? "outside_policy" : "within_policy",
    feedFreshnessMs: candidate.feedFreshnessMs,
    feedFreshnessStatus: candidate.feedFreshnessStatus === "stale" ? "stale" : "fresh",
    lastUpdate: candidate.lastUpdate,
    nextStep: typeof candidate.nextStep === "string" ? candidate.nextStep : "",
    source: candidate.source,
    status: candidate.status,
    targetObservation: candidate.targetObservation,
  }
}

function formatObservationStatus(value: OracleAdapterEvidence["currentObservation"] | OracleAdapterEvidence["targetObservation"]) {
  return value.replace("_", " ")
}

function formatFreshness(value: number) {
  if (value < 1000) return `${value}ms`
  const seconds = Math.round(value / 1000)
  if (seconds < 60) return `${seconds}s`
  return `${Math.round(seconds / 60)}m`
}

function formatDate(value: string) {
  return new Date(value).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })
}

const emptySummary: ShieldSummary = {
  total: 0,
  allowed: 0,
  review: 0,
  blocked: 0,
  providerErrors: 0,
  lastScreenedAt: null,
}

const fallbackChains = ["ETH-SEPOLIA", "MATIC-AMOY", "ARB-SEPOLIA", "UNI-SEPOLIA"]
