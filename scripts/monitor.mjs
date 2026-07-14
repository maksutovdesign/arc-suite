import { appendFile } from "node:fs/promises"

const DEFAULTS = {
  landing: "https://arcsuite-app.vercel.app",
  treasury: "https://treasury-umber.vercel.app",
  reputation: "https://arcsuite-app.vercel.app",
  marketplace: "https://marketplace-eosin-eight.vercel.app",
}

const MONITOR_NAME = "Arc Suite Production Monitor"

const bases = {
  landing: withoutTrailingSlash(process.env.ARC_MONITOR_LANDING_URL ?? process.env.ARC_SMOKE_LANDING_URL ?? DEFAULTS.landing),
  marketplace: withoutTrailingSlash(process.env.ARC_MONITOR_MARKETPLACE_URL ?? process.env.ARC_SMOKE_MARKETPLACE_URL ?? DEFAULTS.marketplace),
  reputation: withoutTrailingSlash(process.env.ARC_MONITOR_REPUTATION_URL ?? process.env.ARC_SMOKE_REPUTATION_URL ?? DEFAULTS.reputation),
  treasury: withoutTrailingSlash(process.env.ARC_MONITOR_TREASURY_URL ?? process.env.ARC_SMOKE_TREASURY_URL ?? DEFAULTS.treasury),
}

const requireSupabase = process.env.ARC_MONITOR_REQUIRE_SUPABASE !== "false"
const latencyWarnMs = numberFromEnv("ARC_MONITOR_LATENCY_WARN_MS", 5_000)
const latencyFailMs = numberFromEnv("ARC_MONITOR_LATENCY_FAIL_MS", 15_000)
const treasuryLatencyWarnMs = numberFromEnv("ARC_MONITOR_TREASURY_LATENCY_WARN_MS", 12_000)
const oracleLatencyWarnMs = numberFromEnv("ARC_MONITOR_ORACLE_LATENCY_WARN_MS", 12_000)
const marketplaceLatencyWarnMs = numberFromEnv("ARC_MONITOR_MARKETPLACE_LATENCY_WARN_MS", 15_000)
const marketplaceLatencyFailMs = numberFromEnv("ARC_MONITOR_MARKETPLACE_LATENCY_FAIL_MS", 45_000)

