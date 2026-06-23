import { NextRequest, NextResponse } from "next/server"

import { parseCircleWebhookEnvelope, readCircleProviderFields, verifyCircleWebhookSignature } from "@/lib/backend/circle-webhook"
import { createRequestId, logOperationalEvent, requestIdHeaders } from "@/lib/backend/observability"
import { recordSupabaseCircleWebhook } from "@/lib/backend/supabase"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  const requestId = createRequestId(request)
  const keyId = request.headers.get("x-circle-key-id")
  const signature = request.headers.get("x-circle-signature")
  if (!keyId || !signature) {
    return NextResponse.json(
      { error: "missing_circle_signature", message: "Circle signature headers are required." },
      { status: 401, headers: requestIdHeaders(requestId) },
    )
  }

  const rawBody = await request.text()
  try {
    const verified = await verifyCircleWebhookSignature({ keyId, rawBody, signature })
    if (!verified) {
      return NextResponse.json(
        { error: "invalid_circle_signature", message: "Circle webhook signature is invalid." },
        { status: 401, headers: requestIdHeaders(requestId) },
      )
    }
    const envelope = parseCircleWebhookEnvelope(JSON.parse(rawBody))
    const provider = readCircleProviderFields(envelope)
    const result = await recordSupabaseCircleWebhook({
      notificationId: envelope.notificationId,
      subscriptionId: envelope.subscriptionId,
      notificationType: envelope.notificationType,
      providerOperationId: provider.providerOperationId,
      signatureKeyId: keyId,
      signatureVerified: true,
      payload: {
        notification: envelope.notification,
        timestamp: envelope.timestamp,
        version: envelope.version,
      },
      providerState: provider.providerState,
      txHash: provider.txHash,
    })
    if (!result) throw new Error("Execution worker migration is required.")
    logOperationalEvent({
      event: result.duplicate ? "circle.webhook.duplicate" : "circle.webhook.processed",
      requestId,
      route: "/api/webhooks/circle",
      details: {
        notificationType: envelope.notificationType,
        matchedJobs: result.matched,
        processingStatus: result.event.processingStatus,
      },
    })
    return NextResponse.json(
      { ok: true, duplicate: result.duplicate, matched: result.matched },
      { headers: requestIdHeaders(requestId) },
    )
  } catch (error) {
    logOperationalEvent({
      event: "circle.webhook.failed",
      level: "error",
      requestId,
      route: "/api/webhooks/circle",
      details: { message: error instanceof Error ? error.message : "Webhook processing failed" },
    })
    return NextResponse.json(
      { error: "circle_webhook_failed", message: error instanceof Error ? error.message : "Webhook processing failed." },
      { status: 400, headers: requestIdHeaders(requestId) },
    )
  }
}
