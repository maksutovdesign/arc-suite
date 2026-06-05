-- Arc Suite lightweight investor CRM.
-- Leads are linked to analytics through anonymous_id and session_id.

create table if not exists investor_leads (
  id text primary key,
  workspace_id text not null references workspaces(id),
  name text not null,
  email text not null,
  company text,
  role text,
  interest text not null default 'pilot' check (interest in ('pilot', 'investment', 'partnership', 'press', 'other')),
  message text,
  status text not null default 'new' check (status in ('new', 'contacted', 'qualified', 'closed')),
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

create index if not exists investor_leads_workspace_time_idx on investor_leads(workspace_id, created_at desc);
create index if not exists investor_leads_email_idx on investor_leads(email);
create index if not exists investor_leads_status_idx on investor_leads(workspace_id, status, created_at desc);
create index if not exists investor_leads_analytics_idx on investor_leads(anonymous_id, session_id) where anonymous_id is not null or session_id is not null;
