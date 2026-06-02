const DEFAULT_API_BASE_URL = process.env.NODE_ENV === "production" ? "https://arcsuite-app.vercel.app" : "http://127.0.0.1:3100"
const API_BASE_URL = process.env.ARC_SUITE_API_URL ?? process.env.NEXT_PUBLIC_ARC_SUITE_API_URL ?? DEFAULT_API_BASE_URL

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

export async function runAccessCheck(input: { agentId: string; apiId: string; amountUsdc?: number }) {
  const response = await fetch(`${API_BASE_URL}/api/access/check`, {
    body: JSON.stringify(input),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  })

  if (!response.ok) {
    throw new Error(`Arc access check failed: ${response.status}`)
  }

  return response.json() as Promise<{ decision: AccessDecision }>
}
