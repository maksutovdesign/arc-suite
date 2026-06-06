import Link from "next/link"
import { BrandMark } from "../BrandMark"
import { AnalyticsDashboardClient } from "./AnalyticsDashboardClient"

export const metadata = {
  title: "Analytics — Arc Suite",
}

export default function AnalyticsPage() {
  return (
    <main>
      <nav className="nav">
        <Link className="brand" href="/" aria-label="Arc Suite home">
          <BrandMark idPrefix="analytics-brand" />
          <span className="brand-name">Arc Suite</span>
        </Link>
        <div className="nav-cluster">
          <div className="nav-links" aria-label="Analytics navigation">
            <Link href="/">Product</Link>
            <Link href="/investors">Investors</Link>
            <a href="https://treasury-umber.vercel.app/demo">Demo</a>
          </div>
        </div>
      </nav>

      <AnalyticsDashboardClient />
    </main>
  )
}
