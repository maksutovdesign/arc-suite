import {
  demoAgents,
  demoArcAgentModel,
  demoApis,
  demoBillingOverview,
  demoFlowPayload,
  demoSettlementConfig,
  demoShieldPayload,
} from "@/app/demoWorkspace"
import type {
  Agent,
  ApiListing,
  ArcAgentIdentity,
  ArcAgentJob,
  ArcAgentJobArtifact,
  ArcAgentJobValidation,
  BillingUsageEvent,
  FlowRun,
  ShieldScreening,
} from "@/lib/backend/schema"

type DemoApiListing = ApiListing & { providerName: string }

export type SignedOffer = {
  amountUsdc: string
  apiId: string
  expiresAt: string
  offerId: string
  payloadHash: string
  scheme: string
  signature: string
}

export type PaymentAuthorization = {
  budgetLockId: string
  digest: string
  nonce: string
  payer: string
  signature: string
}

export type SignedReceipt = {
  digest: string
  receiptId: string
  settlementId: string
  signature: string
  txHash: string
  verified: boolean
}

export type AgenticWorkflowProof = {
  agent: Agent
  agentIdentity: ArcAgentIdentity
  agentJob: ArcAgentJob
  agentName: string
  agentValidation: ArcAgentJobValidation
  amount: string
  api: ApiListing
  apiName: string
  artifacts: ArcAgentJobArtifact[]
  authorization: PaymentAuthorization
  billingEvent: string
  budget: string
  flowRun: FlowRun
  generatedAt: string
  offer: SignedOffer
  payer: string
  policy: string
  price: string
  proofSource: "demo" | "supabase"
  provider: string
  receipt: SignedReceipt
  recipient: string
  reputation: string
  requestId: string
  screening: string
  screeningRecord: ShieldScreening
  settlementId: string
  stored: boolean
  txHash: string
  usage: BillingUsageEvent
  workflowId: string
}

export type StoredAgenticProof = {
  artifacts: ArcAgentJobArtifact[]
  flowRun: FlowRun
  identity: ArcAgentIdentity | null
  job: ArcAgentJob | null
  validation: ArcAgentJobValidation | null
}

type ProofOptions = {
  apiId?: string | null
  flowRunOverrides?: Partial<FlowRun>
  generatedAt?: string
  jobId?: string
  nonce?: string
  proofSource?: "demo" | "supabase"
  stored?: boolean
  workflowId?: string
}

const baseRun = demoFlowPayload.runs[0]
const baseAgent = demoAgents.find((item) => item.id === baseRun.agentId) ?? demoAgents[0]
const baseUsage = demoBillingOverview.usage.find((item) => item.id === "use_demo_001") ?? demoBillingOverview.usage[0]
const baseScreening = demoShieldPayload.screenings.find((item) => item.id === baseRun.screeningId) ?? demoShieldPayload.screenings[0]
const baseIdentity = demoArcAgentModel.identities[0]
const baseJob = demoArcAgentModel.jobs[0]
const baseValidation = demoArcAgentModel.validations[0]

