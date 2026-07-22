"use client"

import {
  Activity,
  ArrowRightLeft,
  ArrowUpRight,
  Check,
  CircleDollarSign,
  Database,
  Play,
  RefreshCw,
  Route,
  X,
} from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"

import type { Agent, ApiListing, FlowRun, FlowSummary } from "@/lib/backend/schema"
import { demoAgents, demoApis, demoFlowPayload, demoSettlementConfig } from "../demoWorkspace"

const API_KEY_STORAGE = "arc_shield_key"

type FlowPayload = {
  auditStorage: boolean
  runs: FlowRun[]
  summary: FlowSummary
}

type AgentPayload = { agents: Agent[] }
type ApiPayload = { apis: Array<ApiListing & { providerName: string }> }
type SettlementConfig = {
  configured: boolean
  defaultRecipient: string | null
  allowedRecipients: string[]
  maxAmountUsdc: number
}

const swapRoutes = [
  { pair: "USDC -> EURC", method: "Swap Kit route", status: "quote-ready", detail: "Uses to.chain and to.recipientAddress routing." },
  { pair: "Agent budget -> provider currency", method: "Unified Balance spend", status: "mapped", detail: "Gateway spend can forward after policy approval." },
  { pair: "Failure trace", method: "Latest tx hash", status: "captured", detail: "Nonce and route errors keep the latest on-chain hash for review." },
] as const

