-- Arc Suite conversion analytics.
-- Tracks landing CTA clicks and demo product events without storing raw IP addresses.

create table if not exists analytics_events (
  id text primary key,
  workspace_id text not null references workspaces(id),
  event_name text not null,
  source text not null check (source in ('landing', 'treasury', 'reputation', 'marketplace')),
  surface text,
  placement text,
  anonymous_id text,
  session_id text,
  path text,
  url text,
  referrer text,
  user_agent text,
  ip_hash text,
  properties jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists analytics_events_workspace_time_idx on analytics_events(workspace_id, created_at desc);
create index if not exists analytics_events_event_time_idx on analytics_events(event_name, created_at desc);
create index if not exists analytics_events_source_time_idx on analytics_events(source, created_at desc);
create index if not exists analytics_events_anonymous_idx on analytics_events(anonymous_id, created_at desc) where anonymous_id is not null;
