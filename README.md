# Arc Suite — AI Agent Infrastructure for the Onchain Economy

> **Three interconnected applications built on [Arc](https://arc.io) and [Circle](https://circle.com) — demonstrating what the agentic economy looks like when AI agents can spend, earn trust, and pay for services autonomously using USDC.**

Built with **Next.js 16**, **TypeScript**, **Tailwind CSS v4**, **shadcn/ui v4**, and the **Arc / Circle SDK**.

---

## Live Demos

| App | URL | Description |
|-----|-----|-------------|
| 💰 **Arc Treasury** | [treasury-umber.vercel.app](https://treasury-umber.vercel.app) | Budget manager for AI agent wallets |
| 🛡️ **Arc Reputation** | [reputation-five.vercel.app](https://reputation-five.vercel.app) | On-chain trust scoring layer for agents |
| 🛒 **Arc Marketplace** | [marketplace-eosin-eight.vercel.app](https://marketplace-eosin-eight.vercel.app) | Discovery platform for x402-enabled APIs |

---

## The Story

Three AI agents — **DataHarvester-Pro**, **TradeBot-Alpha**, and **IoT-Gateway-01** — exist across all three apps. Follow their journey:

1. **Treasury**: TradeBot-Alpha has consumed 95% of its monthly budget and triggered 3 critical alerts.
2. **Reputation**: TradeBot-Alpha's trust score is declining (-23 pts in 30 days, tier: Gold).
3. **Marketplace**: A premium data API **rejects** TradeBot-Alpha — trust score 812 is below the required threshold of 850.

This is the enforcement loop: *spend drives behavior, behavior drives reputation, reputation gates access.*

---

## Apps

### 💰 Arc Treasury — Agent Budget Manager

**`/treasury`** · [Live](https://treasury-umber.vercel.app)

A B2B dashboard for teams deploying AI agents on Arc. Treasury gives operators full visibility and control over every USDC spent by every agent.

**Key features:**
- Real-time dashboard with spend-over-time charts, category breakdowns, and live transaction ticker
- Per-agent budget controls — monthly limits, daily caps, auto-pause on breach
- Critical alert system with Slack/webhook notifications
- Transaction history with full categorization (API calls, swaps, compute, storage, bridge)
- Expense reports with CSV export
- Multi-network support (Arc Testnet, Ethereum Sepolia)
- New agent onboarding modal with wallet creation via Circle Developer Controlled Wallets

**Pages:** Dashboard · Agents · Transactions · Budgets & Alerts · Reports · Settings

---

### 🛡️ Arc Reputation — Agent Trust Layer

**`/reputation`** · [Live](https://reputation-five.vercel.app)

A trust oracle for AI agents. Every on-chain transaction, dispute, and response-time measurement feeds into a **0–1000 score** across 5 dimensions. APIs and services can query this score in real time to gate access — no subscriptions, no manual verification.

**Key features:**
- Live leaderboard with 7-day sparklines, tier badges, and search/filter
- Five-dimension score breakdown: Payment History, Volume Consistency, Response Time, Dispute Record, Account Age
- `payment_denied` events — showing when agents are blocked due to low trust
- Compare page: side-by-side score breakdown, metrics table, and sparklines for any two agents
- Agent detail pages with full event history and API code snippet
- Trust tier system: Platinum → Gold → Silver → Bronze → New
- Developer docs with 5 API endpoints, 3 integration patterns, and webhook reference
- Real-time event feed (score changes, disputes, fast-response streaks)

**Pages:** Leaderboard · Agents · Agent Detail · Compare · Events · Tiers · Reports · Docs · Settings

**API Reference** (preview):
```bash
GET  /v1/agents/:id          # Full reputation profile
POST /v1/agents/batch        # Query up to 100 agents
GET  /v1/agents/:id/history  # Score history (N days)
GET  /v1/leaderboard         # Top 100 ranked agents
POST /v1/webhooks            # Subscribe to score events
```

---

### 🛒 Arc Marketplace — x402 API Discovery

**`/marketplace`** · [Live](https://marketplace-eosin-eight.vercel.app)

A discovery platform for APIs that accept payments via the [x402 protocol](https://x402.org) — pay per request with USDC, no subscriptions, no accounts. Built for the agentic economy where software pays software autonomously.

**Key features:**
- Browse 16+ live APIs across 8 categories (Finance, AI/LLM, Data, Identity, Storage, Compute, Oracles, Messaging)
- Full-text search with sort by rating, volume, uptime, and price
- 7-day request volume sparklines on every API card
- Featured APIs section with editor's picks
- API detail pages with TypeScript code snippets, reviews, SLA stats, and pricing sidebar
- Provider profiles with trust scores and portfolio
- Submit API form — list your x402-enabled endpoint in minutes
- Analytics dashboard: request volumes by category, uptime comparison, top-rated APIs
- x402 protocol explainer page

**Pages:** Browse · API Detail · Categories · Providers · Provider Detail · Analytics · x402 · Submit

---

## Monorepo Structure

```
arc/
├── treasury/        # Next.js app — Agent Budget Manager
├── reputation/      # Next.js app — Agent Trust Layer
├── marketplace/     # Next.js app — x402 API Marketplace
├── package.json     # Workspace root
└── README.md
```

Each app is an independent Next.js 16 project sharing:
- **Design system**: Space Grotesk font, Arc dark theme, `ArcButton`, `ArcProgress`, `StatCard`, `PageHeader`
- **EcosystemNav**: top bar linking all three apps together
- **LiveTicker**: animated real-time event feed in each app's header

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, static export) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS v4 + shadcn/ui v4 |
| UI Primitives | `@base-ui/react` |
| Charts | Recharts 3 |
| Icons | Lucide React |
| Fonts | Space Grotesk + Space Mono |
| Blockchain | Arc Testnet (Chain ID: 5042002, USDC as gas) |
| Payments | x402 protocol + Circle USDC |
| Wallet SDK | `@circle-fin/developer-controlled-wallets` |
| Deploy | Vercel |

---

## Getting Started

### Prerequisites
- Node.js 22+
- npm 10+

### Pilot API database

The landing app exposes the Arc Suite pilot API. By default it uses the bundled demo seed.
To switch it to Supabase/Postgres, run:

```sql
-- Supabase SQL Editor or Supabase CLI
landing/supabase/migrations/2026060201_arc_pilot_schema.sql
landing/supabase/migrations/2026060202_workspace_auth.sql
landing/supabase/migrations/2026060501_analytics_events.sql
landing/supabase/migrations/2026060502_investor_leads.sql
landing/supabase/migrations/2026060601_rate_limit_events.sql
landing/supabase/seed.sql
```

Then configure the landing deployment:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...
ARC_WORKSPACE_ID=wrk_arc_demo
ARC_ANALYTICS_SALT=...
CRON_SECRET=...
```

When these env vars are present, `/api/pilot/summary`, `/api/agents`,
`/api/transactions`, `/api/reputation/:agentId`, and `/api/access/check`
read from Supabase. If Supabase is unavailable, the API falls back to demo seed data.
`/api/health` reports whether the API is using Supabase or seed data. Protected
`/api/readiness` verifies required Supabase tables for production operation.
Protected `/api/ops/rate-limits/cleanup` removes old rate-limit buckets; Vercel
Cron runs it daily when `CRON_SECRET` is configured.

Conversion analytics are captured through `/api/analytics/events` and summarized
through protected `/api/analytics/summary`. The tracked funnel events are demo,
investor page, GitHub, X, and Treasury access-check interactions.

Investor CRM light is captured through `/api/leads` and listed through protected
`GET /api/leads`. Leads store the same anonymous/session ids used by analytics.
Public lead, analytics, and access-check endpoints are rate-limited. Leads also
include an invisible honeypot field to filter simple bot submissions.

### Run locally

```bash
# Clone
git clone https://github.com/maksutovdesign/arc.git
cd arc

# Install all workspaces
npm install

# Verify all apps
npm run lint:all
npm run build:all
npm run test:smoke
npm run monitor:prod

# Run each app (separate terminals)
npm run dev --workspace=landing    # → http://localhost:3000
npm run dev --workspace=treasury    # → http://localhost:3001
npm run dev --workspace=reputation  # → http://localhost:3002
npm run dev --workspace=marketplace # → http://localhost:3003
```

`monitor:prod` checks production health, Supabase data source, readiness access
guards, CORS preflight, security headers, and the four public app surfaces. GitHub
Actions also runs this monitor every 30 minutes through `Arc Suite Production Monitor`.
When that monitor fails, it can notify Slack and Sentry. Add either or both GitHub
repository secrets:

- `ARC_SLACK_WEBHOOK_URL` or `SLACK_WEBHOOK_URL` for a Slack Incoming Webhook.
- `ARC_SENTRY_DSN` or `SENTRY_DSN` for a Sentry project DSN.

The notifier is dependency-free and skips missing sinks, so the workflow stays usable
before alert destinations are configured.

### Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy Treasury
cd treasury && vercel --prod

# Deploy Reputation
cd ../reputation && vercel --prod

# Deploy Marketplace
cd ../marketplace && vercel --prod
```

---

## Integrating with Arc

To connect to the real Arc Testnet, add these environment variables to each app:

```env
# Circle / Arc
CIRCLE_API_KEY=sk_live_...
CIRCLE_ENTITY_SECRET=...

# Arc Testnet RPC
NEXT_PUBLIC_ARC_RPC=https://rpc.testnet.arc.network
NEXT_PUBLIC_ARC_CHAIN_ID=5042002

# x402 signing key (Marketplace)
X402_PRIVATE_KEY=0x...
```

Arc Testnet parameters:
- **Chain ID**: 5042002
- **Native gas token**: USDC (18 decimals)
- **Block explorer**: [testnet.arcscan.app](https://testnet.arcscan.app)
- **Faucet**: [faucet.circle.com](https://faucet.circle.com)

---

## Built for Arc/Circle

These apps were designed to showcase the Arc ecosystem to the **Arc community** and **Circle team** — demonstrating three complementary products that together form an infrastructure layer for the agentic economy:

- **Treasury** answers: *"How do I control what my agents spend?"*
- **Reputation** answers: *"How do I know which agents I can trust?"*
- **Marketplace** answers: *"Where do agents find services to pay for?"*

---

## License

MIT
