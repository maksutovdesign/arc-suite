-- Chainlink on Arc oracle/CCIP evidence trail.
-- This stores reviewer-visible risk signals before the app switches to live
-- Chainlink Data Feeds, Proof of Reserve, or CCIP reads.

create table if not exists oracle_risk_signals (
  id text primary key,
  workspace_id text not null references workspaces(id),
  idempotency_key text not null,
  signal_type text not null
    check (signal_type in ('market_data', 'proof_of_reserve', 'ccip_route')),
  subject text not null,
  source text not null default 'chainlink_on_arc'
    check (source = 'chainlink_on_arc'),
  source_status text not null
    check (source_status in ('simulated_observation', 'live_observation', 'provider_error')),
  result text not null
    check (result in ('pass', 'review', 'block')),
  value text not null,
  threshold text not null,
  data_source text not null,
  ccip_router text not null,
  chain_selector text not null,
  digest text not null,
  evidence jsonb not null default '{}'::jsonb,
  request_id text,
  observed_at timestamptz not null,
  created_at timestamptz not null default now(),
  unique (workspace_id, idempotency_key)
);

create index if not exists oracle_risk_signals_workspace_time_idx
  on oracle_risk_signals(workspace_id, created_at desc);

create index if not exists oracle_risk_signals_subject_time_idx
  on oracle_risk_signals(workspace_id, subject, created_at desc);

create index if not exists oracle_risk_signals_type_result_time_idx
  on oracle_risk_signals(workspace_id, signal_type, result, created_at desc);
