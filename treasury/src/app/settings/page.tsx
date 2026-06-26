import type { Metadata } from "next"
export const metadata: Metadata = { title: "Settings — Arc Treasury" }

import { Key, Webhook, Shield, Globe, Settings, Plus, Check } from "lucide-react"
import { PageHeader } from "@/components/dashboard/PageHeader"
import { ArcButton } from "@/components/ui/ArcButton"
import { ArcProgress } from "@/components/ui/ArcProgress"
import { WorkspaceSecurityPanel } from "@/components/settings/WorkspaceSecurityPanel"
import { getWorkspaceSecurity } from "@/lib/arc-api"
import { getTreasuryServerSessionMode } from "@/lib/treasury-session-server"

const arcCard = {
  background: "linear-gradient(160deg, #263a52 0%, #1e3247 100%)",
  border: "1px solid rgba(255,255,255,0.07)",
  borderRadius: 16,
}

function SectionCard({ title, icon: Icon, children }: {
  title: string
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>
  children: React.ReactNode
}) {
  return (
    <div className="rounded-2xl overflow-hidden" style={arcCard}>
      <div
        className="flex items-center gap-2.5 px-4 py-3"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div
          className="size-7 rounded-lg flex items-center justify-center"
          style={{ background: "rgba(77,142,233,0.12)", border: "1px solid rgba(77,142,233,0.2)" }}
        >
          <Icon className="size-3.5" style={{ color: "#5FBFFF" }} />
        </div>
        <span className="text-sm font-semibold text-white">{title}</span>
      </div>
      <div className="p-4">{children}</div>
    </div>
  )
}

function SettingRow({ label, value, action }: { label: string; value: string; action?: string }) {
  return (
    <div
      className="flex items-center justify-between py-3"
      style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
    >
      <span className="text-sm" style={{ color: "#C7C5D1" }}>{label}</span>
      <div className="flex items-center gap-3">
        <span className="text-sm font-semibold text-white">{value}</span>
        {action && <ArcButton variant="ghost" size="sm">{action}</ArcButton>}
      </div>
    </div>
  )
}

