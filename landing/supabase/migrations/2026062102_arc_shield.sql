-- Arc Shield compliance screening audit trail.
-- Provider recommendations and Arc Shield policy decisions are stored separately.

create table if not exists compliance_screenings (
  id text primary key,
  workspace_id text not null references workspaces(id),
  idempotency_key uuid not null,
  address text not null,
  chain text not null,
  provider text not null default 'circle_compliance_engine'
    check (provider = 'circle_compliance_engine'),
  provider_screening_id text,
  provider_result text,
  provider_status text not null
    check (provider_status in ('completed', 'provider_error')),
  decision text not null
    check (decision in ('allow', 'review', 'block')),
  decision_reason text not null,
  rule_name text,
  actions jsonb not null default '[]'::jsonb,
  risk_score text not null default 'UNKNOWN',
  risk_categories jsonb not null default '[]'::jsonb,
  reasons jsonb not null default '[]'::jsonb,
  alert_id text,
  raw_response jsonb not null default '{}'::jsonb,
  request_id text,
  created_at timestamptz not null default now(),
  unique (workspace_id, idempotency_key)
);

create index if not exists compliance_screenings_workspace_time_idx
  on compliance_screenings(workspace_id, created_at desc);

create index if not exists compliance_screenings_address_time_idx
  on compliance_screenings(address, created_at desc);

create index if not exists compliance_screenings_decision_time_idx
  on compliance_screenings(workspace_id, decision, created_at desc);
