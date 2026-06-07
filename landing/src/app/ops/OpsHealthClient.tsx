"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"

const API_KEY_STORAGE = "arc_ops_health_key"

type ServiceStatus = "ok" | "warning" | "error"

type OpsSummary = {
  generatedAt: string
  ok: boolean
  requestId: string
  status: ServiceStatus
  services: {
    apps: Array<{
      checkedAt: string
      detail: string
      id: string
      label: string
      latencyMs: number
      status: ServiceStatus
      statusCode: number | null
      url: string
    }>
    github: {
      repo: string
      url: string
      workflows: Array<{
        conclusion: string | null
        detail: string
        id: string
        label: string
        runUrl: string
        status: ServiceStatus
        updatedAt: string | null
        workflowFile: string
      }>
    }
    sentry: {
      hasClientDsn: boolean
      hasDsn: boolean
      hasSourceMapUpload: boolean
      org: string
      project: string
      projectUrl: string
      ruleUrl: string
      status: ServiceStatus
    }
    slack: {
      channel: string
      detail: string
      ruleId: string
      ruleName: string
      status: ServiceStatus
      url: string
    }
    supabase: {
      configuration: {
        configured: boolean
        hasServiceRole: boolean
        hasUrl: boolean
        workspaceId: string
      }
      dataSource: "supabase" | "seed"
      status: ServiceStatus
      tables: Array<{
        count: number
        name: string
        ok: boolean
      }>
    }
  }
  signals: {
    analytics: {
      accessChecks: number
      demoClicks: number
      lastEventAt: string | null
      totalEvents: number
    }
    leads: {
      lastLeadAt: string | null
      latest: Array<{
        company: string | null
        createdAt: string
        email: string
        interest: string
        name: string
        status: string
      }>
      totalLoaded: number
    }
  }
}

type SentryTestResult = {
  ok: boolean
  requestId: string
  sentry: {
    eventId: string
    flushOk: boolean
    hasClient: boolean
    hasDsn: boolean
  }
}

