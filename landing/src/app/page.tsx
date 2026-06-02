import { getPilotSummary } from "@/lib/backend/service"
import { ProductLandingClient } from "./ProductLandingClient"

export default async function ProductLanding() {
  try {
    const pilotSummary = await getPilotSummary()
    return <ProductLandingClient initialApiStatus="live" initialPilotSummary={pilotSummary} />
  } catch {
    return <ProductLandingClient initialApiStatus="fallback" initialPilotSummary={null} />
  }
}