export function buildAgenticDemoProof(options: ProofOptions = {}): AgenticWorkflowProof {
  const generatedAt = options.generatedAt ?? new Date().toISOString()
  const selectedApi = resolveDemoApi(options.apiId ?? options.flowRunOverrides?.apiId ?? baseRun.apiId)
  const usage = usageForApi(selectedApi, generatedAt)
  const nonce = options.nonce ?? "demo_001"
  const workflowId = options.workflowId ?? baseRun.id
  const jobId = options.jobId ?? baseJob.id
  const settlementId = `set_agentic_${stableDigest(`settlement:${workflowId}:${nonce}`).slice(0, 10)}`
  const requestId = `req_agentic_${stableDigest(`request:${workflowId}:${nonce}`).slice(0, 10)}`

  let flowRun: FlowRun = {
    ...baseRun,
    accessAllowed: true,
    amountUsdc: selectedApi.priceUsdc,
    apiId: selectedApi.id,
    completedAt: generatedAt,
    createdAt: generatedAt,
    currentStep: "reputation",
    errorCode: null,
    errorMessage: null,
    explorerUrl: baseRun.explorerUrl,
    id: workflowId,
    idempotencyKey: workflowId,
    requestId,
    settlementId,
    status: "completed",
    steps: [
      { completedAt: generatedAt, detail: "Circle compliance screening returned allow.", key: "screening", label: "Screening", status: "passed" },
      { completedAt: generatedAt, detail: "Treasury budget and reputation threshold cleared.", key: "access", label: "Access", status: "passed" },
      { completedAt: generatedAt, detail: "Arc Testnet payment receipt was generated.", key: "settlement", label: "Settlement", status: "passed" },
      { completedAt: generatedAt, detail: "Successful payment became a reputation signal.", key: "reputation", label: "Reputation", status: "passed" },
    ],
    txHash: baseRun.txHash,
    updatedAt: generatedAt,
  }
  if (options.flowRunOverrides) {
    flowRun = {
      ...flowRun,
      ...options.flowRunOverrides,
      steps: options.flowRunOverrides.steps ?? flowRun.steps,
    }
  }

  const offer = createSignedOffer(nonce, flowRun, selectedApi, usage)
  const authorization = createPaymentAuthorization(offer, usage)
  const receipt = createSignedReceipt(offer, authorization, generatedAt, flowRun)
  const effectiveSettlementId = flowRun.settlementId ?? settlementId

  const agentJob: ArcAgentJob = {
    ...baseJob,
    completedAt: generatedAt,
    createdAt: generatedAt,
    amountUsdc: flowRun.amountUsdc,
    apiId: selectedApi.id,
    flowRunId: workflowId,
    id: jobId,
    inputHash: `0x${stableDigest(`input:${workflowId}:${offer.offerId}`)}${stableDigest("input")}`,
    metadata: {
      ...baseJob.metadata,
      generatedBy: "arc-suite-agentic-demo",
      pricingUnit: selectedApi.pricingUnit,
      provider: selectedApi.providerName,
      x402OfferId: offer.offerId,
    },
    outputHash: `0x${stableDigest(`output:${receipt.receiptId}:${workflowId}`)}${stableDigest("output")}`,
    policyHash: `0x${stableDigest(`policy:${workflowId}:${baseScreening.id}`)}${stableDigest("policy")}`,
    receiptHash: receipt.digest,
    requestedCapability: capabilityForApi(selectedApi),
    settlementId: effectiveSettlementId,
    status: "validated",
    txHash: flowRun.txHash,
    updatedAt: generatedAt,
  }

  const artifacts: ArcAgentJobArtifact[] = [
    {
      createdAt: generatedAt,
      digest: offer.payloadHash,
      id: `artifact_offer_${stableDigest(offer.offerId).slice(0, 10)}`,
      jobId,
      signature: offer.signature,
      type: "x402_offer",
      uri: `ipfs://arc-suite/${workflowId}/x402-offer.json`,
      workspaceId: baseJob.workspaceId,
    },
    {
      createdAt: generatedAt,
      digest: authorization.digest,
      id: `artifact_auth_${stableDigest(authorization.digest).slice(0, 10)}`,
      jobId,
      signature: authorization.signature,
      type: "payment_authorization",
      uri: `ipfs://arc-suite/${workflowId}/payment-authorization.json`,
      workspaceId: baseJob.workspaceId,
    },
    {
      createdAt: generatedAt,
      digest: receipt.digest,
      id: `artifact_receipt_${stableDigest(receipt.receiptId).slice(0, 10)}`,
      jobId,
      signature: receipt.signature,
      type: "receipt",
      uri: `ipfs://arc-suite/${workflowId}/receipt.json`,
      workspaceId: baseJob.workspaceId,
    },
  ]

  const agentValidation: ArcAgentJobValidation = {
    ...baseValidation,
    createdAt: generatedAt,
    evidenceHash: `0x${stableDigest(`validation:${workflowId}:${receipt.digest}`)}${stableDigest("validation")}`,
    evidenceUri: `ipfs://arc-suite/${workflowId}/validation.json`,
    id: `arc_validation_${stableDigest(`validation:${workflowId}`).slice(0, 10)}`,
    jobId,
    result: "pass",
    score: 98,
    signature: `sig_validator_${stableDigest(`validator:${workflowId}:${receipt.digest}`).slice(0, 24)}`,
  }

  return {
    agent: baseAgent,
    agentIdentity: baseIdentity,
    agentJob,
    agentName: baseAgent.name,
    agentValidation,
    amount: `${flowRun.amountUsdc.toFixed(3)} USDC`,
    api: selectedApi,
    apiName: selectedApi.name,
    artifacts,
    authorization,
    billingEvent: usage.id,
    budget: `${baseAgent.dailySpentUsdc.toFixed(2)} / ${baseAgent.dailyLimitUsdc.toFixed(2)} USDC daily`,
    flowRun,
    generatedAt,
    offer,
    payer: shortAddress(baseAgent.address),
    policy: "ALLOW",
    price: `${selectedApi.priceUsdc.toFixed(3)} USDC / ${selectedApi.pricingUnit}`,
    proofSource: options.proofSource ?? "demo",
    provider: selectedApi.providerName,
    receipt,
    recipient: shortAddress(flowRun.recipientAddress || demoSettlementConfig.defaultRecipient),
    reputation: `${flowRun.reputationScoreBefore} -> ${flowRun.reputationScoreAfter}`,
    requestId: flowRun.requestId ?? requestId,
    screening: baseScreening.providerResult ?? "APPROVED",
    screeningRecord: baseScreening,
    settlementId: effectiveSettlementId,
    stored: options.stored ?? false,
    txHash: flowRun.txHash ?? "",
    usage,
    workflowId,
  }
}