const checks = [
  {
    name: "landing health",
    run: async () => {
      const response = await fetchWithRetry(`${bases.landing}/api/health`)
      assertStatus(response, 200)
      assertSecurityHeaders(response)
      assertHeaderIncludes(response, "cache-control", "no-store")
      assertNoPoweredBy(response)

      const payload = await response.json()
      assert(payload?.ok === true, "landing health payload ok=true")
      assert(payload?.service === "arc-suite-pilot-api", "landing health service")
      if (requireSupabase) assert(payload?.dataSource === "supabase", "landing health dataSource=supabase")
      return `schema=${payload?.schemaVersion} dataSource=${payload?.dataSource}`
    },
  },
  {
    name: "readiness auth guard",
    run: async () => {
      const response = await fetchWithRetry(`${bases.landing}/api/readiness`)
      assertStatus(response, 401)
      assertSecurityHeaders(response)
      assert(response.headers.has("x-request-id"), "readiness response includes x-request-id")
      return "401 protected"
    },
  },
  {
    name: "oracle risk signal auth guard",
    latencyWarnMs: oracleLatencyWarnMs,
    run: async () => {
      const response = await fetchWithRetry(`${bases.landing}/api/oracle/signals`)
      assertStatus(response, 401)
      assertSecurityHeaders(response)
      assert(response.headers.has("x-request-id"), "oracle signal response includes x-request-id")
      return "401 protected"
    },
  },
  {
    name: "wallet execution readiness auth guard",
    run: async () => {
      const response = await fetchWithRetry(`${bases.landing}/api/wallets/execution-readiness`)
      assertStatus(response, 401)
      assertSecurityHeaders(response)
      assert(response.headers.has("x-request-id"), "wallet readiness response includes x-request-id")
      return "401 protected"
    },
  },
  {
    name: "analytics CORS preflight",
    run: async () => {
      const response = await fetchWithRetry(`${bases.landing}/api/analytics/events`, {
        headers: { Origin: bases.landing },
        method: "OPTIONS",
      })
      assertStatus(response, 204)
      assertHeaderEquals(response, "access-control-allow-origin", bases.landing)
      assertHeaderIncludes(response, "vary", "Origin")
      return "204 CORS ok"
    },
  },
  {
    name: "landing page headers",
    run: async () => checkHtmlPage(`${bases.landing}/`, "Arc Suite"),
  },
  {
    name: "Arc Flow page",
    run: async () => checkHtmlPage(`${bases.landing}/flow`, ["Arc Flow", "Demo workspace"]),
  },
  {
    name: "Agentic Workflow page",
    run: async () => checkHtmlPage(`${bases.landing}/agentic-workflow`, ["Agentic workflow demo", "Signed offer", "Failure-aware job envelope"]),
  },
  {
    name: "Proof page",
    run: async () => checkHtmlPage(`${bases.landing}/proof`, ["Settlement reference", "Artifact failure handling", "policy chain"]),
  },
  {
    name: "Proof archive page",
    run: async () => checkHtmlPage(`${bases.landing}/proofs`, ["Proof archive", "Recent proofs", "receipt"]),
  },
  {
    name: "Arc Provider page",
    run: async () => checkHtmlPage(`${bases.landing}/provider`, ["Provider trust center", "Receipt registry", "Provider keys"]),
  },
  {
    name: "Provider receipts API",
    run: async () => checkJsonApi(`${bases.landing}/api/provider/receipts?limit=3`, (payload) => {
      assert(payload?.ok === true, "provider receipts ok=true")
      assert(Array.isArray(payload?.receipts), "provider receipts array")
      assert(payload.receipts.length > 0, "provider receipts not empty")
      assert(Boolean(payload.receipts[0]?.proofUrl), "provider receipt includes proofUrl")
      return `${payload.receipts.length} receipts`
    }),
  },
  {
    name: "Provider keys API",
    run: async () => checkJsonApi(`${bases.landing}/api/provider/keys`, (payload) => {
      assert(payload?.ok === true, "provider keys ok=true")
      assert(Array.isArray(payload?.keys), "provider keys array")
      assert(payload.keys.length > 0, "provider keys not empty")
      return `${payload.keys.length} keys`
    }),
  },
  {
    name: "Provider fulfillment policy API",
    run: async () => checkJsonApi(`${bases.landing}/api/provider/fulfillment-policy`, (payload) => {
      assert(payload?.ok === true, "provider policy ok=true")
      assert(Array.isArray(payload?.policies), "provider policies array")
      assert(payload.policies.length >= 4, "provider policies include required gates")
      return `${payload.policies.length} policies`
    }),
  },
  {
    name: "Judge mode page",
    run: async () => checkHtmlPage(`${bases.landing}/judge`, ["Judge mode", "Run workflow", "Live demo surface"]),
  },
  {
    name: "Grant review package page",
    run: async () => checkHtmlPage(`${bases.landing}/grant`, ["Grant review package", "Integration status matrix", "Wallet readiness", "Known limits"]),
  },
  {
    name: "Submission page",
    run: async () => checkHtmlPage(`${bases.landing}/submission`, ["Arc Suite submission", "Settlement proof", "Track fit"]),
  },
  {
    name: "Ops Health page",
    run: async () => checkHtmlPage(`${bases.landing}/ops`, ["Ops Health", "MVP control center"]),
  },
  {
    name: "Arc Billing page",
    run: async () => checkHtmlPage(`${bases.landing}/billing`, ["Arc Billing", "Demo workspace"]),
  },
  {
    name: "Arc Escrow page",
    run: async () => checkHtmlPage(`${bases.landing}/escrow`, ["Arc Escrow", "Demo workspace"]),
  },
  {
    name: "Arc Shield page",
    run: async () => checkHtmlPage(`${bases.landing}/shield`, ["Arc Shield", "Demo workspace", "Continuous monitoring", "Risk Watchlist"]),
  },
  {
    name: "Arc Gas page",
    run: async () => checkHtmlPage(`${bases.landing}/gas`, ["Arc Gas", "Demo workspace"]),
  },
  {
    name: "Arc Interop page",
    run: async () => checkHtmlPage(`${bases.landing}/interop`, ["Arc Interop", "Risk Router", "oracleRiskHash", "3034092155422581607"]),
  },
  {
    name: "Arc Wallet OS page",
    run: async () => checkHtmlPage(`${bases.landing}/wallets`, ["Arc Wallet OS", "Demo workspace", "Circle Wallet execution"]),
  },
  {
    name: "Arc Execution Control page",
    run: async () => checkHtmlPage(`${bases.landing}/executions`, ["Execution Control", "Demo workspace"]),
  },
  {
    name: "Arc Radar page",
    run: async () => checkHtmlPage(`${bases.landing}/radar`, ["Arc builder intelligence", "Private payments"]),
  },
  {
    name: "Arc Private page",
    run: async () => checkHtmlPage(`${bases.landing}/private`, ["Private stablecoin payments", "Selective disclosure"]),
  },
  {
    name: "Arc Blueprints page",
    run: async () => checkHtmlPage(`${bases.landing}/blueprints`, ["Builder reference templates", "Six reference flows"]),
  },
  {
    name: "Treasury page headers",
    latencyWarnMs: treasuryLatencyWarnMs,
    run: async () => checkHtmlPage(`${bases.treasury}/`, "Arc Treasury"),
  },
  {
    name: "Reputation page headers",
    run: async () => checkHtmlPage(`${bases.reputation}/`, "Arc Reputation"),
  },
  {
    name: "Marketplace page headers",
    latencyFailMs: marketplaceLatencyFailMs,
    latencyWarnMs: marketplaceLatencyWarnMs,
    run: async () => checkHtmlPage(`${bases.marketplace}/`, "Arc Marketplace"),
  },
]

