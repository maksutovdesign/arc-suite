import { getPilotSummary } from "@/lib/backend/service"
import { ProductLandingClient } from "./ProductLandingClient"

export default async function ProductLanding() {
  const initialData = await loadInitialLandingData()
  return <ProductLandingClient {...initialData} />
}

async function loadInitialLandingData() {
  try {
    const pilotSummary = await getPilotSummary()
    return { initialApiStatus: "live" as const, initialPilotSummary: pilotSummary }
  } catch {
    return { initialApiStatus: "fallback" as const, initialPilotSummary: null }
  }
}
