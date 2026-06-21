import Link from "next/link"

import { BrandMark } from "../BrandMark"
import { FlowDashboardClient } from "./FlowDashboardClient"

export const metadata = {
  title: "Arc Flow — Autonomous Payment Orchestration",
  description: "Compliance, policy, Arc settlement and reputation in one auditable workflow.",
}

export default function FlowPage() {
  return (
    <main>
      <nav className="nav">
        <Link className="brand" href="/" aria-label="Arc Suite home">
          <BrandMark idPrefix="flow-brand" />
          <span className="brand-name">Arc Suite</span>
        </Link>
        <div className="nav-cluster">
          <div className="nav-links" aria-label="Flow navigation">
            <Link href="/">Product</Link>
            <Link href="/billing">Billing</Link>
            <Link href="/shield">Shield</Link>
            <a href="https://treasury-umber.vercel.app">Treasury</a>
            <a href="https://reputation-five.vercel.app">Reputation</a>
            <a href="https://marketplace-eosin-eight.vercel.app">Marketplace</a>
            <Link href="/ops">Ops Health</Link>
          </div>
        </div>
      </nav>
      <FlowDashboardClient />
    </main>
  )
}
