import { createHmac, timingSafeEqual } from "crypto"
import { AppKit } from "@circle-fin/app-kit"
import { createCircleWalletsAdapter } from "@circle-fin/adapter-circle-wallets"
import { createViemAdapterFromPrivateKey } from "@circle-fin/adapter-viem-v2"

import type { MoneyAuthorization, MoneyChain, MoneyOperation } from "./money-policy"

export type MoneyPolicyProof = {
  decision: string
  reason: string
  riskScore: string
  riskCategories: string[]
  ruleName: string | null
  provider: string
  screeningChain: string
  screeningBasis: string
}

export type MoneyExecutionGrant = {
  authorization: MoneyAuthorization
  expiresAt: string
  policy: MoneyPolicyProof
  traceId: string
}

export type MoneyFeeBreakdown = {
  amountUsdc: number
  arcShareUsdc: number
  cctpFeeUsdc: number | null
  destinationAmountUsdc: number
  forwardingFeeUsdc: number
  gasEstimateUsdc: number
  gatewayFeeUsdc: number
  kestrelRevenueUsdc: number
  providerFeeUsdc: number
  sourceDebitUsdc: number
  totalFeeUsdc: number
}

const kit = new AppKit({ disableErrorReporting: true })
const FEE_BPS = 75
const GATEWAY_FEE_RATE = 0.00005
const SWAP_PROVIDER_FEE_RATE = 0.0002

export function getServerMoneyExecutionConfiguration() {
  const privateKey = readEnv("KESTREL_APP_KIT_PRIVATE_KEY")
  const circleWallets = Boolean(
    readEnv("CIRCLE_API_KEY")
    && readEnv("CIRCLE_ENTITY_SECRET")
    && readEnv("ARC_SOURCE_WALLET_ADDRESS"),
  )
  const kitKey = readEnv("ARC_APP_KIT_KEY") ?? readEnv("KIT_KEY")
  const signingSecret = executionSigningSecret()
  const signerConfigured = Boolean(privateKey) || circleWallets
  return {
    adapter: circleWallets ? "circle_wallets" as const : privateKey ? "private_key" as const : "missing" as const,
    enabled: Boolean(signerConfigured && signingSecret),
    swapEnabled: Boolean(signerConfigured && signingSecret && kitKey),
    missing: [
      ...(!signerConfigured ? ["Circle Wallets credentials or KESTREL_APP_KIT_PRIVATE_KEY"] : []),
      ...(!signingSecret ? ["KESTREL_EXECUTION_SIGNING_SECRET"] : []),
    ],
    swapMissing: !kitKey ? ["ARC_APP_KIT_KEY"] : [],
  }
}

export function createMoneyFeeBreakdown(input: {
  amount: string
  destinationChain: MoneyChain
  operation: MoneyOperation
  sourceChain: MoneyChain
}): MoneyFeeBreakdown {
  const amount = round6(Number(input.amount))
  const customFee = round6(amount * FEE_BPS / 10_000)
  const arcShare = round6(customFee * 0.1)
  const kestrelRevenue = round6(customFee - arcShare)
  const crossChain = input.sourceChain !== input.destinationChain
  const gatewayFee = input.operation === "spend" && crossChain ? round6(amount * GATEWAY_FEE_RATE) : 0
  const providerFee = input.operation === "swap" ? round6(Math.max(0, amount - customFee) * SWAP_PROVIDER_FEE_RATE) : 0
  const forwardingFee = input.operation === "spend" ? configuredNumber("KESTREL_FORWARDING_FEE_USDC", 0.2) : 0
  const gasEstimate = configuredNumber("KESTREL_APP_KIT_GAS_ESTIMATE_USDC", 0.03)
  const cctpFee = input.operation === "bridge" && crossChain ? null : 0

  const destinationAmount = input.operation === "spend"
    ? Math.max(0, amount - customFee - forwardingFee)
    : input.operation === "swap"
      ? Math.max(0, amount - customFee - providerFee)
      : amount
  const sourceDebit = input.operation === "bridge"
    ? amount + customFee + gasEstimate
    : input.operation === "send"
      ? amount + gasEstimate
      : amount + gatewayFee + gasEstimate
  const totalFee = customFee + gatewayFee + providerFee + forwardingFee + gasEstimate

  return {
    amountUsdc: amount,
    arcShareUsdc: arcShare,
    cctpFeeUsdc: cctpFee,
    destinationAmountUsdc: round6(destinationAmount),
    forwardingFeeUsdc: round6(forwardingFee),
    gasEstimateUsdc: round6(gasEstimate),
    gatewayFeeUsdc: round6(gatewayFee),
    kestrelRevenueUsdc: kestrelRevenue,
    providerFeeUsdc: round6(providerFee),
    sourceDebitUsdc: round6(sourceDebit),
    totalFeeUsdc: round6(totalFee),
  }
}