export default async function SettingsPage() {
  const sessionMode = await getTreasuryServerSessionMode()
  const security = sessionMode === "admin" || sessionMode === "demo" ? await getWorkspaceSecurity() : null
  const isDemo = sessionMode === "demo"

  return (
    <div className="flex flex-col min-h-full">
      <PageHeader
        title="Settings"
        subtitle="API keys, webhooks, networks and security"
        icon={Settings}
        glow
      />

      <div className="p-6 grid grid-cols-2 gap-5 max-w-4xl">
        {/* API Keys */}
        <div className="col-span-2">
          <SectionCard title="Workspace Access" icon={Key}>
            <WorkspaceSecurityPanel initialSecurity={security} isDemo={isDemo} />
          </SectionCard>
        </div>

        {/* Webhooks */}
        <SectionCard title="Webhooks" icon={Webhook}>
          <div className="space-y-3">
            {[
              { name: "Slack alerts", url: "https://hooks.slack.com/••••", events: ["alert.critical", "budget.exceeded"], ok: true },
              { name: "PagerDuty", url: "https://events.pagerduty.com/••••", events: ["alert.critical"], ok: true },
            ].map((hook) => (
              <div
                key={hook.name}
                className="p-3 rounded-xl"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-white">{hook.name}</span>
                  <div className="flex items-center gap-1.5">
                    {hook.ok && <Check className="size-3.5" style={{ color: "#34d399" }} />}
                    <span className="text-[10px] font-medium" style={{ color: hook.ok ? "#34d399" : "#f87171" }}>
                      {hook.ok ? "Connected" : "Error"}
                    </span>
                  </div>
                </div>
                <p className="text-[10px] font-mono mb-2" style={{ color: "#7a8fa8" }}>{hook.url}</p>
                <div className="flex gap-1">
                  {hook.events.map((e) => (
                    <span
                      key={e}
                      className="text-[9px] px-1.5 py-0.5 rounded-full font-medium"
                      style={{ background: "rgba(77,142,233,0.12)", color: "#5FBFFF", border: "1px solid rgba(77,142,233,0.2)" }}
                    >
                      {e}
                    </span>
                  ))}
                </div>
              </div>
            ))}
            <ArcButton variant="outline" size="sm" icon={Plus} className="w-full justify-center">
              Add webhook
            </ArcButton>
          </div>
        </SectionCard>

        {/* Networks */}
        <SectionCard title="Networks" icon={Globe}>
          <div className="space-y-3">
            {[
              { name: "Arc Testnet",     rpc: "https://rpc.testnet.arc.io",   connected: true,  chainId: "6532" },
              { name: "Ethereum Sepolia",rpc: "https://sepolia.infura.io/v3/••••", connected: true,  chainId: "11155111" },
              { name: "Arc Mainnet",     rpc: "Not configured",               connected: false, chainId: "6533" },
            ].map((net) => (
              <div
                key={net.name}
                className="flex items-center justify-between p-3 rounded-xl"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className="size-2 rounded-full"
                    style={{
                      background: net.connected ? "#34d399" : "#7a8fa8",
                      boxShadow: net.connected ? "0 0 6px rgba(52,211,153,0.8)" : "none",
                    }}
                  />
                  <div>
                    <p className="text-sm font-medium text-white">{net.name}</p>
                    <p className="text-[10px] font-mono" style={{ color: "#7a8fa8" }}>
                      {net.rpc} · chain {net.chainId}
                    </p>
                  </div>
                </div>
                <span
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                  style={
                    net.connected
                      ? { background: "rgba(52,211,153,0.1)", color: "#34d399", border: "1px solid rgba(52,211,153,0.2)" }
                      : { background: "rgba(122,143,168,0.08)", color: "#7a8fa8", border: "1px solid rgba(122,143,168,0.15)" }
                  }
                >
                  {net.connected ? "Connected" : "Disabled"}
                </span>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* Security */}
        <div className="col-span-2">
          <SectionCard title="Security & Limits" icon={Shield}>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <SettingRow label="Require approval for tx over" value="$50.00" action="Edit" />
                <SettingRow label="Auto-pause on budget breach" value="Enabled" action="Toggle" />
                <SettingRow label="IP whitelist" value="3 addresses" action="Manage" />
                <SettingRow label="Audit log retention" value="90 days" action="Edit" />
                <SettingRow label="2FA for withdrawals" value="Enabled" />
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#7a8fa8" }}>
                  Global Limits
                </p>
                {[
                  { label: "Daily global cap",   used: 120, limit: 300,  color: "#4d8ee9" },
                  { label: "Monthly global cap",  used: 1527, limit: 4400, color: "#5FBFFF" },
                ].map(({ label, used, limit, color }) => (
                  <div key={label} className="mb-4">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span style={{ color: "#7a8fa8" }}>{label}</span>
                      <span style={{ color }}>${used.toLocaleString()} / ${limit.toLocaleString()}</span>
                    </div>
                    <ArcProgress value={Math.round((used / limit) * 100)} showLabel />
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5 rounded-2xl p-4"
              style={{ background: "rgba(95,191,255,0.05)", border: "1px solid rgba(95,191,255,0.14)" }}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-white">Post-Quantum Readiness</p>
                  <p className="mt-1 text-xs leading-relaxed" style={{ color: "#94a3b8" }}>
                    Roadmap controls for long-lived wallets, agent identities, and settlement infrastructure as Arc and vendor support matures.
                  </p>
                </div>
                <span className="rounded-full px-2.5 py-1 text-[10px] font-semibold"
                  style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.25)", color: "#f59e0b" }}>
                  Roadmap
                </span>
              </div>

              <div className="mt-4 grid grid-cols-4 gap-2">
                {[
                  { label: "Signatures", value: "Migration plan" },
                  { label: "Transport", value: "PQ-safe TLS watch" },
                  { label: "Custody", value: "Key rotation" },
                  { label: "Recovery", value: "Wallet migration" },
                ].map((item) => (
                  <div key={item.label} className="min-w-0 rounded-xl px-3 py-2"
                    style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <p className="truncate text-[10px] uppercase tracking-widest" style={{ color: "#7a8fa8" }}>{item.label}</p>
                    <p className="mt-1 truncate text-xs font-semibold text-white">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  )
}
