import { ReputationLeaderboard } from "@/components/dashboard/ReputationLeaderboard"
import { getReputationData } from "@/lib/arc-api"

export const dynamic = "force-dynamic"

export default async function LeaderboardPage() {
  const { agents, events, source } = await getReputationData()

  return <ReputationLeaderboard agents={agents} events={events} source={source} />
}
