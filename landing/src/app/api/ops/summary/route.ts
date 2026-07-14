import { NextRequest, NextResponse } from "next/server"

import { requireArcApiKey } from "@/lib/backend/auth"
import { getInfraReadiness } from "@/lib/backend/infra-readiness"
import { createRequestId, logOperationalEvent, requestIdHeaders } from "@/lib/backend/observability"
import { getAnalyticsSummary, getOpsHealthHistory, listInvestorLeads } from "@/lib/backend/service"
import { checkSupabaseReadiness, getSupabaseConfigurationStatus, isSupabaseConfigured } from "@/lib/backend/supabase"

type ServiceStatus = "ok" | "warning" | "error"

const PUBLIC_TARGETS = [
  {
    id: "landing",
    label: "Landing",
    url: "https://arcsuite-app.vercel.app/api/health",
  },
  {
    id: "treasury",
    label: "Treasury",
    url: "https://arcsuite-app.vercel.app/",
  },
  {
    id: "reputation",
    label: "Reputation",
    url: "https://arcsuite-app.vercel.app/?product=reputation#system",
  },
  {
    id: "marketplace",
    label: "Marketplace",
    url: "https://arcsuite-app.vercel.app/?product=marketplace#system",
  },
] as const

const GITHUB_WORKFLOWS = [
  {
    id: "production-monitor",
    label: "Production Monitor",
    workflowFile: "production-monitor.yml",
  },
  {
    id: "ci",
    label: "CI",
    workflowFile: "ci.yml",
  },
] as const

export async function GET(request: NextRequest) {
  const requestId = createRequestId(request)
  const unauthorized = await requireArcApiKey(request, ["read"])
  if (unauthorized) return unauthorized

  const generatedAt = new Date().toISOString()
  const [readiness, analytics, leads, opsHistory, apps, workflows, infra] = await Promise.all([
    checkSupabaseReadiness(),
    getAnalyticsSummary(500),
    listInvestorLeads(100),
    getOpsHealthHistory(72),
    Promise.all(PUBLIC_TARGETS.map(checkPublicTarget)),
    Promise.all(GITHUB_WORKFLOWS.map(checkGithubWorkflow)),
    getInfraReadiness(),
  ])
  const sentry = getSentryStatus()
  const slack = getSlackStatus()
  const configuredSupabase = isSupabaseConfigured()
  const appErrors = apps.filter((app) => app.status === "error")
  const workflowErrors = workflows.filter((workflow) => workflow.status === "error")
  const readinessStatus = readiness.ok ? "ok" : configuredSupabase ? "error" : "warning"
  const overallStatus = appErrors.length > 0 || workflowErrors.length > 0 || readinessStatus === "error" ? "error" : "ok"

  if (overallStatus === "error") {
    logOperationalEvent({
      details: {
        appErrors: appErrors.map((app) => app.id),
        workflowErrors: workflowErrors.map((workflow) => workflow.id),
        supabaseOk: readiness.ok,
      },
      event: "ops.summary_unhealthy",
      level: "error",
      requestId,
      route: "/api/ops/summary",
    })
  }

  return NextResponse.json(
    {
      ok: overallStatus !== "error",
      generatedAt,
      requestId,
      status: overallStatus,
      services: {
        apps,
        github: {
          repo: "maksutovdesign/arc-suite",
          url: "",
          workflows,
        },
        monitor: opsHistory,
        sentry,
        slack,
        infra,
        supabase: {
          ...readiness,
          configuration: getSupabaseConfigurationStatus(),
          dataSource: configuredSupabase ? "supabase" : "seed",
          status: readinessStatus,
        },
      },
      signals: {
        analytics: {
          accessChecks: analytics.funnel.accessCheckRuns,
          demoClicks: analytics.funnel.demoClicks,
          lastEventAt: analytics.recent[0]?.createdAt ?? null,
          totalEvents: analytics.totals.reduce((sum, item) => sum + item.count, 0),
        },
        leads: {
          lastLeadAt: leads[0]?.createdAt ?? null,
          latest: leads.slice(0, 5).map((lead) => ({
            company: lead.company,
            createdAt: lead.createdAt,
            email: lead.email,
            interest: lead.interest,
            name: lead.name,
            status: lead.status,
          })),
          totalLoaded: leads.length,
        },
      },
    },
    { headers: requestIdHeaders(requestId), status: overallStatus === "error" ? 503 : 200 },
  )
}