export function signMoneyExecutionGrant(grant: MoneyExecutionGrant) {
  const secret = executionSigningSecret()
  if (!secret) return null
  const payload = Buffer.from(JSON.stringify(grant)).toString("base64url")
  const signature = createHmac("sha256", secret).update(payload).digest("base64url")
  return `${payload}.${signature}`
}

export function verifyMoneyExecutionGrant(value: unknown): MoneyExecutionGrant | null {
  const secret = executionSigningSecret()
  if (!secret || typeof value !== "string") return null
  const [payload, signature, extra] = value.split(".")
  if (!payload || !signature || extra) return null
  const expected = createHmac("sha256", secret).update(payload).digest()
  const received = Buffer.from(signature, "base64url")
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) return null
  try {
    const grant = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as MoneyExecutionGrant
    if (!grant?.authorization || !grant.policy || grant.policy.decision !== "allow") return null
    if (!Number.isFinite(Date.parse(grant.expiresAt)) || Date.parse(grant.expiresAt) <= Date.now()) return null
    return grant
  } catch {
    return null
  }
}

export async function executeServerMoneyMovement(grant: MoneyExecutionGrant) {
  const privateKey = readEnv("KESTREL_APP_KIT_PRIVATE_KEY")
  const circleApiKey = readEnv("CIRCLE_API_KEY")
  const circleEntitySecret = readEnv("CIRCLE_ENTITY_SECRET")
  const circleAddress = readEnv("ARC_SOURCE_WALLET_ADDRESS")
  const useCircleWallets = Boolean(circleApiKey && circleEntitySecret && circleAddress)
  if (!useCircleWallets && (!privateKey || !/^0x[a-fA-F0-9]{64}$/.test(privateKey))) throw new Error("Server App Kit signer is not configured.")
  const input = grant.authorization
  const feeRecipient = input.feeRecipient
  const customFeeValue = (Number(input.amount) * FEE_BPS / 10_000).toFixed(6)
  const adapter = useCircleWallets
    ? createCircleWalletsAdapter({ apiKey: circleApiKey!, entitySecret: circleEntitySecret! })
    : createViemAdapterFromPrivateKey({ privateKey: privateKey as `0x${string}` })
  const sourceContext = (chain: MoneyChain) => useCircleWallets
    ? { adapter, address: circleAddress!, chain }
    : { adapter, chain }

  if (input.operation === "swap") {
    const kitKey = readEnv("ARC_APP_KIT_KEY") ?? readEnv("KIT_KEY")
    if (!kitKey) throw new Error("Server Swap execution requires ARC_APP_KIT_KEY.")
    if (input.sourceChain !== "Arc_Testnet") throw new Error("Testnet Swap execution is restricted to Arc Testnet.")
    const params = {
      amountIn: input.amount,
      config: {
        allowanceStrategy: "approve",
        customFee: { percentageBps: FEE_BPS, recipientAddress: feeRecipient },
        kitKey,
        slippageBps: 100,
      },
      from: sourceContext("Arc_Testnet"),
      tokenIn: "USDC",
      tokenOut: "EURC",
    }
    return kit.swap(params as unknown as Parameters<typeof kit.swap>[0])
  }

  if (input.operation === "spend") {
    const params = {
      amount: input.amount,
      config: { customFee: { value: customFeeValue, recipientAddress: feeRecipient } },
      from: useCircleWallets ? { adapter, address: circleAddress! } : { adapter },
      to: {
        adapter,
        chain: input.destinationChain,
        recipientAddress: input.recipient,
        useForwarder: true,
      },
      token: "USDC",
    }
    return kit.unifiedBalance.spend(params as unknown as Parameters<typeof kit.unifiedBalance.spend>[0])
  }

  if (input.operation === "bridge") {
    const params = {
      amount: input.amount,
      config: { customFee: { value: customFeeValue, recipientAddress: feeRecipient } },
      from: sourceContext(input.sourceChain),
      to: useCircleWallets
        ? { adapter, address: input.recipient, chain: input.destinationChain }
        : { adapter, chain: input.destinationChain, recipientAddress: input.recipient },
      token: "USDC",
    }
    return kit.bridge(params as unknown as Parameters<typeof kit.bridge>[0])
  }

  const params = {
    amount: input.amount,
    from: sourceContext(input.sourceChain),
    to: input.recipient,
    token: "USDC",
  }
  return kit.send(params as unknown as Parameters<typeof kit.send>[0])
}

