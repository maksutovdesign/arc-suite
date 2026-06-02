import { NextResponse } from "next/server"
import type { ApiKeyScope } from "./schema"
import { verifySupabaseApiKey } from "./supabase"

const API_KEY = process.env.ARC_API_KEY

export async function requireArcApiKey(request: Request, requiredScopes: ApiKeyScope[] = ["read"]) {
  if (!API_KEY && process.env.NODE_ENV !== "production") return null

  const providedKey = request.headers.get("x-arc-api-key") ?? request.headers.get("authorization")?.replace(/^Bearer\s+/i, "")
  if (API_KEY && providedKey === API_KEY) return null

  if (providedKey) {
    const workspaceKey = await verifySupabaseApiKey(providedKey)
    if (workspaceKey && hasScopes(workspaceKey.scopes, requiredScopes)) return null
  }

  return NextResponse.json(
    { error: "Unauthorized", message: "A valid Arc API key with the required scope is required." },
    { status: 401 },
  )
}

function hasScopes(availableScopes: ApiKeyScope[], requiredScopes: ApiKeyScope[]) {
  if (availableScopes.includes("admin")) return true
  return requiredScopes.every((scope) => availableScopes.includes(scope))
}
