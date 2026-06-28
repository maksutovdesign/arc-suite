import type { CircleDeveloperControlledWalletsClient, Transaction as CircleTransaction } from "@circle-fin/developer-controlled-wallets"

const ARC_CHAIN_ID = 5042002
const ARC_CHAIN = "Arc_Testnet" as const
const ARC_EXPLORER_BASE_URL = "https://testnet.arcscan.app"
const ARC_USDC_TOKEN_ADDRESS = "0x3600000000000000000000000000000000000000"
const DEFAULT_MAX_SETTLEMENT_USDC = 0.1

export type ArcSettlementConfiguration = {
  configured: boolean
  chain: typeof ARC_CHAIN
  chainId: number
  explorerBaseUrl: string
  sourceWalletId: string | null
  sourceAddress: string | null
  usdcTokenAddress: string
  defaultRecipient: string | null
  allowedRecipients: string[]
  maxAmountUsdc: number
  missing: string[]
}

export type ArcTransferReceipt = {
  txHash: string
  explorerUrl: string
  gasEstimate: Record<string, unknown>
  providerReceipt: Record<string, unknown>
}

export function getArcSettlementConfiguration(): ArcSettlementConfiguration {
  const sourceWalletId = process.env.ARC_SOURCE_WALLET_ID?.trim() || null
  const sourceAddress = normalizeAddress(process.env.ARC_SOURCE_WALLET_ADDRESS)
  const usdcTokenAddress = normalizeAddress(process.env.ARC_USDC_TOKEN_ADDRESS) ?? ARC_USDC_TOKEN_ADDRESS
  const defaultRecipient = normalizeAddress(process.env.ARC_SETTLEMENT_DEFAULT_RECIPIENT)
  const allowedRecipients = Array.from(new Set([
    ...parseAddressList(process.env.ARC_SETTLEMENT_ALLOWED_RECIPIENTS),
    ...(defaultRecipient ? [defaultRecipient] : []),
  ]))
  const missing: string[] = []

  if (!process.env.CIRCLE_API_KEY) missing.push("CIRCLE_API_KEY")
  if (!process.env.CIRCLE_ENTITY_SECRET) missing.push("CIRCLE_ENTITY_SECRET")
  if (!sourceWalletId) missing.push("ARC_SOURCE_WALLET_ID")
  if (!sourceAddress) missing.push("ARC_SOURCE_WALLET_ADDRESS")
  if (allowedRecipients.length === 0) missing.push("ARC_SETTLEMENT_DEFAULT_RECIPIENT or ARC_SETTLEMENT_ALLOWED_RECIPIENTS")

  return {
    configured: missing.length === 0,
    chain: ARC_CHAIN,
    chainId: ARC_CHAIN_ID,
    explorerBaseUrl: ARC_EXPLORER_BASE_URL,
    sourceWalletId,
    sourceAddress,
    usdcTokenAddress,
    defaultRecipient,
    allowedRecipients,
    maxAmountUsdc: parsePositiveNumber(process.env.ARC_MAX_SETTLEMENT_USDC, DEFAULT_MAX_SETTLEMENT_USDC),
    missing,
  }
}

export async function sendArcTestnetUsdc(input: {
  amountUsdc: number
  recipientAddress: string
  providerIdempotencyKey: string
}): Promise<ArcTransferReceipt> {
  const config = getArcSettlementConfiguration()
  if (!config.configured || !config.sourceAddress || !config.sourceWalletId) {
    throw new ArcTransferError("arc_not_configured", `Arc settlement is not configured: ${config.missing.join(", ")}`)
  }

  const recipientAddress = normalizeAddress(input.recipientAddress)
  if (!recipientAddress || !config.allowedRecipients.includes(recipientAddress)) {
    throw new ArcTransferError("recipient_not_allowed", "Recipient is not in the Arc settlement allowlist")
  }
  if (!Number.isFinite(input.amountUsdc) || input.amountUsdc <= 0 || input.amountUsdc > config.maxAmountUsdc) {
    throw new ArcTransferError("amount_out_of_range", `Amount must be greater than 0 and at most ${config.maxAmountUsdc} USDC`)
  }
  if (!isUuid(input.providerIdempotencyKey)) {
    throw new ArcTransferError("invalid_provider_idempotency_key", "Circle idempotency key must be a UUID")
  }

  const client = await createCircleClient()
  let createResponse: Awaited<ReturnType<CircleDeveloperControlledWalletsClient["createTransaction"]>>
  try {
    createResponse = await client.createTransaction({
      amount: [formatUsdcAmount(input.amountUsdc)],
      destinationAddress: recipientAddress,
      fee: {
        type: "level",
        config: {
          feeLevel: "MEDIUM",
        },
      },
      idempotencyKey: input.providerIdempotencyKey,
      refId: `arc-suite:${input.providerIdempotencyKey}`,
      tokenAddress: config.usdcTokenAddress,
      walletId: config.sourceWalletId,
    })
  } catch (error) {
    throw new ArcTransferError(
      "circle_transaction_create_failed",
      "Circle Wallets rejected the Arc transfer request",
      toSafeCircleError(error),
    )
  }
  const circleTransactionId = createResponse.data?.id
  if (!circleTransactionId) {
    throw new ArcTransferError("circle_transaction_missing", "Circle Wallets did not return a transaction id", toJsonRecord(createResponse))
  }

  const transaction = await waitForCircleTransaction(client, circleTransactionId)
  if (!transaction.txHash) throw new ArcTransferError("circle_hash_missing", "Circle transaction completed without a transaction hash", toJsonRecord(transaction))

  return {
    txHash: transaction.txHash,
    explorerUrl: `${ARC_EXPLORER_BASE_URL}/tx/${transaction.txHash}`,
    gasEstimate: toJsonRecord(transaction.estimatedFee ?? {}),
    providerReceipt: toJsonRecord(transaction),
  }
}

