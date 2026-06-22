import Link from "next/link"

import { BrandMark } from "../BrandMark"
import { EscrowDashboardClient } from "./EscrowDashboardClient"

export const metadata = {
  title: "Arc Escrow — Programmable Agent Deals",
  description: "Milestone escrow, release, refund, disputes and Circle contract events for autonomous agents.",
}

export default function EscrowPage() {
  return (
    <main>
      <nav className="nav">
        <Link className="brand" href="/" aria-label="Arc Suite home">
          <BrandMark idPrefix="escrow-brand" />
          <span className="brand-name">Arc Suite</span>
        </Link>
        <div className="nav-cluster">
          <div className="nav-links" aria-label="Escrow navigation">
            <Link href="/">Product</Link>
            <Link href="/billing">Billing</Link>
            <Link href="/flow">Flow</Link>
            <Link href="/shield">Shield</Link>
            <a href="https://marketplace-eosin-eight.vercel.app">Marketplace</a>
            <Link href="/ops">Ops Health</Link>
          </div>
        </div>
      </nav>
      <EscrowDashboardClient />
    </main>
  )
}
