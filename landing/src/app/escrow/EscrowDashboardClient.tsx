"use client"

import {
  AlertTriangle,
  CheckCircle2,
  CircleDollarSign,
  FileCheck2,
  Gavel,
  LockKeyhole,
  Plus,
  RefreshCw,
  RotateCcw,
  Send,
  ShieldCheck,
} from "lucide-react"
import { type ReactNode, useCallback, useEffect, useRef, useState } from "react"

import type { Agent, EscrowDeal, EscrowMilestone, EscrowOverview } from "@/lib/backend/schema"

const API_KEY_STORAGE = "arc_shield_key"
type Payload = { configured: boolean; overview: EscrowOverview | null }

export function EscrowDashboardClient() {
  const [apiKey, setApiKey] = useState(readStoredApiKey)
  const [overview, setOverview] = useState<EscrowOverview | null>(null)
  const [agents, setAgents] = useState<Agent[]>([])
  const [selectedDealId, setSelectedDealId] = useState("")
  const [buyerAgentId, setBuyerAgentId] = useState("")
  const [sellerAgentId, setSellerAgentId] = useState("")
  const [title, setTitle] = useState("Agent API delivery")
  const [milestoneTitle, setMilestoneTitle] = useState("Production delivery")
  const [milestoneAmount, setMilestoneAmount] = useState("5")
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
        fetch("/api/escrow/overview", { cache: "no-store", headers }),
        fetch("/api/agents", { cache: "no-store", headers }),
      ])
      if (overviewResponse.status === 401 || agentsResponse.status === 401) throw new Error("Invalid API key or missing read scope.")
      const data = await overviewResponse.json() as Payload
      if (!overviewResponse.ok || !data.overview) throw new Error("Arc Escrow migration is required.")
      const agentData = await agentsResponse.json() as { agents: Agent[] }
      setOverview(data.overview)
      setAgents(agentData.agents)
      setSelectedDealId((current) => current || data.overview?.deals[0]?.id || "")
      setBuyerAgentId((current) => current || agentData.agents[0]?.id || "")
      setSellerAgentId((current) => current || agentData.agents.find((agent) => agent.id !== agentData.agents[0]?.id)?.id || "")
      window.sessionStorage.setItem(API_KEY_STORAGE, key)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not load Arc Escrow.")
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

  async function createDeal() {
    const amount = Number(milestoneAmount)
    if (!buyerAgentId || !sellerAgentId || buyerAgentId === sellerAgentId || !title.trim() || !milestoneTitle.trim() || amount <= 0) {
      return setError("Choose different agents and complete the deal fields.")
    }
    setBusy("create")
    setError(null)
    setNotice(null)
    try {
      const response = await fetch("/api/escrow/deals", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-arc-api-key": apiKey.trim() },
        body: JSON.stringify({
          title, description: "Created from the Arc Escrow operator console.",
          buyerAgentId, sellerAgentId,
          idempotencyKey: `escrow-ui:${crypto.randomUUID()}`,
          milestones: [{ title: milestoneTitle, description: "Operator-defined delivery milestone.", amountUsdc: amount }],
        }),
      })
      const result = await response.json() as { deal?: EscrowDeal; message?: string }
      if (!response.ok || !result.deal) throw new Error(result.message ?? "Deal creation failed.")
      setSelectedDealId(result.deal.id)
      setNotice(`Deal created: ${formatUsdc(result.deal.totalAmountUsdc)} locked in the escrow ledger.`)
      await connect(apiKey)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Deal creation failed.")
    } finally {
      setBusy(null)
    }
  }

  async function runAction(milestone: EscrowMilestone, action: "submit" | "release" | "refund" | "dispute") {
    setBusy(`${action}:${milestone.id}`)
    setError(null)
    setNotice(null)
    try {
      const response = await fetch("/api/escrow/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-arc-api-key": apiKey.trim() },
        body: JSON.stringify({
          dealId: milestone.dealId,
          milestoneId: milestone.id,
          action,
          actor: action === "submit" ? selectedDeal?.sellerAgentId : "operator",
          detail: action === "dispute" ? "Operator opened a milestone dispute." : undefined,
        }),
      })
      const result = await response.json() as { message?: string; receipt?: { txHash: string } }
      if (!response.ok) throw new Error(result.message ?? "Escrow action failed.")
      setNotice(result.receipt?.txHash ? `${action} confirmed on Arc: ${shortHash(result.receipt.txHash)}` : `Milestone ${action} recorded.`)
      await connect(apiKey)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Escrow action failed.")
    } finally {
      setBusy(null)
    }
  }

  const summary = overview?.summary ?? { lockedUsdc: 0, releasedUsdc: 0, disputedUsdc: 0, activeDeals: 0 }
  const selectedDeal = overview?.deals.find((deal) => deal.id === selectedDealId) ?? overview?.deals[0] ?? null
  const milestones = (overview?.milestones ?? []).filter((item) => item.dealId === selectedDeal?.id).sort((a, b) => a.position - b.position)
  const events = (overview?.events ?? []).filter((item) => item.dealId === selectedDeal?.id).slice(0, 8)
  const onchain = overview?.configuration.onchainConfigured ?? false

  return (
    <section className="analytics-shell escrow-shell">
      <div className="escrow-heading">
        <div>
          <p className="kicker">Programmable agent deals</p>
          <h1>Arc Escrow</h1>
          <p>Lock commercial intent into milestones, route disputes, and release USDC only after confirmed contract execution.</p>
        </div>
        <div className={`escrow-contract ${onchain ? "is-live" : ""}`}>
          <ShieldCheck size={22} />
          <div><span>Circle Contracts</span><strong>{onchain ? "Onchain execution ready" : "Ledger mode · fail closed"}</strong><small>Arc Testnet · event-audited</small></div>
        </div>
      </div>

      <div className="shield-authbar">
        <label><span>Arc API key</span><input autoComplete="off" placeholder="arc_live_..." type="password" value={apiKey} onChange={(event) => setApiKey(event.target.value)} /></label>
        <button className="button secondary" disabled={busy === "connect"} onClick={() => void connect()} type="button"><RefreshCw size={16} /> Connect</button>
      </div>
      {error && <div className="analytics-error">{error}</div>}
      {notice && <div className="billing-notice">{notice}</div>}

      <div className="billing-metrics">
        <Metric icon={<LockKeyhole size={18} />} label="Locked value" value={formatUsdc(summary.lockedUsdc)} />
        <Metric icon={<CircleDollarSign size={18} />} label="Released" value={formatUsdc(summary.releasedUsdc)} />
        <Metric icon={<Gavel size={18} />} label="In dispute" value={formatUsdc(summary.disputedUsdc)} />
        <Metric icon={<FileCheck2 size={18} />} label="Active deals" value={String(summary.activeDeals)} />
      </div>

      <div className="escrow-layout">
        <aside className="billing-panel escrow-deals">
          <PanelHead eyebrow="Deal book" title="Agent agreements" icon={<LockKeyhole size={20} />} />
          <div className="escrow-deal-list">
            {(overview?.deals ?? []).map((deal) => (
              <button className={deal.id === selectedDeal?.id ? "is-active" : ""} key={deal.id} onClick={() => setSelectedDealId(deal.id)} type="button">
                <span><b>{deal.title}</b><small>{agentName(agents, deal.buyerAgentId)} → {agentName(agents, deal.sellerAgentId)}</small></span>
                <strong>{formatUsdc(deal.totalAmountUsdc)}</strong>
                <em className={`is-${deal.status}`}>{deal.status}</em>
              </button>
            ))}
          </div>
        </aside>

        <section className="billing-panel escrow-detail">
          <PanelHead eyebrow={selectedDeal?.status ?? "No deal"} title={selectedDeal?.title ?? "Select an escrow deal"} icon={<FileCheck2 size={20} />} />
          {selectedDeal && (
            <>
              <div className="escrow-progress">
                <span><b>{formatUsdc(selectedDeal.releasedAmountUsdc)}</b> released</span>
                <span><b>{formatUsdc(selectedDeal.totalAmountUsdc - selectedDeal.releasedAmountUsdc - selectedDeal.refundedAmountUsdc)}</b> locked</span>
                <div><i style={{ width: `${Math.min(100, selectedDeal.releasedAmountUsdc / selectedDeal.totalAmountUsdc * 100)}%` }} /></div>
              </div>
              <div className="escrow-milestones">
                {milestones.map((milestone) => (
                  <article key={milestone.id}>
                    <div className="escrow-milestone-index">{String(milestone.position + 1).padStart(2, "0")}</div>
                    <div><h3>{milestone.title}</h3><p>{milestone.description}</p><span className={`escrow-status is-${milestone.status}`}>{milestone.status}</span></div>
                    <strong>{formatUsdc(milestone.amountUsdc)}</strong>
                    <div className="escrow-actions">
                      {milestone.status === "pending" && <button title="Submit milestone" onClick={() => void runAction(milestone, "submit")} type="button"><Send size={15} /></button>}
                      {["submitted", "disputed"].includes(milestone.status) && <button disabled={!onchain} title={onchain ? "Release on Arc" : "Configure Circle contract to release"} onClick={() => void runAction(milestone, "release")} type="button"><CheckCircle2 size={15} /></button>}
                      {["pending", "submitted", "disputed"].includes(milestone.status) && <button disabled={!onchain} title={onchain ? "Refund on Arc" : "Configure Circle contract to refund"} onClick={() => void runAction(milestone, "refund")} type="button"><RotateCcw size={15} /></button>}
                      {["pending", "submitted"].includes(milestone.status) && <button title="Open dispute" onClick={() => void runAction(milestone, "dispute")} type="button"><AlertTriangle size={15} /></button>}
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}
        </section>
      </div>

      <div className="escrow-layout escrow-lower">
        <section className="billing-panel">
          <PanelHead eyebrow="New agreement" title="Create escrow deal" icon={<Plus size={20} />} />
          <div className="escrow-form">
            <label><span>Deal title</span><input value={title} onChange={(event) => setTitle(event.target.value)} /></label>
            <label><span>Buyer agent</span><select value={buyerAgentId} onChange={(event) => setBuyerAgentId(event.target.value)}>{agents.map((agent) => <option key={agent.id} value={agent.id}>{agent.name}</option>)}</select></label>
            <label><span>Seller agent</span><select value={sellerAgentId} onChange={(event) => setSellerAgentId(event.target.value)}>{agents.map((agent) => <option key={agent.id} value={agent.id}>{agent.name}</option>)}</select></label>
            <label><span>First milestone</span><input value={milestoneTitle} onChange={(event) => setMilestoneTitle(event.target.value)} /></label>
            <label><span>Amount, USDC</span><input min="0.01" step="0.01" type="number" value={milestoneAmount} onChange={(event) => setMilestoneAmount(event.target.value)} /></label>
          </div>
          <button className="button primary billing-action" disabled={busy === "create"} onClick={() => void createDeal()} type="button"><Plus size={16} /> Create deal</button>
        </section>

        <section className="billing-panel escrow-events">
          <PanelHead eyebrow="Event log" title="Escrow audit trail" icon={<Gavel size={20} />} />
          {events.length === 0 ? <p className="billing-copy">No events for this deal.</p> : events.map((event) => (
            <div key={event.id}><span className={`escrow-event-icon is-${event.type}`}><EventIcon type={event.type} /></span><p><b>{event.type}</b>{event.detail}<small>{new Date(event.createdAt).toLocaleString("en-US")} · {event.actor}</small></p>{event.explorerUrl ? <a href={event.explorerUrl} rel="noreferrer" target="_blank">Arcscan</a> : <strong>{event.amountUsdc > 0 ? formatUsdc(event.amountUsdc) : "—"}</strong>}</div>
          ))}
        </section>
      </div>
    </section>
  )
}

function Metric({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return <div className="billing-metric"><span>{icon}{label}</span><strong>{value}</strong></div>
}
function PanelHead({ eyebrow, title, icon }: { eyebrow: string; title: string; icon: ReactNode }) {
  return <div className="flow-panel-title"><div><span>{eyebrow}</span><h2>{title}</h2></div>{icon}</div>
}
function EventIcon({ type }: { type: string }) {
  return type === "released" ? <CheckCircle2 size={14} /> : type === "refunded" ? <RotateCcw size={14} /> : type === "disputed" ? <AlertTriangle size={14} /> : <FileCheck2 size={14} />
}
function readStoredApiKey() { return typeof window === "undefined" ? "" : window.sessionStorage.getItem(API_KEY_STORAGE) ?? window.sessionStorage.getItem("arc_ops_health_key") ?? "" }
function formatUsdc(value: number) { return `${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 6 })} USDC` }
function agentName(agents: Agent[], id: string) { return agents.find((agent) => agent.id === id)?.name ?? id }
function shortHash(value: string) { return `${value.slice(0, 8)}...${value.slice(-6)}` }
