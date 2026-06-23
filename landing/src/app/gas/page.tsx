import Link from "next/link"

import { BrandMark } from "../BrandMark"
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
      <nav className="nav">
        <Link className="brand" href="/" aria-label="Arc Suite home">
          <BrandMark idPrefix="gas-brand" />
          <span className="brand-name">Arc Suite</span>
        </Link>
        <div className="nav-cluster">
          <div className="nav-links" aria-label="Gas navigation">
            <Link href="/">Product</Link>
            <Link href="/wallets">Wallet OS</Link>
            <Link href="/executions">Executions</Link>
            <Link href="/escrow">Escrow</Link>
            <Link href="/billing">Billing</Link>
            <Link href="/flow">Flow</Link>
            <Link href="/shield">Shield</Link>
            <Link href="/ops">Ops Health</Link>
          </div>
        </div>
      </nav>
      <GasDashboardClient />
    </main>
  )
}
