-- Arc Suite public endpoint rate-limit audit.
-- Stores short-lived request buckets without raw IP addresses.

create table if not exists rate_limit_events (
  id text primary key,
  workspace_id text not null references workspaces(id),
  route text not null,
  bucket_key text not null,
  ip_hash text,
  created_at timestamptz not null default now()
);

create index if not exists rate_limit_events_bucket_time_idx on rate_limit_events(route, bucket_key, created_at desc);
create index if not exists rate_limit_events_cleanup_idx on rate_limit_events(created_at);
