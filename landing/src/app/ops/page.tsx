import { SiteHeader } from "../SiteHeader"
import { OpsHealthClient } from "./OpsHealthClient"

export const metadata = {
  title: "Ops Health — Arc Suite",
}

export default function OpsHealthPage() {
  return (
    <main>
      <SiteHeader idPrefix="ops-brand" />
      <OpsHealthClient />
    </main>
  )
}
