export type AgentStatus = "active" | "paused" | "alert" | "idle"
export type TxCategory = "api_call" | "data_feed" | "compute" | "storage" | "bridge" | "swap" | "unknown"
export type TxStatus = "completed" | "pending" | "failed"

export interface Agent {
  id: string
  name: string
  address: string
  status: AgentStatus
  balance: number
  monthlyBudget: number
  monthlySpent: number
  dailyLimit: number
  dailySpent: number
  txCount: number
  lastActive: string
  network: string
  tags: string[]
  createdAt: string
}

export interface Transaction {
  id: string
  agentId: string
  agentName: string
  amount: number
  category: TxCategory
  description: string
  status: TxStatus
  timestamp: string
  txHash: string
  network: string
  recipient: string
  explorerUrl?: string | null
  sourceAddress?: string | null
  chainId?: number | null
  settlementId?: string | null
  memoLabel?: string | null
  memo?: Record<string, unknown>
}

export interface BudgetAlert {
  id: string
  agentId: string
  agentName: string
  type: "daily_limit" | "monthly_limit" | "low_balance" | "unusual_spend"
  severity: "warning" | "critical"
  message: string
  timestamp: string
  resolved: boolean
}

export const AGENTS: Agent[] = [
  {
    id: "agt_01",
    name: "DataHarvester-Pro",
    address: "0x1a2b...9f3c",
    status: "active",
    balance: 847.32,
    monthlyBudget: 1000,
    monthlySpent: 152.68,
    dailyLimit: 50,
    dailySpent: 12.4,
    txCount: 1847,
    lastActive: "2 min ago",
    network: "Arc",
    tags: ["data", "scraping", "production"],
    createdAt: "2025-03-01",
  },
  {
    id: "agt_02",
    name: "TradeBot-Alpha",
    address: "0x4d5e...2a1b",
    status: "alert",
    balance: 23.11,
    monthlyBudget: 500,
    monthlySpent: 476.89,
    dailyLimit: 30,
    dailySpent: 29.8,
    txCount: 4291,
    lastActive: "8 min ago",
    network: "Arc",
    tags: ["trading", "defi", "production"],
    createdAt: "2025-01-15",
  },
  {
    id: "agt_03",
    name: "ContentGen-v2",
    address: "0x7f8a...5c4d",
    status: "active",
    balance: 312.5,
    monthlyBudget: 400,
    monthlySpent: 87.5,
    dailyLimit: 20,
    dailySpent: 4.2,
    txCount: 623,
    lastActive: "1 hour ago",
    network: "Ethereum",
    tags: ["content", "ai", "staging"],
    createdAt: "2025-04-10",
  },
  {
    id: "agt_04",
    name: "ResearchAssist",
    address: "0x3c9d...8e7f",
    status: "paused",
    balance: 150.0,
    monthlyBudget: 200,
    monthlySpent: 50.0,
    dailyLimit: 15,
    dailySpent: 0,
    txCount: 289,
    lastActive: "3 days ago",
    network: "Arc",
    tags: ["research", "analysis"],
    createdAt: "2025-02-20",
  },
  {
    id: "agt_05",
    name: "IoT-Gateway-01",
    address: "0x6b1c...4d2e",
    status: "active",
    balance: 1240.0,
    monthlyBudget: 2000,
    monthlySpent: 760.0,
    dailyLimit: 100,
    dailySpent: 38.5,
    txCount: 18432,
    lastActive: "now",
    network: "Arc",
    tags: ["iot", "sensors", "production"],
    createdAt: "2024-12-01",
  },
  {
    id: "agt_06",
    name: "AuditBot-Corp",
    address: "0x9e2f...1a3b",
    status: "idle",
    balance: 82.50,          // ✅ below budget cap — logically consistent
    monthlyBudget: 300,
    monthlySpent: 0,
    dailyLimit: 25,
    dailySpent: 0,
    txCount: 0,
    lastActive: "never",
    network: "Arc",
    tags: ["audit", "compliance", "dev"],
    createdAt: "2025-05-28",
  },
]

