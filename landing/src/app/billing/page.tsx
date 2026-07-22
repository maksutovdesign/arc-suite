import { EcosystemNav } from "../EcosystemNav"
import { BillingDashboardClient } from "./BillingDashboardClient"

export const metadata = {
  title: "Kestrel Billing — x402 Metering & Subscriptions",
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