async function checkPublicTarget(target: (typeof PUBLIC_TARGETS)[number]) {
  const startedAt = Date.now()
  const response = await fetchWithTimeout(target.url, 7000)

  if (!response.ok) {
    return {
      ...target,
      checkedAt: new Date().toISOString(),
      detail: response.error ?? `HTTP ${response.status ?? "unknown"}`,
      latencyMs: Date.now() - startedAt,
      status: "error" as ServiceStatus,
      statusCode: response.status ?? null,
    }
  }

  return {
    ...target,
    checkedAt: new Date().toISOString(),
    detail: target.id === "landing" ? "Health endpoint responded" : "Public app responded",
    latencyMs: Date.now() - startedAt,
    status: "ok" as ServiceStatus,
    statusCode: response.status,
  }
}

async function checkGithubWorkflow(workflow: (typeof GITHUB_WORKFLOWS)[number]) {
  const url = `https://api.github.com/repos/maksutovdesign/arc-suite/actions/workflows/${workflow.workflowFile}/runs?branch=main&per_page=1`
  const response = await fetchJsonWithTimeout<{ workflow_runs?: GithubRun[] }>(url, 7000)

  if (!response.ok) {
    return {
      ...workflow,
      conclusion: null,
      detail: response.error ?? `Monitor provider HTTP ${response.status ?? "unknown"}`,
      runUrl: "",
      status: "warning" as ServiceStatus,
      updatedAt: null,
    }
  }

  const run = response.body?.workflow_runs?.[0]
  if (!run) {
    return {
      ...workflow,
      conclusion: null,
      detail: "No recent workflow runs found",
      runUrl: "",
      status: "warning" as ServiceStatus,
      updatedAt: null,
    }
  }

  const completed = run.status === "completed"
  const successful = completed && run.conclusion === "success"
  const failedProductionMonitor = completed && !successful && workflow.id === "production-monitor"
  return {
    ...workflow,
    conclusion: run.conclusion,
    detail: `${run.status}${run.conclusion ? ` / ${run.conclusion}` : ""}`,
    runUrl: run.html_url,
    status: successful ? "ok" as ServiceStatus : failedProductionMonitor ? "error" as ServiceStatus : "warning" as ServiceStatus,
    updatedAt: run.updated_at,
  }
}

function getSentryStatus() {
  const hasDsn = Boolean(process.env.SENTRY_DSN ?? process.env.ARC_SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN)
  const hasClientDsn = Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN)
  const hasSourceMapUpload = Boolean(process.env.SENTRY_AUTH_TOKEN && process.env.SENTRY_ORG && process.env.SENTRY_PROJECT)

  return {
    hasClientDsn,
    hasDsn,
    hasSourceMapUpload,
    org: process.env.SENTRY_ORG ?? "maksutov-design",
    project: process.env.SENTRY_PROJECT ?? "arc-suite",
    projectUrl: "https://sentry.io/organizations/maksutov-design/projects/arc-suite/",
    ruleUrl: "https://sentry.io/organizations/maksutov-design/alerts/rules/arc-suite/",
    status: hasDsn && hasClientDsn ? "ok" as ServiceStatus : "warning" as ServiceStatus,
  }
}

function getSlackStatus() {
  return {
    channel: "#arc-alerts",
    detail: "Sentry alert rule sends production error-level issues where test tag is not set.",
    ruleId: "644605",
    ruleName: "Arc Suite critical production errors to Slack",
    status: "ok" as ServiceStatus,
    url: "https://slack.com/app_redirect?channel=C0B8NQJEE9Z",
  }
}

async function fetchWithTimeout(url: string, timeoutMs: number) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(url, {
      cache: "no-store",
      headers: {
        "User-Agent": "arc-suite-ops-health/1.0",
      },
      signal: controller.signal,
    })
    return { ok: response.ok, status: response.status }
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Fetch failed", ok: false, status: null }
  } finally {
    clearTimeout(timeout)
  }
}

async function fetchJsonWithTimeout<T>(url: string, timeoutMs: number) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(url, {
      cache: "no-store",
      headers: {
        Accept: "application/json",
        "User-Agent": "arc-suite-ops-health/1.0",
      },
      signal: controller.signal,
    })
    const body = response.ok ? await response.json() as T : null
    return { body, ok: response.ok, status: response.status }
  } catch (error) {
    return { body: null, error: error instanceof Error ? error.message : "Fetch failed", ok: false, status: null }
  } finally {
    clearTimeout(timeout)
  }
}

type GithubRun = {
  conclusion: string | null
  html_url: string
  status: string
  updated_at: string
}
