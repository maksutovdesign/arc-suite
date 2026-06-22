import { createHash } from "crypto"
import type { CircleDeveloperControlledWalletsClient, Transaction as CircleTransaction } from "@circle-fin/developer-controlled-wallets"

const EXPLORER_BASE_URL = "https://testnet.arcscan.app"

export function getArcEscrowConfiguration() {
  const contractAddress = normalizeAddress(process.env.ARC_ESCROW_CONTRACT_ADDRESS)
  const missing: string[] = []
  if (!process.env.CIRCLE_API_KEY) missing.push("CIRCLE_API_KEY")
  if (!process.env.CIRCLE_ENTITY_SECRET) missing.push("CIRCLE_ENTITY_SECRET")
  if (!process.env.ARC_ESCROW_OPERATOR_WALLET_ID) missing.push("ARC_ESCROW_OPERATOR_WALLET_ID")
  if (!contractAddress) missing.push("ARC_ESCROW_CONTRACT_ADDRESS")
  return {
    configured: missing.length === 0,
    chain: "ARC-TESTNET" as const,
    contractAddress,
    missing,
  }
}

export async function executeArcEscrowAction(input: {
  action: "release" | "refund"
  milestoneId: string
  providerIdempotencyKey: string
}) {
  const config = getArcEscrowConfiguration()
  if (!config.configured || !config.contractAddress) {
    throw new EscrowContractError("escrow_contract_not_configured", `Missing Circle Contracts configuration: ${config.missing.join(", ")}`)
  }

  const client = await createCircleClient()
  const response = await client.createContractExecutionTransaction({
    abiFunctionSignature: input.action === "release" ? "releaseMilestone(bytes32)" : "refundMilestone(bytes32)",
    abiParameters: [toBytes32(input.milestoneId)],
    contractAddress: config.contractAddress,
    walletId: process.env.ARC_ESCROW_OPERATOR_WALLET_ID!,
    fee: { type: "level", config: { feeLevel: "MEDIUM" } },
    idempotencyKey: input.providerIdempotencyKey,
    refId: `arc-escrow:${input.action}:${input.milestoneId}`,
  })
  const transactionId = response.data?.id
  if (!transactionId) throw new EscrowContractError("circle_transaction_missing", "Circle Contracts did not return a transaction id")
  const transaction = await waitForTransaction(client, transactionId)
  if (!transaction.txHash) throw new EscrowContractError("circle_hash_missing", "Contract execution completed without a transaction hash")
  return {
    txHash: transaction.txHash,
    explorerUrl: `${EXPLORER_BASE_URL}/tx/${transaction.txHash}`,
    providerReceipt: toJsonRecord(transaction),
  }
}

export class EscrowContractError extends Error {
  constructor(readonly code: string, message: string, readonly details: Record<string, unknown> = {}) {
    super(message)
    this.name = "EscrowContractError"
  }
}

async function waitForTransaction(client: CircleDeveloperControlledWalletsClient, transactionId: string) {
  const deadline = Date.now() + 45_000
  let latest: CircleTransaction | undefined
  while (Date.now() < deadline) {
    latest = (await client.getTransaction({ id: transactionId })).data?.transaction
    if (latest) {
      if ((latest.state === "COMPLETE" || latest.state === "CONFIRMED") && latest.txHash) return latest
      if (["FAILED", "DENIED", "CANCELLED", "STUCK"].includes(latest.state)) {
        throw new EscrowContractError("circle_contract_execution_failed", latest.errorReason ?? `Circle transaction entered ${latest.state}`, toJsonRecord(latest))
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 2_000))
  }
  throw new EscrowContractError("circle_confirmation_timeout", "Contract execution was submitted but not confirmed before timeout", {
    circleTransactionId: transactionId,
    lastState: latest?.state ?? null,
  })
}

async function createCircleClient() {
  const { initiateDeveloperControlledWalletsClient } = await import("@circle-fin/developer-controlled-wallets")
  return initiateDeveloperControlledWalletsClient({
    apiKey: process.env.CIRCLE_API_KEY!,
    entitySecret: process.env.CIRCLE_ENTITY_SECRET!,
  })
}

function toBytes32(value: string) {
  return `0x${createHash("sha256").update(value).digest("hex")}`
}

function normalizeAddress(value: string | undefined) {
  const normalized = value?.trim().toLowerCase()
  return normalized && /^0x[a-f0-9]{40}$/.test(normalized) ? normalized : null
}

function toJsonRecord(value: unknown): Record<string, unknown> {
  const normalized = JSON.parse(JSON.stringify(value, (_key, item) => typeof item === "bigint" ? item.toString() : item))
  return normalized && typeof normalized === "object" && !Array.isArray(normalized) ? normalized : { value: normalized }
}
