import Link from "next/link"

import { BrandMark } from "../BrandMark"
import { BillingDashboardClient } from "./BillingDashboardClient"

export const metadata = {
  title: "Arc Billing — x402 Metering & Subscriptions",
  description: "Usage metering, prepaid balances, invoices and batched settlement for x402 APIs.",
}

export default function BillingPage() {
  return (
    <main>
      <nav className="nav">
        <Link className="brand" href="/" aria-label="Arc Suite home">
          <BrandMark idPrefix="billing-brand" />
          <span className="brand-name">Arc Suite</span>
        </Link>
        <div className="nav-cluster">
          <div className="nav-links" aria-label="Billing navigation">
            <Link href="/">Product</Link>
            <Link href="/escrow">Escrow</Link>
            <Link href="/flow">Flow</Link>
            <Link href="/shield">Shield</Link>
            <a href="https://marketplace-eosin-eight.vercel.app">Marketplace</a>
            <a href="https://treasury-umber.vercel.app">Treasury</a>
            <Link href="/ops">Ops Health</Link>
          </div>
        </div>
      </nav>
      <BillingDashboardClient />
    </main>
  )
}
