"use client"

import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  CircleOff,
  Database,
  RefreshCw,
  Search,
  ShieldCheck,
  XCircle,
} from "lucide-react"
import { type ReactNode, useCallback, useEffect, useRef, useState } from "react"

import type { ShieldScreening, ShieldSummary } from "@/lib/backend/schema"
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
}

export function ShieldDashboardClient() {
  const [apiKey, setApiKey] = useState("")
  const [address, setAddress] = useState(DEFAULT_TEST_ADDRESS)
  const [chain, setChain] = useState("ETH-SEPOLIA")
  const [payload, setPayload] = useState<ShieldPayload | null>(demoShieldPayload)
  const [latest, setLatest] = useState<ShieldScreening | null>(demoShieldPayload.screenings[0] ?? null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isScreening, setIsScreening] = useState(false)
  const hasLoadedStoredKey = useRef(false)

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
      if (!response.ok) throw new Error("Arc Shield data is unavailable.")

      const nextPayload = await response.json() as ShieldPayload
      setPayload(nextPayload)
      setLatest(nextPayload.screenings[0] ?? null)
      window.sessionStorage.setItem(API_KEY_STORAGE, key)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load Arc Shield.")
    } finally {
      setIsLoading(false)
    }
  }, [apiKey])

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

  function clearSession() {
    window.sessionStorage.removeItem(API_KEY_STORAGE)
    setApiKey("")
    setPayload(null)
    setLatest(null)
    setError(null)
  }

  const summary = payload?.summary ?? emptySummary
  const screenings = payload?.screenings ?? []

  return (
    <section className="analytics-shell shield-shell">
      <div className="shield-heading">
        <div>
          <p className="kicker">Compliance & risk engine</p>
          <h1>Arc Shield</h1>
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
        <ShieldMetric icon={<CircleOff size={18} />} label="Provider errors" value={summary.providerErrors} tone="neutral" />
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
            Arc Shield stores supported-chain results as cross-chain identity signals; Arc settlement enforcement remains monitor-only.
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

function readStoredApiKey() {
  if (typeof window === "undefined") return ""
  return window.sessionStorage.getItem(API_KEY_STORAGE)
    ?? window.sessionStorage.getItem("arc_ops_health_key")
    ?? ""
}

function shortAddress(address: string) {
  return `${address.slice(0, 8)}...${address.slice(-6)}`
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
