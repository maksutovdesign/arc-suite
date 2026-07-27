import { timingSafeEqual } from "crypto"
import { NextResponse } from "next/server"
import type { ApiKeyScope } from "./schema"
import { createRequestId, logOperationalEvent, requestIdHeaders } from "./observability"
import { verifySupabaseApiKey } from "./supabase"

const API_KEY = process.env.ARC_API_KEY
// Opt-in escape hatch for LOCAL development only (`next dev`). It never applies in
// production and requires an explicit flag, so a preview/staging box missing
// ARC_API_KEY fails closed instead of exposing every admin route unauthenticated.
const ALLOW_INSECURE_NO_AUTH =
  process.env.ARC_ALLOW_INSECURE_NO_AUTH === "true" && process.env.NODE_ENV !== "production"

export async function requireArcApiKey(request: Request, requiredScopes: ApiKeyScope[] = ["read"]) {
  if (!API_KEY && ALLOW_INSECURE_NO_AUTH) return null

  const providedKey = request.headers.get("x-arc-api-key") ?? request.headers.get("authorization")?.replace(/^Bearer\s+/i, "")
  if (API_KEY && providedKey && constantTimeEqual(providedKey, API_KEY)) return null

  if (providedKey) {
    const workspaceKey = await verifySupabaseApiKey(providedKey)
    if (workspaceKey && hasScopes(workspaceKey.scopes, requiredScopes)) return null
  }

  const requestId = createRequestId(request)
  logOperationalEvent({
    details: {
      hasProvidedKey: Boolean(providedKey),
      requiredScopes,
    },
    event: "auth.unauthorized",
    level: "warn",
    requestId,
    route: new URL(request.url).pathname,
  })

  return NextResponse.json(
    { error: "Unauthorized", message: "A valid Arc API key with the required scope is required." },
    { headers: requestIdHeaders(requestId), status: 401 },
  )
}

function hasScopes(availableScopes: ApiKeyScope[], requiredScopes: ApiKeyScope[]) {
  if (availableScopes.includes("admin")) return true
  return requiredScopes.every((scope) => availableScopes.includes(scope))
}

function constantTimeEqual(a: string, b: string) {
  const bufferA = Buffer.from(a)
  const bufferB = Buffer.from(b)
  if (bufferA.length !== bufferB.length) return false
  return timingSafeEqual(bufferA, bufferB)
}
