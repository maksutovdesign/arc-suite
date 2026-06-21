-- Arc Flow orchestration audit trail.
-- Links compliance screening, access policy, settlement and reputation updates.

create table if not exists flow_runs (
  id text primary key,
  workspace_id text not null references workspaces(id) on delete cascade,
  idempotency_key text not null,
  agent_id text not null references agents(id),
  api_id text not null references api_listings(id),
  recipient_address text not null,
  screening_chain text not null,
  amount_usdc numeric(18, 6) not null check (amount_usdc > 0),
  status text not null check (status in ('running', 'completed', 'review', 'blocked', 'failed')),
  current_step text not null check (current_step in ('screening', 'access', 'settlement', 'reputation')),
  steps jsonb not null default '[]'::jsonb,
  screening_id text references compliance_screenings(id),
  screening_decision text check (screening_decision is null or screening_decision in ('allow', 'review', 'block')),
  access_decision_id text references access_decisions(id),
  access_allowed boolean,
  settlement_id text references arc_settlements(id),
  tx_hash text,
  explorer_url text,
  reputation_score_before integer,
  reputation_score_after integer,
  error_code text,
  error_message text,
  request_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz,
  unique (workspace_id, idempotency_key)
);

create index if not exists flow_runs_workspace_time_idx
  on flow_runs(workspace_id, created_at desc);

create index if not exists flow_runs_agent_time_idx
  on flow_runs(agent_id, created_at desc);

create index if not exists flow_runs_status_idx
  on flow_runs(workspace_id, status, created_at desc);

alter table flow_runs enable row level security;

revoke all on table flow_runs from anon, authenticated;
grant all on table flow_runs to service_role;
