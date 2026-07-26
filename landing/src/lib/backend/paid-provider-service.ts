import { createHash, randomUUID, timingSafeEqual } from "crypto"

import { createCircleWalletsAdapter } from "@circle-fin/adapter-circle-wallets"
import { BatchEvmScheme } from "@circle-fin/x402-batching/client"
import type { BatchEvmSigner, HookPaymentRequirements } from "@circle-fin/x402-batching"
import { privateKeyToAccount } from "viem/accounts"

import { insertSupabaseOpsHealthCheck, listSupabaseOpsHealthChecks } from "./supabase"

const PROVIDER_URL = "https://api.aisa.one/apis/v2/coingecko/simple/price?ids=usd-coin&vs_currencies=usd"
const PROVIDER_ORIGIN = "https://api.aisa.one"
const PROVIDER_NAME = "AIsa API"
const PROVIDER_PRODUCT = "CoinGecko Simple Price"
const PROVIDER_NETWORK = "eip155:8453"
const PROVIDER_CHAIN = "Base"
const MONITOR_NAME = "Kestrel Paid Provider Pilot"
const DEFAULT_BATCH_SIZE = 25
const MAX_BATCH_SIZE = 25
const DEFAULT_MAX_UNIT_PRICE_USDC = 0.01
const KESTREL_FEE_BPS = 75
const PROOF_ARTIFACT_COUNT = 6

type PaymentRequired = {
  accepts: HookPaymentRequirements[]
  resource?: {
    description?: string
    mimeType?: string
    url?: string
  }
  x402Version: number
}

type PaymentResponse = {
  network?: string
  payer?: string
  success?: boolean
  transaction?: string
}

export type PaidProviderOperation = {
  authorizationReference: string | null
  completedAt: string
  dataHash: string | null
  durationMs: number
  error: string | null
  fee: {
    bps: number
    kestrelFeeUsdc: number
    status: "accrued" | "settled"
  }
  id: string
  index: number
  network: string
  paymentRequiredHash: string | null
  paymentResponseHash: string | null
  paymentSignatureHash: string | null
  priceUsdc: number
  proofArtifactsPresent: number
  proofCompletenessPct: number
  provider: string
  resource: string
  responseStatus: number | null
  status: "completed" | "failed"
}

export type PaidProviderBatch = {
  batchId: string
  completedAt: string
  durationMs: number
  fee: {
    accruedUsdc: number
    settledUsdc: number
    status: "accrued" | "settled"
  }
  operations: PaidProviderOperation[]
  proofCompletenessPct: number
  providerSpendUsdc: number
  requestedOperations: number
  stored: boolean
  successfulOperations: number
}

export function getPaidProviderConfiguration() {
  const circleWalletsConfigured = Boolean(
    readEnv("CIRCLE_API_KEY")
    && readEnv("CIRCLE_ENTITY_SECRET")
    && readEnv("KESTREL_X402_WALLET_ADDRESS"),
  )
  const privateKeyConfigured = /^0x[a-fA-F0-9]{64}$/.test(readEnv("KESTREL_X402_PRIVATE_KEY") ?? "")
  const executionSecretConfigured = Boolean(batchSecret())
  const explicitlyEnabled = readEnv("KESTREL_X402_EXECUTION_ENABLED") === "true"

  return {
    batchSize: DEFAULT_BATCH_SIZE,
    enabled: explicitlyEnabled && executionSecretConfigured && (circleWalletsConfigured || privateKeyConfigured),
    executionMode: circleWalletsConfigured ? "circle_wallets" : privateKeyConfigured ? "private_key" : "missing",
    feeBps: KESTREL_FEE_BPS,
    maxBatchSize: MAX_BATCH_SIZE,
    maxUnitPriceUsdc: configuredPositiveNumber("KESTREL_X402_MAX_UNIT_PRICE_USDC", DEFAULT_MAX_UNIT_PRICE_USDC),
    missing: [
      ...(!explicitlyEnabled ? ["KESTREL_X402_EXECUTION_ENABLED=true"] : []),
      ...(!executionSecretConfigured ? ["KESTREL_X402_BATCH_SECRET or CRON_SECRET"] : []),
      ...(!circleWalletsConfigured && !privateKeyConfigured
        ? ["Circle Wallets + KESTREL_X402_WALLET_ADDRESS, or KESTREL_X402_PRIVATE_KEY"]
        : []),
    ],
    network: PROVIDER_NETWORK,
    provider: PROVIDER_NAME,
    product: PROVIDER_PRODUCT,
    resource: PROVIDER_URL,
  }
}

