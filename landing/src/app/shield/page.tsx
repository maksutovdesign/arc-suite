import Link from "next/link"

import { BrandMark } from "../BrandMark"
import { ShieldDashboardClient } from "./ShieldDashboardClient"

export const metadata = {
  title: "Arc Shield — Compliance & Risk Engine",
  description: "Circle-powered address screening and auditable policy decisions for Arc Suite.",
}

export default function ShieldPage() {
  return (
    <main>
      <nav className="nav">
        <Link className="brand" href="/" aria-label="Arc Suite home">
          <BrandMark idPrefix="shield-brand" />
          <span className="brand-name">Arc Suite</span>
        </Link>
        <div className="nav-cluster">
          <div className="nav-links" aria-label="Shield navigation">
            <Link href="/">Product</Link>
            <Link href="/escrow">Escrow</Link>
            <Link href="/billing">Billing</Link>
            <Link href="/flow">Flow</Link>
            <a href="https://treasury-umber.vercel.app">Treasury</a>
            <a href="https://reputation-five.vercel.app">Reputation</a>
            <a href="https://marketplace-eosin-eight.vercel.app">Marketplace</a>
            <Link href="/ops">Ops Health</Link>
          </div>
        </div>
      </nav>

      <ShieldDashboardClient />
    </main>
  )
}
