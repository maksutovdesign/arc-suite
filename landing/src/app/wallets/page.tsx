import Link from "next/link"

import { BrandMark } from "../BrandMark"
import { WalletDashboardClient } from "./WalletDashboardClient"

export const metadata = {
  title: "Arc Wallet OS — Wallet Lifecycle & Signing Policy",
  description: "Circle wallet custody models, roles, recovery, signing policies and lifecycle operations.",
}

export default function WalletsPage() {
  return (
    <main>
      <nav className="nav">
        <Link className="brand" href="/" aria-label="Arc Suite home">
          <BrandMark idPrefix="wallet-brand" />
          <span className="brand-name">Arc Suite</span>
        </Link>
        <div className="nav-cluster">
          <div className="nav-links" aria-label="Wallet OS navigation">
            <Link href="/">Product</Link>
            <Link href="/gas">Gas</Link>
            <Link href="/escrow">Escrow</Link>
            <Link href="/billing">Billing</Link>
            <Link href="/flow">Flow</Link>
            <Link href="/shield">Shield</Link>
            <Link href="/ops">Ops Health</Link>
          </div>
        </div>
      </nav>
      <WalletDashboardClient />
    </main>
  )
}