export function FlowDashboardClient() {
  const [apiKey, setApiKey] = useState("")
  const [payload, setPayload] = useState<FlowPayload | null>(demoFlowPayload)
  const [agents, setAgents] = useState<Agent[]>(demoAgents)
  const [apis, setApis] = useState<ApiPayload["apis"]>(demoApis)
  const [config, setConfig] = useState<SettlementConfig | null>(demoSettlementConfig)
  const [agentId, setAgentId] = useState(demoAgents[0]?.id ?? "")
  const [apiId, setApiId] = useState(demoApis[0]?.id ?? "")
  const [recipientAddress, setRecipientAddress] = useState(demoSettlementConfig.defaultRecipient ?? "")
  const [amountUsdc, setAmountUsdc] = useState("0.01")
  const [latest, setLatest] = useState<FlowRun | null>(demoFlowPayload.runs[0] ?? null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isRunning, setIsRunning] = useState(false)
  const loadedStoredKey = useRef(false)

  const connect = useCallback(async (nextKey = apiKey) => {
    const key = nextKey.trim()
    if (!key) return setError("Enter an Arc API key with read and write scopes.")
    setIsLoading(true)
    setError(null)
    try {
      const headers = { "x-arc-api-key": key }
      const [runsResponse, agentsResponse, apisResponse, configResponse] = await Promise.all([
        fetch("/api/flow/runs?limit=50", { cache: "no-store", headers }),
        fetch("/api/agents", { cache: "no-store", headers }),
        fetch("/api/apis", { cache: "no-store", headers }),
        fetch("/api/settlements/arc", { cache: "no-store", headers }),
      ])
      if ([runsResponse, agentsResponse, apisResponse, configResponse].some((response) => response.status === 401)) {
        throw new Error("Invalid API key or missing read scope.")
      }
      if (!runsResponse.ok || !agentsResponse.ok || !apisResponse.ok || !configResponse.ok) {
        throw new Error("Kestrel Flow dependencies are unavailable.")
      }
      const [runsData, agentsData, apisData, configData] = await Promise.all([
        runsResponse.json() as Promise<FlowPayload>,
        agentsResponse.json() as Promise<AgentPayload>,
        apisResponse.json() as Promise<ApiPayload>,
        configResponse.json() as Promise<SettlementConfig>,
      ])
      setPayload(runsData)
      setAgents(agentsData.agents)
      setApis(apisData.apis)
      setConfig(configData)
      setLatest(runsData.runs[0] ?? null)
      setAgentId((current) => current || agentsData.agents[0]?.id || "")
      setApiId((current) => current || apisData.apis[0]?.id || "")
      setRecipientAddress((current) => current || configData.defaultRecipient || configData.allowedRecipients[0] || "")
      window.sessionStorage.setItem(API_KEY_STORAGE, key)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not connect Kestrel Flow.")
    } finally {
      setIsLoading(false)
    }
  }, [apiKey])

  useEffect(() => {
    if (loadedStoredKey.current) return
    loadedStoredKey.current = true
    const stored = readStoredApiKey().trim()
    if (!stored) return
    const timer = window.setTimeout(() => {
      setApiKey(stored)
      void connect(stored)
    }, 0)
    return () => window.clearTimeout(timer)
  }, [connect])

  async function runFlow() {
    const key = apiKey.trim()
    const amount = Number(amountUsdc)
    if (!key || !agentId || !apiId || !recipientAddress || !Number.isFinite(amount) || amount <= 0) {
      return setError("Complete the run configuration before starting Kestrel Flow.")
    }
    setIsRunning(true)
    setError(null)
    try {
      const response = await fetch("/api/flow/runs", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-arc-api-key": key },
        body: JSON.stringify({
          agentId,
          apiId,
          amountUsdc: amount,
          recipientAddress,
          screeningChain: "ETH-SEPOLIA",
          idempotencyKey: `flow-ui:${crypto.randomUUID()}`,
        }),
      })
      const result = await response.json() as { message?: string; run?: FlowRun }
      if (result.run) setLatest(result.run)
      if (!response.ok) setError(result.message ?? "Kestrel Flow stopped with an error.")
      await connect(key)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Kestrel Flow failed.")
    } finally {
      setIsRunning(false)
    }
  }

  const summary = payload?.summary ?? emptySummary
  const runs = payload?.runs ?? []

  return (
    <section className="analytics-shell flow-shell">
      <div className="flow-heading">
        <div>
          <p className="kicker">Autonomous payment orchestration</p>
          <h1>Kestrel Flow</h1>
          <p>One auditable run from counterparty screening to a settlement-ready Arc path and reputation update.</p>
        </div>
        <div className="flow-health">
          <span><Database size={16} /> Audit trail <strong>{payload?.auditStorage ? "Supabase live" : "Migration required"}</strong></span>
          <span><CircleDollarSign size={16} /> Settlement <strong>{config?.configured ? "Arc ready" : "Not connected"}</strong></span>
        </div>
      </div>

      <div className="shield-authbar">
        <label>
          <span>Arc API key</span>
          <input autoComplete="off" placeholder="arc_live_..." type="password" value={apiKey} onChange={(event) => setApiKey(event.target.value)} />
        </label>
        <button className="button secondary" disabled={isLoading} onClick={() => void connect()} type="button">
          <RefreshCw size={16} /> {isLoading ? "Loading" : "Connect"}
        </button>
      </div>
      {!apiKey.trim() && <div className="demo-mode-banner">Demo workspace is loaded in read-only mode. Connect an Arc API key to run live policy and settlement actions.</div>}

      {error && <div className="analytics-error">{error}</div>}

      <div className="flow-metrics">
        <Metric label="Total runs" value={summary.total} />
        <Metric label="Completed" value={summary.completed} tone="success" />
        <Metric label="Review" value={summary.review} tone="warning" />
        <Metric label="Blocked / failed" value={summary.blocked + summary.failed} tone="danger" />
      </div>

      <div className="flow-layout">
        <section className="flow-panel">
          <div className="flow-panel-title"><div><span>New run</span><h2>Configure payment intent</h2></div><Route size={21} /></div>
          <div className="flow-form">
            <label><span>Agent</span><select value={agentId} onChange={(event) => setAgentId(event.target.value)}>{agents.map((agent) => <option key={agent.id} value={agent.id}>{agent.name}</option>)}</select></label>
            <label><span>Marketplace API</span><select value={apiId} onChange={(event) => setApiId(event.target.value)}>{apis.map((api) => <option key={api.id} value={api.id}>{api.name} · {api.priceUsdc} USDC</option>)}</select></label>
            <label className="flow-wide"><span>Recipient wallet</span><input value={recipientAddress} onChange={(event) => setRecipientAddress(event.target.value)} /></label>
            <label><span>Amount, USDC</span><input max={config?.maxAmountUsdc ?? 0.1} min="0.000001" step="0.001" type="number" value={amountUsdc} onChange={(event) => setAmountUsdc(event.target.value)} /></label>
            <label><span>Screening identity</span><input disabled value="ETH-SEPOLIA" /></label>
          </div>
          <button className="button primary flow-run-button" disabled={isRunning || !config?.configured} onClick={() => void runFlow()} type="button">
            <Play size={17} /> {isRunning ? "Running policy pipeline..." : "Run Kestrel Flow"}
          </button>
        </section>

        <section className={`flow-panel flow-live ${latest ? `is-${latest.status}` : ""}`}>
          <div className="flow-panel-title"><div><span>Latest execution</span><h2>{latest ? latest.status.toUpperCase() : "Waiting"}</h2></div><Activity size={21} /></div>
          <div className="flow-pipeline">
            {(latest?.steps ?? placeholderSteps).map((step, index) => (
              <div className={`flow-step is-${step.status}`} key={step.key}>
                <div className="flow-step-icon">{step.status === "passed" ? <Check size={16} /> : step.status === "failed" || step.status === "blocked" ? <X size={16} /> : index + 1}</div>
                <div><strong>{step.label}</strong><span>{step.detail}</span></div>
              </div>
            ))}
          </div>
          {latest?.explorerUrl && (
            <a className="flow-explorer" href={latest.explorerUrl} target="_blank" rel="noreferrer">
              View transaction on Arcscan <ArrowUpRight size={15} />
            </a>
          )}
        </section>
      </div>

      <section className="flow-panel flow-swap-routes">
        <div className="flow-panel-title">
          <div>
            <span>Stablecoin route adapter</span>
            <h2>Swap and unified balance readiness.</h2>
          </div>
          <ArrowRightLeft size={21} />
        </div>
        <div className="flow-swap-grid">
          {swapRoutes.map((item) => (
            <article key={item.pair}>
              <span>{item.pair}</span>
              <strong>{item.method}</strong>
              <em>{item.status}</em>
              <small>{item.detail}</small>
            </article>
          ))}
        </div>
      </section>

      <section className="flow-panel flow-history">
        <div className="flow-panel-title"><div><span>Execution history</span><h2>Recent autonomous payment runs</h2></div><strong>{runs.length} loaded</strong></div>
        <div className="shield-table-wrap">
          <table className="shield-table">
            <thead><tr><th>Status</th><th>Agent</th><th>API</th><th>Amount</th><th>Current step</th><th>Transaction</th></tr></thead>
            <tbody>
              {runs.length === 0 ? <tr><td className="shield-table-empty" colSpan={6}>No Flow runs yet.</td></tr> : runs.map((run) => (
                <tr key={run.id}>
                  <td><span className={`flow-status is-${run.status}`}>{run.status}</span></td>
                  <td><code>{run.agentId}</code></td><td>{run.apiId}</td><td>{run.amountUsdc.toFixed(3)} USDC</td><td>{run.currentStep}</td>
                  <td>{run.explorerUrl ? <a href={run.explorerUrl} target="_blank" rel="noreferrer">{shortHash(run.txHash)} <ArrowUpRight size={12} /></a> : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  )
}

function Metric({ label, value, tone = "neutral" }: { label: string; value: number; tone?: "neutral" | "success" | "warning" | "danger" }) {
  return <div className={`flow-metric is-${tone}`}><span>{label}</span><strong>{value}</strong></div>
}

function readStoredApiKey() {
  if (typeof window === "undefined") return ""
  return window.sessionStorage.getItem(API_KEY_STORAGE) ?? window.sessionStorage.getItem("arc_ops_health_key") ?? ""
}

function shortHash(hash: string | null) {
  return hash ? `${hash.slice(0, 8)}...${hash.slice(-5)}` : "Open"
}

const emptySummary: FlowSummary = { total: 0, completed: 0, review: 0, blocked: 0, failed: 0, lastRunAt: null }
const placeholderSteps: FlowRun["steps"] = [
  { key: "screening", label: "Shield screening", status: "pending", detail: "Recipient risk check", completedAt: null },
  { key: "access", label: "Access policy", status: "pending", detail: "Reputation, budget and balance", completedAt: null },
  { key: "settlement", label: "Arc settlement", status: "pending", detail: "Circle wallet transaction", completedAt: null },
  { key: "reputation", label: "Reputation update", status: "pending", detail: "Economic behavior signal", completedAt: null },
]