export async function inspectPaidProvider() {
  const startedAt = Date.now()
  const response = await fetchProvider()
  const encoded = response.headers.get("payment-required")
  const required = encoded ? decodeHeader<PaymentRequired>(encoded) : null
  const selected = required?.accepts.find((item) =>
    item.network === PROVIDER_NETWORK
    && item.extra?.name === "GatewayWalletBatched"
    && item.extra?.version === "1",
  ) ?? null
  const priceUsdc = selected ? atomicUsdc(selected.amount) : null

  return {
    available: response.status === 402 && Boolean(selected) && priceUsdc !== null,
    batching: Boolean(selected),
    description: required?.resource?.description ?? PROVIDER_PRODUCT,
    inspectedAt: new Date().toISOString(),
    latencyMs: Date.now() - startedAt,
    network: selected?.network ?? PROVIDER_NETWORK,
    paymentRequiredHash: encoded ? digest(encoded) : null,
    priceUsdc,
    provider: PROVIDER_NAME,
    resource: PROVIDER_URL,
    status: response.status,
    x402Version: required?.x402Version ?? null,
  }
}

export function authorizePaidProviderBatch(request: Request) {
  const expected = batchSecret()
  if (!expected) return false
  const provided = request.headers.get("x-kestrel-execution-secret")
    ?? request.headers.get("authorization")?.replace(/^Bearer\s+/i, "")
  if (!provided) return false
  const expectedBytes = Buffer.from(expected)
  const providedBytes = Buffer.from(provided)
  return expectedBytes.length === providedBytes.length && timingSafeEqual(expectedBytes, providedBytes)
}

export async function executePaidProviderBatch(count = DEFAULT_BATCH_SIZE): Promise<PaidProviderBatch> {
  const configuration = getPaidProviderConfiguration()
  if (!configuration.enabled) throw new Error(`Paid provider execution is disabled: ${configuration.missing.join(", ")}`)
  const requestedOperations = Math.max(1, Math.min(Math.floor(count), MAX_BATCH_SIZE))
  const batchId = `provider_batch_${randomUUID()}`
  const startedAt = Date.now()
  const signer = createProviderSigner()
  const operations: PaidProviderOperation[] = []

  for (let index = 0; index < requestedOperations; index += 1) {
    operations.push(await executePaidProviderOperation({ batchId, index: index + 1, signer }))
  }

  const successful = operations.filter((operation) => operation.status === "completed")
  const providerSpendUsdc = round6(successful.reduce((sum, operation) => sum + operation.priceUsdc, 0))
  const accruedUsdc = round6(successful.reduce((sum, operation) => sum + operation.fee.kestrelFeeUsdc, 0))
  const proofCompletenessPct = successful.length
    ? round2(successful.reduce((sum, operation) => sum + operation.proofCompletenessPct, 0) / successful.length)
    : 0
  const completedAt = new Date().toISOString()
  const durationMs = Date.now() - startedAt

  const stored = await insertSupabaseOpsHealthCheck({
    checks: requestedOperations,
    durationMs,
    failureCount: requestedOperations - successful.length,
    metadata: {
      accruedFeeUsdc: accruedUsdc,
      batchId,
      evidenceType: "paid_provider_batch",
      feeStatus: "accrued",
      operations,
      proofCompletenessPct,
      provider: PROVIDER_NAME,
      providerSpendUsdc,
      resource: PROVIDER_URL,
      schemaVersion: 1,
    },
    monitorName: MONITOR_NAME,
    results: operations.map((operation) => ({
      detail: `${operation.proofCompletenessPct}% proof · ${operation.priceUsdc.toFixed(3)} USDC`,
      durationMs: operation.durationMs,
      message: operation.error,
      name: `AIsa paid call ${String(operation.index).padStart(2, "0")}`,
      status: operation.status === "completed" && operation.proofCompletenessPct === 100 ? "ok" : "failed",
    })),
    runId: batchId,
    source: "manual",
    status: successful.length === requestedOperations && proofCompletenessPct === 100 ? "ok" : "failed",
    warningCount: successful.filter((operation) => operation.proofCompletenessPct < 100).length,
  })

  return {
    batchId,
    completedAt,
    durationMs,
    fee: { accruedUsdc, settledUsdc: 0, status: "accrued" },
    operations,
    proofCompletenessPct,
    providerSpendUsdc,
    requestedOperations,
    stored: Boolean(stored),
    successfulOperations: successful.length,
  }
}

