"use client"

import { ArrowRightLeft, CircleDollarSign, Fingerprint, KeyRound, RefreshCw, Save, ShieldCheck, UserRoundCog, WalletCards } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"

import type { WalletAccount, WalletLifecycleEvent, WalletOverview, WalletSigningPolicy } from "@/lib/backend/schema"
import { demoWalletOverview } from "../demoWorkspace"

const API_KEY_STORAGE = "arc_wallet_os_key"

const multicurrencyAccounts = [
  { asset: "USDC", balance: "3,072.93", role: "Agent spend base", status: "implemented" },
  { asset: "EURC", balance: "1,184.20", role: "Invoice and FX quote rail", status: "planned" },
  { asset: "Fiat rail", balance: "Gateway-ready", role: "Top-up path for operators", status: "planned" },
] as const

const stableFxRoutes = [
  { route: "USDC -> EURC", signal: "StableFX-ready quote", state: "priced" },
  { route: "EURC invoice -> USDC budget", signal: "Policy-priced settlement", state: "planned" },
  { route: "Fiat top-up -> agent wallet", signal: "Gateway funding path", state: "planned" },
] as const

export function WalletDashboardClient() {
  const [apiKey, setApiKey] = useState("")
  const [overview, setOverview] = useState<WalletOverview | null>(demoWalletOverview)
  const [walletId, setWalletId] = useState(demoWalletOverview.wallets[0]?.id ?? "")
  const [policy, setPolicy] = useState<WalletSigningPolicy | null>(demoWalletOverview.policies[0] ?? null)
  const [action, setAction] = useState<WalletLifecycleEvent["action"]>("sign")
  const [actor, setActor] = useState("Arc Operator")
  const [detail, setDetail] = useState("Request Circle wallet operation under the active signing policy")
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const loaded = useRef(false)

  const connect = useCallback(async (nextKey = apiKey) => {
    const key = nextKey.trim()
    if (!key) return setError("Enter an Arc API key.")
    setBusy("connect")
    setError(null)
    try {
      const response = await fetch("/api/wallets/overview", { cache: "no-store", headers: { "x-arc-api-key": key } })
      if (response.status === 401) throw new Error("Invalid API key or missing read scope.")
      const payload = await response.json() as { overview: WalletOverview | null }
      if (!response.ok || !payload.overview) throw new Error("Arc Wallet OS migration is required.")
      setOverview(payload.overview)
      const nextWalletId = walletId || payload.overview.wallets[0]?.id || ""
      setWalletId(nextWalletId)
      setPolicy(payload.overview.policies.find((item) => item.walletId === nextWalletId) ?? null)
      window.sessionStorage.setItem(API_KEY_STORAGE, key)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not load Arc Wallet OS.")
    } finally {
      setBusy(null)
    }
  }, [apiKey, walletId])

  useEffect(() => {
    if (loaded.current) return
    loaded.current = true
    const stored = readStoredApiKey().trim()
    if (!stored) return
    const timer = window.setTimeout(() => {
      setApiKey(stored)
      void connect(stored)
    }, 0)
    return () => window.clearTimeout(timer)
  }, [connect])

  function selectWallet(nextWalletId: string) {
    setWalletId(nextWalletId)
    setPolicy(overview?.policies.find((item) => item.walletId === nextWalletId) ?? null)
  }

  async function requestAction() {
    if (!walletId) return setError("Select a wallet.")
    setBusy("action")
    setError(null)
    setNotice(null)
    try {
      const response = await fetch("/api/wallets/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-arc-api-key": apiKey.trim() },
        body: JSON.stringify({
          walletId, action, actor, detail,
          idempotencyKey: `wallet-ui:${crypto.randomUUID()}`,
          source: "wallet_os_console",
        }),
      })
      const result = await response.json() as { message?: string; event?: WalletLifecycleEvent }
      if (!response.ok) throw new Error(result.message ?? "Lifecycle request failed.")
      setNotice(`${actionLabel(action)} requested. Circle confirmation is still required.`)
      await connect(apiKey)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Lifecycle request failed.")
    } finally {
      setBusy(null)
    }
  }

  async function savePolicy() {
    if (!policy) return
    setBusy("policy")
    setError(null)
    try {
      const response = await fetch("/api/wallets/policies", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-arc-api-key": apiKey.trim() },
        body: JSON.stringify(policy),
      })
      const result = await response.json() as { message?: string }
      if (!response.ok) throw new Error(response.status === 403 ? "Policy updates require admin scope." : result.message ?? "Policy update failed.")
      setNotice("Signing policy updated.")
      await connect(apiKey)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Policy update failed.")
    } finally {
      setBusy(null)
    }
  }

  const summary = overview?.summary ?? { totalWallets: 0, activeWallets: 0, userControlledWallets: 0, pendingOperations: 0 }
  const wallet = overview?.wallets.find((item) => item.id === walletId) ?? null

  return (
    <section className="analytics-shell wallet-shell">
      <div className="wallet-heading">
        <div>
          <p className="kicker">Circle wallet control plane</p>
          <h1>Arc Wallet OS</h1>
          <p>Operate team and client wallets across developer-controlled, user-controlled and modular custody models.</p>
        </div>
        <div className="wallet-protocol"><WalletCards size={24} /><div><span>Arc Testnet</span><strong>One lifecycle, three custody models</strong><small>Circle receipt required for provider completion</small></div></div>
      </div>

      <div className="shield-authbar">
        <label><span>Arc API key</span><input autoComplete="off" placeholder="arc_live_..." type="password" value={apiKey} onChange={(event) => setApiKey(event.target.value)} /></label>
        <button className="button secondary" disabled={busy === "connect"} onClick={() => void connect()} type="button"><RefreshCw size={16} /> Connect</button>
      </div>
      {!apiKey.trim() && <div className="demo-mode-banner">Demo workspace is loaded in read-only mode. Connect an Arc API key to request Circle wallet operations and edit signing policy.</div>}
      {error && <div className="analytics-error">{error}</div>}
      {notice && <div className="billing-notice">{notice}</div>}

      <div className="wallet-metrics">
        <Metric label="Wallets" value={String(summary.totalWallets)} icon={<WalletCards size={18} />} />
        <Metric label="Active" value={String(summary.activeWallets)} icon={<ShieldCheck size={18} />} />
        <Metric label="User custody" value={String(summary.userControlledWallets)} icon={<Fingerprint size={18} />} />
        <Metric label="Pending ops" value={String(summary.pendingOperations)} icon={<RefreshCw size={18} />} />
      </div>

      <section className="wallet-panel wallet-account-surface">
        <PanelHead eyebrow="Application layer" title="One agent balance, multiple currencies" icon={<CircleDollarSign size={20} />} />
        <p className="wallet-account-copy">
          Wallet OS is the operator layer behind a Pulsar-style experience: agents keep a USDC spending base, price invoices in EURC,
          and prepare fiat funding paths without exposing the custody complexity underneath.
        </p>
        <div className="wallet-account-grid">
          {multicurrencyAccounts.map((item) => (
            <div className="wallet-account-card" key={item.asset}>
              <span>{item.asset}</span>
              <strong>{item.balance}</strong>
              <small>{item.role}</small>
              <em className={`wallet-account-status is-${item.status}`}>{item.status}</em>
            </div>
          ))}
        </div>
        <div className="wallet-fx-routes">
          {stableFxRoutes.map((item) => (
            <div className="wallet-fx-route" key={item.route}>
              <ArrowRightLeft size={16} />
              <span><strong>{item.route}</strong><small>{item.signal}</small></span>
              <em>{item.state}</em>
            </div>
          ))}
        </div>
      </section>

      <div className="wallet-grid">
        <section className="wallet-panel">
          <PanelHead eyebrow="Wallet registry" title="Custody & lifecycle" icon={<WalletCards size={20} />} />
          <div className="wallet-list">
            {(overview?.wallets ?? []).map((item) => (
              <button className={item.id === walletId ? "is-active" : ""} key={item.id} onClick={() => selectWallet(item.id)} type="button">
                <span><strong>{item.name}</strong><small>{item.ownerLabel}</small></span>
                <span><em>{custodyName(item.custodyModel)}</em><small>{item.accountType} · {item.status}</small></span>
              </button>
            ))}
          </div>
          {wallet && <div className="wallet-address"><span>{wallet.authMethod.replaceAll("_", " ")}</span><code>{wallet.address ?? "Awaiting Circle provisioning"}</code></div>}
        </section>

        <section className="wallet-panel">
          <PanelHead eyebrow="Provider operation" title="Lifecycle request" icon={<UserRoundCog size={20} />} />
          <div className="wallet-form">
            <label><span>Action</span><select value={action} onChange={(event) => setAction(event.target.value as WalletLifecycleEvent["action"])}><option value="sign">Request signature</option><option value="recover">Start recovery</option><option value="suspend">Suspend wallet</option><option value="resume">Resume wallet</option><option value="retire">Retire wallet</option></select></label>
            <label><span>Actor</span><input value={actor} onChange={(event) => setActor(event.target.value)} /></label>
            <label className="wallet-wide"><span>Reason</span><input value={detail} onChange={(event) => setDetail(event.target.value)} /></label>
          </div>
          <button className="button primary wallet-action" disabled={!apiKey.trim() || busy === "action" || !wallet} onClick={() => void requestAction()} type="button"><KeyRound size={16} /> Request operation</button>
        </section>
      </div>

      <div className="wallet-grid wallet-lower">
        <section className="wallet-panel">
          <PanelHead eyebrow="Signing policy" title="Approvals & controls" icon={<ShieldCheck size={20} />} />
          {policy ? <>
            <div className="wallet-form">
              <label><span>Status</span><select value={policy.status} onChange={(event) => setPolicy({ ...policy, status: event.target.value as WalletSigningPolicy["status"] })}><option value="active">Active</option><option value="paused">Paused</option></select></label>
              <NumberField label="Approvals required" value={policy.approvalsRequired} onChange={(value) => setPolicy({ ...policy, approvalsRequired: value })} step="1" />
              <NumberField label="Per transaction, USDC" value={policy.transactionLimitUsdc} onChange={(value) => setPolicy({ ...policy, transactionLimitUsdc: value })} />
              <NumberField label="Daily limit, USDC" value={policy.dailyLimitUsdc} onChange={(value) => setPolicy({ ...policy, dailyLimitUsdc: value })} />
              <NumberField label="Minimum reputation" value={policy.requireReputationScore} onChange={(value) => setPolicy({ ...policy, requireReputationScore: value })} step="1" />
              <label className="wallet-check"><input checked={policy.requireShield} onChange={(event) => setPolicy({ ...policy, requireShield: event.target.checked })} type="checkbox" /><span>Require Arc Shield</span></label>
            </div>
            <button className="button secondary wallet-action" disabled={!apiKey.trim() || busy === "policy"} onClick={() => void savePolicy()} type="button"><Save size={16} /> Save policy</button>
          </> : <p>Connect with an API key to edit policy.</p>}
        </section>

        <section className="wallet-panel">
          <PanelHead eyebrow="Access model" title="Roles & recovery" icon={<Fingerprint size={20} />} />
          <div className="wallet-role-list">
            {(overview?.roles.filter((item) => item.walletId === walletId) ?? []).map((item) => <div key={item.id}><span><strong>{item.principal}</strong><small>{item.status}</small></span><em>{item.role}</em></div>)}
            {wallet && <div><span><strong>Recovery</strong><small>Custody-specific path</small></span><em>{wallet.recoveryMethod.replaceAll("_", " ")}</em></div>}
          </div>
        </section>
      </div>

      <section className="wallet-panel wallet-events">
        <PanelHead eyebrow="Audit timeline" title="Wallet lifecycle events" icon={<RefreshCw size={20} />} />
        <div className="shield-table-wrap"><table className="shield-table"><thead><tr><th>Wallet</th><th>Action</th><th>Actor</th><th>Status</th><th>Detail</th><th>Time</th></tr></thead><tbody>
          {(overview?.events ?? []).length === 0 ? <tr><td className="shield-table-empty" colSpan={6}>No lifecycle events yet.</td></tr> : overview?.events.map((event) => <tr key={event.id}><td>{walletName(overview.wallets, event.walletId)}</td><td>{actionLabel(event.action)}</td><td>{event.actor}</td><td><em className={`wallet-status is-${event.status}`}>{event.status}</em></td><td>{event.detail}</td><td>{formatDate(event.createdAt)}</td></tr>)}
        </tbody></table></div>
      </section>
    </section>
  )
}

