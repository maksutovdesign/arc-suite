import { EcosystemNav } from "../EcosystemNav"
import { AgenticWorkflowClient } from "./AgenticWorkflowClient"

export const metadata = {
  title: "Agentic Workflow Demo - Arc Suite",
  description: "One end-to-end autonomous API purchase: policy, x402 receipt, Arc settlement and reputation update.",
}

export default function AgenticWorkflowPage() {
  return (
    <main>
      <EcosystemNav current="flow" />
      <AgenticWorkflowClient />
    </main>
  )
}
