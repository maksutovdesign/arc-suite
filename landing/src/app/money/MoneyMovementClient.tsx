"use client"

import { AppKit, KitError } from "@circle-fin/app-kit"
import { createViemAdapterFromProvider, type CreateViemAdapterFromProviderParams } from "@circle-fin/adapter-viem-v2"
import { ArrowRight, BadgeDollarSign, CheckCircle2, CircleDollarSign, ExternalLink, RefreshCw, Route, ShieldCheck, WalletCards } from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"

type BrowserProvider = CreateViemAdapterFromProviderParams["provider"]
type AppAdapter = Awaited<ReturnType<typeof createViemAdapterFromProvider>>
type Operation = "spend" | "bridge" | "swap" | "send"
type Chain = "Arc_Testnet" | "Base_Sepolia" | "Ethereum_Sepolia" | "Arbitrum_Sepolia"
type TimelineItem = { label: string; state: "pending" | "active" | "done" | "error"; detail: string }
type PolicyProof = {
  decision: string
  reason: string
  riskScore: string
  riskCategories: string[]
  ruleName: string | null
  provider: string
  screeningChain: string
  screeningBasis: string
}
type Proof = { operation: Operation; state: string; traceId: string; recordedAt: string; txHashes: string[]; explorerUrls: string[]; policy: PolicyProof | null; raw: unknown }
type MoneyPolicyConfiguration = {
  enabled: boolean
  feeBps: number
  feeRecipient: string | null
  maxAmountUsdc: number
  allowlistRequired: boolean
  complianceConfigured: boolean
  signatureTtlSeconds: number
  missing: string[]
}

type Eip6963Detail = {
  info: { uuid: string; name: string; icon: string; rdns: string }
  provider: BrowserProvider
}

declare global {
  interface WindowEventMap {
    "eip6963:announceProvider": CustomEvent<Eip6963Detail>
  }
}

const kit = new AppKit({ disableErrorReporting: true })
const chains: Chain[] = ["Arc_Testnet", "Base_Sepolia", "Ethereum_Sepolia", "Arbitrum_Sepolia"]
const feeBps = 75
const configuredFeeRecipient = process.env.NEXT_PUBLIC_KESTREL_FEE_RECIPIENT?.trim() ?? ""
const appKitKey = process.env.NEXT_PUBLIC_CIRCLE_APP_KIT_KEY?.trim() ?? ""

const operationCopy: Record<Operation, { title: string; description: string }> = {
  spend: { title: "Unified Balance", description: "Source available USDC across Gateway balances and mint it on Arc." },
  bridge: { title: "Bridge", description: "Move native USDC through CCTP with a retryable transaction lifecycle." },
  swap: { title: "Swap", description: "Price and execute USDC/EURC conversion with a stop-limit and developer fee." },
  send: { title: "Send", description: "Transfer USDC on one chain and preserve the resulting transaction proof." },
}