const startedAt = Date.now()
const failures = []
const warnings = []
const results = []

for (const check of checks) {
  const checkStartedAt = Date.now()
  const checkLatencyFailMs = check.latencyFailMs ?? latencyFailMs
  const checkLatencyWarnMs = check.latencyWarnMs ?? latencyWarnMs
  try {
    const detail = await check.run()
    const durationMs = Date.now() - checkStartedAt
    const result = {
      detail,
      durationMs,
      name: check.name,
      status: "ok",
    }

    if (durationMs > checkLatencyFailMs) {
      throw new Error(`latency budget exceeded: ${durationMs}ms > ${checkLatencyFailMs}ms`)
    }

    if (durationMs > checkLatencyWarnMs) {
      const warning = { durationMs, message: `slow check: ${durationMs}ms > ${checkLatencyWarnMs}ms`, name: check.name }
      warnings.push(warning)
      result.status = "warn"
      result.warning = warning.message
      console.warn(`WARN ${check.name}: ${warning.message}`)
    }

    results.push(result)
    console.log(`OK ${check.name} (${durationMs}ms)${detail ? `: ${detail}` : ""}`)
  } catch (error) {
    const durationMs = Date.now() - checkStartedAt
    const message = error instanceof Error ? error.message : String(error)
    failures.push({ durationMs, name: check.name, message })
    results.push({
      durationMs,
      message,
      name: check.name,
      status: "failed",
    })
    console.error(`FAIL ${check.name} (${durationMs}ms): ${message}`)
  }
}

