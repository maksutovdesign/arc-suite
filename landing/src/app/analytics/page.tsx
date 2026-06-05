import { BrandMark } from "../BrandMark"
import { AnalyticsDashboardClient } from "./AnalyticsDashboardClient"

export const metadata = {
  title: "Analytics — Arc Suite",
}

export default function AnalyticsPage() {
  return (
    <main>
      <nav className="nav">
        <a className="brand" href="/" aria-label="Arc Suite home">
          <BrandMark idPrefix="analytics-brand" />
          <span className="brand-name">Arc Suite</span>
        </a>
        <div className="nav-cluster">
          <div className="nav-links" aria-label="Analytics navigation">
            <a href="/">Product</a>
            <a href="/investors">Investors</a>
            <a href="https://treasury-umber.vercel.app/demo">Demo</a>
          </div>
        </div>
      </nav>

      <AnalyticsDashboardClient />
    </main>
  )
}
