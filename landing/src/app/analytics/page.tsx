import { SiteHeader } from "../SiteHeader"
import { AnalyticsDashboardClient } from "./AnalyticsDashboardClient"

export const metadata = {
  title: "Analytics — Kestrel",
}

export default function AnalyticsPage() {
  return (
    <main>
      <SiteHeader idPrefix="analytics-brand" />
      <AnalyticsDashboardClient />
    </main>
  )
}
