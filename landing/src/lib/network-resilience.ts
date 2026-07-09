export type ArcNetworkResilienceState =
  | "nominal"
  | "network_congested"
  | "retry_scheduled"
  | "deferred_settlement"
  | "settlement_recorded"

export const arcNetworkResilience = {
  announcementDate: "2026-07-08",
  statusPageUrl: "https://status.arc.io/",
  sourceUrl: "https://x.com/arc/status/2074547232792293686",
  headline: "Arc Testnet load-aware execution",
  summary:
    "Arc Suite separates policy approval, receipt evidence and settlement recording so temporary Arc Testnet congestion does not corrupt reputation or access decisions.",
  currentState: "nominal" as ArcNetworkResilienceState,
  states: [
    {
      state: "network_congested" as ArcNetworkResilienceState,
      action: "Pause final settlement marking",
      detail: "Policy can pass, but route finalization waits if Arc status or block production is degraded.",
    },
    {
      state: "retry_scheduled" as ArcNetworkResilienceState,
      action: "Retry with idempotency",
      detail: "The same job envelope can be retried without double-counting spend or reputation.",
    },
    {
      state: "deferred_settlement" as ArcNetworkResilienceState,
      action: "Keep proof open",
      detail: "Proof stays reviewable while the transaction is pending, delayed or awaiting explorer visibility.",
    },
    {
      state: "settlement_recorded" as ArcNetworkResilienceState,
      action: "Close the loop",
      detail: "Only recorded transaction evidence can move the job into the completed settlement state.",
    },
  ],
  monitorPolicy: [
    "Classify Arc network degradation separately from application failures.",
    "Do not turn temporary testnet congestion into negative agent reputation.",
    "Keep policy, receipt, validation and settlement evidence as separate proof gates.",
  ],
} as const
