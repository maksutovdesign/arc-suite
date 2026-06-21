import type { ShieldDecision, ShieldReason } from "./schema"

const CIRCLE_SCREENING_URL = "https://api.circle.com/v1/w3s/compliance/screening/addresses"
const PROVIDER_TIMEOUT_MS = 15_000

export const CIRCLE_SCREENING_CHAINS = [
  "ETH",
  "ETH-SEPOLIA",
  "AVAX",
  "AVAX-FUJI",
  "MATIC",
  "MATIC-AMOY",
  "ARB",
  "ARB-SEPOLIA",
  "UNI",
  "UNI-SEPOLIA",
  "OP",
] as const

export type CircleScreeningResponse = {
  result?: string
  id?: string
  address?: string
  chain?: string
  alertId?: string
  decision?: {
    screeningDate?: string
    ruleName?: string
    actions?: string[]
    reasons?: Array<{
      source?: string
      sourceValue?: string
      riskScore?: string
      riskCategories?: string[]
      type?: string
    }>
  }
  [key: string]: unknown
}

export type CircleScreeningResult = {
  response: CircleScreeningResponse
  rawResponse: Record<string, unknown>
}

export class CircleComplianceError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly response: Record<string, unknown>,
  ) {
    super(message)
  }
}

export function getCircleComplianceConfiguration() {
  return {
    configured: Boolean(process.env.CIRCLE_API_KEY),
    endpoint: CIRCLE_SCREENING_URL,
    supportedChains: CIRCLE_SCREENING_CHAINS,
    arcNativeScreening: false,
  }
}

export async function screenCircleAddress(input: {
  address: string
  chain: string
  idempotencyKey: string
}): Promise<CircleScreeningResult> {
  const apiKey = process.env.CIRCLE_API_KEY
  if (!apiKey) {
    throw new CircleComplianceError("CIRCLE_API_KEY is not configured", 503, {
      code: "circle_api_key_missing",
    })
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), PROVIDER_TIMEOUT_MS)

  try {
    const response = await fetch(CIRCLE_SCREENING_URL, {
      body: JSON.stringify(input),
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      method: "POST",
      signal: controller.signal,
    })
    const payload = await response.json().catch(() => ({})) as Record<string, unknown>

    if (!response.ok) {
      const message = readProviderMessage(payload) ?? `Circle Compliance returned HTTP ${response.status}`
      throw new CircleComplianceError(message, response.status, payload)
    }

    return {
      response: unwrapCircleResponse(payload),
      rawResponse: payload,
    }
  } catch (error) {
    if (error instanceof CircleComplianceError) throw error
    const message = error instanceof Error && error.name === "AbortError"
      ? "Circle Compliance request timed out"
      : error instanceof Error ? error.message : "Circle Compliance request failed"
    throw new CircleComplianceError(message, 502, { code: "circle_request_failed" })
  } finally {
    clearTimeout(timeout)
  }
}

export function evaluateShieldPolicy(response: CircleScreeningResponse): {
  actions: string[]
  decision: ShieldDecision
  decisionReason: string
  reasons: ShieldReason[]
  riskCategories: string[]
  riskScore: string
  ruleName: string | null
} {
  const actions = uniqueStrings(response.decision?.actions)
  const reasons = (response.decision?.reasons ?? []).map((reason) => ({
    source: normalizeString(reason.source, "ADDRESS"),
    sourceValue: normalizeString(reason.sourceValue, response.address ?? ""),
    riskScore: normalizeString(reason.riskScore, "UNKNOWN").toUpperCase(),
    riskCategories: uniqueStrings(reason.riskCategories),
    type: normalizeString(reason.type, "UNKNOWN"),
  }))
  const riskCategories = uniqueStrings(reasons.flatMap((reason) => reason.riskCategories))
  const riskScore = highestRiskScore(reasons.map((reason) => reason.riskScore))
  const providerDenied = response.result?.toUpperCase() === "DENIED"
  const providerApproved = response.result?.toUpperCase() === "APPROVED"
  const providerReview = actions.includes("REVIEW")
  const providerBlock = actions.includes("DENY") || actions.includes("FREEZE_WALLET")

  if (providerDenied || providerBlock) {
    return {
      actions,
      decision: "block",
      decisionReason: providerBlock
        ? `Circle recommends ${actions.filter((action) => action === "DENY" || action === "FREEZE_WALLET").join(" and ")}.`
        : "Circle returned a denied screening result.",
      reasons,
      riskCategories,
      riskScore,
      ruleName: response.decision?.ruleName ?? null,
    }
  }

  if (providerReview || riskCategories.length > 0 || ["MEDIUM", "HIGH", "SEVERE", "BLOCKLIST"].includes(riskScore)) {
    return {
      actions,
      decision: "review",
      decisionReason: providerReview
        ? "Circle recommends manual review."
        : "Risk signals were found and require an operator decision.",
      reasons,
      riskCategories,
      riskScore,
      ruleName: response.decision?.ruleName ?? null,
    }
  }

  if (!providerApproved) {
    return {
      actions: actions.length > 0 ? actions : ["REVIEW"],
      decision: "review",
      decisionReason: "Circle response did not include a recognized APPROVED or DENIED result.",
      reasons,
      riskCategories,
      riskScore,
      ruleName: response.decision?.ruleName ?? null,
    }
  }

  return {
    actions,
    decision: "allow",
    decisionReason: "Circle returned no blocking or review recommendation.",
    reasons,
    riskCategories,
    riskScore,
    ruleName: response.decision?.ruleName ?? null,
  }
}

function unwrapCircleResponse(payload: Record<string, unknown>): CircleScreeningResponse {
  const data = payload.data
  if (data && typeof data === "object" && !Array.isArray(data)) {
    return data as CircleScreeningResponse
  }
  return payload as CircleScreeningResponse
}

function highestRiskScore(scores: string[]) {
  const order = ["UNKNOWN", "LOW", "MEDIUM", "HIGH", "SEVERE", "BLOCKLIST"]
  return scores.reduce((highest, score) => {
    const normalized = score.toUpperCase()
    return order.indexOf(normalized) > order.indexOf(highest) ? normalized : highest
  }, "UNKNOWN")
}

function uniqueStrings(values: unknown) {
  if (!Array.isArray(values)) return []
  return [...new Set(values.filter((value): value is string => typeof value === "string" && value.length > 0))]
}

function normalizeString(value: unknown, fallback: string) {
  return typeof value === "string" && value.length > 0 ? value : fallback
}

function readProviderMessage(payload: Record<string, unknown>) {
  if (typeof payload.message === "string") return payload.message
  if (typeof payload.error === "string") return payload.error
  if (payload.error && typeof payload.error === "object" && "message" in payload.error) {
    const message = (payload.error as { message?: unknown }).message
    return typeof message === "string" ? message : null
  }
  return null
}
