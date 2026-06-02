import { ReputationEventsTimeline } from "@/components/dashboard/ReputationEventsTimeline"
import { getReputationData } from "@/lib/arc-api"

export const dynamic = "force-dynamic"

export default async function EventsPage() {
  const { events, source } = await getReputationData()

  return <ReputationEventsTimeline events={events} source={source} />
}
