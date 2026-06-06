import { APIS_ALL, type ApiCategory, type ApiListing, type PricingModel } from "@/data/mock"

const DEFAULT_API_BASE_URL = process.env.NODE_ENV === "production" ? "https://arcsuite-app.vercel.app" : "http://127.0.0.1:3100"
const API_BASE_URL = process.env.ARC_SUITE_API_URL ?? process.env.NEXT_PUBLIC_ARC_SUITE_API_URL ?? DEFAULT_API_BASE_URL
const ARC_API_KEY = process.env.ARC_API_KEY

type BackendApiListing = {
  id: string
  providerId: string
  providerName?: string
  name: string
  category: "Finance" | "AI / LLM" | "Data feeds" | "Compute" | "Oracles"
  priceUsdc: number
  pricingUnit: string
  uptimePct: number
  requestCount: number
  minReputationScore: number
}

export type MarketplaceData = {
  apis: ApiListing[]
  source: "api" | "mock"
}

export type AccessDecision = {
  allowed: boolean
  agentId: string
  apiId: string
  reason: string
  requiredScore: number
  score: number
  monthlyBudgetUsedPct: number
  dailyBudgetUsedPct: number
}

export async function runAccessCheck(input: { agentId: string; apiId: string; amountUsdc?: number }, options: { clientBucket?: string | null } = {}) {
  const response = await fetch(`${API_BASE_URL}/api/access/check`, {
    body: JSON.stringify(input),
    headers: arcApiHeaders({
      "Content-Type": "application/json",
      ...(options.clientBucket ? { "x-arc-client-bucket": options.clientBucket } : {}),
    }),
    method: "POST",
  })

  if (!response.ok) {
    const payload = await response.json().catch(() => null) as { error?: string; message?: string } | null
    throw new Error(payload?.message ?? payload?.error ?? `Arc access check failed: ${response.status}`)
  }

  return response.json() as Promise<{ decision: AccessDecision }>
}

export async function getMarketplaceData(): Promise<MarketplaceData> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/apis`, { cache: "no-store", headers: arcApiHeaders() })
    if (!response.ok) throw new Error(`Arc APIs request failed: ${response.status}`)
    const payload = (await response.json()) as { apis: BackendApiListing[] }

    return {
      apis: payload.apis.map(mapApiListing),
      source: "api",
    }
  } catch {
    return {
      apis: APIS_ALL,
      source: "mock",
    }
  }
}

function arcApiHeaders(extra: Record<string, string> = {}) {
  return {
    ...extra,
    ...(ARC_API_KEY ? { "x-arc-api-key": ARC_API_KEY } : {}),
  }
}

function mapApiListing(api: BackendApiListing): ApiListing {
  const seed = APIS_ALL.find((item) => item.id === api.id || item.name === api.name)
  const category = mapCategory(api.category)
  const price = Number(api.priceUsdc)

  return {
    id: api.id,
    name: api.name,
    provider: api.providerName ?? seed?.provider ?? api.providerId,
    providerAddress: seed?.providerAddress ?? `0x${api.providerId.replace(/\W/g, "").slice(0, 4).padEnd(4, "0")}...api`,
    description: seed?.description ?? `${api.name} is an x402 API listed in the Arc Marketplace live catalog.`,
    longDescription: seed?.longDescription ?? `${api.name} is served from the Arc Suite backend catalog with live pricing, uptime, request volume, and reputation requirements. Agents can request API access using their current Treasury budget and Reputation score.`,
    category,
    status: inferStatus(api.uptimePct),
    pricingModel: mapPricingModel(api.pricingUnit),
    price,
    unit: api.pricingUnit,
    endpoint: seed?.endpoint ?? `https://api.arc.market/${api.id}`,
    uptime: Number(api.uptimePct),
    latencyMs: seed?.latencyMs ?? estimateLatency(api.uptimePct, api.requestCount),
    totalRequests: Number(api.requestCount),
    rating: seed?.rating ?? estimateRating(api.uptimePct),
    ratingCount: seed?.ratingCount ?? Math.max(24, Math.round(Number(api.requestCount) / 25000)),
    tags: seed?.tags ?? [category, "x402", "usdc"],
    network: seed?.network ?? "Arc",
    x402: true,
    verified: seed?.verified ?? true,
    createdAt: seed?.createdAt ?? "2026-06-01",
  }
}

function mapCategory(category: BackendApiListing["category"]): ApiCategory {
  if (category === "Finance") return "finance"
  if (category === "AI / LLM") return "ai"
  if (category === "Data feeds") return "data"
  if (category === "Compute") return "compute"
  if (category === "Oracles") return "oracle"
  return "data"
}

function mapPricingModel(unit: string): PricingModel {
  const normalized = unit.toLowerCase()
  if (normalized.includes("token")) return "per_token"
  if (normalized.includes("second")) return "per_second"
  if (normalized.includes("minute")) return "per_second"
  if (normalized.includes("mb") || normalized.includes("byte")) return "per_byte"
  return "per_request"
}

function inferStatus(uptimePct: number): ApiListing["status"] {
  if (uptimePct < 99) return "beta"
  return "live"
}

function estimateLatency(uptimePct: number, requestCount: number) {
  const volumeFactor = requestCount > 5_000_000 ? 48 : requestCount > 2_000_000 ? 85 : 180
  return Math.round(volumeFactor + Math.max(0, 100 - uptimePct) * 80)
}

function estimateRating(uptimePct: number) {
  return Math.round(Math.min(4.9, Math.max(4.1, uptimePct / 20.5)) * 10) / 10
}
