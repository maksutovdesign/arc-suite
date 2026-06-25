import { EcosystemNav } from "../EcosystemNav"
import { EscrowDashboardClient } from "./EscrowDashboardClient"

export const metadata = {
  title: "Arc Escrow — Programmable Agent Deals",
  description: "Milestone escrow, release, refund, disputes and Circle contract events for autonomous agents.",
}

export default function EscrowPage() {
  return (
    <main>
      <EcosystemNav current="escrow" />
      <EscrowDashboardClient />
    </main>
  )
}
