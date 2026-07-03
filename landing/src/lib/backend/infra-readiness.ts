export type InfraServiceStatus = "ok" | "warning" | "error"

export type InfraReadiness = {
  chainId: number
  chainIdHex: string
  checkedAt: string
  explorer: {
    status: InfraServiceStatus
    url: string
  }
  fallbackRpc: {
    configured: boolean
    label: string
    status: InfraServiceStatus
  }
  indexing: {
    detail: string
    status: InfraServiceStatus
  }
  provider: string
  rpc: {
    configured: boolean
    detail: string
    latencyMs: number | null
    status: InfraServiceStatus
    urlLabel: string
  }
  status: InfraServiceStatus
}

const ARC_CHAIN_ID = 5042002
const ARC_CHAIN_ID_HEX = `0x${ARC_CHAIN_ID.toString(16)}`
const ARC_EXPLORER_URL = "https://testnet.arcscan.app"

export async function getInfraReadiness(): Promise<InfraReadiness> {
  const rpcUrl = readEnv("QUICKNODE_ARC_RPC_URL") ?? readEnv("ARC_RPC_URL") ?? readEnv("NEXT_PUBLIC_ARC_RPC_URL")
  const fallbackRpcUrl = readEnv("ARC_FALLBACK_RPC_URL") ?? readEnv("NEXT_PUBLIC_ARC_FALLBACK_RPC_URL")
  const indexingConfigured = Boolean(readEnv("SUPABASE_URL") && readEnv("SUPABASE_SERVICE_ROLE_KEY"))
  const checkedAt = new Date().toISOString()
  const rpc = rpcUrl ? await checkRpc(rpcUrl) : {
    configured: false,
    detail: "RPC endpoint is not configured in this deployment.",
    latencyMs: null,
    status: "warning" as InfraServiceStatus,
    urlLabel: "pending env",
  }
  const fallbackRpc = {
    configured: Boolean(fallbackRpcUrl),
    label: fallbackRpcUrl ? maskUrl(fallbackRpcUrl) : "ready to configure",
    status: fallbackRpcUrl ? "ok" as InfraServiceStatus : "warning" as InfraServiceStatus,
  }
  const indexing = {
    detail: indexingConfigured ? "Supabase-backed indexing and audit tables are configured." : "Demo index active until Supabase env is configured.",
    status: indexingConfigured ? "ok" as InfraServiceStatus : "warning" as InfraServiceStatus,
  }
  const status = rpc.status === "error"
    ? "error"
    : rpc.status === "ok" && indexing.status === "ok"
      ? "ok"
      : "warning"

  return {
    chainId: ARC_CHAIN_ID,
    chainIdHex: ARC_CHAIN_ID_HEX,
    checkedAt,
    explorer: {
      status: "ok",
      url: ARC_EXPLORER_URL,
    },
    fallbackRpc,
    indexing,
    provider: rpcUrl?.includes("quiknode") || rpcUrl?.includes("quicknode") ? "QuickNode" : rpcUrl ? "Arc RPC" : "QuickNode-ready",
    rpc,
    status,
  }
}

async function checkRpc(rpcUrl: string): Promise<InfraReadiness["rpc"]> {
  const startedAt = Date.now()
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 4000)

  try {
    const response = await fetch(rpcUrl, {
      body: JSON.stringify({ id: 1, jsonrpc: "2.0", method: "eth_chainId", params: [] }),
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "arc-suite-infra-readiness/1.0",
      },
      method: "POST",
      signal: controller.signal,
    })
    const latencyMs = Date.now() - startedAt
    const payload = await response.json().catch(() => null) as { result?: string } | null
    const observedChainId = payload?.result?.toLowerCase()

    if (!response.ok) {
      return {
        configured: true,
        detail: `RPC HTTP ${response.status}`,
        latencyMs,
        status: "error",
        urlLabel: maskUrl(rpcUrl),
      }
    }

    if (observedChainId !== ARC_CHAIN_ID_HEX) {
      return {
        configured: true,
        detail: `Unexpected chain id ${observedChainId ?? "missing"}`,
        latencyMs,
        status: "error",
        urlLabel: maskUrl(rpcUrl),
      }
    }

    return {
      configured: true,
      detail: `Arc chain id confirmed: ${observedChainId}`,
      latencyMs,
      status: latencyMs <= 1200 ? "ok" : "warning",
      urlLabel: maskUrl(rpcUrl),
    }
  } catch (error) {
    return {
      configured: true,
      detail: error instanceof Error ? error.message : "RPC check failed",
      latencyMs: Date.now() - startedAt,
      status: "error",
      urlLabel: maskUrl(rpcUrl),
    }
  } finally {
    clearTimeout(timeout)
  }
}

function readEnv(name: string) {
  const value = process.env[name]?.trim()
  return value || null
}

function maskUrl(value: string) {
  try {
    const url = new URL(value)
    return `${url.hostname}${url.pathname === "/" ? "" : url.pathname.slice(0, 10)}`
  } catch {
    return "configured"
  }
}