export function buildAgenticProofFromStored(stored: StoredAgenticProof): AgenticWorkflowProof {
  const suffix = stored.flowRun.id.replace(/[^a-z0-9]/gi, "").slice(-12) || "stored"
  const proof = buildAgenticDemoProof({
    apiId: stored.flowRun.apiId,
    generatedAt: stored.flowRun.completedAt ?? stored.flowRun.updatedAt ?? stored.flowRun.createdAt,
    jobId: stored.job?.id,
    flowRunOverrides: stored.flowRun,
    nonce: suffix,
    proofSource: "supabase",
    stored: true,
    workflowId: stored.flowRun.id,
  })
  const agentJob = stored.job ?? proof.agentJob
  const artifacts = stored.artifacts.length > 0 ? stored.artifacts : proof.artifacts
  const agentValidation = stored.validation ?? proof.agentValidation

  return {
    ...proof,
    agentIdentity: stored.identity ?? proof.agentIdentity,
    agentJob,
    agentValidation,
    artifacts,
    flowRun: stored.flowRun,
    generatedAt: stored.flowRun.completedAt ?? stored.flowRun.updatedAt ?? proof.generatedAt,
    amount: `${stored.flowRun.amountUsdc.toFixed(3)} USDC`,
    receipt: {
      ...proof.receipt,
      digest: agentJob.receiptHash ?? proof.receipt.digest,
      settlementId: agentJob.settlementId ?? stored.flowRun.settlementId ?? proof.receipt.settlementId,
      txHash: agentJob.txHash ?? stored.flowRun.txHash ?? proof.receipt.txHash,
      verified: Boolean(agentJob.receiptHash && (agentJob.txHash ?? stored.flowRun.txHash)),
    },
    requestId: stored.flowRun.requestId ?? proof.requestId,
    recipient: shortAddress(stored.flowRun.recipientAddress),
    reputation: `${stored.flowRun.reputationScoreBefore} -> ${stored.flowRun.reputationScoreAfter}`,
    settlementId: agentJob.settlementId ?? stored.flowRun.settlementId ?? proof.settlementId,
    txHash: agentJob.txHash ?? stored.flowRun.txHash ?? proof.txHash,
  }
}

export function shortAddress(value: string | null) {
  if (!value) return "not configured"
  return `${value.slice(0, 6)}...${value.slice(-4)}`
}

export function shortHash(value: string | null) {
  if (!value) return "pending"
  return value.length > 16 ? `${value.slice(0, 8)}...${value.slice(-5)}` : value
}

export function stableDigest(value: string) {
  let hash = 0x811c9dc5
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 0x01000193)
  }
  const first = Math.abs(hash >>> 0).toString(16).padStart(8, "0")
  const second = Math.abs((hash ^ value.length) >>> 0).toString(16).padStart(8, "0")
  return `${first}${second}`
}