export async function getPaidProviderEvidence() {
  const checks = await listSupabaseOpsHealthChecks(100)
  const batches = (checks ?? []).filter((check) =>
    check.monitorName === MONITOR_NAME
    && check.metadata?.evidenceType === "paid_provider_batch",
  )
  const operations = batches.flatMap((batch) =>
    Array.isArray(batch.metadata?.operations)
      ? batch.metadata.operations.filter(isPaidProviderOperation)
      : [],
  )
  const successful = operations.filter((operation) => operation.status === "completed")
  const proofComplete = successful.filter((operation) => operation.proofCompletenessPct === 100)
  const providerSpendUsdc = round6(successful.reduce((sum, operation) => sum + operation.priceUsdc, 0))
  const accruedFeeUsdc = round6(successful.reduce((sum, operation) => sum + operation.fee.kestrelFeeUsdc, 0))
  const settledFeeUsdc = round6(successful
    .filter((operation) => operation.fee.status === "settled")
    .reduce((sum, operation) => sum + operation.fee.kestrelFeeUsdc, 0))

  return {
    batches: batches.length,
    generatedAt: new Date().toISOString(),
    latestBatchId: batches[0]?.runId ?? null,
    metrics: {
      accruedFeeUsdc,
      paidOperations: successful.length,
      proofCompleteOperations: proofComplete.length,
      proofCompletenessPct: successful.length ? round2(proofComplete.length / successful.length * 100) : 0,
      providerSpendUsdc,
      settledFeeUsdc,
    },
    persisted: checks !== null,
  }
}

async function executePaidProviderOperation(input: {
  batchId: string
  index: number
  signer: BatchEvmSigner
}): Promise<PaidProviderOperation> {
  const id = `${input.batchId}_${String(input.index).padStart(2, "0")}`
  const startedAt = Date.now()
  let paymentRequiredHash: string | null = null
  let paymentSignatureHash: string | null = null
  let paymentResponseHash: string | null = null
  let dataHash: string | null = null
  let responseStatus: number | null = null
  let priceUsdc = 0
  let authorizationReference: string | null = null

  try {
    const initial = await fetchProvider()
    responseStatus = initial.status
    if (initial.status !== 402) throw new Error(`Expected HTTP 402, received ${initial.status}`)
    const paymentRequiredHeader = initial.headers.get("payment-required")
    if (!paymentRequiredHeader) throw new Error("PAYMENT-REQUIRED header is missing")
    paymentRequiredHash = digest(paymentRequiredHeader)
    const paymentRequired = decodeHeader<PaymentRequired>(paymentRequiredHeader)
    const requirements = paymentRequired.accepts.find((item) =>
      item.network === PROVIDER_NETWORK
      && item.extra?.name === "GatewayWalletBatched"
      && item.extra?.version === "1",
    )
    if (!requirements) throw new Error("AIsa does not offer Circle Gateway batching on Base")
    priceUsdc = atomicUsdc(requirements.amount)
    const maxUnitPrice = getPaidProviderConfiguration().maxUnitPriceUsdc
    if (priceUsdc > maxUnitPrice) throw new Error(`Provider price ${priceUsdc} exceeds ${maxUnitPrice} USDC policy cap`)

    const scheme = new BatchEvmScheme(input.signer)
    const paymentPayload = await scheme.createPaymentPayload(paymentRequired.x402Version, requirements)
    const paymentSignatureHeader = Buffer.from(JSON.stringify(paymentPayload)).toString("base64")
    paymentSignatureHash = digest(paymentSignatureHeader)
    const paid = await fetchProvider({ "payment-signature": paymentSignatureHeader })
    responseStatus = paid.status
    const body = await paid.text()
    if (!paid.ok) throw new Error(`Paid request failed with HTTP ${paid.status}`)
    dataHash = digest(body)
    const paymentResponseHeader = paid.headers.get("payment-response")
    if (!paymentResponseHeader) throw new Error("PAYMENT-RESPONSE header is missing")
    paymentResponseHash = digest(paymentResponseHeader)
    const paymentResponse = decodeHeader<PaymentResponse>(paymentResponseHeader)
    authorizationReference = paymentResponse.transaction ?? null

    const present = countProofArtifacts({
      dataHash,
      initial402: true,
      paymentRequiredHash,
      paymentResponseHash,
      paymentSignatureHash,
      successfulResponse: paid.ok,
    })
    return {
      authorizationReference,
      completedAt: new Date().toISOString(),
      dataHash,
      durationMs: Date.now() - startedAt,
      error: null,
      fee: {
        bps: KESTREL_FEE_BPS,
        kestrelFeeUsdc: round6(priceUsdc * KESTREL_FEE_BPS / 10_000),
        status: "accrued",
      },
      id,
      index: input.index,
      network: PROVIDER_NETWORK,
      paymentRequiredHash,
      paymentResponseHash,
      paymentSignatureHash,
      priceUsdc,
      proofArtifactsPresent: present,
      proofCompletenessPct: round2(present / PROOF_ARTIFACT_COUNT * 100),
      provider: PROVIDER_NAME,
      resource: PROVIDER_URL,
      responseStatus,
      status: "completed",
    }
  } catch (error) {
    const present = countProofArtifacts({
      dataHash,
      initial402: responseStatus === 402,
      paymentRequiredHash,
      paymentResponseHash,
      paymentSignatureHash,
      successfulResponse: Boolean(responseStatus && responseStatus >= 200 && responseStatus < 300),
    })
    return {
      authorizationReference,
      completedAt: new Date().toISOString(),
      dataHash,
      durationMs: Date.now() - startedAt,
      error: error instanceof Error ? error.message.slice(0, 240) : "Paid provider operation failed",
      fee: {
        bps: KESTREL_FEE_BPS,
        kestrelFeeUsdc: 0,
        status: "accrued",
      },
      id,
      index: input.index,
      network: PROVIDER_NETWORK,
      paymentRequiredHash,
      paymentResponseHash,
      paymentSignatureHash,
      priceUsdc,
      proofArtifactsPresent: present,
      proofCompletenessPct: round2(present / PROOF_ARTIFACT_COUNT * 100),
      provider: PROVIDER_NAME,
      resource: PROVIDER_URL,
      responseStatus,
      status: "failed",
    }
  }
}