// Per-agent sparkline data (7 days)
export const AGENT_SPARKLINES: Record<string, { value: number }[]> = {
  agt_01: [{ value: 18.2 }, { value: 22.1 }, { value: 15.4 }, { value: 28.9 }, { value: 19.8 }, { value: 31.2 }, { value: 12.4 }],
  agt_02: [{ value: 52.1 }, { value: 68.3 }, { value: 44.2 }, { value: 81.5 }, { value: 57.4 }, { value: 89.7 }, { value: 29.8 }],
  agt_03: [{ value: 8.4 }, { value: 9.1 }, { value: 7.8 }, { value: 11.2 }, { value: 6.9 }, { value: 14.1 }, { value: 4.2 }],
  agt_04: [{ value: 4.1 }, { value: 5.0 }, { value: 3.8 }, { value: 6.2 }, { value: 4.5 }, { value: 7.2 }, { value: 0 }],
  agt_05: [{ value: 10.7 }, { value: 13.3 }, { value: 11.1 }, { value: 12.6 }, { value: 11.6 }, { value: 13.3 }, { value: 15.7 }],
  agt_06: [{ value: 0 }, { value: 0 }, { value: 0 }, { value: 0 }, { value: 0 }, { value: 0 }, { value: 0 }],
}

// Previous week sparkline data for comparison
export const AGENT_SPARKLINES_PREV: Record<string, { value: number }[]> = {
  agt_01: [{ value: 16.0 }, { value: 19.5 }, { value: 14.2 }, { value: 21.3 }, { value: 17.8 }, { value: 24.6 }, { value: 14.9 }],
  agt_02: [{ value: 38.4 }, { value: 45.2 }, { value: 51.1 }, { value: 60.3 }, { value: 42.9 }, { value: 55.8 }, { value: 34.7 }],
  agt_03: [{ value: 7.1 }, { value: 8.5 }, { value: 6.3 }, { value: 10.4 }, { value: 5.8 }, { value: 9.2 }, { value: 7.0 }],
  agt_04: [{ value: 5.5 }, { value: 6.8 }, { value: 4.9 }, { value: 7.1 }, { value: 5.3 }, { value: 8.0 }, { value: 3.2 }],
  agt_05: [{ value: 9.2 }, { value: 11.0 }, { value: 10.4 }, { value: 10.8 }, { value: 9.7 }, { value: 11.5 }, { value: 12.1 }],
  agt_06: [{ value: 0 }, { value: 0 }, { value: 0 }, { value: 0 }, { value: 0 }, { value: 0 }, { value: 0 }],
}

// Weekly agent comparison bar chart
export const AGENT_BAR_DATA = [
  { name: "DataHarvester", value: 152.68, color: "#4d8ee9" },
  { name: "TradeBot",      value: 476.89, color: "#f87171" },
  { name: "ContentGen",    value: 87.5,   color: "#a78bfa" },
  { name: "ResearchAssist",value: 50.0,   color: "#f59e0b" },
  { name: "IoT-Gateway",   value: 760.0,  color: "#34d399" },
  { name: "AuditBot",      value: 0,      color: "#7a8fa8" },
]