export function MoneyMovementClient() {
  const adapterRef = useRef<AppAdapter | null>(null)
  const providerRef = useRef<BrowserProvider | null>(null)
  const [wallet, setWallet] = useState<{ address: string; name: string } | null>(null)
  const [operation, setOperation] = useState<Operation>("spend")
  const [sourceChain, setSourceChain] = useState<Chain>("Base_Sepolia")
  const [destinationChain, setDestinationChain] = useState<Chain>("Arc_Testnet")
  const [amount, setAmount] = useState("1.00")
  const [recipient, setRecipient] = useState("")
  const [feeRecipient, setFeeRecipient] = useState(configuredFeeRecipient)
  const [policyConfiguration, setPolicyConfiguration] = useState<MoneyPolicyConfiguration | null>(null)
  const [busy, setBusy] = useState<"connect" | "quote" | "execute" | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [estimate, setEstimate] = useState<unknown>(null)
  const [proof, setProof] = useState<Proof | null>(null)
  const [events, setEvents] = useState<TimelineItem[]>(initialTimeline())

  const amountNumber = Number(amount)
  const developerFee = Number.isFinite(amountNumber) ? amountNumber * feeBps / 10_000 : 0
  const appRevenue = developerFee * 0.9
  const arcShare = developerFee * 0.1
  const canExecute = Boolean(wallet && recipient && amountNumber > 0 && feeRecipient && policyConfiguration?.enabled)
  const estimateRows = useMemo(() => flattenEstimate(estimate), [estimate])

  useEffect(() => {
    let cancelled = false
    void fetch("/api/money/preflight", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Money Movement policy configuration is unavailable.")
        return response.json() as Promise<MoneyPolicyConfiguration>
      })
      .then((configuration) => {
        if (cancelled) return
        setPolicyConfiguration(configuration)
        if (configuration.feeRecipient) setFeeRecipient(configuration.feeRecipient)
      })
      .catch((reason) => {
        if (!cancelled) setError(errorMessage(reason))
      })
    return () => { cancelled = true }
  }, [])

  async function connectWallet() {
    setBusy("connect")
    setError(null)
    try {
      const providers = await discoverWallets()
      const selected = providers.find(({ info }) => info.rdns === "io.metamask") ?? providers[0]
      if (!selected) throw new Error("No EIP-6963 browser wallet found. Install MetaMask or another EVM wallet.")
      await selected.provider.request({ method: "eth_requestAccounts", params: undefined })
      const accounts = await selected.provider.request({ method: "eth_accounts", params: undefined }) as string[]
      const address = accounts[0]
      if (!address) throw new Error("The wallet did not return an account.")
      adapterRef.current = await createViemAdapterFromProvider({ provider: selected.provider })
      providerRef.current = selected.provider
      setWallet({ address, name: selected.info.name })
      setRecipient((value) => value || address)
      setEvents(markTimeline("Wallet connected", "done", `${selected.info.name} · ${shortHash(address)}`))
    } catch (reason) {
      setError(errorMessage(reason))
    } finally {
      setBusy(null)
    }
  }

  async function requestQuote() {
    const adapter = adapterRef.current
    if (!adapter || !wallet) return setError("Connect an EVM wallet first.")
    if (!recipient || !feeRecipient || !(amountNumber > 0)) return setError("Enter valid amount, recipient and fee wallet.")
    setBusy("quote")
    setError(null)
    setProof(null)
    setEvents(markTimeline("Preflight estimate", "active", "App Kit is validating route capability and fees."))
    try {
      const result = await estimateOperation({ adapter, operation, sourceChain, destinationChain, amount, recipient, feeRecipient })
      setEstimate(toJsonSafe(result))
      void recordMoneyAnalytics("money_quote_created", { amount: amountNumber, destinationChain, operation, sourceChain })
      setEvents(markTimeline("Preflight estimate", "done", "Route, fees and recipient outcome are available."))
    } catch (reason) {
      setEvents(markTimeline("Preflight estimate", "error", errorMessage(reason)))
      setError(errorMessage(reason))
    } finally {
      setBusy(null)
    }
  }

  async function execute() {
    const adapter = adapterRef.current
    const provider = providerRef.current
    if (!adapter || !provider || !wallet || !canExecute) return setError("Execution is blocked until wallet and server policy are ready.")
    setBusy("execute")
    setError(null)
    setEvents(markTimeline("Policy & compliance", "active", "Sign the exact intent for server-side policy and Circle screening."))
    try {
      const policyResult = await authorizeMoneyMovement({
        provider,
        walletAddress: wallet.address,
        operation,
        sourceChain,
        destinationChain: operation === "send" ? sourceChain : destinationChain,
        amount,
        recipient,
        feeRecipient,
      })
      setEvents(markTimeline("Policy & compliance", "done", `${policyResult.policy.provider} · ${policyResult.policy.decision} · ${policyResult.traceId.slice(0, 8)}`))
      void recordMoneyAnalytics("money_preflight_authorized", { amount: amountNumber, destinationChain, operation, traceId: policyResult.traceId })
      setEvents(markTimeline("Wallet signature", "active", "Confirm the App Kit transaction in your wallet."))
      const result = await executeOperation({ adapter, operation, sourceChain, destinationChain, amount, recipient, feeRecipient })
      const safeResult = toJsonSafe(result)
      const nextProof = buildProof(operation, safeResult, policyResult.policy, policyResult.traceId)
      setProof(nextProof)
      void recordMoneyAnalytics("money_execution_completed", { amount: amountNumber, destinationChain, operation, traceId: policyResult.traceId, txCount: nextProof.txHashes.length })
      setEvents((current) => current.map((item) => item.label === "Wallet signature"
        ? { ...item, state: "done", detail: "Signed and broadcast through App Kit." }
        : item.label === "Settlement proof"
          ? { ...item, state: "done", detail: `${nextProof.txHashes.length || 1} execution reference recorded.` }
          : item))
    } catch (reason) {
      const message = errorMessage(reason)
      const resumable = reason instanceof KitError && reason.recoverability === "RESUMABLE"
      void recordMoneyAnalytics("money_execution_blocked", { amount: amountNumber, destinationChain, operation, reason: message.slice(0, 120) })
      setEvents((current) => current.map((item) => item.label === "Wallet signature"
        ? { ...item, state: "error", detail: message }
        : item.label === "Policy & compliance" && item.state === "active"
          ? { ...item, state: "error", detail: message }
        : item.label === "Recovery path" && resumable
          ? { ...item, state: "active", detail: "Mint can be resumed with the returned attestation before it expires." }
          : item))
      setError(message)
    } finally {
      setBusy(null)
    }
  }

  return (
    <section className="analytics-shell money-shell">
      <header className="money-hero">
        <div>
          <p className="kicker">Circle App Kit execution core</p>
          <h1>Move money. Apply policy. Keep proof.</h1>
          <p>Kestrel turns Send, Bridge, Swap and Unified Balance into one controlled flow with transparent fees and Arc settlement.</p>
        </div>
        <div className="money-hero-badge"><Route size={22} /><span><strong>Production adapter</strong><small>Browser wallet · App Kit · Arc Testnet</small></span></div>
      </header>

      <div className="money-grid">
        <section className="money-panel money-builder">
          <div className="money-panel-head"><span>01</span><div><p>Execution intent</p><h2>Choose the movement</h2></div></div>
          <div className="money-operation-tabs">
            {(Object.keys(operationCopy) as Operation[]).map((item) => <button className={operation === item ? "is-active" : ""} key={item} onClick={() => { setOperation(item); setEstimate(null); setProof(null) }} type="button"><strong>{operationCopy[item].title}</strong><small>{operationCopy[item].description}</small></button>)}
          </div>

          <div className="money-wallet-row">
            <div><WalletCards size={18} /><span><strong>{wallet ? wallet.name : "Wallet not connected"}</strong><small>{wallet ? shortHash(wallet.address) : "EIP-6963 · user-controlled"}</small></span></div>
            <button className="button secondary" disabled={busy === "connect"} onClick={() => void connectWallet()} type="button">{busy === "connect" ? <RefreshCw className="is-spinning" size={15} /> : <WalletCards size={15} />}{wallet ? "Reconnect" : "Connect wallet"}</button>
          </div>

          <div className="money-form">
            <label><span>Source chain</span><select disabled={operation === "send" && destinationChain === sourceChain} value={sourceChain} onChange={(event) => setSourceChain(event.target.value as Chain)}>{chains.map((chain) => <option key={chain}>{chain}</option>)}</select></label>
            <label><span>Destination chain</span><select value={operation === "send" ? sourceChain : destinationChain} onChange={(event) => setDestinationChain(event.target.value as Chain)} disabled={operation === "send"}>{chains.map((chain) => <option key={chain}>{chain}</option>)}</select></label>
            <label><span>Amount</span><div className="money-amount"><input inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} /><em>USDC</em></div></label>
            <label><span>Recipient</span><input value={recipient} onChange={(event) => setRecipient(event.target.value)} placeholder="0x…" /></label>
            <label className="money-wide"><span>Kestrel fee wallet · enforced by server policy</span><input value={feeRecipient} readOnly placeholder="Waiting for production configuration" /></label>
          </div>

          <div className="money-actions">
            <button className="button secondary" disabled={!wallet || busy !== null} onClick={() => void requestQuote()} type="button"><BadgeDollarSign size={16} />{busy === "quote" ? "Estimating…" : "Estimate route"}</button>
            <button className="button primary" disabled={!canExecute || busy !== null || !estimate} onClick={() => void execute()} type="button"><ArrowRight size={16} />{busy === "execute" ? "Executing…" : "Confirm & execute"}</button>
          </div>
          {policyConfiguration && !policyConfiguration.enabled && <div className="analytics-error">Execution is fail-closed: {policyConfiguration.missing.join(", ") || "policy configuration is incomplete"}.</div>}
          {policyConfiguration?.enabled && <p className="money-fee-note">Execution guard: wallet-signed intent · Circle screening · {policyConfiguration.maxAmountUsdc} USDC cap{policyConfiguration.allowlistRequired ? " · recipient allowlist" : ""}.</p>}
          {error && <div className="analytics-error">{error}</div>}
        </section>

        <aside className="money-panel money-fees">
          <div className="money-panel-head"><span>02</span><div><p>Monetization</p><h2>Fee breakdown</h2></div></div>
          <div className="money-fee-total"><span>Developer fee</span><strong>{developerFee.toFixed(6)} USDC</strong><small>{feeBps} bps · shown before signature</small></div>
          <div className="money-fee-split"><div><span>Kestrel revenue · 90%</span><strong>{appRevenue.toFixed(6)}</strong></div><div><span>Arc share · 10%</span><strong>{arcShare.toFixed(6)}</strong></div></div>
          <p className="money-fee-note">Unified Balance fees are carved from the spend amount. Bridge fees are added on top. Swap fees are percentage-based and collected before execution.</p>
          <div className="money-estimate-list">
            {estimateRows.length ? estimateRows.map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>) : <div><span>Live App Kit estimate</span><strong>Connect and estimate</strong></div>}
          </div>
        </aside>
      </div>

      <div className="money-bottom-grid">
        <section className="money-panel">
          <div className="money-panel-head"><span>03</span><div><p>Controlled lifecycle</p><h2>Execution timeline</h2></div></div>
          <div className="money-timeline">{events.map((item) => <div className={`is-${item.state}`} key={item.label}><i>{item.state === "done" ? <CheckCircle2 size={15} /> : item.state === "active" ? <RefreshCw className="is-spinning" size={15} /> : <ShieldCheck size={15} />}</i><span><strong>{item.label}</strong><small>{item.detail}</small></span></div>)}</div>
        </section>
        <section className="money-panel money-proof">
          <div className="money-panel-head"><span>04</span><div><p>Transaction proof</p><h2>Verifiable outcome</h2></div></div>
          {proof ? <><div className="money-proof-grid"><div><span>State</span><strong>{proof.state}</strong></div><div><span>Trace</span><strong>{shortHash(proof.traceId)}</strong></div><div><span>Policy</span><strong>{proof.policy?.decision ?? "unknown"}</strong></div><div><span>Transactions</span><strong>{proof.txHashes.length}</strong></div></div>{proof.explorerUrls.map((url) => <a href={url} key={url} rel="noreferrer" target="_blank">Open transaction <ExternalLink size={13} /></a>)}<pre>{JSON.stringify(proof, null, 2)}</pre></> : <div className="money-proof-empty"><CircleDollarSign size={28} /><strong>No settlement proof yet</strong><span>The completed App Kit result, policy decision, hashes, explorer links and trace ID will appear here.</span></div>}
        </section>
      </div>
    </section>
  )
}

