"use client"

import { useEffect, useMemo, useState } from "react"
import { Check, Copy, Key, Plus, RotateCcw, Shield, UserRound, XCircle } from "lucide-react"
import { ArcButton } from "@/components/ui/ArcButton"
import type { WorkspaceApiKey, WorkspaceApiKeyCreated, WorkspaceSecurity } from "@/lib/arc-api"
import { apiPath } from "@/lib/base-path"

const cardStyle = {
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.05)",
}

export function WorkspaceSecurityPanel({ initialSecurity, isDemo = false }: { initialSecurity: WorkspaceSecurity | null; isDemo?: boolean }) {
  const [security, setSecurity] = useState(initialSecurity)
  const [name, setName] = useState("Marketplace integration key")
  const [scopes, setScopes] = useState<Array<"read" | "write" | "admin">>(["read"])
  const [pending, setPending] = useState<string | null>(null)
  const [freshKey, setFreshKey] = useState<WorkspaceApiKeyCreated | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [adminKey, setAdminKey] = useState("")
  const [isLocked, setIsLocked] = useState(false)

  useEffect(() => {
    if (initialSecurity) return
    refresh()
  }, [initialSecurity])

  const activeKeys = useMemo(() => security?.apiKeys.filter((key) => !key.revokedAt) ?? [], [security])

  async function refresh() {
    const response = await fetch(apiPath("/api/arc/workspace/security"))
    if (response.status === 401) {
      setIsLocked(true)
      setError("Unlock a Treasury admin session to manage workspace access.")
      return
    }
    if (!response.ok) {
      setError("Workspace security API is unavailable")
      return
    }
    setIsLocked(false)
    setSecurity(await response.json())
  }

  async function unlockSession() {
    setPending("unlock")
    setError(null)
    try {
      const response = await fetch(apiPath("/api/arc/session"), {
        body: JSON.stringify({ adminKey }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      })
      if (!response.ok) throw new Error("Unlock failed")
      setAdminKey("")
      setIsLocked(false)
      await refresh()
    } catch {
      setError("Invalid Treasury admin key.")
    } finally {
      setPending(null)
    }
  }

  async function createKey() {
    if (isDemo) {
      setError("Demo workspace is read-only. API key creation is disabled.")
      return
    }
    setPending("create")
    setError(null)
    try {
      const response = await fetch(apiPath("/api/arc/workspace/security"), {
        body: JSON.stringify({ name, scopes }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      })
      if (!response.ok) throw new Error("Create failed")
      const payload = (await response.json()) as { apiKey: WorkspaceApiKeyCreated }
      setFreshKey(payload.apiKey)
      await refresh()
    } catch {
      setError("Could not create API key. Check Supabase auth tables and ARC_API_KEY.")
    } finally {
      setPending(null)
    }
  }

  async function rotateKey(key: WorkspaceApiKey) {
    if (isDemo) {
      setError("Demo workspace is read-only. API key rotation is disabled.")
      return
    }
    setPending(`rotate:${key.id}`)
    setError(null)
    try {
      const response = await fetch(apiPath(`/api/arc/workspace/security/keys/${key.id}/rotate`), { method: "POST" })
      if (!response.ok) throw new Error("Rotate failed")
      const payload = (await response.json()) as { apiKey: WorkspaceApiKeyCreated }
      setFreshKey(payload.apiKey)
      await refresh()
    } catch {
      setError("Could not rotate API key.")
    } finally {
      setPending(null)
    }
  }

  async function revokeKey(key: WorkspaceApiKey) {
    if (isDemo) {
      setError("Demo workspace is read-only. API key revoke is disabled.")
      return
    }
    setPending(`revoke:${key.id}`)
    setError(null)
    try {
      const response = await fetch(apiPath(`/api/arc/workspace/security/keys/${key.id}/revoke`), { method: "POST" })
      if (!response.ok) throw new Error("Revoke failed")
      setFreshKey(null)
      await refresh()
    } catch {
      setError("Could not revoke API key.")
    } finally {
      setPending(null)
    }
  }

  function toggleScope(scope: "read" | "write" | "admin") {
    setScopes((current) => {
      if (scope === "admin") return current.includes("admin") ? ["read"] : ["admin"]
      const withoutAdmin = current.filter((item) => item !== "admin")
      const next = withoutAdmin.includes(scope) ? withoutAdmin.filter((item) => item !== scope) : [...withoutAdmin, scope]
      return next.length > 0 ? next : ["read"]
    })
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <Metric label="Workspace" value={security?.workspace.name ?? "Arc pilot"} />
        <Metric label="Members" value={String(security?.members.length ?? 0)} />
        <Metric label="Active keys" value={String(activeKeys.length)} />
      </div>

      {isDemo && (
        <div className="rounded-xl p-3" style={{ background: "rgba(95,191,255,0.08)", border: "1px solid rgba(95,191,255,0.2)" }}>
          <p className="text-xs font-semibold" style={{ color: "#5FBFFF" }}>Demo security view</p>
          <p className="text-[11px] mt-1" style={{ color: "#C7C5D1" }}>
            Members and key prefixes are visible, but creating, rotating, and revoking keys is disabled for public demo sessions.
          </p>
        </div>
      )}

      {freshKey && (
        <div className="rounded-xl p-3" style={{ background: "rgba(52,211,153,0.09)", border: "1px solid rgba(52,211,153,0.2)" }}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold" style={{ color: "#34d399" }}>One-time secret</p>
              <p className="text-[11px] mt-1" style={{ color: "#C7C5D1" }}>Copy it now. Arc only stores the hash.</p>
            </div>
            <ArcButton variant="outline" size="sm" icon={Copy} onClick={() => navigator.clipboard.writeText(freshKey.secret)}>
              Copy
            </ArcButton>
          </div>
          <code className="block mt-3 text-[11px] break-all rounded-lg p-2" style={{ color: "#fff", background: "rgba(0,0,0,0.18)" }}>
            {freshKey.secret}
          </code>
        </div>
      )}

      {(isLocked || error?.includes("admin session")) && (
        <div className="rounded-xl p-3" style={{ background: "rgba(95,191,255,0.08)", border: "1px solid rgba(95,191,255,0.2)" }}>
          <div className="flex items-center gap-2 mb-3">
            <Shield className="size-4" style={{ color: "#5FBFFF" }} />
            <p className="text-xs font-semibold text-white">Treasury admin session</p>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto]">
            <input
              className="h-9 w-full rounded-lg px-3 text-sm outline-none"
              placeholder="Enter admin key"
              style={{ background: "rgba(0,0,0,0.16)", border: "1px solid rgba(255,255,255,0.08)", color: "#fff" }}
              type="password"
              value={adminKey}
              onChange={(event) => setAdminKey(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") unlockSession()
              }}
            />
            <ArcButton variant="primary" size="md" disabled={!adminKey || pending === "unlock"} onClick={unlockSession}>
              Unlock
            </ArcButton>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-xl p-3 text-xs" style={{ color: "#fca5a5", background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.2)" }}>
          {error}
        </div>
      )}

      <div className="rounded-xl p-3" style={cardStyle}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto]">
          <label className="space-y-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#7a8fa8" }}>Key name</span>
            <input
              className="h-9 w-full rounded-lg px-3 text-sm outline-none"
              disabled={isDemo}
              style={{ background: "rgba(0,0,0,0.16)", border: "1px solid rgba(255,255,255,0.08)", color: "#fff" }}
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </label>
          <div className="flex items-end">
            <ArcButton
              className="w-full sm:w-auto"
              variant="primary"
              size="md"
              icon={Plus}
              disabled={pending === "create" || isDemo}
              title={isDemo ? "Demo workspace is read-only" : "Generate workspace API key"}
              onClick={createKey}
            >
              Generate key
            </ArcButton>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-3">
          {(["read", "write", "admin"] as const).map((scope) => (
            <button
              key={scope}
              className="h-7 px-3 rounded-lg text-xs font-semibold"
              disabled={isDemo}
              style={
                scopes.includes(scope)
                  ? { background: "rgba(95,191,255,0.16)", color: "#5FBFFF", border: "1px solid rgba(95,191,255,0.3)" }
                  : { background: "rgba(255,255,255,0.03)", color: "#7a8fa8", border: "1px solid rgba(255,255,255,0.06)" }
              }
              onClick={() => toggleScope(scope)}
              title={isDemo ? "Demo workspace is read-only" : `Toggle ${scope} scope`}
              type="button"
            >
              {scope}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        {(security?.apiKeys ?? []).map((key) => (
          <div key={key.id} className="flex flex-col gap-3 rounded-xl p-3 sm:flex-row sm:items-center sm:justify-between" style={cardStyle}>
            <div className="flex items-center gap-3 min-w-0">
              <div className="size-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(77,142,233,0.1)", border: "1px solid rgba(77,142,233,0.15)" }}>
                <Key className="size-3.5" style={{ color: "#5FBFFF" }} />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium text-white truncate">{key.name}</p>
                  <Status active={!key.revokedAt} />
                </div>
                <p className="truncate text-[11px] font-mono mt-0.5" style={{ color: "#7a8fa8" }}>{key.keyPrefix}</p>
                <p className="truncate text-[10px] mt-1" style={{ color: "#7a8fa8" }}>{key.scopes.join(", ")} · last used {formatDate(key.lastUsedAt)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <ArcButton
                variant="ghost"
                size="icon"
                icon={RotateCcw}
                disabled={isDemo || Boolean(key.revokedAt) || pending === `rotate:${key.id}`}
                title={isDemo ? "Demo workspace is read-only" : "Rotate key"}
                onClick={() => rotateKey(key)}
              />
              <ArcButton
                variant="danger"
                size="icon"
                icon={XCircle}
                disabled={isDemo || Boolean(key.revokedAt) || pending === `revoke:${key.id}`}
                title={isDemo ? "Demo workspace is read-only" : "Revoke key"}
                onClick={() => revokeKey(key)}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {(security?.members ?? []).map((member) => (
          <div key={member.id} className="rounded-xl p-3 flex items-center gap-3" style={cardStyle}>
            <div className="size-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <UserRound className="size-3.5" style={{ color: "#C7C5D1" }} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">{member.name}</p>
              <p className="truncate text-[10px]" style={{ color: "#7a8fa8" }}>{member.role} · {member.email}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-xl p-3" style={cardStyle}>
      <p className="text-[10px] uppercase tracking-wider" style={{ color: "#7a8fa8" }}>{label}</p>
      <strong className="mt-1 block truncate text-base text-white sm:text-lg">{value}</strong>
    </div>
  )
}

function Status({ active }: { active: boolean }) {
  return (
    <span
      className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full"
      style={
        active
          ? { background: "rgba(52,211,153,0.12)", color: "#34d399", border: "1px solid rgba(52,211,153,0.25)" }
          : { background: "rgba(122,143,168,0.1)", color: "#7a8fa8", border: "1px solid rgba(122,143,168,0.2)" }
      }
    >
      {active && <Check className="size-3" />}
      {active ? "Active" : "Revoked"}
    </span>
  )
}

function formatDate(value: string | null) {
  if (!value) return "never"
  return new Intl.DateTimeFormat("en-US", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(value))
}