export const TRANSACTIONS: Transaction[] = [
  { id: "tx_001", agentId: "agt_01", agentName: "DataHarvester-Pro", amount: 0.003, category: "api_call", description: "Weather API — real-time data fetch", status: "completed", timestamp: "2026-06-01T10:42:00Z", txHash: "0xabc1...ef01", network: "Arc", recipient: "0xWeatherAPI", memoLabel: "Weather feed invoice", memo: { schema: "arc-suite.memo.v1", purpose: "x402_api_payment", invoiceId: "inv_weather_1042", apiId: "api_03", agentId: "agt_01", workflow: "policy_check.usdc_settlement.reputation_update" } },
  { id: "tx_002", agentId: "agt_05", agentName: "IoT-Gateway-01", amount: 0.001, category: "data_feed", description: "Sensor stream — temperature batch", status: "completed", timestamp: "2026-06-01T10:41:30Z", txHash: "0xdef2...ab02", network: "Arc", recipient: "0xSensorHub", memoLabel: "Sensor batch payout", memo: { schema: "arc-suite.memo.v1", purpose: "batch_data_feed", payoutReference: "iot_batch_20260601_01", deviceGroup: "factory-floor-a", agentId: "agt_05" } },
  { id: "tx_003", agentId: "agt_02", agentName: "TradeBot-Alpha", amount: 12.5, category: "swap", description: "USDC → ETH swap via DEX", status: "completed", timestamp: "2026-06-01T10:40:00Z", txHash: "0xghi3...cd03", network: "Arc", recipient: "0xUniswap", memoLabel: "Rebalance route", memo: { schema: "arc-suite.memo.v1", purpose: "agent_swap", strategyId: "strat_delta_hedge", route: "USDC/ETH", venue: "Uniswap", agentId: "agt_02" } },
  { id: "tx_004", agentId: "agt_03", agentName: "ContentGen-v2", amount: 0.05, category: "compute", description: "LLM inference — 10k tokens", status: "completed", timestamp: "2026-06-01T10:38:00Z", txHash: "0xjkl4...ef04", network: "Ethereum", recipient: "0xOpenAI" },
  { id: "tx_005", agentId: "agt_01", agentName: "DataHarvester-Pro", amount: 0.002, category: "api_call", description: "CoinGecko price feed", status: "completed", timestamp: "2026-06-01T10:35:00Z", txHash: "0xmno5...gh05", network: "Arc", recipient: "0xCoinGecko" },
  { id: "tx_006", agentId: "agt_02", agentName: "TradeBot-Alpha", amount: 8.75, category: "swap", description: "ETH → USDC rebalance", status: "pending", timestamp: "2026-06-01T10:32:00Z", txHash: "0xpqr6...ij06", network: "Arc", recipient: "0xCurve" },
  { id: "tx_007", agentId: "agt_05", agentName: "IoT-Gateway-01", amount: 0.001, category: "storage", description: "IPFS pin — sensor snapshot", status: "completed", timestamp: "2026-06-01T10:30:00Z", txHash: "0xstu7...kl07", network: "Arc", recipient: "0xIPFS" },
  { id: "tx_008", agentId: "agt_03", agentName: "ContentGen-v2", amount: 0.08, category: "api_call", description: "Perplexity search — research query", status: "completed", timestamp: "2026-06-01T10:28:00Z", txHash: "0xvwx8...mn08", network: "Ethereum", recipient: "0xPerplexity" },
  { id: "tx_009", agentId: "agt_01", agentName: "DataHarvester-Pro", amount: 0.015, category: "bridge", description: "USDC bridge Arc → Ethereum", status: "failed", timestamp: "2026-06-01T10:25:00Z", txHash: "0xyza9...op09", network: "Arc", recipient: "0xCCTP" },
  { id: "tx_010", agentId: "agt_05", agentName: "IoT-Gateway-01", amount: 0.001, category: "data_feed", description: "Air quality index stream", status: "completed", timestamp: "2026-06-01T10:22:00Z", txHash: "0xbcd0...qr10", network: "Arc", recipient: "0xAQI" },
  { id: "tx_011", agentId: "agt_02", agentName: "TradeBot-Alpha", amount: 4.2, category: "api_call", description: "Bloomberg market data — premium tier", status: "completed", timestamp: "2026-06-01T09:55:00Z", txHash: "0xcde1...st11", network: "Arc", recipient: "0xBloomberg" },
  { id: "tx_012", agentId: "agt_01", agentName: "DataHarvester-Pro", amount: 0.004, category: "api_call", description: "Twitter API v2 — filtered stream", status: "completed", timestamp: "2026-06-01T09:50:00Z", txHash: "0xefg2...uv12", network: "Arc", recipient: "0xTwitter" },
]

