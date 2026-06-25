import { EcosystemNav } from "../EcosystemNav"
import { ShieldDashboardClient } from "./ShieldDashboardClient"

export const metadata = {
  title: "Arc Shield — Compliance & Risk Engine",
  description: "Circle-powered address screening and auditable policy decisions for Arc Suite.",
}

export default function ShieldPage() {
  return (
    <main>
      <EcosystemNav current="shield" />
      <ShieldDashboardClient />
    </main>
  )
}
