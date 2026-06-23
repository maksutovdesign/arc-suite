import { createPublicKey, verify } from "crypto"

const CIRCLE_API_BASE = "https://api.circle.com"
const publicKeyCache = new Map<string, { expiresAt: number; key: ReturnType<typeof createPublicKey> }>()

export type CircleWebhookEnvelope = {
  subscriptionId?: string
  notificationId: string
  notificationType: string
  notification: Record<string, unknown>
  timestamp?: string
  version?: number
}

export async function verifyCircleWebhookSignature(input: {
  keyId: string
  rawBody: string
  signature: string
}) {
  const key = await getCircleWebhookPublicKey(input.keyId)
  return verify(
    "sha256",
    Buffer.from(input.rawBody),
    key,
    Buffer.from(input.signature, "base64"),
  )
}

export function parseCircleWebhookEnvelope(value: unknown): CircleWebhookEnvelope {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Circle webhook body must be an object")
  const body = value as Record<string, unknown>
  if (typeof body.notificationId !== "string" || !body.notificationId.trim()) throw new Error("notificationId is required")
  if (typeof body.notificationType !== "string" || !body.notificationType.trim()) throw new Error("notificationType is required")
  if (!body.notification || typeof body.notification !== "object" || Array.isArray(body.notification)) throw new Error("notification must be an object")
  return {
    subscriptionId: typeof body.subscriptionId === "string" ? body.subscriptionId : undefined,
    notificationId: body.notificationId,
    notificationType: body.notificationType,
    notification: body.notification as Record<string, unknown>,
    timestamp: typeof body.timestamp === "string" ? body.timestamp : undefined,
    version: typeof body.version === "number" ? body.version : undefined,
  }
}

export function readCircleProviderFields(envelope: CircleWebhookEnvelope) {
  const payload = envelope.notification
  const transaction = objectValue(payload.transaction)
  const providerOperationId = stringValue(payload.id)
    ?? stringValue(payload.transactionId)
    ?? stringValue(payload.contractExecutionId)
    ?? stringValue(transaction?.id)
  const providerState = stringValue(payload.state)
    ?? stringValue(payload.status)
    ?? stringValue(transaction?.state)
    ?? stringValue(transaction?.status)
  const txHash = stringValue(payload.txHash)
    ?? stringValue(payload.transactionHash)
    ?? stringValue(transaction?.txHash)
  return { providerOperationId, providerState, txHash }
}

async function getCircleWebhookPublicKey(keyId: string) {
  const cached = publicKeyCache.get(keyId)
  if (cached && cached.expiresAt > Date.now()) return cached.key
  const apiKey = process.env.CIRCLE_API_KEY
  if (!apiKey) throw new Error("CIRCLE_API_KEY is not configured")
  const response = await fetch(`${CIRCLE_API_BASE}/v2/notifications/publicKey/${encodeURIComponent(keyId)}`, {
    cache: "no-store",
    headers: { Authorization: `Bearer ${apiKey}` },
  })
  const payload = await response.json().catch(() => null) as { data?: { publicKey?: string }; publicKey?: string; message?: string } | null
  if (!response.ok) throw new Error(payload?.message ?? `Circle public key request returned ${response.status}`)
  const encoded = payload?.data?.publicKey ?? payload?.publicKey
  if (!encoded) throw new Error("Circle public key response is missing publicKey")
  const key = createPublicKey({ key: Buffer.from(encoded, "base64"), format: "der", type: "spki" })
  publicKeyCache.set(keyId, { expiresAt: Date.now() + 60 * 60 * 1000, key })
  return key
}

function objectValue(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null
}

function stringValue(value: unknown) {
  return typeof value === "string" && value.trim() ? value : null
}
