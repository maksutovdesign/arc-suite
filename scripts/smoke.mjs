const DEFAULTS = {
  landing: "https://arcsuite-app.vercel.app",
  treasury: "https://treasury-umber.vercel.app",
  reputation: "https://reputation-five.vercel.app",
  marketplace: "https://marketplace-eosin-eight.vercel.app",
}

const landingBase = withoutTrailingSlash(process.env.ARC_SMOKE_LANDING_URL ?? process.env.ARC_SMOKE_BASE_URL ?? DEFAULTS.landing)
const targets = [
  {
    kind: "json",
    name: "landing health",
    url: `${landingBase}/api/health`,
    validate: (payload) => payload?.ok === true && payload?.service === "arc-suite-pilot-api",
  },
  {
    kind: "html",
    name: "Treasury app",
    url: process.env.ARC_SMOKE_TREASURY_URL ?? DEFAULTS.treasury,
  },
  {
    kind: "html",
    name: "Reputation app",
    url: process.env.ARC_SMOKE_REPUTATION_URL ?? DEFAULTS.reputation,
  },
  {
    kind: "html",
    name: "Marketplace app",
    url: process.env.ARC_SMOKE_MARKETPLACE_URL ?? DEFAULTS.marketplace,
  },
]

for (const target of targets) {
  await checkTarget(target)
}

console.log(`Smoke checks passed (${targets.length})`)

async function checkTarget(target) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 15_000)

  try {
    const response = await fetch(target.url, {
      cache: "no-store",
      headers: { "User-Agent": "arc-suite-smoke/1.0" },
      signal: controller.signal,
    })

    if (!response.ok) {
      throw new Error(`${target.name} returned ${response.status}`)
    }

    if (target.kind === "json") {
      const payload = await response.json()
      if (!target.validate(payload)) {
        throw new Error(`${target.name} returned an unexpected payload`)
      }
      console.log(`OK ${target.name}: ${payload.schemaVersion ?? "ready"}`)
      return
    }

    const html = await response.text()
    if (!html.includes("<html")) {
      throw new Error(`${target.name} did not return an HTML page`)
    }
    console.log(`OK ${target.name}`)
  } finally {
    clearTimeout(timeout)
  }
}

function withoutTrailingSlash(value) {
  return value.replace(/\/$/, "")
}
