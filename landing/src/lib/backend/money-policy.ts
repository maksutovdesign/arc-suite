import { isAddress } from "viem"

export const MONEY_OPERATIONS = ["spend", "bridge", "swap", "send"] as const
export const MONEY_CHAINS = ["Arc_Testnet", "Base_Sepolia", "Ethereum_Sepolia", "Arbitrum_Sepolia"] as const

export type MoneyOperation = (typeof MONEY_OPERATIONS)[number]
export type MoneyChain = (typeof MONEY_CHAINS)[number]

export type MoneyAuthorization = {
  walletAddress: string
  operation: MoneyOperation
  sourceChain: MoneyChain
  destinationChain: MoneyChain
  amount: string
  recipient: string
  feeRecipient: string
  issuedAt: string
  nonce: string
}

export function getMoneyPolicyConfiguration() {
  const feeRecipient = readEnv("KESTREL_FEE_RECIPIENT") ?? readEnv("ARC_SOURCE_WALLET_ADDRESS")
  const maxAmountUsdc = positiveNumber(
    readEnv("KESTREL_MAX_MONEY_MOVEMENT_USDC") ?? readEnv("ARC_MAX_SETTLEMENT_USDC"),
    0.1,
  )
  const allowedRecipients = commaSeparated(
    readEnv("KESTREL_MONEY_ALLOWED_RECIPIENTS") ?? readEnv("ARC_SETTLEMENT_ALLOWED_RECIPIENTS"),
  )
  const complianceConfigured = Boolean(process.env.CIRCLE_API_KEY)
  const explicitlyEnabled = readEnv("KESTREL_MONEY_EXECUTION_ENABLED") === "true"

  return {
    enabled: explicitlyEnabled && Boolean(feeRecipient) && complianceConfigured,
    feeBps: 75,
    feeRecipient,
    maxAmountUsdc,
    allowedRecipients,
    allowlistRequired: allowedRecipients.length > 0,
    complianceConfigured,
    signatureTtlSeconds: 300,
    missing: [
      ...(!explicitlyEnabled ? ["KESTREL_MONEY_EXECUTION_ENABLED=true"] : []),
      ...(!feeRecipient ? ["KESTREL_FEE_RECIPIENT or ARC_SOURCE_WALLET_ADDRESS"] : []),
      ...(!complianceConfigured ? ["CIRCLE_API_KEY"] : []),
    ],
  }
}

export function validateMoneyAuthorization(value: unknown): { input: MoneyAuthorization | null; error: string | null } {
  if (!value || typeof value !== "object" || Array.isArray(value)) return invalid("JSON object is required")
  const input = value as Record<string, unknown>

  if (!isEvmAddress(input.walletAddress)) return invalid("walletAddress must be a full EVM address")
  if (!MONEY_OPERATIONS.includes(input.operation as MoneyOperation)) return invalid("operation is not supported")
  if (!MONEY_CHAINS.includes(input.sourceChain as MoneyChain)) return invalid("sourceChain is not supported")
  if (!MONEY_CHAINS.includes(input.destinationChain as MoneyChain)) return invalid("destinationChain is not supported")
  if (typeof input.amount !== "string" || !/^\d+(\.\d{1,6})?$/.test(input.amount)) return invalid("amount must use at most 6 decimals")
  if (!(Number(input.amount) > 0)) return invalid("amount must be greater than zero")
  if (!isEvmAddress(input.recipient)) return invalid("recipient must be a full EVM address")
  if (!isEvmAddress(input.feeRecipient)) return invalid("feeRecipient must be a full EVM address")
  if (typeof input.issuedAt !== "string" || !Number.isFinite(Date.parse(input.issuedAt))) return invalid("issuedAt must be an ISO timestamp")
  if (typeof input.nonce !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(input.nonce)) {
    return invalid("nonce must be a UUID v4")
  }

  return {
    input: {
      walletAddress: input.walletAddress,
      operation: input.operation as MoneyOperation,
      sourceChain: input.sourceChain as MoneyChain,
      destinationChain: input.destinationChain as MoneyChain,
      amount: input.amount,
      recipient: input.recipient,
      feeRecipient: input.feeRecipient,
      issuedAt: input.issuedAt,
      nonce: input.nonce,
    },
    error: null,
  }
}

export function policyValidationError(
  input: MoneyAuthorization,
  configuration: ReturnType<typeof getMoneyPolicyConfiguration>,
): string | null {
  const issuedAt = Date.parse(input.issuedAt)
  const ageMs = Date.now() - issuedAt
  if (ageMs < -30_000 || ageMs > configuration.signatureTtlSeconds * 1000) return "The wallet authorization has expired."
  if (Number(input.amount) > configuration.maxAmountUsdc) return `Amount exceeds the ${configuration.maxAmountUsdc} USDC execution limit.`
  if (input.feeRecipient.toLowerCase() !== configuration.feeRecipient?.toLowerCase()) return "The fee recipient does not match server policy."
  if (configuration.allowlistRequired && !configuration.allowedRecipients.includes(input.recipient.toLowerCase())) return "Recipient is not in the production allowlist."
  if (input.operation === "send" && input.sourceChain !== input.destinationChain) return "Send must use the same source and destination chain."
  if (input.operation === "swap" && (input.sourceChain !== "Arc_Testnet" || input.destinationChain !== "Arc_Testnet")) return "Testnet Swap is restricted to Arc Testnet."
  if ((input.operation === "bridge" || input.operation === "spend") && input.sourceChain === input.destinationChain) return "Cross-chain movement requires different source and destination chains."
  return null
}

export function moneyAuthorizationMessage(input: MoneyAuthorization) {
  return [
    "Kestrel Money Movement Authorization",
    "Version: 1",
    `Wallet: ${input.walletAddress.toLowerCase()}`,
    `Operation: ${input.operation}`,
    `Source chain: ${input.sourceChain}`,
    `Destination chain: ${input.destinationChain}`,
    `Amount: ${input.amount} USDC`,
    `Recipient: ${input.recipient.toLowerCase()}`,
    `Fee recipient: ${input.feeRecipient.toLowerCase()}`,
    `Issued at: ${input.issuedAt}`,
    `Nonce: ${input.nonce}`,
  ].join("\n")
}

export function complianceChainFor(chain: MoneyChain) {
  if (chain === "Arbitrum_Sepolia") return { chain: "ARB-SEPOLIA", basis: "native-chain" as const }
  if (chain === "Ethereum_Sepolia") return { chain: "ETH-SEPOLIA", basis: "native-chain" as const }
  return { chain: "ETH-SEPOLIA", basis: "cross-chain-evm-identity" as const }
}

function isEvmAddress(value: unknown): value is string {
  return typeof value === "string" && isAddress(value.trim())
}

function invalid(error: string) {
  return { input: null, error }
}

function positiveNumber(value: string | null, fallback: number) {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

function commaSeparated(value: string | null): string[] {
  if (!value) return []
  return [...new Set<string>(value.split(",").map((item) => item.trim().toLowerCase()).filter((item) => isAddress(item)))]
}

function readEnv(name: string) {
  const value = process.env[name]?.trim()
  return value || null
}
