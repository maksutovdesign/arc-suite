import { spawn } from "node:child_process"

const port = Number(process.env.ARC_LOCAL_SMOKE_PORT ?? "3210")
const baseUrl = `http://127.0.0.1:${port}`
const nextBin = new URL("../node_modules/next/dist/bin/next", import.meta.url)
const server = spawn(process.execPath, [nextBin.pathname, "start", "landing", "-H", "127.0.0.1", "-p", String(port)], {
  env: { ...process.env, NODE_ENV: "production" },
  stdio: ["ignore", "pipe", "pipe"],
})

let serverOutput = ""
server.stdout.on("data", (chunk) => { serverOutput += chunk.toString() })
server.stderr.on("data", (chunk) => { serverOutput += chunk.toString() })

try {
  await waitForServer()
  await checkHtml("/", ["Kestrel", "Built on Arc"])
  await checkHtml("/proof", ["Settlement proof", "Settlement evidence", "Policy chain"])
  await checkJson("/api/health", 200, (payload) => payload?.ok === true && payload?.service === "kestrel-pilot-api")
  await checkStatus("/api/readiness", 401)
  await checkStatus("/api/webhooks/circle", 401, { method: "POST" })
  await checkStatus("/api/analytics/events", 204, {
    headers: { Origin: "http://localhost:3000" },
    method: "OPTIONS",
  })
  console.log("Local API smoke checks passed (6)")
} finally {
  server.kill("SIGTERM")
  await Promise.race([
    new Promise((resolve) => server.once("exit", resolve)),
    new Promise((resolve) => setTimeout(resolve, 5_000)),
  ])
}

async function waitForServer() {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    if (server.exitCode !== null) throw new Error(`Next.js server exited early:\n${serverOutput}`)
    try {
      const response = await fetch(`${baseUrl}/api/health`)
      if (response.ok) return
    } catch {
      // Server is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 500))
  }
  throw new Error(`Timed out waiting for Next.js server:\n${serverOutput}`)
}

async function checkHtml(path, expectedText) {
  const response = await fetch(`${baseUrl}${path}`)
  if (response.status !== 200) throw new Error(`${path} returned ${response.status}`)
  const html = await response.text()
  for (const text of expectedText) {
    if (!html.includes(text)) throw new Error(`${path} did not include ${text}`)
  }
  assertSecurityHeaders(response, path)
}

async function checkJson(path, expectedStatus, validate) {
  const response = await fetch(`${baseUrl}${path}`)
  if (response.status !== expectedStatus) throw new Error(`${path} returned ${response.status}`)
  const payload = await response.json()
  if (!validate(payload)) throw new Error(`${path} returned an unexpected payload`)
  assertSecurityHeaders(response, path)
}

async function checkStatus(path, expectedStatus, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, options)
  if (response.status !== expectedStatus) throw new Error(`${path} returned ${response.status}, expected ${expectedStatus}`)
  assertSecurityHeaders(response, path)
}

function assertSecurityHeaders(response, path) {
  const csp = response.headers.get("content-security-policy") ?? ""
  if (!csp.includes("frame-ancestors 'none'")) throw new Error(`${path} is missing the CSP frame-ancestors policy`)
  if (response.headers.get("x-content-type-options") !== "nosniff") throw new Error(`${path} is missing nosniff`)
  if (response.headers.has("x-powered-by")) throw new Error(`${path} exposes x-powered-by`)
}
