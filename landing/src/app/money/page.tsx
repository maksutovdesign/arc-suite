import { EcosystemNav } from "../EcosystemNav"
import { MoneyMovementClient } from "./MoneyMovementClient"

export const metadata = {
  title: "Money Movement — Kestrel",
  description: "Execute, price and prove multichain USDC movement with Circle App Kit. Built on Arc.",
}

export default function MoneyMovementPage() {
  return (
    <main>
      <EcosystemNav current="money" />
      <MoneyMovementClient />
    </main>
  )
}