async function discoverWallets() {
  const providers = new Map<string, Eip6963Detail>()
  const listener = (event: WindowEventMap["eip6963:announceProvider"]) => {
    providers.set(event.detail.info.uuid, event.detail)
  }
  window.addEventListener("eip6963:announceProvider", listener)
  window.dispatchEvent(new Event("eip6963:requestProvider"))
  await new Promise((resolve) => window.setTimeout(resolve, 350))
  window.removeEventListener("eip6963:announceProvider", listener)
  return [...providers.values()]
}

type OperationInput = { adapter: AppAdapter; operation: Operation; sourceChain: Chain; destinationChain: Chain; amount: string; recipient: string; feeRecipient: string }
type AuthorizationInput = Omit<OperationInput, "adapter"> & { provider: BrowserProvider; walletAddress: string }

async function authorizeMoneyMovement(input: AuthorizationInput): Promise<{ authorized: true; traceId: string; policy: PolicyProof }> {
  const authorization = {
    walletAddress: input.walletAddress,
    operation: input.operation,
    sourceChain: input.sourceChain,
    destinationChain: input.destinationChain,
    amount: input.amount,
    recipient: input.recipient,
    feeRecipient: input.feeRecipient,
    issuedAt: new Date().toISOString(),
    nonce: crypto.randomUUID(),
  }
  const message = moneyAuthorizationMessage(authorization)
  const signature = await (input.provider as unknown as {
    request: (request: { method: string; params: string[] }) => Promise<unknown>
  }).request({ method: "personal_sign", params: [message, input.walletAddress] })
  if (typeof signature !== "string") throw new Error("The wallet did not return an authorization signature.")

  const response = await fetch("/api/money/preflight", {
    body: JSON.stringify({ ...authorization, signature }),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  })
  const payload = await response.json().catch(() => ({})) as {
    authorized?: boolean
    message?: string
    traceId?: string
    policy?: PolicyProof
  }
  if (!response.ok || !payload.authorized || !payload.traceId || !payload.policy) {
    throw new Error(payload.message ?? "Server policy denied this execution.")
  }
  return { authorized: true, traceId: payload.traceId, policy: payload.policy }
}

