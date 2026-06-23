import Link from "next/link"

import { BrandMark } from "../BrandMark"
import { ExecutionDashboardClient } from "./ExecutionDashboardClient"

export const metadata = {
  title: "Arc Executions — Provider Operations",
  description: "Circle execution jobs, retries, reconciliation and signed webhook delivery.",
}

export default function ExecutionsPage() {
  return (
    <main>
      <nav className="nav">
        <Link className="brand" href="/" aria-label="Arc Suite home">
          <BrandMark idPrefix="execution-brand" />
          <span className="brand-name">Arc Suite</span>
        </Link>
        <div className="nav-cluster">
          <div className="nav-links" aria-label="Execution navigation">
            <Link href="/">Product</Link>
            <Link href="/wallets">Wallet OS</Link>
            <Link href="/gas">Gas</Link>
            <Link href="/escrow">Escrow</Link>
            <Link href="/billing">Billing</Link>
            <Link href="/ops">Ops Health</Link>
          </div>
        </div>
      </nav>
      <ExecutionDashboardClient />
    </main>
  )
}
