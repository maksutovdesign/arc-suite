import { createHash, randomUUID } from "crypto"

import type { OracleRiskSignal, OracleRiskSignalSummary, OracleRiskSignalType } from "./schema"

export const ARC_CHAINLINK_CCIP_ROUTER = "0xdE4E7FED43FAC37EB21aA0643d9852f75332eab8"
export const ARC_CHAINLINK_CHAIN_SELECTOR = "3034092155422581607"

const ORACLE_DOCS = [
  "https://docs.arc.network/arc/tools/oracles",
  "https://docs.chain.link/builders-quick-links",
  "https://docs.chain.link/resources/link-token-contracts#arc-network",
]

export type OracleRiskSignalInput = {
  signalType: OracleRiskSignalType
  subject?: string
  idempotencyKey?: string
  requestId?: string | null
}

export type OracleObservationAdapter = {
  currentObservation: "simulated_observation"
  targetObservation: "live_observation"
  status: "adapter_ready"
  source: string
  feedFreshnessMs: number
  feedFreshnessStatus: "fresh" | "stale"
  deviationBps: number
  deviationStatus: "within_policy" | "outside_policy"
  lastUpdate: string
  nextStep: string
}

export function createOracleRiskSignal(input: OracleRiskSignalInput): Omit<OracleRiskSignal, "workspaceId" | "createdAt"> {
  const observedAt = new Date().toISOString()
  const subject = input.subject?.trim() || defaultSubject(input.signalType)
  const policy = policyForSignal(input.signalType)
  const oracleAdapter = observationAdapterForSignal(input.signalType, observedAt)
  const evidence = {
    chainSelector: ARC_CHAINLINK_CHAIN_SELECTOR,
    ccipRouter: ARC_CHAINLINK_CCIP_ROUTER,
    docs: ORACLE_DOCS,
    network: "arc-testnet",
    oracleAdapter,
    sourceStatus: "simulated_observation",
  }
  const digest = digestFor({
    dataSource: policy.dataSource,
    evidence,
    observedAt,
    signalType: input.signalType,
    subject,
    threshold: policy.threshold,
    value: policy.value,
  })

  return {
    id: `ors_${randomUUID()}`,
    ccipRouter: ARC_CHAINLINK_CCIP_ROUTER,
    chainSelector: ARC_CHAINLINK_CHAIN_SELECTOR,
    dataSource: policy.dataSource,
    digest,
    evidence,
    idempotencyKey: input.idempotencyKey ?? randomUUID(),
    observedAt,
    requestId: input.requestId ?? null,
    result: "pass",
    source: "chainlink_on_arc",
    sourceStatus: "simulated_observation",
    signalType: input.signalType,
    subject,
    threshold: policy.threshold,
    value: policy.value,
  }
}

export const demoOracleRiskSignals: OracleRiskSignal[] = [
  createDemoOracleRiskSignal({
    createdAt: "2026-07-03T09:12:00.000Z",
    id: "ors_demo_ccip_arc_route",
    signalType: "ccip_route",
  }),
  createDemoOracleRiskSignal({
    createdAt: "2026-07-03T09:08:00.000Z",
    id: "ors_demo_por_usdc",
    signalType: "proof_of_reserve",
  }),
  createDemoOracleRiskSignal({
    createdAt: "2026-07-03T09:05:00.000Z",
    id: "ors_demo_market_btc",
    signalType: "market_data",
  }),
]

export function summarizeOracleRiskSignals(signals: OracleRiskSignal[]): OracleRiskSignalSummary {
  return {
    total: signals.length,
    blocked: signals.filter((signal) => signal.result === "block").length,
    lastObservedAt: signals[0]?.observedAt ?? null,
    passed: signals.filter((signal) => signal.result === "pass").length,
    providerErrors: signals.filter((signal) => signal.sourceStatus === "provider_error").length,
    review: signals.filter((signal) => signal.result === "review").length,
  }
}

export function withOracleObservationAdapters(signals: OracleRiskSignal[]): OracleRiskSignal[] {
  return signals.map((signal) => {
    const evidence = signal.evidence ?? {}
    if ("oracleAdapter" in evidence) return signal

    return {
      ...signal,
      evidence: {
        ...evidence,
        oracleAdapter: observationAdapterForSignal(signal.signalType, signal.observedAt),
      },
    }
  })
}