export function OpsHealthClient() {
  const [apiKey, setApiKey] = useState(readStoredApiKey)
  const [summary, setSummary] = useState<OpsSummary | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isTestingSentry, setIsTestingSentry] = useState(false)
  const [sentryTest, setSentryTest] = useState<SentryTestResult | null>(null)
  const [lastLoadedAt, setLastLoadedAt] = useState<string | null>(null)
  const hasLoadedStoredKey = useRef(false)

  const loadSummary = useCallback(async (nextKey = apiKey) => {
    const key = nextKey.trim()
    if (!key) {
      setError("Enter an Arc API key to open Ops Health.")
      return
    }

    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/ops/summary", {
        cache: "no-store",
        headers: { "x-arc-api-key": key },
      })
      if (response.status === 401) throw new Error("Invalid API key or missing read scope.")
      if (!response.ok && response.status !== 503) throw new Error("Ops Health summary is unavailable.")

      const payload = await response.json() as OpsSummary
      setSummary(payload)
      setLastLoadedAt(new Date().toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" }))
      window.sessionStorage.setItem(API_KEY_STORAGE, key)
    } catch (err) {
      setSummary(null)
      setError(err instanceof Error ? err.message : "Could not load Ops Health.")
    } finally {
      setIsLoading(false)
    }
  }, [apiKey])

  useEffect(() => {
    if (hasLoadedStoredKey.current) return
    hasLoadedStoredKey.current = true

    const stored = apiKey.trim()
    if (!stored) return

    const handle = window.setTimeout(() => {
      void loadSummary(stored)
    }, 0)

    return () => window.clearTimeout(handle)
  }, [apiKey, loadSummary])

  const appStatusText = useMemo(() => {
    if (!summary) return "0/4"
    const healthy = summary.services.apps.filter((app) => app.status === "ok").length
    return `${healthy}/${summary.services.apps.length}`
  }, [summary])

  async function runSentryTest() {
    const key = apiKey.trim()
    if (!key) {
      setError("Enter an admin scoped Arc API key before sending a Sentry test event.")
      return
    }

    setIsTestingSentry(true)
    setError(null)
    try {
      const response = await fetch("/api/ops/sentry-test", {
        cache: "no-store",
        headers: { "x-arc-api-key": key },
        method: "POST",
      })
      if (response.status === 401) throw new Error("Sentry test requires an admin scoped Arc API key.")
      if (!response.ok) throw new Error("Could not send Sentry test event.")

      const payload = await response.json() as SentryTestResult
      setSentryTest(payload)
      void loadSummary(key)
    } catch (err) {
      setSentryTest(null)
      setError(err instanceof Error ? err.message : "Could not send Sentry test event.")
    } finally {
      setIsTestingSentry(false)
    }
  }

  function clearSession() {
    window.sessionStorage.removeItem(API_KEY_STORAGE)
    setApiKey("")
    setSummary(null)
    setSentryTest(null)
    setError(null)
    setLastLoadedAt(null)
  }

  return (
    <section className="analytics-shell ops-shell">
      <div className="analytics-toolbar">
        <div>
          <p className="kicker">Ops Health</p>
          <h1>MVP control center</h1>
          <p>
            One protected operator view for production availability, Supabase readiness, GitHub
            monitor state, Sentry runtime configuration, Slack alert routing, and investor signals.
          </p>
        </div>
        <form
          className="analytics-auth"
          onSubmit={(event) => {
            event.preventDefault()
            void loadSummary()
          }}
        >
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
          <div className="analytics-auth-actions">
            <button className="button primary" disabled={isLoading} type="submit">
              {isLoading ? "Checking..." : "Run health check"}
            </button>
            <button className="button secondary" onClick={clearSession} type="button">
              Clear
            </button>
          </div>
        </form>
      </div>

      {error && <div className="analytics-error">{error}</div>}

      {!summary ? (
        <div className="analytics-lock">
          <strong>Protected Ops Health</strong>
          <p>
            Use a read or admin scoped Arc API key. This page reads operational status from protected
            Arc endpoints and keeps the key only in this browser session.
          </p>
        </div>
      ) : (
        <div className="analytics-dashboard">
          <div className="analytics-meta">
            <StatusPill status={summary.status} label={`Overall ${summary.status}`} />
            <span>Updated {lastLoadedAt}</span>
            <span>Request {summary.requestId}</span>
          </div>

          <div className="analytics-kpi-grid ops-kpi-grid">
            <Metric label="Production apps" value={appStatusText} status={summary.status} />
            <Metric label="Supabase" value={summary.services.supabase.dataSource} status={summary.services.supabase.status} />
            <Metric label="GitHub monitor" value={summary.services.github.workflows[0]?.conclusion ?? "pending"} status={summary.services.github.workflows[0]?.status ?? "warning"} />
            <Metric label="Sentry runtime" value={summary.services.sentry.hasDsn ? "ready" : "missing"} status={summary.services.sentry.status} />
            <Metric label="Investor leads" value={String(summary.signals.leads.totalLoaded)} status="ok" />
          </div>

          <div className="analytics-grid ops-grid">
            <div className="analytics-card analytics-card-wide">
              <div className="analytics-card-head">
                <h2>Production Apps</h2>
                <span>server-side public checks</span>
              </div>
              <div className="ops-status-list">
                {summary.services.apps.map((app) => (
                  <ServiceRow
                    detail={`${app.detail} · ${app.statusCode ?? "no status"} · ${app.latencyMs} ms`}
                    href={app.url}
                    key={app.id}
                    label={app.label}
                    meta={formatDate(app.checkedAt)}
                    status={app.status}
                  />
                ))}
              </div>
            </div>

            <div className="analytics-card">
              <div className="analytics-card-head">
                <h2>Supabase</h2>
                <span>{summary.services.supabase.configuration.workspaceId}</span>
              </div>
              <div className="ops-status-list">
                <ServiceRow
                  detail={summary.services.supabase.configuration.configured ? "Service role and URL configured" : "Using seed fallback"}
                  label="Configuration"
                  meta={summary.services.supabase.dataSource}
                  status={summary.services.supabase.status}
                />
                {summary.services.supabase.tables.map((table) => (
                  <ServiceRow
                    detail={`${table.count} rows visible`}
                    key={table.name}
                    label={labelize(table.name)}
                    meta={table.ok ? "ready" : "missing"}
                    status={table.ok ? "ok" : "error"}
                  />
                ))}
              </div>
            </div>

            <div className="analytics-card">
              <div className="analytics-card-head">
                <h2>GitHub Actions</h2>
                <a href={summary.services.github.url}>Open</a>
              </div>
              <div className="ops-status-list">
                {summary.services.github.workflows.map((workflow) => (
                  <ServiceRow
                    detail={workflow.detail}
                    href={workflow.runUrl}
                    key={workflow.id}
                    label={workflow.label}
                    meta={workflow.updatedAt ? formatDate(workflow.updatedAt) : workflow.workflowFile}
                    status={workflow.status}
                  />
                ))}
              </div>
            </div>

            <div className="analytics-card">
              <div className="analytics-card-head">
                <h2>Sentry</h2>
                <a href={summary.services.sentry.projectUrl}>Open</a>
              </div>
              <div className="ops-status-list">
                <ServiceRow
                  detail={summary.services.sentry.hasDsn ? "Server runtime has DSN" : "Server DSN is missing"}
                  label="Server runtime"
                  meta={summary.services.sentry.project}
                  status={summary.services.sentry.hasDsn ? "ok" : "warning"}
                />
                <ServiceRow
                  detail={summary.services.sentry.hasClientDsn ? "Client runtime has public DSN" : "Client DSN is missing"}
                  label="Client runtime"
                  meta={summary.services.sentry.org}
                  status={summary.services.sentry.hasClientDsn ? "ok" : "warning"}
                />
                <ServiceRow
                  detail={summary.services.sentry.hasSourceMapUpload ? "Source map upload env is present" : "Source map upload env is incomplete"}
                  label="Source maps"
                  meta="release deploy"
                  status={summary.services.sentry.hasSourceMapUpload ? "ok" : "warning"}
                />
              </div>
            </div>

            <div className="analytics-card">
              <div className="analytics-card-head">
                <h2>Slack Alerts</h2>
                <a href={summary.services.slack.url}>Open</a>
              </div>
              <div className="ops-status-list">
                <ServiceRow
                  detail={summary.services.slack.detail}
                  href={summary.services.sentry.ruleUrl}
                  label={summary.services.slack.ruleName}
                  meta={summary.services.slack.channel}
                  status={summary.services.slack.status}
                />
              </div>
              <div className="ops-actions">
                <button className="button secondary" disabled={isTestingSentry} onClick={runSentryTest} type="button">
                  {isTestingSentry ? "Sending..." : "Send Sentry test"}
                </button>
                {sentryTest && (
                  <p>
                    Event {sentryTest.sentry.eventId} · flush {sentryTest.sentry.flushOk ? "ok" : "pending"}
                  </p>
                )}
              </div>
            </div>

            <div className="analytics-card analytics-card-wide">
              <div className="analytics-card-head">
                <h2>Product Signals</h2>
                <span>loaded analytics window</span>
              </div>
              <div className="ops-signal-grid">
                <Metric label="Demo clicks" value={String(summary.signals.analytics.demoClicks)} status="ok" />
                <Metric label="Access checks" value={String(summary.signals.analytics.accessChecks)} status="ok" />
                <Metric label="Events" value={String(summary.signals.analytics.totalEvents)} status="ok" />
                <Metric label="Last event" value={summary.signals.analytics.lastEventAt ? formatDate(summary.signals.analytics.lastEventAt) : "none"} status="warning" />
              </div>
            </div>

            <div className="analytics-card analytics-card-full">
              <div className="analytics-card-head">
                <h2>Latest Leads</h2>
                <span>{summary.signals.leads.totalLoaded} loaded</span>
              </div>
              {summary.signals.leads.latest.length === 0 ? (
                <div className="empty-row">No investor or pilot leads captured yet.</div>
              ) : (
                <div className="lead-list">
                  {summary.signals.leads.latest.map((lead) => (
                    <div className="lead-row" key={`${lead.email}:${lead.createdAt}`}>
                      <div>
                        <strong>{lead.name}</strong>
                        <span>{lead.email} · {lead.company ?? "No company"} · {formatDate(lead.createdAt)}</span>
                      </div>
                      <div>
                        <b>{labelize(lead.interest)}</b>
                        <code>{lead.status}</code>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

function readStoredApiKey() {
  if (typeof window === "undefined") return ""
  return window.sessionStorage.getItem(API_KEY_STORAGE) ?? ""
}

function Metric({ label, status, value }: { label: string; status: ServiceStatus; value: string }) {
  return (
    <div className={`analytics-metric ops-metric is-${status}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function ServiceRow({
  detail,
  href,
  label,
  meta,
  status,
}: {
  detail: string
  href?: string
  label: string
  meta: string
  status: ServiceStatus
}) {
  const content = (
    <>
      <StatusPill status={status} />
      <div>
        <strong>{label}</strong>
        <span>{detail}</span>
      </div>
      <code>{meta}</code>
    </>
  )

  if (href) {
    return (
      <a className="ops-status-row" href={href}>
        {content}
      </a>
    )
  }

  return <div className="ops-status-row">{content}</div>
}

function StatusPill({ label, status }: { label?: string; status: ServiceStatus }) {
  return <span className={`ops-pill is-${status}`}>{label ?? status}</span>
}

function labelize(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase())
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
  }).format(new Date(value))
}