function moneyAuthorizationMessage(input: Omit<AuthorizationInput, "provider"> & { issuedAt: string; nonce: string }) {
  return [
    "Kestrel Money Movement Authorization",
    "Version: 1",
    `Wallet: ${input.walletAddress.toLowerCase()}`,
    `Operation: ${input.operation}`,
    `Source chain: ${input.sourceChain}`,
    `Destination chain: ${input.destinationChain}`,
    `Amount: ${input.amount} USDC`,
    `Recipient: ${input.recipient.toLowerCase()}`,
    `Fee recipient: ${input.feeRecipient.toLowerCase()}`,
    `Issued at: ${input.issuedAt}`,
    `Nonce: ${input.nonce}`,
  ].join("\n")
}

function paramsFor(input: OperationInput) {
  const customFeeValue = (Number(input.amount) * feeBps / 10_000).toFixed(6)
  if (input.operation === "spend") return { from: { adapter: input.adapter }, to: { adapter: input.adapter, chain: input.destinationChain, recipientAddress: input.recipient, useForwarder: true }, token: "USDC" as const, amountIn: input.amount, config: { customFee: { value: customFeeValue, recipientAddress: input.feeRecipient } } }
  if (input.operation === "bridge") return { from: { adapter: input.adapter, chain: input.sourceChain }, to: { adapter: input.adapter, chain: input.destinationChain, recipientAddress: input.recipient }, amount: input.amount, token: "USDC" as const, config: { customFee: { value: customFeeValue, recipientAddress: input.feeRecipient } } }
  if (input.operation === "swap") return { from: { adapter: input.adapter, chain: input.sourceChain }, tokenIn: "USDC", tokenOut: "EURC", amountIn: input.amount, config: { allowanceStrategy: "approve" as const, slippageBps: 100, customFee: { percentageBps: feeBps, recipientAddress: input.feeRecipient }, ...(appKitKey ? { kitKey: appKitKey } : {}) } }
  return { from: { adapter: input.adapter, chain: input.sourceChain }, to: input.recipient, amount: input.amount, token: "USDC" }
}