export function normalizeMoneyProof(input: {
  feeBreakdown: MoneyFeeBreakdown
  grant: MoneyExecutionGrant
  raw: unknown
}) {
  const safeRaw = toJsonSafe(input.raw)
  const strings = collectStrings(safeRaw)
  const txHashes = [...new Set(strings.filter((value) => /^(0x[a-fA-F0-9]{40,}|[1-9A-HJ-NP-Za-km-z]{64,})$/.test(value)))]
  const explorerUrls = [...new Set(strings.filter((value) => /^https:\/\/.+\/(tx|transaction)\//.test(value)))]
  const record = isRecord(safeRaw) ? safeRaw : {}
  return {
    id: `money_${input.grant.traceId}`,
    kind: "money_movement",
    operation: input.grant.authorization.operation,
    state: String(record.state ?? record.status ?? "submitted"),
    traceId: input.grant.traceId,
    recordedAt: new Date().toISOString(),
    authorization: input.grant.authorization,
    feeBreakdown: input.feeBreakdown,
    policy: input.grant.policy,
    txHashes,
    explorerUrls,
    raw: safeRaw,
  }
}

let warnedSigningFallback = false

function executionSigningSecret() {
  const dedicated = readEnv("KESTREL_EXECUTION_SIGNING_SECRET")
  if (dedicated) return dedicated
  // The analytics salt is deliberately NOT reused here: it is also the IP-hashing salt
  // on public/low-trust paths, so sharing it with the money-grant HMAC would let a
  // low-sensitivity value forge fund-moving grants. The service-role key is a genuine
  // secret and is kept only as a stopgap so an unconfigured deploy still functions —
  // a dedicated KESTREL_EXECUTION_SIGNING_SECRET should always be set.
  const fallback = readEnv("SUPABASE_SERVICE_ROLE_KEY")
  if (fallback && !warnedSigningFallback && process.env.NODE_ENV === "production") {
    warnedSigningFallback = true
    console.warn("[money-execution] KESTREL_EXECUTION_SIGNING_SECRET is not set; falling back to SUPABASE_SERVICE_ROLE_KEY. Set a dedicated secret.")
  }
  return fallback
}

function configuredNumber(name: string, fallback: number) {
  const value = Number(readEnv(name))
  return Number.isFinite(value) && value >= 0 ? round6(value) : fallback
}

function round6(value: number) {
  return Math.round(value * 1_000_000) / 1_000_000
}

function readEnv(name: string) {
  const value = process.env[name]?.trim()
  return value || null
}

function collectStrings(value: unknown): string[] {
  if (typeof value === "string") return [value]
  if (Array.isArray(value)) return value.flatMap(collectStrings)
  if (isRecord(value)) return Object.values(value).flatMap(collectStrings)
  return []
}

function toJsonSafe(value: unknown): unknown {
  if (typeof value === "bigint") return value.toString()
  if (Array.isArray(value)) return value.map(toJsonSafe)
  if (isRecord(value)) return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, toJsonSafe(item)]))
  return value
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}
