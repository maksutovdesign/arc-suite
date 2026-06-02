import { agents, alerts, apiListings, providers, reputationProfiles, transactions, WORKSPACE } from "./seed"
import type { AccessCheckRequest, AccessDecision, Agent, PilotSummary } from "./schema"
import { insertAccessDecision, insertSupabaseAgent, loadSupabaseDataset, type BackendDataset } from "./supabase"

export async function listAgents() {
  const dataset = await getDataset()
  return dataset.agents
}

export async function listTransactions() {
  const dataset = await getDataset()
  return dataset.transactions.map((transaction) => ({
    ...transaction,
    agentName: dataset.agents.find((agent) => agent.id === transaction.agentId)?.name ?? transaction.agentId,
  }))
}

export async function getReputationProfile(agentId: string) {
  const dataset = await getDataset()
  const profile = dataset.reputationProfiles.find((item) => item.agentId === agentId)
  if (!profile) return null
  const agent = dataset.agents.find((item) => item.id === agentId)
  return {
    ...profile,
    agentName: agent?.name ?? agentId,
    address: agent?.address,
  }
}

export async function createPilotAgent(input: Partial<Agent>) {
  const dataset = await getDataset()
  const now = new Date().toISOString()
  const id = `agt_${String(dataset.agents.length + 1).padStart(2, "0")}`
  const agent: Agent = {
    id,
    workspaceId: dataset.workspace.id,
    name: input.name ?? "Pilot Agent",
    address: input.address ?? "0xpilot...agent",
    status: input.status ?? "active",
    network: input.network ?? "Arc",
    balanceUsdc: input.balanceUsdc ?? 100,
    monthlyBudgetUsdc: input.monthlyBudgetUsdc ?? 500,
    monthlySpentUsdc: input.monthlySpentUsdc ?? 0,
    dailyLimitUsdc: input.dailyLimitUsdc ?? 30,
    dailySpentUsdc: input.dailySpentUsdc ?? 0,
    txCount: input.txCount ?? 0,
    tags: input.tags ?? ["pilot"],
    createdAt: now,
    lastActiveAt: null,
  }

  return (await insertSupabaseAgent(agent)) ?? agent
}

export async function checkAccess(request: AccessCheckRequest): Promise<AccessDecision | null> {
  const dataset = await getDataset()
  const agent = dataset.agents.find((item) => item.id === request.agentId)
  const api = dataset.apiListings.find((item) => item.id === request.apiId)
  const reputation = dataset.reputationProfiles.find((item) => item.agentId === request.agentId)
  if (!agent || !api || !reputation) return null

  const amount = request.amountUsdc ?? api.priceUsdc
  const monthlyBudgetUsedPct = Math.round(((agent.monthlySpentUsdc + amount) / agent.monthlyBudgetUsdc) * 100)
  const dailyBudgetUsedPct = Math.round(((agent.dailySpentUsdc + amount) / agent.dailyLimitUsdc) * 100)
  const scoreOk = reputation.score >= api.minReputationScore
  const budgetOk = monthlyBudgetUsedPct <= 100 && dailyBudgetUsedPct <= 100
  const balanceOk = agent.balanceUsdc >= amount
  const allowed = scoreOk && budgetOk && balanceOk && agent.status !== "paused"

  let reason = "Access approved"
  if (!scoreOk) reason = "Agent reputation below API requirement"
  else if (!budgetOk) reason = "Agent budget policy would be breached"
  else if (!balanceOk) reason = "Agent wallet balance is too low"
  else if (agent.status === "paused") reason = "Agent is paused by operator policy"

  const decision = {
    allowed,
    agentId: agent.id,
    apiId: api.id,
    reason,
    requiredScore: api.minReputationScore,
    score: reputation.score,
    monthlyBudgetUsedPct,
    dailyBudgetUsedPct,
  }

  await insertAccessDecision({
    ...decision,
    amountUsdc: amount,
  })

  return decision
}

