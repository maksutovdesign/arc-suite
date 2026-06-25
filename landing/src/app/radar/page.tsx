import { EcosystemNav } from "../EcosystemNav"
import { RadarClient } from "./RadarClient"

export const metadata = {
  title: "Arc Radar - Builder Intelligence",
  description: "Ecosystem intelligence map for Arc builders, primitives, traction and opportunity gaps.",
}

export default function RadarPage() {
  return (
    <main>
      <EcosystemNav current="radar" />
      <RadarClient />
    </main>
  )
}
