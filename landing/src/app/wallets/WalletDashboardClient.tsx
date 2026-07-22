"use client"

import { ArrowRightLeft, CircleDollarSign, CreditCard, Fingerprint, KeyRound, Network, RefreshCw, Save, ShieldCheck, UserRoundCog, WalletCards, Zap } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"

import type { WalletAccount, WalletLifecycleEvent, WalletOverview, WalletSigningPolicy } from "@/lib/backend/schema"
import { demoWalletOverview } from "../demoWorkspace"

const API_KEY_STORAGE = "arc_wallet_os_key"

type ExecutionReadiness = {
  configured: boolean
  chain: string
  chainId: number
  sourceWalletId: string | null
  sourceAddress: string | null
  usdcTokenId: string | null
  defaultRecipient: string | null
  maxAmountUsdc: number
  missing: string[]
  circle: {
    tokenLookup: "configured" | "resolved" | "missing" | "unavailable"
    balanceReadable: boolean
    balanceUsdc: number | null
    tokenId: string | null
    tokenSymbol: string | null
    lastCheckedAt: string
    errorMessage: string | null
  }
}

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

const appLayerFlows = [
  { label: "Balances", value: "USDC / EURC", detail: "Arc-native account surface", icon: CircleDollarSign },
  { label: "Payments", value: "Policy-gated", detail: "Operator limits before movement", icon: ShieldCheck },
  { label: "Card-like spend", value: "Daily cap", detail: "Agent budgets act like controls", icon: CreditCard },
  { label: "CCTP", value: "Hidden route", detail: "Cross-chain movement stays behind UX", icon: Network },
  { label: "Gas", value: "Abstracted", detail: "Sponsored execution model", icon: Zap },
] as const

const unifiedBalanceReadiness = [
  { step: "Deposit", method: "Gateway -> unified balance", status: "mapped", detail: "Funding path can move behind the account surface." },
  { step: "Balance", method: "kit.unifiedBalance.*", status: "ready", detail: "One readable USDC state for operator controls." },
  { step: "Spend", method: "useForwarder-ready", status: "planned", detail: "Forwarded spend can support routed destinations." },
  { step: "Trace", method: "onBroadcast tx hash", status: "captured", detail: "Latest transaction hash is retained for support and proof." },
] as const

const gatewayDecisionMap = [
  ["Raw Gateway", "custom attestation, x402 debugging, provider-level settlement control"],
  ["Unified Balance Kit", "one spendable balance, estimateSpend, forwarding and operator UX"],
  ["Swap Kit", "cross-chain swap status, USD rates and route tracking"],
  ["Bridge Kit", "chain mismatch, rejected switch and latest failed tx hash handling"],
] as const

