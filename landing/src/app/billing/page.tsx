import { EcosystemNav } from "../EcosystemNav"
import { BillingDashboardClient } from "./BillingDashboardClient"

export const metadata = {
  title: "Arc Billing — x402 Metering & Subscriptions",
  description: "Usage metering, prepaid balances, invoices and batched settlement for x402 APIs.",
}

export default function BillingPage() {
  return (
    <main>
      <EcosystemNav current="billing" />
      <BillingDashboardClient />
    </main>
  )
}