async function estimateOperation(input: OperationInput) {
  const params = paramsFor(input)
  if (input.operation === "spend") return kit.unifiedBalance.estimateSpend(params as Parameters<typeof kit.unifiedBalance.estimateSpend>[0])
  if (input.operation === "bridge") return kit.estimateBridge(params as Parameters<typeof kit.estimateBridge>[0])
  if (input.operation === "swap") return kit.estimateSwap(params as Parameters<typeof kit.estimateSwap>[0])
  return kit.estimateSend(params as Parameters<typeof kit.estimateSend>[0])
}

async function executeOperation(input: OperationInput) {
  const params = paramsFor(input)
  if (input.operation === "spend") return kit.unifiedBalance.spend(params as Parameters<typeof kit.unifiedBalance.spend>[0])
  if (input.operation === "bridge") return kit.bridge(params as Parameters<typeof kit.bridge>[0])
  if (input.operation === "swap") return kit.swap(params as Parameters<typeof kit.swap>[0])
  return kit.send(params as Parameters<typeof kit.send>[0])
}

function initialTimeline(): TimelineItem[] {
  return [
    { label: "Wallet connected", state: "pending", detail: "User-controlled signer remains in the browser." },
    { label: "Preflight estimate", state: "pending", detail: "Validate balance, route capability, fees and recipient." },
    { label: "Policy & compliance", state: "pending", detail: "Attach Kestrel policy decision before value moves." },
    { label: "Wallet signature", state: "pending", detail: "Explicit confirmation is required for execution." },
    { label: "Recovery path", state: "pending", detail: "Resumable mint failures retain attestation context." },
    { label: "Settlement proof", state: "pending", detail: "Record hashes, explorer URLs and trace state." },
  ]
}

