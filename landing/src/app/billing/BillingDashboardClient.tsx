"use client"

import {
  Activity,
  Boxes,
  CircleDollarSign,
  FileText,
  Gauge,
  Layers3,
  Plus,
  RefreshCw,
  WalletCards,
} from "lucide-react"
import { type ReactNode, useCallback, useEffect, useRef, useState } from "react"

import type { Agent, ApiListing, BillingOverview } from "@/lib/backend/schema"
import { demoAgents, demoApis, demoBillingOverview } from "../demoWorkspace"

const API_KEY_STORAGE = "arc_shield_key"

type OverviewPayload = { configured: boolean; overview: BillingOverview | null }
type ApiPayload = { apis: Array<ApiListing & { providerName: string }> }

export function BillingDashboardClient() {
  const [apiKey, setApiKey] = useState(readStoredApiKey)
  const [overview, setOverview] = useState<BillingOverview | null>(demoBillingOverview)
  const [configured, setConfigured] = useState(false)
  const [agents, setAgents] = useState<Agent[]>(demoAgents)
  const [apis, setApis] = useState<ApiPayload["apis"]>(demoApis)
  const [agentId, setAgentId] = useState(demoAgents[0]?.id ?? "")
  const [apiId, setApiId] = useState(demoApis[0]?.id ?? "")
  const [units, setUnits] = useState("1")
  const [topUpAmount, setTopUpAmount] = useState("10")
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
      const [overviewResponse, agentsResponse, apisResponse] = await Promise.all([
        fetch("/api/billing/overview", { cache: "no-store", headers }),
        fetch("/api/agents", { cache: "no-store", headers }),
        fetch("/api/apis", { cache: "no-store", headers }),
      ])
      if ([overviewResponse, agentsResponse, apisResponse].some((response) => response.status === 401)) throw new Error("Invalid API key or missing read scope.")
      const overviewData = await overviewResponse.json() as OverviewPayload
      if (!overviewResponse.ok || !overviewData.overview) throw new Error("Arc Billing migration is required.")
      const agentData = await agentsResponse.json() as { agents: Agent[] }
      const apiData = await apisResponse.json() as ApiPayload
      setOverview(overviewData.overview)
      setConfigured(overviewData.configured)
      setAgents(agentData.agents)
      setApis(apiData.apis)
      setAgentId((current) => current || agentData.agents[0]?.id || "")
      setApiId((current) => current || apiData.apis[0]?.id || "")
      window.sessionStorage.setItem(API_KEY_STORAGE, key)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not load Arc Billing.")
    } finally {
      setBusy(null)
    }
  }, [apiKey])

  useEffect(() => {
    if (loaded.current) return
    loaded.current = true
    if (!apiKey.trim()) return
    const timer = window.setTimeout(() => void connect(apiKey), 0)
    return () => window.clearTimeout(timer)
  }, [apiKey, connect])

  async function meterUsage() {
    const amount = Number(units)
    if (!agentId || !apiId || !Number.isFinite(amount) || amount <= 0) return setError("Select an agent, API and positive units.")
    setBusy("usage")
    setError(null)
    setNotice(null)
    try {
      const response = await fetch("/api/billing/usage", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-arc-api-key": apiKey.trim() },
        body: JSON.stringify({ agentId, apiId, units: amount, idempotencyKey: `billing-ui:${crypto.randomUUID()}`, metadata: { source: "billing_console" } }),
      })
      const result = await response.json() as { message?: string; usage?: { netAmountUsdc: number } }
      if (!response.ok) throw new Error(response.status === 402 ? "Payment required: prepaid balance is insufficient." : result.message ?? "Usage metering failed.")
      setNotice(`Usage recorded: ${formatUsdc(result.usage?.netAmountUsdc ?? 0)} charged.`)
      await connect(apiKey)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Usage metering failed.")
    } finally {
      setBusy(null)
    }
  }

  async function topUp() {
    const amount = Number(topUpAmount)
    setBusy("topup")
    setError(null)
    try {
      const response = await fetch("/api/billing/topups", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-arc-api-key": apiKey.trim() },
        body: JSON.stringify({ agentId, amountUsdc: amount }),
      })
      const result = await response.json() as { message?: string }
      if (!response.ok) throw new Error(response.status === 403 ? "Top-up requires an API key with admin scope." : result.message ?? "Top-up failed.")
      setNotice(`${formatUsdc(amount)} added to prepaid balance.`)
      await connect(apiKey)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Top-up failed.")
    } finally {
      setBusy(null)
    }
  }

  async function createBatch() {
    setBusy("batch")
    setError(null)
    try {
      const response = await fetch("/api/billing/batches", { method: "POST", headers: { "x-arc-api-key": apiKey.trim() } })
      const result = await response.json() as { message?: string; batch?: { usageCount: number; netAmountUsdc: number } }
      if (!response.ok) throw new Error(result.message ?? "No usage is ready for batching.")
      setNotice(`Batch prepared: ${result.batch?.usageCount ?? 0} events, ${formatUsdc(result.batch?.netAmountUsdc ?? 0)} net.`)
      await connect(apiKey)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Batch creation failed.")
    } finally {
      setBusy(null)
    }
  }

  const summary = overview?.summary ?? emptySummary
  const selectedApi = apis.find((api) => api.id === apiId)

  return (
    <section className="analytics-shell billing-shell">
      <div className="billing-heading">
        <div>
          <p className="kicker">x402 metering & subscriptions</p>
          <h1>Arc Billing</h1>
          <p>Turn Marketplace API calls into prepaid nanopayments, invoices and settlement-ready batches.</p>
        </div>
        <div className="billing-protocol">
          <Gauge size={22} />
          <div><span>Gateway model</span><strong>Meter now · settle net</strong><small>x402 usage ledger on Arc</small></div>
        </div>
      </div>

      <div className="shield-authbar">
        <label><span>Arc API key</span><input autoComplete="off" placeholder="arc_live_..." type="password" value={apiKey} onChange={(event) => setApiKey(event.target.value)} /></label>
        <button className="button secondary" disabled={busy === "connect"} onClick={() => void connect()} type="button"><RefreshCw size={16} /> Connect</button>
      </div>
      {!apiKey.trim() && <div className="demo-mode-banner">Demo workspace is loaded in read-only mode. Connect an Arc API key to meter live usage, top up balances and create settlement batches.</div>}

      {error && <div className="analytics-error">{error}</div>}
      {notice && <div className="billing-notice">{notice}</div>}

      <div className="billing-metrics">
        <Metric icon={<WalletCards size={18} />} label="Prepaid balance" value={formatUsdc(summary.prepaidBalanceUsdc)} />
        <Metric icon={<Activity size={18} />} label="Metered usage" value={formatUsdc(summary.meteredUsageUsdc)} />
        <Metric icon={<Layers3 size={18} />} label="Ready to batch" value={formatUsdc(summary.unbatchedUsageUsdc)} />
        <Metric icon={<CircleDollarSign size={18} />} label="Active accounts" value={String(summary.activeAccounts)} />
      </div>

      <div className="billing-grid">
        <section className="billing-panel">
          <PanelHead eyebrow="Gateway simulator" title="Record x402 usage" icon={<Gauge size={20} />} />
          <div className="billing-form">
            <label><span>Billing account</span><select value={agentId} onChange={(event) => setAgentId(event.target.value)}>{agents.map((agent) => <option key={agent.id} value={agent.id}>{agent.name}</option>)}</select></label>
            <label><span>Marketplace API</span><select value={apiId} onChange={(event) => setApiId(event.target.value)}>{apis.map((api) => <option key={api.id} value={api.id}>{api.name}</option>)}</select></label>
            <label><span>Usage units</span><input min="0.000001" step="1" type="number" value={units} onChange={(event) => setUnits(event.target.value)} /></label>
            <div className="billing-quote"><span>Rate</span><strong>{selectedApi ? `${formatUsdc(selectedApi.priceUsdc)} / ${selectedApi.pricingUnit}` : "—"}</strong></div>
          </div>
          <button className="button primary billing-action" disabled={!apiKey.trim() || !configured || busy === "usage"} onClick={() => void meterUsage()} type="button"><Plus size={16} /> Meter usage event</button>
        </section>

        <section className="billing-panel">
          <PanelHead eyebrow="Prepaid balance" title="Fund an account" icon={<WalletCards size={20} />} />
          <div className="billing-account-list">
            {(overview?.accounts ?? []).map((account) => (
              <div key={account.id}><span>{agentName(agents, account.agentId)}</span><strong>{formatUsdc(account.prepaidBalanceUsdc)}</strong><small>{planName(overview, account.planId)}</small></div>
            ))}
          </div>
          <div className="billing-topup"><input min="0.01" step="1" type="number" value={topUpAmount} onChange={(event) => setTopUpAmount(event.target.value)} /><button className="button secondary" disabled={!apiKey.trim() || busy === "topup"} onClick={() => void topUp()} type="button">Top up selected</button></div>
        </section>
      </div>

      <div className="billing-grid billing-grid-lower">
        <section className="billing-panel">
          <PanelHead eyebrow="Invoices" title="Current billing period" icon={<FileText size={20} />} />
          <div className="billing-invoices">
            {(overview?.invoices ?? []).length === 0 ? <p>No draft invoices yet.</p> : overview?.invoices.map((invoice) => (
              <div key={invoice.id}><span><b>{agentName(agents, invoice.agentId)}</b><small>{invoice.usageCount} usage events</small></span><strong>{formatUsdc(invoice.totalUsdc)}</strong><em className={`is-${invoice.status}`}>{invoice.status}</em></div>
            ))}
          </div>
        </section>
        <section className="billing-panel">
          <PanelHead eyebrow="Batched settlement" title="Net nanopayments" icon={<Boxes size={20} />} />
          <p className="billing-copy">Aggregate many tiny x402 charges into one settlement-ready provider batch.</p>
          <button className="button primary billing-action" disabled={!apiKey.trim() || busy === "batch" || summary.unbatchedUsageUsdc <= 0} onClick={() => void createBatch()} type="button"><Boxes size={16} /> Create settlement batch</button>
          <div className="billing-batches">{(overview?.batches ?? []).slice(0, 3).map((batch) => <div key={batch.id}><code>{batch.id.slice(0, 18)}...</code><span>{batch.usageCount} events</span><strong>{formatUsdc(batch.netAmountUsdc)}</strong></div>)}</div>
        </section>
      </div>

      <section className="billing-panel billing-ledger">
        <PanelHead eyebrow="Usage ledger" title="Recent x402 charges" icon={<Activity size={20} />} />
        <div className="shield-table-wrap"><table className="shield-table"><thead><tr><th>Agent</th><th>API</th><th>Units</th><th>Gross</th><th>Discount</th><th>Net</th><th>Invoice</th></tr></thead><tbody>
          {(overview?.usage ?? []).length === 0 ? <tr><td className="shield-table-empty" colSpan={7}>No metered usage yet.</td></tr> : overview?.usage.map((usage) => <tr key={usage.id}><td>{agentName(agents, usage.agentId)}</td><td>{apiName(apis, usage.apiId)}</td><td>{usage.units}</td><td>{formatUsdc(usage.grossAmountUsdc)}</td><td>{formatUsdc(usage.discountUsdc)}</td><td>{formatUsdc(usage.netAmountUsdc)}</td><td><code>{usage.invoiceId}</code></td></tr>)}
        </tbody></table></div>
      </section>
    </section>
  )
}

function Metric({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return <div className="billing-metric"><span>{icon}{label}</span><strong>{value}</strong></div>
}
function PanelHead({ eyebrow, title, icon }: { eyebrow: string; title: string; icon: ReactNode }) {
  return <div className="flow-panel-title"><div><span>{eyebrow}</span><h2>{title}</h2></div>{icon}</div>
}
function readStoredApiKey() { return typeof window === "undefined" ? "" : window.sessionStorage.getItem(API_KEY_STORAGE) ?? window.sessionStorage.getItem("arc_ops_health_key") ?? "" }
function formatUsdc(value: number) { return `${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 6 })} USDC` }
function agentName(agents: Agent[], id: string) { return agents.find((agent) => agent.id === id)?.name ?? id }
function apiName(apis: ApiPayload["apis"], id: string) { return apis.find((api) => api.id === id)?.name ?? id }
function planName(overview: BillingOverview | null, id: string) { return overview?.plans.find((plan) => plan.id === id)?.name ?? id }
const emptySummary = { prepaidBalanceUsdc: 0, meteredUsageUsdc: 0, unbatchedUsageUsdc: 0, activeAccounts: 0, lowBalanceAccounts: 0 }
