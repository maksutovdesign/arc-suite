import type { Metadata } from "next"
import { Bot } from "lucide-react"
import { PageHeader } from "@/components/dashboard/PageHeader"
import { AgentsGrid } from "@/components/agents/AgentsGrid"
import { getTreasuryDashboardData } from "@/lib/arc-api"

export const metadata: Metadata = { title: "Agents — Arc Treasury" }
export const dynamic = "force-dynamic"

export default async function AgentsPage() {
  const { agents, source } = await getTreasuryDashboardData()

  return (
    <div className="flex flex-col min-h-full">
      <PageHeader
        glow
        icon={Bot}
        title="Agents"
        subtitle={source === "api" ? "Live pilot API" : "Mock fallback"}
      />
      <AgentsGrid agents={agents} />
    </div>
  )
}
