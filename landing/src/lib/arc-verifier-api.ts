import { ARC_RPC_URL, ARC_FALLBACK_RPC_URL, createArcReadRpc, inspectArcTransaction, type ArcTransactionInspection } from "../../../scripts/arc-send-verification.mjs"

type Inspector = (hash: string, signal: AbortSignal) => Promise<ArcTransactionInspection>
const headers = { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" }

// Best-effort instance-local load guard, not a distributed rate-limit guarantee.
// No IP addresses, wallet connections, database writes or execution credentials.
export async function inspectArcWithFallback(hash: string, signal: AbortSignal, fetchImpl: typeof fetch = fetch) {
  try {
    return await inspectArcTransaction(hash, { rpc: createArcReadRpc(fetchImpl, { rpcUrl: ARC_RPC_URL, signal: AbortSignal.any([signal, AbortSignal.timeout(5_000)]) }) })
  } catch (error) {
    if (signal.aborted) throw error
    // A valid negative observation is returned above. Only a failed attempt
    // moves to the fixed, officially listed secondary endpoint.
    return inspectArcTransaction(hash, { rpc: createArcReadRpc(fetchImpl, { rpcUrl: ARC_FALLBACK_RPC_URL, signal }) })
  }
}

export function createArcVerifierHandler(inspect: Inspector = inspectArcWithFallback) {
  let active = 0
  let started = 0
  let windowStart = 0
  return async function GET(request: Request) {
    const url = new URL(request.url)
    const hashes = url.searchParams.getAll("tx")
    if (hashes.length !== 1 || !/^0x[0-9a-f]{64}$/i.test(hashes[0]) || [...url.searchParams.keys()].some((key) => key !== "tx")) {
      return Response.json({ error: "invalid_hash", message: "Enter one 0x-prefixed transaction hash with 64 hexadecimal characters." }, { status: 400, headers })
    }
    const now = Date.now()
    if (now - windowStart >= 60_000) { windowStart = now; started = 0 }
    if (active >= 2 || started >= 30) {
      return Response.json({ error: "busy", message: "The verifier is busy. Please try again in a minute." }, { status: 429, headers: { ...headers, "Retry-After": "60" } })
    }
    active++; started++
    try {
      const signal = AbortSignal.any([request.signal, AbortSignal.timeout(12_000)])
      const result = await inspect(hashes[0].toLowerCase(), signal)
      return Response.json(result, { headers })
    } catch {
      return Response.json({ error: "rpc_unavailable", message: "Arc RPC could not complete verification. No confirmation is claimed. Try again later." }, { status: 503, headers })
    } finally { active-- }
  }
}