const durationMs = Date.now() - startedAt
const summary = {
  branch: process.env.GITHUB_REF_NAME ?? null,
  checks: checks.length,
  commitSha: process.env.GITHUB_SHA ?? null,
  durationMs,
  failureCount: failures.length,
  latencyFailMs,
  latencyWarnMs,
  latencyFailOverrides: checks
    .filter((check) => typeof check.latencyFailMs === "number")
    .map((check) => ({ latencyFailMs: check.latencyFailMs, name: check.name })),
  latencyWarnOverrides: checks
    .filter((check) => typeof check.latencyWarnMs === "number")
    .map((check) => ({ latencyWarnMs: check.latencyWarnMs, name: check.name })),
  monitorName: MONITOR_NAME,
  results,
  runId: process.env.GITHUB_RUN_ID ?? null,
  runUrl: getGithubRunUrl(),
  source: process.env.GITHUB_ACTIONS === "true" ? "github_actions" : "local",
  status: failures.length > 0 ? "failed" : warnings.length > 0 ? "warn" : "ok",
  warningCount: warnings.length,
  warnings,
}

await writeGithubSummary(summary)
await persistMonitorSummary(summary)

if (failures.length > 0) {
  console.error(JSON.stringify(summary))
  process.exit(1)
}

console.log(JSON.stringify(summary))

async function checkHtmlPage(url, expectedText) {
  const response = await fetchWithRetry(url)
  assertStatus(response, 200)
  assertSecurityHeaders(response)
  assertNoPoweredBy(response)

  const html = await response.text()
  assert(html.includes("<html"), `${url} returns HTML`)
  for (const text of Array.isArray(expectedText) ? expectedText : [expectedText]) {
    assert(html.includes(text), `${url} includes ${text}`)
  }
  return "200 headers ok"
}

async function checkJsonApi(url, validate) {
  const response = await fetchWithRetry(url)
  assertStatus(response, 200)
  assertSecurityHeaders(response)
  assertNoPoweredBy(response)
  assertHeaderIncludes(response, "cache-control", "no-store")
  const payload = await response.json()
  return validate(payload)
}

async function fetchWithRetry(url, options = {}, attempts = 3) {
  let lastError

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 20_000)

    try {
      const headers = {
        "User-Agent": "arc-suite-monitor/1.0",
        ...(options.headers ?? {}),
      }
      return await fetch(url, {
        ...options,
        cache: "no-store",
        headers,
        signal: controller.signal,
      })
    } catch (error) {
      lastError = error
      if (attempt === attempts) break
      await wait(attempt * 1000)
    } finally {
      clearTimeout(timeout)
    }
  }

  throw lastError
}

function assertSecurityHeaders(response) {
  assertHeaderEquals(response, "x-frame-options", "DENY")
  assertHeaderEquals(response, "x-content-type-options", "nosniff")
  assertHeaderEquals(response, "referrer-policy", "strict-origin-when-cross-origin")
  assertHeaderIncludes(response, "strict-transport-security", "max-age=63072000")
  assertHeaderIncludes(response, "permissions-policy", "camera=()")
}

function assertNoPoweredBy(response) {
  assert(!response.headers.has("x-powered-by"), "x-powered-by header is absent")
}

function assertStatus(response, expectedStatus) {
  assert(response.status === expectedStatus, `expected status ${expectedStatus}, got ${response.status}`)
}

function assertHeaderEquals(response, name, expected) {
  const actual = response.headers.get(name)
  assert(actual === expected, `${name}=${expected}, got ${actual}`)
}

