import { getServerMoneyExecutionConfiguration } from "./money-execution"
import { getAnalyticsSummary, getPilotSummary } from "./service"
import { getSupabaseRecentAgenticProofs, getSupabaseRecentArcSettlements } from "./supabase"

export async function getGrantEvidence() {
  const [pilot, analytics, proofs, settlements] = await Promise.all([
    getPilotSummary(),
    getAnalyticsSummary(500),
    getSupabaseRecentAgenticProofs(12),
    getSupabaseRecentArcSettlements(12),
  ])
  const confirmedSettlements = settlements.filter((item) => item.status === "confirmed")
  const confirmedVolume = round6(confirmedSettlements.reduce((total, item) => total + item.amountUsdc, 0))
  const measuredMoneyVolume = analytics.money.completedVolumeUsdc
  const totalMeasuredVolume = round6(Math.max(confirmedVolume, measuredMoneyVolume))

  return {
    generatedAt: new Date().toISOString(),
    source: proofs.length || settlements.length || analytics.recent.length ? "live" as const : "demo_fallback" as const,
    metrics: {
      activeAgents: pilot.reputation.agentsScored,
      managedUsdc: pilot.treasury.managedUsdc,
      moneyExecutions: analytics.money.executionsCompleted,
      moneyQuotes: analytics.money.quotes,
      operationVolumeUsdc: totalMeasuredVolume,
      kestrelFeeRevenueUsdc: round6(totalMeasuredVolume * 0.0075 * 0.9),
      executionSuccessRatePct: analytics.money.executionSuccessRatePct,
      confirmedArcSettlements: confirmedSettlements.length,
      indexedProofs: proofs.length,
      marketplaceRequests: pilot.marketplace.requests,
      apiListings: pilot.marketplace.apisListed,
    },
    readiness: {
      appKitBrowser: true,
      appKitServer: getServerMoneyExecutionConfiguration().enabled,
      swapServer: getServerMoneyExecutionConfiguration().swapEnabled,
      policySigned: true,
      compliance: Boolean(process.env.CIRCLE_API_KEY),
      proofArchive: proofs.length > 0,
      arcSettlement: confirmedSettlements.length > 0,
    },
    milestones: [
      {
        id: "app-kit-execution",
        label: "Server App Kit execution + balance state",
        status: getServerMoneyExecutionConfiguration().enabled ? "ready" as const : "configuration" as const,
        evidence: "/money",
      },
      {
        id: "proof-center",
        label: "Unified policy, fee, receipt and settlement proof",
        status: proofs.length > 0 ? "measured" as const : "implemented" as const,
        evidence: "/proof-center",
      },
      {
        id: "pilot-scenarios",
        label: "Three end-to-end pilot scenarios",
        status: "implemented" as const,
        evidence: "/pilots",
      },
      {
        id: "public-evidence",
        label: "Public grant metrics and revenue evidence",
        status: analytics.money.executionsCompleted > 0 ? "measured" as const : "collecting" as const,
        evidence: "/grant-evidence",
      },
    ],
    recentSettlements: settlements.map((item) => ({
      amountUsdc: item.amountUsdc,
      explorerUrl: item.explorerUrl,
      id: item.id,
      status: item.status,
      txHash: item.txHash,
      updatedAt: item.updatedAt,
    })),
    recentProofs: proofs.flatMap((item) => item.job ? [{
      id: item.job.id,
      status: item.job.status,
      txHash: item.job.txHash,
      updatedAt: item.job.updatedAt,
    }] : []),
  }
}

function round6(value: number) {
  return Math.round(value * 1_000_000) / 1_000_000
}
