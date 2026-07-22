import { EcosystemNav } from "../EcosystemNav"
import { FlowDashboardClient } from "./FlowDashboardClient"

export const metadata = {
  title: "Kestrel Flow — Autonomous Payment Orchestration",
  description: "Compliance, policy, Arc settlement and reputation in one auditable workflow.",
}

export default function FlowPage() {
  return (
    <main>
      <EcosystemNav current="flow" />
      <FlowDashboardClient />
    </main>
  )
}