function createDemoOracleRiskSignal(input: {
  createdAt: string
  id: string
  signalType: OracleRiskSignalType
}): OracleRiskSignal {
  const subject = defaultSubject(input.signalType)
  const policy = policyForSignal(input.signalType)
  const oracleAdapter = observationAdapterForSignal(input.signalType, input.createdAt)
  const evidence = {
    chainSelector: ARC_CHAINLINK_CHAIN_SELECTOR,
    ccipRouter: ARC_CHAINLINK_CCIP_ROUTER,
    docs: ORACLE_DOCS,
    network: "arc-testnet",
    oracleAdapter,
    sourceStatus: "simulated_observation",
  }
  return {
    id: input.id,
    ccipRouter: ARC_CHAINLINK_CCIP_ROUTER,
    chainSelector: ARC_CHAINLINK_CHAIN_SELECTOR,
    createdAt: input.createdAt,
    dataSource: policy.dataSource,
    digest: digestFor({ ...policy, evidence, signalType: input.signalType, subject, observedAt: input.createdAt }),
    evidence,
    idempotencyKey: input.id,
    observedAt: input.createdAt,
    requestId: null,
    result: "pass",
    source: "chainlink_on_arc",
    sourceStatus: "simulated_observation",
    signalType: input.signalType,
    subject,
    threshold: policy.threshold,
    value: policy.value,
    workspaceId: "wrk_arc_demo",
  }
}

function defaultSubject(signalType: OracleRiskSignalType) {
  if (signalType === "market_data") return "BTC/USD"
  if (signalType === "proof_of_reserve") return "USDC reserve attestation"
  return "Arc Testnet CCIP route"
}

function policyForSignal(signalType: OracleRiskSignalType) {
  if (signalType === "market_data") {
    return {
      dataSource: "Chainlink Data Feeds / Data Streams",
      threshold: "max_age_ms=1000; max_deviation_bps=50",
      value: "BTC/USD freshness < 1s, deviation within policy",
    }
  }
  if (signalType === "proof_of_reserve") {
    return {
      dataSource: "Chainlink Proof of Reserve",
      threshold: "max_age_minutes=30; reserve_ratio>=1.0",
      value: "reserve freshness within policy",
    }
  }
  return {
    dataSource: "Chainlink CCIP",
    threshold: "router configured; chain selector matches Arc testnet",
    value: "Arc Testnet CCIP route configured",
  }
}

function observationAdapterForSignal(signalType: OracleRiskSignalType, observedAt: string): OracleObservationAdapter {
  if (signalType === "market_data") {
    return {
      currentObservation: "simulated_observation",
      deviationBps: 18,
      deviationStatus: "within_policy",
      feedFreshnessMs: 420,
      feedFreshnessStatus: "fresh",
      lastUpdate: observedAt,
      nextStep: "Swap deterministic BTC/USD observation for Chainlink Data Feeds or Data Streams read.",
      source: "Chainlink Data Feeds / Data Streams",
      status: "adapter_ready",
      targetObservation: "live_observation",
    }
  }

  if (signalType === "proof_of_reserve") {
    return {
      currentObservation: "simulated_observation",
      deviationBps: 3,
      deviationStatus: "within_policy",
      feedFreshnessMs: 10 * 60 * 1000,
      feedFreshnessStatus: "fresh",
      lastUpdate: observedAt,
      nextStep: "Replace reserve ratio fixture with Chainlink Proof of Reserve freshness and collateral read.",
      source: "Chainlink Proof of Reserve",
      status: "adapter_ready",
      targetObservation: "live_observation",
    }
  }

  return {
    currentObservation: "simulated_observation",
    deviationBps: 0,
    deviationStatus: "within_policy",
    feedFreshnessMs: 730,
    feedFreshnessStatus: "fresh",
    lastUpdate: observedAt,
    nextStep: "Connect Chainlink CCIP message status reads for Arc route runs.",
    source: "Chainlink CCIP",
    status: "adapter_ready",
    targetObservation: "live_observation",
  }
}

function digestFor(payload: Record<string, unknown>) {
  return `sha256:${createHash("sha256").update(JSON.stringify(payload)).digest("hex")}`
}