function markTimeline(label: string, state: TimelineItem["state"], detail: string) {
  return (current: TimelineItem[]) => current.map((item) => item.label === label ? { ...item, state, detail } : item)
}

function buildProof(operation: Operation, raw: unknown, policy: PolicyProof, policyTraceId: string): Proof {
  const strings = collectStrings(raw)
  const txHashes = [...new Set(strings.filter((value) => /^(0x[a-fA-F0-9]{40,}|[1-9A-HJ-NP-Za-km-z]{64,})$/.test(value)))]
  const explorerUrls = [...new Set(strings.filter((value) => /^https:\/\/.+\/(tx|transaction)\//.test(value)))]
  const record = isRecord(raw) ? raw : {}
  return { operation, state: String(record.state ?? record.status ?? "submitted"), traceId: String(record.traceId ?? policyTraceId), recordedAt: new Date().toISOString(), txHashes, explorerUrls, policy, raw }
}

async function recordMoneyAnalytics(eventName: string, properties: Record<string, unknown>) {
  await fetch("/api/analytics/events", {
    body: JSON.stringify({
      eventName,
      path: window.location.pathname,
      placement: "money_movement",
      properties,
      source: "landing",
      surface: "money",
      url: window.location.href,
    }),
    headers: { "Content-Type": "application/json" },
    keepalive: true,
    method: "POST",
  }).catch(() => undefined)
}

function flattenEstimate(value: unknown): [string, string][] {
  if (!isRecord(value)) return []
  const rows: [string, string][] = []
  for (const [key, item] of Object.entries(value)) {
    if (typeof item === "string" || typeof item === "number") rows.push([humanize(key), String(item)])
    if (Array.isArray(item) && item.length) rows.push([humanize(key), `${item.length} item${item.length === 1 ? "" : "s"}`])
  }
  return rows.slice(0, 8)
}

function collectStrings(value: unknown): string[] {
  if (typeof value === "string") return [value]
  if (Array.isArray(value)) return value.flatMap(collectStrings)
  if (isRecord(value)) return Object.values(value).flatMap(collectStrings)
  return []
}

function toJsonSafe(value: unknown): unknown {
  if (typeof value === "bigint") return value.toString()
  if (Array.isArray(value)) return value.map(toJsonSafe)
  if (isRecord(value)) return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, toJsonSafe(item)]))
  return value
}

function isRecord(value: unknown): value is Record<string, unknown> { return Boolean(value) && typeof value === "object" }
function shortHash(value: string) { return value.length > 16 ? `${value.slice(0, 8)}…${value.slice(-6)}` : value }
function humanize(value: string) { return value.replace(/([a-z])([A-Z])/g, "$1 $2").replaceAll("_", " ") }
function errorMessage(reason: unknown) { return reason instanceof Error ? reason.message : "The App Kit operation failed." }
