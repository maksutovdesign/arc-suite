export type TrustTier = "platinum" | "gold" | "silver" | "bronze" | "new"
export type EventType = "payment_completed" | "payment_failed" | "payment_denied" | "dispute_raised" | "dispute_resolved" | "fast_response" | "large_tx" | "new_service"

export interface Agent {
  id: string
  name: string
  address: string
  owner: string
  tier: TrustTier
  score: number          // 0–1000
  scoreChange: number    // delta last 30d
  totalTx: number
  successRate: number    // 0–100
  avgResponseMs: number
  totalVolumeUSDC: number
  disputeRate: number    // 0–100
  agedays: number
  tags: string[]
  network: string
  verified: boolean
  lastActive: string
  scoreBreakdown: {
    paymentHistory: number   // 0–250
    volumeConsistency: number
    responseTime: number
    disputeRecord: number
    accountAge: number
  }
}

export interface ReputationEvent {
  id: string
  agentId: string
  agentName: string
  type: EventType
  description: string
  scoreDelta: number
  timestamp: string
  txHash?: string
}

export const AGENTS: Agent[] = [
  {
    id: "agt_01",
    name: "DataHarvester-Pro",
    address: "0x1a2b3c4d...9f3c",
    owner: "0xOwner1",
    tier: "platinum",
    score: 961,
    scoreChange: +14,
    totalTx: 18432,
    successRate: 99.6,
    avgResponseMs: 142,
    totalVolumeUSDC: 48320.5,
    disputeRate: 0.02,
    agedays: 180,
    tags: ["data", "scraping", "api"],
    network: "Arc",
    verified: true,
    lastActive: "2 min ago",
    scoreBreakdown: { paymentHistory: 248, volumeConsistency: 230, responseTime: 245, disputeRecord: 250, accountAge: 188 },
  },
  {
    id: "agt_02",
    name: "IoT-Gateway-01",
    address: "0x6b1c2d3e...4d2e",
    owner: "0xOwner2",
    tier: "platinum",
    score: 944,
    scoreChange: +8,
    totalTx: 84201,
    successRate: 99.1,
    avgResponseMs: 98,
    totalVolumeUSDC: 112480.0,
    disputeRate: 0.05,
    agedays: 548,
    tags: ["iot", "sensors", "realtime"],
    network: "Arc",
    verified: true,
    lastActive: "now",
    scoreBreakdown: { paymentHistory: 243, volumeConsistency: 240, responseTime: 250, disputeRecord: 248, accountAge: 213 },
  },
  {
    id: "agt_03",
    name: "TradeBot-Alpha",
    address: "0x4d5e6f7a...2a1b",
    owner: "0xOwner3",
    tier: "gold",
    score: 812,
    scoreChange: -23,
    totalTx: 4291,
    successRate: 97.2,
    avgResponseMs: 310,
    totalVolumeUSDC: 29840.0,
    disputeRate: 1.2,
    agedays: 136,
    tags: ["trading", "defi", "swap"],
    network: "Arc",
    verified: true,
    lastActive: "8 min ago",
    scoreBreakdown: { paymentHistory: 210, volumeConsistency: 195, responseTime: 180, disputeRecord: 170, accountAge: 157 },
  },
  {
    id: "agt_04",
    name: "ContentGen-v2",
    address: "0x7f8a9b0c...5c4d",
    owner: "0xOwner4",
    tier: "gold",
    score: 789,
    scoreChange: +31,
    totalTx: 623,
    successRate: 98.5,
    avgResponseMs: 890,
    totalVolumeUSDC: 4210.0,
    disputeRate: 0.3,
    agedays: 51,
    tags: ["content", "ai", "llm"],
    network: "Ethereum",
    verified: false,
    lastActive: "1 hour ago",
    scoreBreakdown: { paymentHistory: 220, volumeConsistency: 185, responseTime: 150, disputeRecord: 234, accountAge: 100 },
  },
  {
    id: "agt_05",
    name: "ResearchAssist",
    address: "0x3c9d0e1f...8e7f",
    owner: "0xOwner5",
    tier: "silver",
    score: 634,
    scoreChange: +5,
    totalTx: 289,
    successRate: 96.1,
    avgResponseMs: 1240,
    totalVolumeUSDC: 1820.0,
    disputeRate: 0.7,
    agedays: 101,
    tags: ["research", "analysis"],
    network: "Arc",
    verified: false,
    lastActive: "3 days ago",
    scoreBreakdown: { paymentHistory: 165, volumeConsistency: 140, responseTime: 120, disputeRecord: 209, accountAge: 130 },
  },
  {
    id: "agt_06",
    name: "AuditBot-Corp",
    address: "0x9e2f3a4b...1a3b",
    owner: "0xOwner6",
    tier: "new",
    score: 150,
    scoreChange: +150,
    totalTx: 12,
    successRate: 100,
    avgResponseMs: 420,
    totalVolumeUSDC: 43.5,
    disputeRate: 0,
    agedays: 3,
    tags: ["audit", "compliance"],
    network: "Arc",
    verified: false,
    lastActive: "2 hours ago",
    scoreBreakdown: { paymentHistory: 50, volumeConsistency: 30, responseTime: 40, disputeRecord: 30, accountAge: 0 },
  },
]

