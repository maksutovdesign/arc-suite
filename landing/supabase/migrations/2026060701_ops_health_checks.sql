-- Arc Suite production monitor history.
-- Stores append-only health snapshots for the Ops Health dashboard.

create table if not exists ops_health_checks (
  id text primary key,
  workspace_id text not null references workspaces(id),
  monitor_name text not null default 'Arc Suite Production Monitor',
  source text not null default 'github_actions' check (source in ('github_actions', 'local', 'manual')),
  status text not null check (status in ('ok', 'warn', 'failed', 'test')),
  check_count integer not null default 0,
  warning_count integer not null default 0,
  failure_count integer not null default 0,
  duration_ms integer not null default 0,
  latency_warn_ms integer,
  latency_fail_ms integer,
  branch text,
  commit_sha text,
  run_id text,
  run_url text,
  results jsonb not null default '[]'::jsonb,
  warnings jsonb not null default '[]'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists ops_health_checks_workspace_time_idx on ops_health_checks(workspace_id, created_at desc);
create index if not exists ops_health_checks_status_time_idx on ops_health_checks(status, created_at desc);
create index if not exists ops_health_checks_run_idx on ops_health_checks(run_id) where run_id is not null;
