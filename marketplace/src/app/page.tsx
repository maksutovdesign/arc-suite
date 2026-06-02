import { MarketplaceBrowse } from "@/components/browse/MarketplaceBrowse"
import { getMarketplaceData } from "@/lib/arc-api"

export const dynamic = "force-dynamic"

export default async function BrowsePage() {
  const { apis, source } = await getMarketplaceData()

  return <MarketplaceBrowse apis={apis} source={source} />
}
