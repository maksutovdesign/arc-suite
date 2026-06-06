const DEFAULTS = {
  landing: "https://arcsuite-app.vercel.app",
  treasury: "https://treasury-umber.vercel.app",
  reputation: "https://reputation-five.vercel.app",
  marketplace: "https://marketplace-eosin-eight.vercel.app",
}

const bases = {
  landing: withoutTrailingSlash(process.env.ARC_MONITOR_LANDING_URL ?? process.env.ARC_SMOKE_LANDING_URL ?? DEFAULTS.landing),
  marketplace: withoutTrailingSlash(process.env.ARC_MONITOR_MARKETPLACE_URL ?? process.env.ARC_SMOKE_MARKETPLACE_URL ?? DEFAULTS.marketplace),
  reputation: withoutTrailingSlash(process.env.ARC_MONITOR_REPUTATION_URL ?? process.env.ARC_SMOKE_REPUTATION_URL ?? DEFAULTS.reputation),
  treasury: withoutTrailingSlash(process.env.ARC_MONITOR_TREASURY_URL ?? process.env.ARC_SMOKE_TREASURY_URL ?? DEFAULTS.treasury),
}

const requireSupabase = process.env.ARC_MONITOR_REQUIRE_SUPABASE !== "false"

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
    name: "Treasury page headers",
    run: async () => checkHtmlPage(`${bases.treasury}/`, "Arc Treasury"),
  },
  {
    name: "Reputation page headers",
    run: async () => checkHtmlPage(`${bases.reputation}/`, "Arc Reputation"),
  },
  {
    name: "Marketplace page headers",
    run: async () => checkHtmlPage(`${bases.marketplace}/`, "Arc Marketplace"),
  },
]

const startedAt = Date.now()
const failures = []

for (const check of checks) {
  try {
    const detail = await check.run()
    console.log(`OK ${check.name}${detail ? `: ${detail}` : ""}`)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    failures.push({ name: check.name, message })
    console.error(`FAIL ${check.name}: ${message}`)
  }
}

const durationMs = Date.now() - startedAt
if (failures.length > 0) {
  console.error(JSON.stringify({ durationMs, failures, status: "failed" }))
  process.exit(1)
}

console.log(JSON.stringify({ checks: checks.length, durationMs, status: "ok" }))

async function checkHtmlPage(url, expectedText) {
  const response = await fetchWithRetry(url)
  assertStatus(response, 200)
  assertSecurityHeaders(response)
  assertNoPoweredBy(response)

  const html = await response.text()
  assert(html.includes("<html"), `${url} returns HTML`)
  assert(html.includes(expectedText), `${url} includes ${expectedText}`)
  return "200 headers ok"
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

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
