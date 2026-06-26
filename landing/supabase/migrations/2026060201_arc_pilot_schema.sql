-- Arc Suite pilot MVP schema for Supabase/Postgres.
-- Run this migration before setting SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.

create table if not exists workspaces (
  id text primary key,
  name text not null,
  mode text not null default 'pilot',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists agents (
  id text primary key,
  workspace_id text not null references workspaces(id),
  name text not null,
  address text not null,
  status text not null check (status in ('active', 'paused', 'alert', 'idle')),
  network text not null check (network in ('Arc', 'Ethereum')),
  balance_usdc numeric(18, 6) not null default 0,
  monthly_budget_usdc numeric(18, 6) not null default 0,
  monthly_spent_usdc numeric(18, 6) not null default 0,
  daily_limit_usdc numeric(18, 6) not null default 0,
  daily_spent_usdc numeric(18, 6) not null default 0,
  tx_count integer not null default 0,
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  last_active_at timestamptz
);

create table if not exists transactions (
  id text primary key,
  workspace_id text not null references workspaces(id),
  agent_id text not null references agents(id),
  amount_usdc numeric(18, 6) not null,
  category text not null check (category in ('api_call', 'data_feed', 'compute', 'storage', 'bridge', 'swap')),
  description text not null,
  status text not null check (status in ('completed', 'pending', 'failed')),
  occurred_at timestamptz not null,
  tx_hash text not null,
  network text not null check (network in ('Arc', 'Ethereum')),
  recipient text not null,
  memo_label text,
  memo jsonb not null default '{}'::jsonb
);

create table if not exists budget_alerts (
  id text primary key,
  workspace_id text not null references workspaces(id),
  agent_id text not null references agents(id),
  type text not null check (type in ('daily_limit', 'monthly_limit', 'low_balance', 'unusual_spend')),
  severity text not null check (severity in ('warning', 'critical')),
  message text not null,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create table if not exists reputation_profiles (
  agent_id text primary key references agents(id),
  score integer not null check (score >= 0 and score <= 1000),
  score_change_30d integer not null default 0,
  tier text not null check (tier in ('Platinum', 'Gold', 'Silver', 'New')),
  payment_reliability integer not null,
  volume_consistency integer not null,
  response_time integer not null,
  dispute_history integer not null,
  account_age integer not null,
  updated_at timestamptz not null default now()
);

create table if not exists api_providers (
  id text primary key,
  name text not null,
  verified boolean not null default false
);

create table if not exists api_listings (
  id text primary key,
  provider_id text not null references api_providers(id),
  name text not null,
  category text not null check (category in ('Finance', 'AI / LLM', 'Data feeds', 'Compute', 'Oracles')),
  price_usdc numeric(18, 6) not null,
  pricing_unit text not null,
  uptime_pct numeric(6, 3) not null,
  request_count bigint not null default 0,
  min_reputation_score integer not null default 700
);

create table if not exists access_decisions (
  id text primary key,
  workspace_id text not null references workspaces(id),
  agent_id text not null references agents(id),
  api_id text not null references api_listings(id),
  amount_usdc numeric(18, 6) not null,
  allowed boolean not null,
  reason text not null,
  required_score integer not null,
  score integer not null,
  monthly_budget_used_pct integer not null,
  daily_budget_used_pct integer not null,
  created_at timestamptz not null default now()
);

create index if not exists transactions_workspace_time_idx on transactions(workspace_id, occurred_at desc);
create index if not exists agents_workspace_status_idx on agents(workspace_id, status);
create index if not exists budget_alerts_open_idx on budget_alerts(workspace_id, resolved_at) where resolved_at is null;
create index if not exists reputation_score_idx on reputation_profiles(score desc);
create index if not exists access_decisions_workspace_time_idx on access_decisions(workspace_id, created_at desc);