function createSignedOffer(nonce: string, flowRun: FlowRun, api: DemoApiListing, usage: BillingUsageEvent): SignedOffer {
  const offerId = `offer_x402_${stableDigest(`offer:${flowRun.id}:${api.id}:${nonce}`).slice(0, 10)}`
  const payload = [
    "x402",
    "exact",
    "ARC-TESTNET",
    api.id,
    baseAgent.id,
    flowRun.amountUsdc.toFixed(6),
    usage.id,
    flowRun.recipientAddress,
    nonce,
  ].join(":")

  return {
    amountUsdc: flowRun.amountUsdc.toFixed(3),
    apiId: api.id,
    expiresAt: "2026-06-30T23:59:59Z",
    offerId,
    payloadHash: `0x${stableDigest(payload)}${stableDigest(offerId)}`,
    scheme: "x402/exact-usdc-arc-testnet",
    signature: `sig_marketplace_${stableDigest(`marketplace:${payload}`).slice(0, 24)}`,
  }
}

function createPaymentAuthorization(offer: SignedOffer, usage: BillingUsageEvent): PaymentAuthorization {
  const nonce = `auth_${stableDigest(`auth:${offer.offerId}:${baseAgent.address}`).slice(0, 12)}`
  const digest = `0x${stableDigest(`${offer.payloadHash}:${baseAgent.address}:${usage.id}:${nonce}`)}${stableDigest(nonce)}`

  return {
    budgetLockId: `lock_${stableDigest(`budget:${offer.offerId}:${usage.id}`).slice(0, 10)}`,
    digest,
    nonce,
    payer: shortAddress(baseAgent.address),
    signature: `sig_agent_${stableDigest(digest).slice(0, 24)}`,
  }
}

function createSignedReceipt(
  offer: SignedOffer,
  authorization: PaymentAuthorization,
  generatedAt: string,
  flowRun: FlowRun,
): SignedReceipt {
  const receiptId = `rcpt_arc_${stableDigest(`receipt:${offer.offerId}:${authorization.digest}:${flowRun.txHash}`).slice(0, 10)}`
  const digest = `0x${stableDigest(`${receiptId}:${flowRun.settlementId}:${flowRun.txHash}:${generatedAt}`)}${stableDigest(receiptId)}`

  return {
    digest,
    receiptId,
    settlementId: flowRun.settlementId ?? "set_demo_001",
    signature: `sig_provider_${stableDigest(digest).slice(0, 24)}`,
    txHash: flowRun.txHash ?? "",
    verified: Boolean(flowRun.txHash && authorization.signature && offer.signature),
  }
}

function resolveDemoApi(apiId: string | null | undefined): DemoApiListing {
  return demoApis.find((item) => item.id === apiId) ?? demoApis.find((item) => item.id === baseRun.apiId) ?? demoApis[0]
}

function usageForApi(api: DemoApiListing, generatedAt: string): BillingUsageEvent {
  const existing = demoBillingOverview.usage.find((item) => item.apiId === api.id)
  if (existing) return existing

  const units = api.pricingUnit === "minute" ? 1 : 12
  const grossAmountUsdc = roundUsdc(units * api.priceUsdc)
  const discountUsdc = roundUsdc(grossAmountUsdc * 0.05)

  return {
    ...baseUsage,
    apiId: api.id,
    createdAt: generatedAt,
    discountUsdc,
    grossAmountUsdc,
    id: `use_agentic_${stableDigest(`usage:${api.id}`).slice(0, 10)}`,
    idempotencyKey: `use-agentic:${api.id}`,
    metadata: {
      ...baseUsage.metadata,
      apiSpecificProof: true,
    },
    netAmountUsdc: roundUsdc(grossAmountUsdc - discountUsdc),
    occurredAt: generatedAt,
    pricingUnit: api.pricingUnit,
    unitPriceUsdc: api.priceUsdc,
    units,
  }
}

function roundUsdc(value: number) {
  return Number(value.toFixed(6))
}

function capabilityForApi(api: DemoApiListing) {
  const capabilities: Record<ApiListing["category"], string> = {
    "AI / LLM": "ai.inference.completion",
    Compute: "compute.gpu.burst",
    "Data feeds": "data.feed.latest",
    Finance: "finance.market_data.latest",
    Oracles: "risk.oracle.screening",
  }
  return capabilities[api.category] ?? "x402.api.request"
}
