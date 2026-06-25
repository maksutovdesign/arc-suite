import { SiteHeader } from "../SiteHeader"
import { AnalyticsDashboardClient } from "./AnalyticsDashboardClient"

export const metadata = {
  title: "Analytics — Arc Suite",
}

export default function AnalyticsPage() {
  return (
    <main>
      <SiteHeader idPrefix="analytics-brand" />
      <AnalyticsDashboardClient />
    </main>
  )
}