function createProviderSigner(): BatchEvmSigner {
  const privateKey = readEnv("KESTREL_X402_PRIVATE_KEY")
  if (privateKey && /^0x[a-fA-F0-9]{64}$/.test(privateKey)) {
    const account = privateKeyToAccount(privateKey as `0x${string}`)
    return {
      address: account.address,
      signTypedData: (params) => account.signTypedData(params),
    }
  }

  const apiKey = readEnv("CIRCLE_API_KEY")
  const entitySecret = readEnv("CIRCLE_ENTITY_SECRET")
  const address = readEnv("KESTREL_X402_WALLET_ADDRESS")
  if (!apiKey || !entitySecret || !address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
    throw new Error("A dedicated x402 signer is not configured")
  }
  const adapter = createCircleWalletsAdapter({ apiKey, entitySecret })
  return {
    address: address as `0x${string}`,
    signTypedData: (params) => adapter.signTypedData(params, {
      address,
      chain: PROVIDER_CHAIN,
    }),
  }
}

function fetchProvider(headers: Record<string, string> = {}) {
  const url = new URL(PROVIDER_URL)
  if (url.origin !== PROVIDER_ORIGIN) throw new Error("Provider URL failed the fixed-origin policy")
  return fetch(url, {
    cache: "no-store",
    headers: { Accept: "application/json", ...headers },
    method: "GET",
    redirect: "error",
    signal: AbortSignal.timeout(15_000),
  })
}

function countProofArtifacts(input: {
  dataHash: string | null
  initial402: boolean
  paymentRequiredHash: string | null
  paymentResponseHash: string | null
  paymentSignatureHash: string | null
  successfulResponse: boolean
}) {
  return [
    input.initial402,
    Boolean(input.paymentRequiredHash),
    Boolean(input.paymentSignatureHash),
    input.successfulResponse,
    Boolean(input.paymentResponseHash),
    Boolean(input.dataHash),
  ].filter(Boolean).length
}

function decodeHeader<T>(value: string): T {
  const decoded = Buffer.from(value, "base64").toString("utf8")
  return JSON.parse(decoded) as T
}

function atomicUsdc(value: string) {
  if (!/^\d+$/.test(value)) throw new Error("Provider returned an invalid USDC amount")
  return Number(BigInt(value)) / 1_000_000
}

function digest(value: string) {
  return `sha256:${createHash("sha256").update(value).digest("hex")}`
}

function batchSecret() {
  return readEnv("KESTREL_X402_BATCH_SECRET") ?? readEnv("CRON_SECRET")
}

function configuredPositiveNumber(name: string, fallback: number) {
  const value = Number(readEnv(name))
  return Number.isFinite(value) && value > 0 ? value : fallback
}

function readEnv(name: string) {
  const value = process.env[name]?.trim()
  return value || null
}

function round6(value: number) {
  return Math.round(value * 1_000_000) / 1_000_000
}

function round2(value: number) {
  return Math.round(value * 100) / 100
}

function isPaidProviderOperation(value: unknown): value is PaidProviderOperation {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false
  const item = value as Partial<PaidProviderOperation>
  return typeof item.id === "string"
    && typeof item.priceUsdc === "number"
    && typeof item.proofCompletenessPct === "number"
    && (item.status === "completed" || item.status === "failed")
    && Boolean(item.fee && typeof item.fee.kestrelFeeUsdc === "number")
}
