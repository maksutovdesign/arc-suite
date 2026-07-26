import { SiteHeader } from "../SiteHeader"
import { ProofCenterClient } from "./ProofCenterClient"

export const metadata = {
  title: "Proof Center - Kestrel",
  description: "Unified Kestrel proof envelopes for policy, fees, receipts and Arc settlement.",
}

export default function ProofCenterPage() {
  return (
    <main>
      <SiteHeader demoHref="/dashboard" idPrefix="proof-center-brand" variant="console" />
      <ProofCenterClient />
    </main>
  )
}