export async function resumeArcTestnetUsdc(circleTransactionId: string): Promise<ArcTransferReceipt> {
  const config = getArcSettlementConfiguration()
  if (!config.configured) {
    throw new ArcTransferError("arc_not_configured", `Arc settlement is not configured: ${config.missing.join(", ")}`)
  }
  if (!circleTransactionId.trim()) {
    throw new ArcTransferError("circle_transaction_missing", "Circle transaction id is required for reconciliation")
  }

  const client = await createCircleClient()
  const transaction = await waitForCircleTransaction(client, circleTransactionId)
  if (!transaction.txHash) throw new ArcTransferError("circle_hash_missing", "Circle transaction completed without a transaction hash", toJsonRecord(transaction))

  return {
    txHash: transaction.txHash,
    explorerUrl: `${ARC_EXPLORER_BASE_URL}/tx/${transaction.txHash}`,
    gasEstimate: toJsonRecord(transaction.estimatedFee ?? {}),
    providerReceipt: toJsonRecord(transaction),
  }
}

export class ArcTransferError extends Error {
  code: string
  details: Record<string, unknown>

  constructor(code: string, message: string, details: Record<string, unknown> = {}) {
    super(message)
    this.name = "ArcTransferError"
    this.code = code
    this.details = details
  }
}

function parseAddressList(value: string | undefined) {
  return (value ?? "")
    .split(",")
    .map((address) => normalizeAddress(address))
    .filter((address): address is string => Boolean(address))
}

function normalizeAddress(value: string | undefined | null) {
  const trimmed = value?.trim()
  if (!trimmed || !/^0x[a-fA-F0-9]{40}$/.test(trimmed)) return null
  return trimmed.toLowerCase()
}

function parsePositiveNumber(value: string | undefined, fallback: number) {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

function formatUsdcAmount(amount: number) {
  return amount.toFixed(6).replace(/0+$/, "").replace(/\.$/, "")
}

async function waitForCircleTransaction(
  client: CircleDeveloperControlledWalletsClient,
  transactionId: string,
): Promise<CircleTransaction> {
  const timeoutMs = clamp(
    parsePositiveNumber(process.env.ARC_SETTLEMENT_CONFIRMATION_TIMEOUT_MS, 45_000),
    5_000,
    50_000,
  )
  const pollIntervalMs = clamp(
    parsePositiveNumber(process.env.ARC_SETTLEMENT_POLL_INTERVAL_MS, 2_000),
    500,
    5_000,
  )
  const deadline = Date.now() + timeoutMs
  let latest: CircleTransaction | undefined

  while (Date.now() < deadline) {
    const response = await client.getTransaction({ id: transactionId })
    latest = response.data?.transaction
    if (latest) {
      if ((latest.state === "COMPLETE" || latest.state === "CONFIRMED") && latest.txHash) return latest
      if (["FAILED", "DENIED", "CANCELLED", "STUCK"].includes(latest.state)) {
        throw new ArcTransferError(
          "circle_transaction_failed",
          latest.errorReason ?? `Circle transaction entered ${latest.state}`,
          toJsonRecord(latest),
        )
      }
    }
    await wait(pollIntervalMs)
  }

  throw new ArcTransferError(
    "circle_confirmation_timeout",
    "Circle transaction was submitted but was not confirmed before the request timeout",
    {
      circleTransactionId: transactionId,
      lastState: latest && typeof latest === "object" && "state" in latest ? latest.state : null,
    },
  )
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

async function createCircleClient() {
  const { initiateDeveloperControlledWalletsClient } = await import("@circle-fin/developer-controlled-wallets")
  return initiateDeveloperControlledWalletsClient({
    apiKey: process.env.CIRCLE_API_KEY!,
    entitySecret: process.env.CIRCLE_ENTITY_SECRET!,
  })
}

function toJsonRecord(value: unknown): Record<string, unknown> {
  const normalized = JSON.parse(JSON.stringify(value, (_key, item) => typeof item === "bigint" ? item.toString() : item))
  return normalized && typeof normalized === "object" && !Array.isArray(normalized) ? normalized : { value: normalized }
}

function toSafeCircleError(error: unknown): Record<string, unknown> {
  if (!error || typeof error !== "object") {
    return { message: String(error) }
  }

  const source = error as {
    message?: string
    response?: {
      data?: unknown
      headers?: Record<string, unknown>
      status?: number
      statusText?: string
    }
  }
  const responseData = source.response?.data
  return {
    message: source.message ?? "Circle request failed",
    response: {
      data: sanitizeCirclePayload(responseData),
      requestId: headerValue(source.response?.headers, "x-request-id")
        ?? headerValue(source.response?.headers, "cf-ray")
        ?? headerValue(source.response?.headers, "circle-request-id"),
      status: source.response?.status ?? null,
      statusText: source.response?.statusText ?? null,
    },
  }
}

function sanitizeCirclePayload(value: unknown): unknown {
  if (!value || typeof value !== "object") return value
  const payload = toJsonRecord(value)
  for (const key of ["apiKey", "entitySecret", "secret", "token", "authorization"]) {
    if (key in payload) payload[key] = "[redacted]"
  }
  return payload
}

function headerValue(headers: Record<string, unknown> | undefined, key: string) {
  if (!headers) return null
  const direct = headers[key]
  if (typeof direct === "string") return direct
  const match = Object.entries(headers).find(([header]) => header.toLowerCase() === key.toLowerCase())
  return typeof match?.[1] === "string" ? match[1] : null
}