export function WalletDashboardClient() {
  const [apiKey, setApiKey] = useState("")
  const [overview, setOverview] = useState<WalletOverview | null>(demoWalletOverview)
  const [walletId, setWalletId] = useState(demoWalletOverview.wallets[0]?.id ?? "")
  const [policy, setPolicy] = useState<WalletSigningPolicy | null>(demoWalletOverview.policies[0] ?? null)
  const [action, setAction] = useState<WalletLifecycleEvent["action"]>("sign")
  const [actor, setActor] = useState("Kestrel Operator")
  const [detail, setDetail] = useState("Request Circle wallet operation under the active signing policy")
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [executionReadiness, setExecutionReadiness] = useState<ExecutionReadiness | null>(null)
  const loaded = useRef(false)

  const connect = useCallback(async (nextKey = apiKey) => {
    const key = nextKey.trim()
    if (!key) return setError("Enter an Arc API key.")
    setBusy("connect")
    setError(null)
    try {
      const [response, readinessResponse] = await Promise.all([
        fetch("/api/wallets/overview", { cache: "no-store", headers: { "x-arc-api-key": key } }),
        fetch("/api/wallets/execution-readiness", { cache: "no-store", headers: { "x-arc-api-key": key } }),
      ])
      if (response.status === 401) throw new Error("Invalid API key or missing read scope.")
      const payload = await response.json() as { overview: WalletOverview | null }
      if (!response.ok || !payload.overview) throw new Error("Kestrel Wallets migration is required.")
      if (readinessResponse.ok) {
        const readinessPayload = await readinessResponse.json() as { readiness: ExecutionReadiness }
        setExecutionReadiness(readinessPayload.readiness)
      }
      setOverview(payload.overview)
      const nextWalletId = walletId || payload.overview.wallets[0]?.id || ""
      setWalletId(nextWalletId)
      setPolicy(payload.overview.policies.find((item) => item.walletId === nextWalletId) ?? null)
      window.sessionStorage.setItem(API_KEY_STORAGE, key)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not load Kestrel Wallets.")
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
  const transactionReady = isTransactionReady(executionReadiness)
  const readinessStatus = !executionReadiness ? "Connect key" : transactionReady ? "Ready for smoke transfer" : "Blocked"
  const gatewayExecutionRows = buildGatewayExecutionRows(executionReadiness, transactionReady)

  return (
    <section className="analytics-shell wallet-shell">
      <div className="wallet-heading">
        <div>
          <p className="kicker">Circle wallet control plane</p>
          <h1>Kestrel Wallets</h1>
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
        <div className="wallet-app-layer">
          {appLayerFlows.map((item) => {
            const Icon = item.icon
            return (
              <div key={item.label}>
                <Icon size={17} />
                <span>{item.label}</span>
                <strong>{item.value}</strong>
                <small>{item.detail}</small>
              </div>
            )
          })}
        </div>
        <div className="wallet-unified-grid" aria-label="Unified Balance Kit readiness">
          {unifiedBalanceReadiness.map((item) => (
            <article key={item.step}>
              <span>{item.step}</span>
              <strong>{item.method}</strong>
              <em>{item.status}</em>
              <small>{item.detail}</small>
            </article>
          ))}
        </div>
        <div className="wallet-unified-grid" aria-label="Gateway to Unified Balance Kit decision map">
          {gatewayDecisionMap.map(([label, detail]) => (
            <article key={label}>
              <span>{label}</span>
              <strong>{label === "Unified Balance Kit" ? "preferred app surface" : "specialized path"}</strong>
              <em>{label === "Unified Balance Kit" ? "default" : "fallback"}</em>
              <small>{detail}</small>
            </article>
          ))}
        </div>
        <div className="wallet-live-adapter" aria-label="Gateway execution adapter">
          <div>
            <span>Gateway execution adapter</span>
            <strong>Balance {"->"} Spend {"->"} Forward {"->"} Trace</strong>
            <small>
              Maps the latest Gateway and Stablecoin Kit update into one operator path:
              readable balance, spend estimate, forwarded route and transaction hash capture.
            </small>
          </div>
          <div className="wallet-live-adapter-grid">
            {gatewayExecutionRows.map((item) => (
              <article className={`is-${item.tone}`} key={item.label}>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
                <small>{item.detail}</small>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="wallet-panel wallet-live-readiness">
        <div className="wallet-readiness-head">
          <PanelHead eyebrow="Live transaction readiness" title="Circle Wallet execution" icon={<Zap size={20} />} />
          <span className={`wallet-readiness-status ${transactionReady ? "is-ok" : executionReadiness ? "is-warn" : "is-neutral"}`}>{readinessStatus}</span>
        </div>
        <p className="wallet-account-copy">
          Wallet OS checks the Circle path before a policy-gated transfer is attempted: credentials, source wallet,
          Arc Testnet USDC token lookup, readable balance, recipient policy and smoke-transfer guardrails.
        </p>
        <div className="wallet-readiness-grid">
          <ReadinessCell label="Circle path" value={executionReadiness ? executionReadiness.configured ? "Configured" : "Needs env" : "Demo mode"} tone={executionReadiness?.configured ? "ok" : "warn"} />
          <ReadinessCell label="Source wallet" value={shortId(executionReadiness?.sourceWalletId)} />
          <ReadinessCell label="USDC balance" value={formatUsdcBalance(executionReadiness?.circle.balanceUsdc)} tone={executionReadiness?.circle.balanceReadable ? "ok" : "warn"} />
          <ReadinessCell label="Token lookup" value={executionReadiness?.circle.tokenLookup ?? "locked"} tone={executionReadiness?.circle.tokenLookup === "resolved" || executionReadiness?.circle.tokenLookup === "configured" ? "ok" : "warn"} />
          <ReadinessCell label="Max transfer" value={executionReadiness ? `${executionReadiness.maxAmountUsdc} USDC` : "policy-gated"} />
          <ReadinessCell label="Last check" value={executionReadiness ? formatDate(executionReadiness.circle.lastCheckedAt) : "Connect key"} />
        </div>
        <div className="wallet-readiness-checks">
          {buildReadinessChecks(executionReadiness).map((check) => (
            <div className={`wallet-readiness-check ${check.ok ? "is-ok" : "is-warn"}`} key={check.label}>
              <span>{check.ok ? "Ready" : "Missing"}</span>
              <strong>{check.label}</strong>
              <small>{check.detail}</small>
            </div>
          ))}
        </div>
        <p className="wallet-readiness-note">Next controlled smoke: 0.003 USDC from the configured source wallet after a write-scope Circle key is present.</p>
        {executionReadiness?.circle.errorMessage && <p className="wallet-readiness-note">Circle read returned: {executionReadiness.circle.errorMessage}</p>}
        {executionReadiness?.missing.length ? <p className="wallet-readiness-note">Missing production env: {executionReadiness.missing.join(", ")}</p> : null}
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
              <label className="wallet-check"><input checked={policy.requireShield} onChange={(event) => setPolicy({ ...policy, requireShield: event.target.checked })} type="checkbox" /><span>Require Kestrel Shield</span></label>
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
function ReadinessCell({ label, value, tone = "neutral" }: { label: string; value: string; tone?: "ok" | "warn" | "neutral" }) { return <div className={`wallet-readiness-cell is-${tone}`}><span>{label}</span><strong>{value}</strong></div> }
function isTransactionReady(readiness: ExecutionReadiness | null) {
  if (!readiness) return false
  const tokenReady = readiness.circle.tokenLookup === "configured" || readiness.circle.tokenLookup === "resolved"
  return readiness.configured && tokenReady && readiness.circle.balanceReadable && Boolean(readiness.sourceWalletId) && Boolean(readiness.sourceAddress) && readiness.missing.length === 0
}
function buildReadinessChecks(readiness: ExecutionReadiness | null) {
  if (!readiness) {
    return [
      { label: "Arc API key", ok: false, detail: "Connect a scoped key to inspect the production wallet path." },
      { label: "Circle env", ok: false, detail: "Circle credentials are checked after connection." },
      { label: "Source wallet", ok: false, detail: "Source wallet is checked after connection." },
      { label: "USDC token", ok: false, detail: "Arc Testnet USDC lookup is checked after connection." },
      { label: "Balance read", ok: false, detail: "Readable balance is checked after connection." },
      { label: "Recipient policy", ok: false, detail: "Recipient allowlist is checked after connection." },
    ]
  }
  const tokenReady = readiness.circle.tokenLookup === "configured" || readiness.circle.tokenLookup === "resolved"
  const recipientReady = !readiness.missing.some((item) => item.includes("ARC_SETTLEMENT_ALLOWED_RECIPIENTS") || item.includes("ARC_SETTLEMENT_DEFAULT_RECIPIENT"))
  return [
    { label: "Production env", ok: readiness.configured, detail: readiness.missing.length ? readiness.missing.join(", ") : "Circle and Arc settlement env are present." },
    { label: "Source wallet", ok: Boolean(readiness.sourceWalletId && readiness.sourceAddress), detail: readiness.sourceAddress ? shortId(readiness.sourceAddress) : "Source wallet env is not configured." },
    { label: "USDC token", ok: tokenReady, detail: readiness.circle.tokenId ? shortId(readiness.circle.tokenId) : "Token lookup must resolve Arc Testnet USDC." },
    { label: "Balance read", ok: readiness.circle.balanceReadable, detail: formatUsdcBalance(readiness.circle.balanceUsdc) },
    { label: "Recipient policy", ok: recipientReady, detail: readiness.defaultRecipient ? shortId(readiness.defaultRecipient) : "Allowlist can be used without exposing recipients in UI." },
    { label: "Guardrail", ok: readiness.maxAmountUsdc > 0, detail: `Max ${readiness.maxAmountUsdc} USDC per smoke transfer.` },
  ]
}
function buildGatewayExecutionRows(readiness: ExecutionReadiness | null, transactionReady: boolean) {
  return [
    {
      label: "Balance",
      value: formatUsdcBalance(readiness?.circle.balanceUsdc),
      detail: readiness?.circle.balanceReadable ? "Live Circle wallet balance read." : "Falls back to demo until Circle read is available.",
      tone: readiness?.circle.balanceReadable ? "ok" : "warn",
    },
    {
      label: "Estimate spend",
      value: readiness ? `${readiness.maxAmountUsdc} USDC max` : "policy gated",
      detail: "Spend remains bounded before provider access or route execution.",
      tone: readiness ? "ok" : "neutral",
    },
    {
      label: "Forward route",
      value: transactionReady ? "armed" : "review",
      detail: transactionReady ? "Ready for a controlled Arc Testnet smoke transfer." : "Waits for env, token lookup and recipient policy.",
      tone: transactionReady ? "ok" : "warn",
    },
    {
      label: "Tx trace",
      value: readiness?.sourceAddress ? shortId(readiness.sourceAddress) : "not attached",
      detail: "Latest on-chain hash can be attached to Proof and support workflows.",
      tone: readiness?.sourceAddress ? "ok" : "neutral",
    },
  ] as const
}
function NumberField({ label, value, onChange, step = "0.01" }: { label: string; value: number; onChange: (value: number) => void; step?: string }) { return <label><span>{label}</span><input min="0" step={step} type="number" value={value} onChange={(event) => onChange(Number(event.target.value))} /></label> }
function custodyName(value: WalletAccount["custodyModel"]) { return value === "developer" ? "Developer-controlled" : value === "user" ? "User-controlled" : "Modular" }
function actionLabel(value: WalletLifecycleEvent["action"]) { return value.replaceAll("_", " ").replace(/^\w/, (letter) => letter.toUpperCase()) }
function walletName(wallets: WalletAccount[], id: string) { return wallets.find((wallet) => wallet.id === id)?.name ?? id }
function formatDate(value: string) { return new Date(value).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" }) }
function shortId(value: string | null | undefined) { return value ? `${value.slice(0, 8)}...${value.slice(-4)}` : "Not configured" }
function formatUsdcBalance(value: number | null | undefined) { return typeof value === "number" ? `${value.toLocaleString("en-US", { maximumFractionDigits: 6 })} USDC` : "Unreadable" }
function readStoredApiKey() { return typeof window === "undefined" ? "" : window.sessionStorage.getItem(API_KEY_STORAGE) ?? window.sessionStorage.getItem("arc_gas_key") ?? window.sessionStorage.getItem("arc_shield_key") ?? "" }