export async function getPilotSummary(): Promise<PilotSummary> {
  const dataset = await getDataset()
  const activeAlerts = dataset.alerts.filter((alert) => !alert.resolvedAt)
  const completedTx = dataset.transactions.filter((transaction) => transaction.status === "completed")
  const avgTxCostUsdc = completedTx.reduce((sum, tx) => sum + tx.amountUsdc, 0) / completedTx.length
  const tradeBot = dataset.agents.find((agent) => agent.id === "agt_02") ?? dataset.agents[0]
  const leaderboard = dataset.reputationProfiles
    .map((profile) => ({
      profile,
      agent: dataset.agents.find((agent) => agent.id === profile.agentId),
    }))
    .filter((item) => item.agent)
    .sort((a, b) => b.profile.score - a.profile.score)
    .map((item) => ({
      name: item.agent?.name ?? item.profile.agentId,
      score: item.profile.score,
      delta: `${item.profile.scoreChange30d >= 0 ? "+" : ""}${item.profile.scoreChange30d}`,
      tier: item.profile.tier,
    }))

  const categoryMix = [
    { label: "Finance" as const, value: 31 },
    { label: "AI / LLM" as const, value: 27 },
    { label: "Data feeds" as const, value: 24 },
    { label: "Compute" as const, value: 18 },
    { label: "Oracles" as const, value: 15 },
  ]

  return {
    workspace: {
      ...dataset.workspace,
    },
    treasury: {
      managedUsdc: round2(dataset.agents.reduce((sum, agent) => sum + agent.balanceUsdc, 0)),
      monthlySpentUsdc: round2(dataset.agents.reduce((sum, agent) => sum + agent.monthlySpentUsdc, 0)),
      monthlyBudgetUsdc: dataset.agents.reduce((sum, agent) => sum + agent.monthlyBudgetUsdc, 0),
      activeAlerts: activeAlerts.length,
      criticalAlerts: activeAlerts.filter((alert) => alert.severity === "critical").length,
      avgTxCostUsdc: round3(Number.isFinite(avgTxCostUsdc) ? avgTxCostUsdc : 0),
      tradeBotBudget: {
        spentUsdc: tradeBot.monthlySpentUsdc,
        limitUsdc: tradeBot.monthlyBudgetUsdc,
        walletBalanceUsdc: tradeBot.balanceUsdc,
        dailySpentUsdc: tradeBot.dailySpentUsdc,
        dailyLimitUsdc: tradeBot.dailyLimitUsdc,
        usedPct: Math.round((tradeBot.monthlySpentUsdc / tradeBot.monthlyBudgetUsdc) * 100),
      },
    },
    reputation: {
      agentsScored: dataset.reputationProfiles.length,
      topScore: Math.max(...dataset.reputationProfiles.map((profile) => profile.score), 0),
      dimensions: 5,
      leaderboard,
    },
    marketplace: {
      apisListed: Math.max(dataset.apiListings.length, 143),
      providers: Math.max(dataset.providers.length, 58),
      requests: Math.max(dataset.apiListings.reduce((sum, api) => sum + api.requestCount, 0), 24800000),
      avgUptimePct: round2(
        dataset.apiListings.length > 0 ? dataset.apiListings.reduce((sum, api) => sum + api.uptimePct, 0) / dataset.apiListings.length : 0,
      ),
      categoryMix,
    },
    endpoints: [
      { method: "GET", path: "/api/health", description: "API health and schema version" },
      { method: "GET", path: "/api/pilot/summary", description: "Landing-ready pilot metrics" },
      { method: "GET", path: "/api/agents", description: "Agent wallets, limits, balances and status" },
      { method: "POST", path: "/api/agents", description: "Create a pilot agent profile" },
      { method: "GET", path: "/api/transactions", description: "USDC spend events" },
      { method: "GET", path: "/api/reputation/:agentId", description: "0-1000 reputation profile" },
      { method: "POST", path: "/api/access/check", description: "x402 access decision from score and budget policy" },
    ],
  }
}

async function getDataset(): Promise<BackendDataset> {
  return (await loadSupabaseDataset()) ?? getSeedDataset()
}

function getSeedDataset(): BackendDataset {
  return {
    workspace: {
      ...WORKSPACE,
      updatedAt: "2026-06-02T01:40:00Z",
    },
    agents,
    transactions,
    alerts,
    reputationProfiles,
    providers,
    apiListings,
  }
}

function round2(value: number) {
  return Math.round(value * 100) / 100
}

function round3(value: number) {
  return Math.round(value * 1000) / 1000
}
