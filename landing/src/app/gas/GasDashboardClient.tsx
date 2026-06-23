"use client"

import {
  Activity,
  Ban,
  CircleDollarSign,
  Fuel,
  Gauge,
  RefreshCw,
  Save,
  ShieldCheck,
  Zap,
} from "lucide-react"
import { type ReactNode, useCallback, useEffect, useRef, useState } from "react"

import type { Agent, GasOverview, GasPolicy } from "@/lib/backend/schema"
import { demoAgents, demoGasOverview } from "../demoWorkspace"

const API_KEY_STORAGE = "arc_gas_key"
const defaultDestination = "0x55e0dd25cd5f917e24de571d98d97c3b243709b2"

type OverviewPayload = { configured: boolean; overview: GasOverview | null }

export function GasDashboardClient() {
  const [apiKey, setApiKey] = useState(readStoredApiKey)
  const [overview, setOverview] = useState<GasOverview | null>(demoGasOverview)
  const [agents, setAgents] = useState<Agent[]>(demoAgents)
  const [agentId, setAgentId] = useState(demoGasOverview.policies[0]?.agentId ?? demoAgents[0]?.id ?? "")
  const [action, setAction] = useState("Escrow milestone release")
  const [destination, setDestination] = useState(defaultDestination)
  const [estimatedFee, setEstimatedFee] = useState("0.008")
  const [policyDraft, setPolicyDraft] = useState<GasPolicy | null>(demoGasOverview.policies[0] ?? null)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const loaded = useRef(false)

  const connect = useCallback(async (nextKey = apiKey) => {
    const key = nextKey.trim()
    if (!key) return setError("Enter an Arc API key.")
    setBusy("connect")
    setError(null)
    try {
      const headers = { "x-arc-api-key": key }
      const [overviewResponse, agentsResponse] = await Promise.all([
        fetch("/api/gas/overview", { cache: "no-store", headers }),
        fetch("/api/agents", { cache: "no-store", headers }),
      ])
      if (overviewResponse.status === 401 || agentsResponse.status === 401) throw new Error("Invalid API key or missing read scope.")
      const gasData = await overviewResponse.json() as OverviewPayload
      const agentData = await agentsResponse.json() as { agents: Agent[] }
      if (!overviewResponse.ok || !gasData.overview) throw new Error("Arc Gas migration is required.")
      setOverview(gasData.overview)
      setAgents(agentData.agents)
      const nextAgent = agentId || gasData.overview.policies[0]?.agentId || agentData.agents[0]?.id || ""
      setAgentId(nextAgent)
      setPolicyDraft(gasData.overview.policies.find((policy) => policy.agentId === nextAgent) ?? null)
      window.sessionStorage.setItem(API_KEY_STORAGE, key)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not load Arc Gas.")
    } finally {
      setBusy(null)
    }
  }, [agentId, apiKey])

  useEffect(() => {
    if (loaded.current) return
    loaded.current = true
    if (!apiKey.trim()) return
    const timer = window.setTimeout(() => void connect(apiKey), 0)
    return () => window.clearTimeout(timer)
  }, [apiKey, connect])

  function selectAgent(nextAgentId: string) {
    setAgentId(nextAgentId)
    setPolicyDraft(overview?.policies.find((policy) => policy.agentId === nextAgentId) ?? null)
  }

  async function requestSponsorship() {
    const fee = Number(estimatedFee)
    if (!agentId || !Number.isFinite(fee) || fee < 0) return setError("Select an agent and enter a valid fee.")
    setBusy("sponsor")
    setError(null)
    setNotice(null)
    try {
      const response = await fetch("/api/gas/sponsorships", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-arc-api-key": apiKey.trim() },
        body: JSON.stringify({
          agentId,
          action,
          destination,
          estimatedFeeUsdc: fee,
          idempotencyKey: `gas-ui:${crypto.randomUUID()}`,
          source: "gas_console",
        }),
      })
      const result = await response.json() as { message?: string; sponsorship?: { status: string; decisionReason: string } }
      if (!response.ok && response.status !== 403) throw new Error(result.message ?? "Sponsorship check failed.")
      setNotice(result.sponsorship?.status === "denied"
        ? `Denied: ${result.sponsorship.decisionReason}`
        : `Sponsored: ${formatUsdc(fee)} reserved under agent policy.`)
      await connect(apiKey)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Sponsorship check failed.")
    } finally {
      setBusy(null)
    }
  }

  async function savePolicy() {
    if (!policyDraft) return
    setBusy("policy")
    setError(null)
    try {
      const response = await fetch("/api/gas/policies", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-arc-api-key": apiKey.trim() },
        body: JSON.stringify(policyDraft),
      })
      const result = await response.json() as { message?: string }
      if (!response.ok) throw new Error(response.status === 403 ? "Policy updates require admin scope." : result.message ?? "Policy update failed.")
      setNotice("Agent gas policy updated.")
      await connect(apiKey)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Policy update failed.")
    } finally {
      setBusy(null)
    }
  }

  const summary = overview?.summary ?? { sponsoredUsdc: 0, sponsoredTransactions: 0, deniedTransactions: 0, activePolicies: 0 }

  return (
    <section className="analytics-shell gas-shell">
      <div className="gas-heading">
        <div>
          <p className="kicker">USDC gas control plane</p>
          <h1>Arc Gas</h1>
          <p>Sponsor agent transactions, enforce per-agent gas limits and reconcile every fee across Circle Gas Station and Paymaster modes.</p>
        </div>
        <div className="gas-protocol">
          <Fuel size={23} />
          <div><span>Arc Testnet</span><strong>Gas denominated in USDC</strong><small>Policy first · receipt after execution</small></div>
        </div>
      </div>

      <div className="shield-authbar">
        <label><span>Arc API key</span><input autoComplete="off" placeholder="arc_live_..." type="password" value={apiKey} onChange={(event) => setApiKey(event.target.value)} /></label>
        <button className="button secondary" disabled={busy === "connect"} onClick={() => void connect()} type="button"><RefreshCw size={16} /> Connect</button>
      </div>
      {!apiKey.trim() && <div className="demo-mode-banner">Demo workspace is loaded in read-only mode. Connect an Arc API key to run sponsorship checks and save gas policies.</div>}

      {error && <div className="analytics-error">{error}</div>}
      {notice && <div className="billing-notice">{notice}</div>}

      <div className="gas-metrics">
        <Metric icon={<CircleDollarSign size={18} />} label="Sponsored gas" value={formatUsdc(summary.sponsoredUsdc)} />
        <Metric icon={<Zap size={18} />} label="Sponsored tx" value={String(summary.sponsoredTransactions)} />
        <Metric icon={<Ban size={18} />} label="Denied tx" value={String(summary.deniedTransactions)} />
        <Metric icon={<ShieldCheck size={18} />} label="Active policies" value={String(summary.activePolicies)} />
      </div>

      <div className="gas-grid">
        <section className="gas-panel">
          <PanelHead eyebrow="Sponsorship simulator" title="Run policy check" icon={<Gauge size={20} />} />
          <div className="gas-form">
            <label><span>Agent</span><select value={agentId} onChange={(event) => selectAgent(event.target.value)}>{agents.map((agent) => <option key={agent.id} value={agent.id}>{agent.name}</option>)}</select></label>
            <label><span>Action</span><input value={action} onChange={(event) => setAction(event.target.value)} /></label>
            <label className="gas-wide"><span>Destination contract</span><input value={destination} onChange={(event) => setDestination(event.target.value)} /></label>
            <label><span>Estimated fee, USDC</span><input min="0" step="0.001" type="number" value={estimatedFee} onChange={(event) => setEstimatedFee(event.target.value)} /></label>
          </div>
          <button className="button primary gas-action" disabled={!apiKey.trim() || busy === "sponsor"} onClick={() => void requestSponsorship()} type="button"><Zap size={16} /> Run sponsorship check</button>
        </section>

        <section className="gas-panel">
          <PanelHead eyebrow="Agent policy" title="Limits & payment mode" icon={<ShieldCheck size={20} />} />
          {policyDraft ? (
            <>
              <div className="gas-form">
                <label><span>Payment mode</span><select value={policyDraft.mode} onChange={(event) => setPolicyDraft({ ...policyDraft, mode: event.target.value as GasPolicy["mode"] })}><option value="gas_station">Gas Station · developer sponsored</option><option value="paymaster">Paymaster · agent pays USDC</option></select></label>
                <label><span>Status</span><select value={policyDraft.status} onChange={(event) => setPolicyDraft({ ...policyDraft, status: event.target.value as GasPolicy["status"] })}><option value="active">Active</option><option value="paused">Paused</option></select></label>
                <Limit label="Per transaction" value={policyDraft.perTxLimitUsdc} onChange={(value) => setPolicyDraft({ ...policyDraft, perTxLimitUsdc: value })} />
                <Limit label="Daily" value={policyDraft.dailyLimitUsdc} onChange={(value) => setPolicyDraft({ ...policyDraft, dailyLimitUsdc: value })} />
                <Limit label="Monthly" value={policyDraft.monthlyLimitUsdc} onChange={(value) => setPolicyDraft({ ...policyDraft, monthlyLimitUsdc: value })} />
              </div>
              <div className="gas-usage"><span>Today <b>{formatUsdc(policyDraft.dailySpentUsdc)}</b></span><span>This month <b>{formatUsdc(policyDraft.monthlySpentUsdc)}</b></span></div>
              <button className="button secondary gas-action" disabled={!apiKey.trim() || busy === "policy"} onClick={() => void savePolicy()} type="button"><Save size={16} /> Save policy</button>
            </>
          ) : <p>Connect with an API key to edit policy.</p>}
        </section>
      </div>

      <section className="gas-panel gas-ledger">
        <PanelHead eyebrow="Gas ledger" title="Sponsored transaction reporting" icon={<Activity size={20} />} />
        <div className="shield-table-wrap">
          <table className="shield-table">
            <thead><tr><th>Agent</th><th>Mode</th><th>Action</th><th>Estimated</th><th>Actual</th><th>Status</th><th>Decision</th></tr></thead>
            <tbody>
              {(overview?.sponsorships ?? []).length === 0
                ? <tr><td className="shield-table-empty" colSpan={7}>No sponsorship decisions yet.</td></tr>
                : overview?.sponsorships.map((item) => (
                  <tr key={item.id}>
                    <td>{agentName(agents, item.agentId)}</td>
                    <td><code>{modeName(item.mode)}</code></td>
                    <td>{item.action}</td>
                    <td>{formatUsdc(item.estimatedFeeUsdc)}</td>
                    <td>{item.actualFeeUsdc === null ? "—" : formatUsdc(item.actualFeeUsdc)}</td>
                    <td><em className={`gas-status is-${item.status}`}>{item.status}</em></td>
                    <td>{item.explorerUrl ? <a href={item.explorerUrl} target="_blank" rel="noreferrer">{item.decisionReason}</a> : item.decisionReason}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  )
}

function Metric({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return <div className="gas-metric"><span>{icon}{label}</span><strong>{value}</strong></div>
}
function PanelHead({ eyebrow, title, icon }: { eyebrow: string; title: string; icon: ReactNode }) {
  return <div className="flow-panel-title"><div><span>{eyebrow}</span><h2>{title}</h2></div>{icon}</div>
}
function Limit({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return <label><span>{label} limit, USDC</span><input min="0" step="0.01" type="number" value={value} onChange={(event) => onChange(Number(event.target.value))} /></label>
}
function readStoredApiKey() {
  return typeof window === "undefined"
    ? ""
    : window.sessionStorage.getItem(API_KEY_STORAGE)
      ?? window.sessionStorage.getItem("arc_shield_key")
      ?? window.sessionStorage.getItem("arc_ops_health_key")
      ?? ""
}
function formatUsdc(value: number) { return `${value.toLocaleString("en-US", { minimumFractionDigits: 3, maximumFractionDigits: 8 })} USDC` }
function agentName(agents: Agent[], id: string) { return agents.find((agent) => agent.id === id)?.name ?? id }
function modeName(mode: GasPolicy["mode"]) { return mode === "gas_station" ? "Gas Station" : "Paymaster" }