export const ALERTS: BudgetAlert[] = [
  {
    id: "alrt_01",
    agentId: "agt_02",
    agentName: "TradeBot-Alpha",
    type: "monthly_limit",
    severity: "critical",
    message: "Monthly budget 95% used — $476.89 of $500.00 spent",
    timestamp: "2026-06-01T10:30:00Z",
    resolved: false,
  },
  {
    id: "alrt_02",
    agentId: "agt_02",
    agentName: "TradeBot-Alpha",
    type: "low_balance",
    severity: "critical",
    message: "Wallet balance critically low — $23.11 remaining",
    timestamp: "2026-06-01T10:30:00Z",
    resolved: false,
  },
  {
    id: "alrt_03",
    agentId: "agt_02",
    agentName: "TradeBot-Alpha",
    type: "daily_limit",
    severity: "warning",
    message: "Daily limit nearly reached — $29.80 of $30.00",
    timestamp: "2026-06-01T09:00:00Z",
    resolved: false,
  },
  {
    id: "alrt_04",
    agentId: "agt_05",
    agentName: "IoT-Gateway-01",
    type: "unusual_spend",
    severity: "warning",
    message: "Spending 2.4× higher than 7-day average",
    timestamp: "2026-05-31T22:00:00Z",
    resolved: true,
  },
]

// Jun 2026 — correct calendar: Jun 1 is Mon, week shown is May 26–Jun 1
export const SPEND_OVER_TIME = [
  { date: "Mon May 25", total: 89.4,  dataharvester: 18.2, tradebot: 52.1, contentgen: 8.4,  iot: 10.7 },
  { date: "Tue May 26", total: 112.8, dataharvester: 22.1, tradebot: 68.3, contentgen: 9.1,  iot: 13.3 },
  { date: "Wed May 27", total: 78.5,  dataharvester: 15.4, tradebot: 44.2, contentgen: 7.8,  iot: 11.1 },
  { date: "Thu May 28", total: 134.2, dataharvester: 28.9, tradebot: 81.5, contentgen: 11.2, iot: 12.6 },
  { date: "Fri May 29", total: 95.7,  dataharvester: 19.8, tradebot: 57.4, contentgen: 6.9,  iot: 11.6 },
  { date: "Sat May 30", total: 148.3, dataharvester: 31.2, tradebot: 89.7, contentgen: 14.1, iot: 13.3 },
  { date: "Sun May 31", total: 62.1,  dataharvester: 12.4, tradebot: 29.8, contentgen: 4.2,  iot: 15.7 },
]

export const CATEGORY_BREAKDOWN = [
  { name: "API Calls",   value: 38.4, color: "#4d8ee9" },
  { name: "Swaps",       value: 31.2, color: "#5FBFFF" },
  { name: "Compute",     value: 14.8, color: "#a78bfa" },
  { name: "Data Feeds",  value: 9.1,  color: "#34d399" },
  { name: "Storage",     value: 4.2,  color: "#f59e0b" },
  { name: "Bridge",      value: 2.3,  color: "#f87171" },
]

export const STATS = {
  totalAgents: AGENTS.length,
  activeAgents: AGENTS.filter(a => a.status === "active").length,
  totalUSDCManaged: Math.round(AGENTS.reduce((s, a) => s + a.balance, 0) * 100) / 100,
  monthlySpent: Math.round(AGENTS.reduce((s, a) => s + a.monthlySpent, 0) * 100) / 100,
  monthlyBudget: AGENTS.reduce((s, a) => s + a.monthlyBudget, 0),
  activeAlerts: ALERTS.filter(a => !a.resolved).length,
  totalTransactions: AGENTS.reduce((s, a) => s + a.txCount, 0),
  avgTxCost: 0.061,
}
