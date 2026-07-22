import { EcosystemNav } from "../EcosystemNav"
import { ShieldDashboardClient } from "./ShieldDashboardClient"

export const metadata = {
  title: "Kestrel Shield — Compliance & Risk Engine",
  description: "Circle-powered address screening and auditable policy decisions for Kestrel.",
}

export default function ShieldPage() {
  return (
    <main>
      <EcosystemNav current="shield" />
      <ShieldDashboardClient />
    </main>
  )
}
