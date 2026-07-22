import { EcosystemNav } from "../EcosystemNav"
import { WalletDashboardClient } from "./WalletDashboardClient"

export const metadata = {
  title: "Kestrel Wallets — Wallet Lifecycle & Signing Policy",
  description: "Circle wallet custody models, roles, recovery, signing policies and lifecycle operations.",
}

export default function WalletsPage() {
  return (
    <main>
      <EcosystemNav current="wallets" />
      <WalletDashboardClient />
    </main>
  )
}
