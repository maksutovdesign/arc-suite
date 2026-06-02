import { AGENTS, EVENTS, type Agent, type ReputationEvent, type TrustTier } from "@/data/mock"

type ApiAgent = {
  id: string
  name: string
  address: string
  status: string
  network: string
  balanceUsdc: number
  monthlyBudgetUsdc: number
  monthlySpentUsdc: number
  dailyLimitUsdc: number
  dailySpentUsdc: number
  txCount: number
  tags: string[]
  createdAt: string
  lastActiveAt: string | null
}

type ApiReputation = {
  agentId: string
  agentName: string
  address?: string
  score: number
  scoreChange30d: number
  tier: "Platinum" | "Gold" | "Silver" | "New"
  breakdown: {
    paymentReliability: number
    volumeConsistency: number
    responseTime: number
    disputeHistory: number
    accountAge: number
  }
  updatedAt: string
}

export type ReputationData = {
  agents: Agent[]
  events: ReputationEvent[]
  source: "api" | "mock"
}

const DEFAULT_API_BASE_URL = process.env.NODE_ENV === "production" ? "https://arcsuite-app.vercel.app" : "http://127.0.0.1:3100"
const API_BASE_URL = process.env.ARC_SUITE_API_URL ?? process.env.NEXT_PUBLIC_ARC_SUITE_API_URL ?? DEFAULT_API_BASE_URL
const ARC_API_KEY = process.env.ARC_API_KEY

export async function getReputationData(): Promise<ReputationData> {
  try {
    const agentsResponse = await fetch(`${API_BASE_URL}/api/agents`, { cache: "no-store", headers: arcApiHeaders() })
    if (!agentsResponse.ok) throw new Error("Agents request failed")
    const agentsPayload = (await agentsResponse.json()) as { agents: ApiAgent[] }

    const reputationProfiles = await Promise.all(
      agentsPayload.agents.map(async (agent) => {
        const response = await fetch(`${API_BASE_URL}/api/reputation/${agent.id}`, { cache: "no-store", headers: arcApiHeaders() })
        if (!response.ok) throw new Error("Reputation request failed")
        const payload = (await response.json()) as { reputation: ApiReputation }
        return payload.reputation
      }),
    )
    const eventsResponse = await fetch(`${API_BASE_URL}/api/reputation/events?limit=40`, { cache: "no-store", headers: arcApiHeaders() })
    if (!eventsResponse.ok) throw new Error("Reputation events request failed")
    const eventsPayload = (await eventsResponse.json()) as { events: ReputationEvent[] }

    return {
      agents: agentsPayload.agents.map((agent) => {
        const profile = reputationProfiles.find((item) => item.agentId === agent.id)
        return mapAgent(agent, profile)
      }),
      events: eventsPayload.events,
      source: "api",
    }
  } catch {
    return {
      agents: AGENTS,
      events: EVENTS,
      source: "mock",
    }
  }
}

function arcApiHeaders(): Record<string, string> {
  return ARC_API_KEY ? { "x-arc-api-key": ARC_API_KEY } : {}
}

function mapAgent(agent: ApiAgent, profile?: ApiReputation): Agent {
  const score = profile?.score ?? 0
  const monthlyBudgetUsedPct = agent.monthlyBudgetUsdc > 0 ? agent.monthlySpentUsdc / agent.monthlyBudgetUsdc : 0
  const successRate = clamp(100 - monthlyBudgetUsedPct * 2 - (agent.status === "alert" ? 1.2 : 0), 92, 100)
  const disputeRate = profile ? clamp((1000 - profile.score) / 180, 0, 5) : 0
  const ageDays = Math.max(1, Math.round((Date.now() - new Date(agent.createdAt).getTime()) / 86400000))

  return {
    id: agent.id,
    name: agent.name,
    address: agent.address,
    owner: `0xOwner${agent.id.replace(/\D/g, "") || "0"}`,
    tier: mapTier(profile?.tier),
    score,
    scoreChange: profile?.scoreChange30d ?? 0,
    totalTx: agent.txCount,
    successRate: Math.round(successRate * 10) / 10,
    avgResponseMs: estimateResponseTime(score, agent.status),
    totalVolumeUSDC: Math.round((agent.monthlySpentUsdc * 18 + agent.balanceUsdc) * 100) / 100,
    disputeRate: Math.round(disputeRate * 10) / 10,
    agedays: ageDays,
    tags: agent.tags,
    network: agent.network,
    verified: score >= 700,
    lastActive: agent.lastActiveAt ? formatLastActive(agent.lastActiveAt) : "never",
    scoreBreakdown: {
      paymentHistory: scaleDimension(profile?.breakdown.paymentReliability),
      volumeConsistency: scaleDimension(profile?.breakdown.volumeConsistency),
      responseTime: scaleDimension(profile?.breakdown.responseTime),
      disputeRecord: scaleDimension(profile?.breakdown.disputeHistory),
      accountAge: scaleDimension(profile?.breakdown.accountAge),
    },
  }
}

function mapTier(tier?: ApiReputation["tier"]): TrustTier {
  if (tier === "Platinum") return "platinum"
  if (tier === "Gold") return "gold"
  if (tier === "Silver") return "silver"
  return "new"
}

function scaleDimension(value = 0) {
  return Math.round((value / 100) * 250)
}

function estimateResponseTime(score: number, status: string) {
  const base = Math.max(80, 1200 - score)
  return Math.round(status === "paused" ? base + 220 : base)
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function formatLastActive(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime()
  const minutes = Math.max(0, Math.round(diffMs / 60000))
  if (minutes < 1) return "now"
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.round(minutes / 60)
  if (hours < 48) return `${hours} hour${hours === 1 ? "" : "s"} ago`
  const days = Math.round(hours / 24)
  return `${days} day${days === 1 ? "" : "s"} ago`
}
