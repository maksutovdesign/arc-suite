import { ReputationAgentsGrid } from "@/components/dashboard/ReputationAgentsGrid"
import { getReputationData } from "@/lib/arc-api"

export const dynamic = "force-dynamic"

export default async function AgentsPage() {
  const { agents, source } = await getReputationData()

  return <ReputationAgentsGrid agents={agents} source={source} />
}
