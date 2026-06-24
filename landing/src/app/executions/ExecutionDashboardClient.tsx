"use client"

import { Activity, CircleCheck, Clock3, RefreshCw, RotateCcw, Webhook, XCircle } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"

import { demoExecutionOverview } from "@/app/demoWorkspace"
import type { ExecutionOverview } from "@/lib/backend/schema"

const API_KEY_STORAGE = "arc_execution_key"

export function ExecutionDashboardClient() {
  const [apiKey, setApiKey] = useState(readStoredApiKey)
  const [overview, setOverview] = useState<ExecutionOverview | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const loaded = useRef(false)
  const liveMode = Boolean(overview)
  const visibleOverview = overview ?? demoExecutionOverview

  const connect = useCallback(async (nextKey = apiKey) => {
    const key = nextKey.trim()
    if (!key) return setError("Enter an Arc API key.")
    setBusy("connect")
    setError(null)
    try {
      const response = await fetch("/api/executions/overview", { cache: "no-store", headers: { "x-arc-api-key": key } })
      if (response.status === 401) throw new Error("Invalid API key or missing read scope.")
      const payload = await response.json() as { overview: ExecutionOverview | null }
      if (!response.ok || !payload.overview) throw new Error("Execution worker migration is required.")
      setOverview(payload.overview)
      window.sessionStorage.setItem(API_KEY_STORAGE, key)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not load execution jobs.")
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

  async function runWorker() {
    setBusy("worker")
    setError(null)
    setNotice(null)
    try {
      const response = await fetch("/api/executions/worker?limit=10", { headers: { "x-arc-api-key": apiKey.trim() } })
      const result = await response.json() as { claimed?: number; message?: string }
      if (!response.ok) throw new Error(response.status === 403 ? "Worker execution requires admin scope." : result.message ?? "Worker failed.")
      setNotice(`Worker processed ${result.claimed ?? 0} job(s).`)
      await connect(apiKey)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Worker failed.")
    } finally {
      setBusy(null)
    }
  }

  const summary = visibleOverview.summary

  return (
    <section className="analytics-shell execution-shell">
      <div className="execution-heading">
        <div>
          <p className="kicker">Circle provider operations</p>
          <h1>Execution Control</h1>
          <p>One leased queue for Wallet OS, Escrow, Gas and Billing with signed webhook reconciliation.</p>
        </div>
        <div className="execution-protocol"><Webhook size={24} /><div><span>At-least-once safe</span><strong>Idempotent jobs and webhook inbox</strong><small>Lease · retry · reconcile · confirm</small></div></div>
      </div>

      <div className="shield-authbar">
        <label><span>Arc API key</span><input autoComplete="off" placeholder="arc_live_..." type="password" value={apiKey} onChange={(event) => setApiKey(event.target.value)} /></label>
        <button className="button secondary" disabled={busy === "connect"} onClick={() => void connect()} type="button"><RefreshCw size={16} /> Connect</button>
        <button className="button primary" disabled={!liveMode || busy === "worker"} onClick={() => void runWorker()} type="button"><RotateCcw size={16} /> Run worker</button>
      </div>
      {!liveMode && (
        <div className="demo-mode-banner">
          Demo workspace is active. Connect an Arc API key to run the live provider worker.
        </div>
      )}
      {error && <div className="analytics-error">{error}</div>}
      {notice && <div className="billing-notice">{notice}</div>}

      <div className="execution-metrics">
        <Metric icon={<Activity size={18} />} label="Queued" value={summary.queued} />
        <Metric icon={<Clock3 size={18} />} label="Waiting provider" value={summary.waitingProvider} />
        <Metric icon={<RotateCcw size={18} />} label="Retrying" value={summary.retrying} />
        <Metric icon={<CircleCheck size={18} />} label="Succeeded" value={summary.succeeded} />
        <Metric icon={<XCircle size={18} />} label="Failed" value={summary.failed} />
      </div>

      <section className="wallet-panel execution-table">
        <div className="flow-panel-title"><div><span>Execution jobs</span><h2>Provider lifecycle</h2></div><Activity size={20} /></div>
        <div className="shield-table-wrap"><table className="shield-table"><thead><tr><th>Product</th><th>Action</th><th>Resource</th><th>Status</th><th>Attempts</th><th>Provider ID</th><th>Last error</th></tr></thead><tbody>
          {visibleOverview.jobs.length === 0 ? <tr><td className="shield-table-empty" colSpan={7}>No execution jobs yet.</td></tr> : visibleOverview.jobs.map((job) => <tr key={job.id}><td>{kindName(job.kind)}</td><td>{job.action}</td><td><code>{job.resourceId}</code></td><td><em className={`execution-status is-${job.status}`}>{job.status}</em></td><td>{job.attempts}/{job.maxAttempts}</td><td><code>{job.providerOperationId ?? "awaiting submission"}</code></td><td>{job.lastErrorMessage ?? "—"}</td></tr>)}
        </tbody></table></div>
      </section>

      <section className="wallet-panel execution-table">
        <div className="flow-panel-title"><div><span>Circle webhooks</span><h2>Signed delivery inbox</h2></div><Webhook size={20} /></div>
        <div className="shield-table-wrap"><table className="shield-table"><thead><tr><th>Notification</th><th>Type</th><th>Provider ID</th><th>Signature</th><th>Processing</th><th>Received</th></tr></thead><tbody>
          {visibleOverview.webhooks.length === 0 ? <tr><td className="shield-table-empty" colSpan={6}>No Circle webhooks received yet.</td></tr> : visibleOverview.webhooks.map((event) => <tr key={event.id}><td><code>{event.notificationId}</code></td><td>{event.notificationType}</td><td><code>{event.providerOperationId ?? "—"}</code></td><td>{event.signatureVerified ? "verified" : "rejected"}</td><td><em className={`execution-status is-${event.processingStatus}`}>{event.processingStatus}</em></td><td>{formatDate(event.receivedAt)}</td></tr>)}
        </tbody></table></div>
      </section>
    </section>
  )
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) { return <div className="execution-metric"><span>{icon}{label}</span><strong>{value}</strong></div> }
function kindName(kind: string) { return kind.replaceAll("_", " ").replace(/^\w/, (letter) => letter.toUpperCase()) }
function formatDate(value: string) { return new Date(value).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" }) }
function readStoredApiKey() { return typeof window === "undefined" ? "" : window.sessionStorage.getItem(API_KEY_STORAGE) ?? window.sessionStorage.getItem("arc_wallet_os_key") ?? window.sessionStorage.getItem("arc_gas_key") ?? "" }
