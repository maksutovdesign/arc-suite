import { SiteHeader } from "../SiteHeader"
import { ExecutionDashboardClient } from "./ExecutionDashboardClient"

export const metadata = {
  title: "Arc Executions — Provider Operations",
  description: "Circle execution jobs, retries, reconciliation and signed webhook delivery.",
}

export default function ExecutionsPage() {
  return (
    <main>
      <SiteHeader ariaLabel="Execution navigation" idPrefix="execution-brand" showDemo={false} variant="console" />
      <ExecutionDashboardClient />
    </main>
  )
}