export const EVENTS: ReputationEvent[] = [
  { id: "ev_01", agentId: "agt_01", agentName: "DataHarvester-Pro", type: "payment_completed", description: "Completed 500 micro-payments in batch", scoreDelta: +3, timestamp: "2026-06-01T10:42:00Z", txHash: "0xabc1...ef01" },
  { id: "ev_02", agentId: "agt_02", agentName: "IoT-Gateway-01", type: "fast_response", description: "Sub-100ms response streak: 1,000 transactions", scoreDelta: +5, timestamp: "2026-06-01T10:38:00Z" },
  { id: "ev_03", agentId: "agt_03", agentName: "TradeBot-Alpha", type: "dispute_raised", description: "Dispute filed on over-charge — $8.75 swap fee", scoreDelta: -18, timestamp: "2026-06-01T10:30:00Z", txHash: "0xpqr6...ij06" },
  { id: "ev_04", agentId: "agt_04", agentName: "ContentGen-v2", type: "new_service", description: "Started accepting x402 payments for LLM inference", scoreDelta: +10, timestamp: "2026-06-01T09:00:00Z" },
  { id: "ev_05", agentId: "agt_06", agentName: "AuditBot-Corp", type: "payment_completed", description: "First 10 successful payments recorded", scoreDelta: +50, timestamp: "2026-05-31T18:00:00Z", txHash: "0xnew1...0001" },
  { id: "ev_06", agentId: "agt_03", agentName: "TradeBot-Alpha", type: "dispute_resolved", description: "Dispute resolved — refund issued", scoreDelta: +8, timestamp: "2026-05-31T12:00:00Z" },
  { id: "ev_07", agentId: "agt_01", agentName: "DataHarvester-Pro", type: "large_tx", description: "Single transaction over $1,000 USDC completed", scoreDelta: +2, timestamp: "2026-05-30T16:20:00Z", txHash: "0xlrg1...0099" },
  { id: "ev_08", agentId: "agt_05", agentName: "ResearchAssist", type: "payment_failed", description: "Payment failed — insufficient balance", scoreDelta: -4, timestamp: "2026-05-29T11:00:00Z" },
  { id: "ev_09", agentId: "agt_03", agentName: "TradeBot-Alpha", type: "payment_denied", description: "Marketplace API rejected — trust score below required threshold (need ≥850, got 812)", scoreDelta: 0, timestamp: "2026-06-01T09:45:00Z", txHash: "0xden1...ff09" },
  { id: "ev_10", agentId: "agt_05", agentName: "ResearchAssist", type: "payment_denied", description: "Premium data feed rejected — Silver tier not eligible for this API tier", scoreDelta: 0, timestamp: "2026-05-31T15:20:00Z" },
]

export const TIER_CONFIG: Record<TrustTier, { label: string; color: string; bg: string; min: number; max: number }> = {
  platinum: { label: "Platinum", color: "text-sky-700", bg: "bg-sky-500/10 border-sky-500/30", min: 900, max: 1000 },
  gold:     { label: "Gold",     color: "text-yellow-700", bg: "bg-yellow-500/10 border-yellow-500/30", min: 700, max: 899 },
  silver:   { label: "Silver",   color: "text-slate-600",  bg: "bg-slate-500/10 border-slate-500/30",   min: 500, max: 699 },
  bronze:   { label: "Bronze",   color: "text-orange-700", bg: "bg-orange-500/10 border-orange-500/30", min: 250, max: 499 },
  new:      { label: "New",      color: "text-muted-foreground", bg: "bg-muted border-border",           min: 0,   max: 249 },
}

// 7-day score history per agent  (sparkline data)
export const SCORE_HISTORY: Record<string, { value: number }[]> = {
  agt_01: [
    { value: 920 }, { value: 930 }, { value: 938 }, { value: 942 }, { value: 947 }, { value: 955 }, { value: 961 },
  ],
  agt_02: [
    { value: 960 }, { value: 958 }, { value: 955 }, { value: 952 }, { value: 947 }, { value: 944 }, { value: 944 },
  ],
  agt_03: [
    { value: 850 }, { value: 842 }, { value: 835 }, { value: 830 }, { value: 820 }, { value: 812 }, { value: 812 },
  ],
  agt_04: [
    { value: 740 }, { value: 745 }, { value: 752 }, { value: 760 }, { value: 770 }, { value: 780 }, { value: 789 },
  ],
  agt_05: [
    { value: 620 }, { value: 624 }, { value: 626 }, { value: 629 }, { value: 631 }, { value: 633 }, { value: 634 },
  ],
  agt_06: [
    { value: 0 }, { value: 20 }, { value: 50 }, { value: 80 }, { value: 110 }, { value: 130 }, { value: 150 },
  ],
}

// Bar chart: score comparison across agents
export const SCORE_BAR_DATA = [
  { name: "DataHarvester",  value: 961, color: "#38bdf8" },
  { name: "IoT-Gateway",    value: 944, color: "#38bdf8" },
  { name: "TradeBot",       value: 812, color: "#facc15" },
  { name: "ContentGen",     value: 789, color: "#facc15" },
  { name: "ResearchAssist", value: 634, color: "#94a3b8" },
  { name: "AuditBot",       value: 150, color: "#7a8fa8" },
]

// Tier distribution over time
export const TIER_HISTORY = [
  { month: "Jan", platinum: 0, gold: 1, silver: 2, bronze: 1 },
  { month: "Feb", platinum: 1, gold: 1, silver: 2, bronze: 1 },
  { month: "Mar", platinum: 1, gold: 2, silver: 1, bronze: 1 },
  { month: "Apr", platinum: 2, gold: 2, silver: 1, bronze: 0 },
  { month: "May", platinum: 2, gold: 2, silver: 1, bronze: 0 },
]
