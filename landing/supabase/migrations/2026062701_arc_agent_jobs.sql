-- Arc Agent / Job model.
-- ERC-8004-compatible identity/reputation/validation registry surface plus an
-- ERC-8183-compatible job envelope for agent-to-agent work and x402 settlement.

create table if not exists arc_agent_identities (
  id text primary key,
  workspace_id text not null references workspaces(id) on delete cascade,
  agent_id text not null references agents(id) on delete cascade,
  standard text not null default 'erc_8004_compatible',
  registry_address text,
  agent_uri text not null,
  service_endpoint text not null,
  wallet_address text not null,
  validation_endpoint text not null,
  reputation_endpoint text not null,
  capabilities text[] not null default '{}',
  trust_model jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  status text not null default 'registered' check (status in ('registered', 'active', 'suspended', 'retired')),
  registered_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, agent_id)
);

create table if not exists arc_agent_jobs (
  id text primary key,
  workspace_id text not null references workspaces(id) on delete cascade,
  agent_identity_id text not null references arc_agent_identities(id) on delete cascade,
  requester_agent_id text not null references agents(id),
  provider_agent_id text not null references agents(id),
  api_id text not null references api_listings(id),
  flow_run_id text references flow_runs(id),
  execution_job_id text references execution_jobs(id),
  standard text not null default 'erc_8183_compatible',
  kind text not null check (kind in ('api_request', 'data_delivery', 'settlement', 'validation')),
  status text not null default 'requested' check (status in ('requested', 'accepted', 'running', 'settled', 'validated', 'failed', 'disputed')),
  requested_capability text not null,
  amount_usdc numeric(18, 6) not null check (amount_usdc >= 0),
  input_hash text not null,
  output_hash text,
  policy_hash text not null,
  receipt_hash text,
  settlement_id text references arc_settlements(id),
  tx_hash text,
  constraints jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists arc_agent_job_artifacts (
  id text primary key,
  workspace_id text not null references workspaces(id) on delete cascade,
  job_id text not null references arc_agent_jobs(id) on delete cascade,
  type text not null check (type in ('input', 'output', 'x402_offer', 'payment_authorization', 'receipt', 'validation')),
  uri text not null,
  digest text not null,
  signature text,
  created_at timestamptz not null default now()
);

create table if not exists arc_agent_job_validations (
  id text primary key,
  workspace_id text not null references workspaces(id) on delete cascade,
  job_id text not null references arc_agent_jobs(id) on delete cascade,
  validator_agent_id text references agents(id),
  result text not null check (result in ('pass', 'warn', 'fail')),
  score integer not null check (score >= 0 and score <= 1000),
  evidence_uri text not null,
  evidence_hash text not null,
  signature text not null,
  created_at timestamptz not null default now()
);

create index if not exists arc_agent_identities_workspace_idx
  on arc_agent_identities(workspace_id, status, updated_at desc);

create index if not exists arc_agent_jobs_workspace_idx
  on arc_agent_jobs(workspace_id, status, created_at desc);

create index if not exists arc_agent_jobs_flow_idx
  on arc_agent_jobs(flow_run_id) where flow_run_id is not null;

create index if not exists arc_agent_job_artifacts_job_idx
  on arc_agent_job_artifacts(job_id, created_at desc);

create index if not exists arc_agent_job_validations_job_idx
  on arc_agent_job_validations(job_id, created_at desc);

alter table arc_agent_identities enable row level security;
alter table arc_agent_jobs enable row level security;
alter table arc_agent_job_artifacts enable row level security;
alter table arc_agent_job_validations enable row level security;

revoke all on table arc_agent_identities, arc_agent_jobs, arc_agent_job_artifacts, arc_agent_job_validations from anon, authenticated;
grant all on table arc_agent_identities, arc_agent_jobs, arc_agent_job_artifacts, arc_agent_job_validations to service_role;