function Metric({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) { return <div className="wallet-metric"><span>{icon}{label}</span><strong>{value}</strong></div> }
function PanelHead({ eyebrow, title, icon }: { eyebrow: string; title: string; icon: React.ReactNode }) { return <div className="flow-panel-title"><div><span>{eyebrow}</span><h2>{title}</h2></div>{icon}</div> }
function NumberField({ label, value, onChange, step = "0.01" }: { label: string; value: number; onChange: (value: number) => void; step?: string }) { return <label><span>{label}</span><input min="0" step={step} type="number" value={value} onChange={(event) => onChange(Number(event.target.value))} /></label> }
function custodyName(value: WalletAccount["custodyModel"]) { return value === "developer" ? "Developer-controlled" : value === "user" ? "User-controlled" : "Modular" }
function actionLabel(value: WalletLifecycleEvent["action"]) { return value.replaceAll("_", " ").replace(/^\w/, (letter) => letter.toUpperCase()) }
function walletName(wallets: WalletAccount[], id: string) { return wallets.find((wallet) => wallet.id === id)?.name ?? id }
function formatDate(value: string) { return new Date(value).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" }) }
function readStoredApiKey() { return typeof window === "undefined" ? "" : window.sessionStorage.getItem(API_KEY_STORAGE) ?? window.sessionStorage.getItem("arc_gas_key") ?? window.sessionStorage.getItem("arc_shield_key") ?? "" }