function assertHeaderIncludes(response, name, expectedPart) {
  const actual = response.headers.get(name)
  assert(Boolean(actual?.includes(expectedPart)), `${name} includes ${expectedPart}, got ${actual}`)
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function withoutTrailingSlash(value) {
  return value.replace(/\/$/, "")
}

function numberFromEnv(name, fallback) {
  const value = Number(process.env[name])
  return Number.isFinite(value) && value > 0 ? value : fallback
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function persistMonitorSummary(summary) {
  const apiKey = firstPresent(process.env.ARC_MONITOR_API_KEY, process.env.ARC_API_KEY)
  if (!apiKey) {
    const message = "monitor history not stored: set ARC_MONITOR_API_KEY or ARC_API_KEY."
    if (summary.source === "github_actions") {
      console.warn(`WARN ${message}`)
    } else {
      console.log(`SKIP ${message}`)
    }
    return
  }

  const url = process.env.ARC_MONITOR_INGEST_URL ?? `${bases.landing}/api/ops/health-checks`

  try {
    const response = await fetch(url, {
      body: JSON.stringify(summary),
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "arc-suite-monitor/1.0",
        "x-arc-api-key": apiKey,
      },
      method: "POST",
    })

    if (!response.ok) {
      const text = await response.text().catch(() => "")
      console.warn(`WARN monitor history not stored: ${response.status}${text ? ` ${truncateForLog(text)}` : ""}`)
      return
    }

    const payload = await response.json().catch(() => null)
    console.log(`OK monitor history stored: stored=${Boolean(payload?.stored)}`)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.warn(`WARN monitor history not stored: ${message}`)
  }
}

async function writeGithubSummary(summary) {
  const summaryFile = process.env.GITHUB_STEP_SUMMARY
  if (!summaryFile) return

  try {
    const statusIcon = summary.status === "ok" ? "OK" : "FAIL"
    const rows = summary.results
      .map((result) => {
        const state = result.status === "failed" ? "FAIL" : result.status === "warn" ? "WARN" : "OK"
        const detail = result.message ?? result.warning ?? result.detail ?? ""
        return `| ${state} | ${escapeMarkdown(result.name)} | ${result.durationMs} | ${escapeMarkdown(detail)} |`
      })
      .join("\n")

    const content = [
      `## ${MONITOR_NAME}`,
      "",
      `Status: **${statusIcon}**`,
      "",
      `Duration: **${summary.durationMs}ms**`,
      "",
      `Per-check latency warning budget: **${summary.latencyWarnMs}ms**`,
      "",
      ...formatLatencyWarnOverrides(summary.latencyWarnOverrides),
      `Per-check latency failure budget: **${summary.latencyFailMs}ms**`,
      "",
      ...formatLatencyFailOverrides(summary.latencyFailOverrides),
      "| Status | Check | Duration, ms | Detail |",
      "| --- | --- | ---: | --- |",
      rows,
      "",
    ].join("\n")

    await appendFile(summaryFile, content, "utf8")
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.warn(`WARN GitHub summary unavailable: ${message}`)
  }
}

function formatLatencyWarnOverrides(overrides) {
  if (!Array.isArray(overrides) || overrides.length === 0) return []
  return [
    "Per-check warning overrides:",
    "",
    ...overrides.map((override) => `- ${escapeMarkdown(override.name)}: **${override.latencyWarnMs}ms**`),
    "",
  ]
}

function formatLatencyFailOverrides(overrides) {
  if (!Array.isArray(overrides) || overrides.length === 0) return []
  return [
    "Per-check failure overrides:",
    "",
    ...overrides.map((override) => `- ${escapeMarkdown(override.name)}: **${override.latencyFailMs}ms**`),
    "",
  ]
}

function escapeMarkdown(value) {
  return String(value).replaceAll("|", "\\|").replaceAll("\n", " ")
}

function firstPresent(...values) {
  return values.find((value) => typeof value === "string" && value.trim())?.trim()
}

function getGithubRunUrl() {
  if (!process.env.GITHUB_SERVER_URL || !process.env.GITHUB_REPOSITORY || !process.env.GITHUB_RUN_ID) return null
  return `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`
}

function truncateForLog(value) {
  return String(value).replaceAll("\n", " ").slice(0, 240)
}
