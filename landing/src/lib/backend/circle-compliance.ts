import type { ShieldDecision, ShieldReason } from "./schema"

const CIRCLE_SCREENING_URL = "https://api.circle.com/v1/w3s/compliance/screening/addresses"
const PROVIDER_TIMEOUT_MS = 15_000
const CIRCLE_TEST_SCENARIOS = [
  { suffix: "9999", ruleName: "Circle's Sanctions Blocklist" },
  { suffix: "8888", ruleName: "Frozen User Wallet" },
  { suffix: "7777", ruleName: "Custom Blocklist Rule" },
  { suffix: "8999", ruleName: "Severe Sanctions Risk (Owner)" },
  { suffix: "8899", ruleName: "Severe Terrorist Financing (Owner)" },
  { suffix: "8889", ruleName: "Severe CSAM Risk (Owner)" },
  { suffix: "7779", ruleName: "Severe Illicit Behavior (Owner)" },
  { suffix: "7666", ruleName: "High Illicit Behavior Risk (Owner)" },
  { suffix: "7766", ruleName: "High Gambling Risk (Owner)" },
] as const

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

export function evaluateShieldPolicy(
  response: CircleScreeningResponse,
  context?: { address: string; chain: string },
): {
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
  const missedTestScenario = findMissedTestScenario(response, context)

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

  if (providerApproved && missedTestScenario) {
    return {
      actions: ["REVIEW"],
      decision: "review",
      decisionReason: `Circle approved an official test-risk address without the expected "${missedTestScenario.ruleName}" rule. Verify Compliance Engine account access and testnet rules.`,
      reasons,
      riskCategories,
      riskScore,
      ruleName: null,
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

function findMissedTestScenario(
  response: CircleScreeningResponse,
  context?: { address: string; chain: string },
) {
  if (response.decision?.ruleName || response.decision?.reasons?.length || response.decision?.actions?.length) {
    return null
  }

  const address = (response.address ?? context?.address ?? "").toLowerCase()
  const chain = (response.chain ?? context?.chain ?? "").toUpperCase()
  if (!isTestnetChain(chain)) return null

  return CIRCLE_TEST_SCENARIOS.find((scenario) => address.endsWith(scenario.suffix)) ?? null
}

function isTestnetChain(chain: string) {
  return chain.endsWith("-SEPOLIA") || chain.endsWith("-FUJI") || chain.endsWith("-AMOY") || chain.endsWith("-DEVNET")
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
