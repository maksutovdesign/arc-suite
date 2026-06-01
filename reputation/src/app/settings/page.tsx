import { Key, Webhook, Bell, Shield, Code } from "lucide-react"
import { PageHeader } from "@/components/dashboard/PageHeader"
import { ArcButton } from "@/components/ui/ArcButton"

const SECTION = ({ title, icon: Icon, color, children }: { title: string; icon: typeof Key; color: string; children: React.ReactNode }) => (
  <div className="rounded-2xl overflow-hidden"
    style={{ background: "linear-gradient(160deg,#263a52,#1e3247)", border: "1px solid rgba(255,255,255,0.08)" }}>
    <div className="flex items-center gap-2 px-5 py-3.5 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
      <div className="size-6 rounded-lg flex items-center justify-center" style={{ background: `${color}18` }}>
        <Icon className="size-3.5" style={{ color }} />
      </div>
      <p className="text-sm font-semibold text-white">{title}</p>
    </div>
    <div className="p-5">{children}</div>
  </div>
)

export default function SettingsPage() {
  return (
    <div className="flex flex-col min-h-full">
      <PageHeader title="Settings" subtitle="API keys, webhooks and notification preferences" icon={Shield} glow />
      <div className="p-6 max-w-2xl space-y-4">

        <SECTION title="API Keys" icon={Key} color="#5FBFFF">
          <div className="space-y-3">
            {[
              { name: "Reputation Read API", key: "rep_live_••••••••••••••••••3f9a", active: true },
              { name: "Webhook Signing Secret", key: "whsec_••••••••••••••••••••7b2c", active: true },
            ].map(({ name, key, active }) => (
              <div key={name} className="flex items-center justify-between p-3 rounded-xl"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div>
                  <p className="text-sm font-medium text-white">{name}</p>
                  <p className="text-[11px] font-mono mt-0.5" style={{ color: "#3d5a74" }}>{key}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                    style={active
                      ? { background: "rgba(52,211,153,0.1)", color: "#34d399", border: "1px solid rgba(52,211,153,0.2)" }
                      : { background: "rgba(122,143,168,0.1)", color: "#7a8fa8", border: "1px solid rgba(122,143,168,0.2)" }}>
                    {active ? "Active" : "Inactive"}
                  </span>
                  <ArcButton variant="outline" size="sm">Rotate</ArcButton>
                </div>
              </div>
            ))}
            <ArcButton variant="outline" size="sm" icon={Key} className="w-full justify-center">
              Generate new key
            </ArcButton>
          </div>
        </SECTION>

        <SECTION title="Webhooks" icon={Webhook} color="#a78bfa">
          <div className="space-y-3">
            <div className="p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <p className="text-sm font-medium text-white mb-0.5">Slack alerts</p>
              <p className="text-[11px] mb-2" style={{ color: "#7a8fa8" }}>https://hooks.slack.com/services/•••</p>
              <div className="flex gap-1.5 flex-wrap">
                {["score.change", "tier.upgrade", "dispute.raised"].map(ev => (
                  <span key={ev} className="text-[10px] px-1.5 py-0.5 rounded-md"
                    style={{ background: "rgba(167,139,250,0.1)", color: "#a78bfa", border: "1px solid rgba(167,139,250,0.2)" }}>
                    {ev}
                  </span>
                ))}
              </div>
            </div>
            <ArcButton variant="outline" size="sm" icon={Webhook} className="w-full justify-center">Add webhook</ArcButton>
          </div>
        </SECTION>

        <SECTION title="Score Alert Thresholds" icon={Bell} color="#f59e0b">
          <div className="space-y-2">
            {[
              { label: "Alert when score drops below", value: "700" },
              { label: "Alert when dispute rate exceeds", value: "2.0%" },
              { label: "Notify on tier change", value: "Enabled" },
              { label: "Notify on new dispute", value: "Enabled" },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between py-2 border-b"
                style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                <span className="text-sm" style={{ color: "#7a8fa8" }}>{label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-white">{value}</span>
                  <ArcButton variant="ghost" size="sm">Edit</ArcButton>
                </div>
              </div>
            ))}
          </div>
        </SECTION>

        <SECTION title="Score Query API" icon={Code} color="#34d399">
          <div className="rounded-xl overflow-hidden" style={{ background: "#0d1b2a", border: "1px solid rgba(52,211,153,0.15)" }}>
            <pre className="px-4 py-3 text-[11px] leading-relaxed" style={{ color: "#94a3b8", fontFamily: "'Space Mono', monospace" }}>
{`// Check any agent's score before transacting
GET https://reputation.arc.io/v1/agents/:id

// Batch query
POST https://reputation.arc.io/v1/agents/batch
{ "ids": ["agt_01", "agt_02", ...] }

// Webhooks — receive score updates in real-time
POST https://your-server.com/webhook
{ "event": "score.change", "agent": "agt_01",
  "old": 890, "new": 961, "delta": +71 }`}
            </pre>
          </div>
        </SECTION>
      </div>
    </div>
  )
}
