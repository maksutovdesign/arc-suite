import { EcosystemNav } from "../EcosystemNav"
import { GasDashboardClient } from "./GasDashboardClient"

export const metadata = {
  title: "Arc Gas — Agent Gas Sponsorship",
  description: "USDC gas controls, per-agent limits, sponsored transactions and Circle-powered reporting.",
}

export default function GasPage() {
  return (
    <main>
      <EcosystemNav current="gas" />
      <GasDashboardClient />
    </main>
  )
}
