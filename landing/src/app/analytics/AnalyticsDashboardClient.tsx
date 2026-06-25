"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { AnalyticsEvent, AnalyticsSummary, InvestorLead } from "@/lib/backend/schema"

const API_KEY_STORAGE = "arc_analytics_dashboard_key"

export function AnalyticsDashboardClient() {
  const [apiKey, setApiKey] = useState(readStoredApiKey)
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null)
  const [leads, setLeads] = useState<InvestorLead[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [lastLoadedAt, setLastLoadedAt] = useState<string | null>(null)
  const hasLoadedStoredKey = useRef(false)

  const loadSummary = useCallback(async (nextKey = apiKey) => {
    const key = nextKey.trim()
    if (!key) {
      setError("Enter an Arc API key to open the analytics dashboard.")
      return
    }

    setIsLoading(true)
    setError(null)
    try {
      const headers = { "x-arc-api-key": key }
      const [summaryResponse, leadsResponse] = await Promise.all([
        fetch("/api/analytics/summary?limit=500", { cache: "no-store", headers }),
        fetch("/api/leads?limit=100", { cache: "no-store", headers }),
      ])
      if (summaryResponse.status === 401 || leadsResponse.status === 401) throw new Error("Invalid API key or missing read scope.")
      if (!summaryResponse.ok) throw new Error("Analytics summary is unavailable.")

      const payload = (await summaryResponse.json()) as AnalyticsSummary
      const leadsPayload = leadsResponse.ok ? (await leadsResponse.json()) as { leads: InvestorLead[] } : { leads: [] }
      setSummary(payload)
      setLeads(leadsPayload.leads)
      setLastLoadedAt(new Date().toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" }))
      window.sessionStorage.setItem(API_KEY_STORAGE, key)
    } catch (err) {
      setSummary(null)
      setLeads([])
      setError(err instanceof Error ? err.message : "Could not load analytics.")
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

  const totalEvents = useMemo(() => summary?.totals.reduce((sum, item) => sum + item.count, 0) ?? 0, [summary])

  function clearSession() {
    window.sessionStorage.removeItem(API_KEY_STORAGE)
    setApiKey("")
    setSummary(null)
    setLeads([])
    setError(null)
    setLastLoadedAt(null)
  }

  return (
    <section className="analytics-shell">
      <div className="analytics-toolbar">
        <div>
          <p className="kicker">Operator analytics</p>
          <h1>Conversion dashboard</h1>
          <p>
            Track how investors move from landing-page intent into the working Arc Treasury demo.
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
              {isLoading ? "Loading..." : "Load dashboard"}
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
          <strong>Protected analytics</strong>
          <p>
            Use a read or admin scoped Arc API key. The dashboard reads the protected analytics summary
            endpoint and does not expose the key in page source.
          </p>
        </div>
      ) : (
        <div className="analytics-dashboard">
          <div className="analytics-meta">
            <span>{totalEvents} events loaded</span>
            {lastLoadedAt && <span>Updated {lastLoadedAt}</span>}
          </div>

          <div className="analytics-kpi-grid">
            <Metric label="Demo clicks" value={String(summary.funnel.demoClicks)} />
            <Metric label="Access checks" value={String(summary.funnel.accessCheckRuns)} />
            <Metric label="Leads" value={String(leads.length)} />
            <Metric label="Demo to check" value={`${summary.funnel.demoToAccessCheckRatePct}%`} />
            <Metric label="Check completion" value={`${summary.funnel.accessCheckCompletionRatePct}%`} />
          </div>

          <div className="analytics-grid">
            <div className="analytics-card analytics-card-wide">
              <div className="analytics-card-head">
                <h2>Investor Funnel</h2>
                <span>demo_click to access_check_result</span>
              </div>
              <div className="funnel-grid">
                <FunnelStep label="Demo" value={summary.funnel.demoClicks} />
                <FunnelStep label="Run Access Check" value={summary.funnel.accessCheckRuns} />
                <FunnelStep label="Result" value={summary.funnel.accessCheckResults} />
              </div>
            </div>

            <div className="analytics-card">
              <div className="analytics-card-head">
                <h2>CTA Totals</h2>
                <span>loaded window</span>
              </div>
              <BarList
                items={[
                  ["Investors", summary.funnel.investorClicks],
                  ["Demo", summary.funnel.demoClicks],
                  ["Run Access Check", summary.funnel.accessCheckRuns],
                ]}
              />
            </div>

            <div className="analytics-card">
              <div className="analytics-card-head">
                <h2>Sources</h2>
                <span>landing vs app</span>
              </div>
              <BarList items={summary.sources.map((item) => [labelize(item.source), item.count])} />
            </div>

            <div className="analytics-card analytics-card-wide">
              <div className="analytics-card-head">
                <h2>Placement Breakdown</h2>
                <span>where clicks happen</span>
              </div>
              <div className="placement-grid">
                {summary.placements.slice(0, 12).map((item) => (
                  <div className="placement-row" key={`${item.eventName}:${item.placement}`}>
                    <span>{labelize(item.eventName)}</span>
                    <strong>{item.placement}</strong>
                    <b>{item.count}</b>
                  </div>
                ))}
              </div>
            </div>

            <div className="analytics-card analytics-card-full">
              <div className="analytics-card-head">
                <h2>Investor Leads</h2>
                <span>latest 100</span>
              </div>
              {leads.length === 0 ? (
                <div className="empty-row">No leads captured yet.</div>
              ) : (
                <div className="lead-list">
                  {leads.map((lead) => <LeadRow lead={lead} key={lead.id} />)}
                </div>
              )}
            </div>

            <div className="analytics-card analytics-card-full">
              <div className="analytics-card-head">
                <h2>Recent Events</h2>
                <span>latest 50</span>
              </div>
              <div className="event-list">
                {summary.recent.map((event) => <EventRow event={event} key={event.id} />)}
              </div>
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

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="analytics-metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function FunnelStep({ label, value }: { label: string; value: number }) {
  return (
    <div className="funnel-step">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function BarList({ items }: { items: Array<[string, number]> }) {
  const max = Math.max(...items.map(([, value]) => value), 1)
  return (
    <div className="bar-list">
      {items.map(([label, value]) => (
        <div className="bar-row" key={label}>
          <div>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
          <b style={{ width: `${Math.max(6, (value / max) * 100)}%` }} />
        </div>
      ))}
    </div>
  )
}

function EventRow({ event }: { event: AnalyticsEvent }) {
  return (
    <div className="event-row">
      <div>
        <strong>{labelize(event.eventName)}</strong>
        <span>{event.source} · {event.placement ?? "unknown"} · {formatDate(event.createdAt)}</span>
      </div>
      <code>{event.path ?? "/"}</code>
    </div>
  )
}

function LeadRow({ lead }: { lead: InvestorLead }) {
  return (
    <div className="lead-row">
      <div>
        <strong>{lead.name}</strong>
        <span>{lead.email} · {lead.company ?? "No company"} · {formatDate(lead.createdAt)}</span>
      </div>
      <div>
        <b>{labelize(lead.interest)}</b>
        <code>{lead.anonymousId ?? "no-session"}</code>
      </div>
    </div>
  )
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
