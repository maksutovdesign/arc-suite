-- Arc Suite workspace/session boundary for the pilot MVP.
-- API key values are never stored directly; only SHA-256 hashes are persisted.

create table if not exists workspace_members (
  id text primary key,
  workspace_id text not null references workspaces(id),
  email text not null,
  name text not null,
  role text not null check (role in ('owner', 'admin', 'operator', 'viewer')),
  created_at timestamptz not null default now(),
  last_active_at timestamptz
);

create table if not exists workspace_api_keys (
  id text primary key,
  workspace_id text not null references workspaces(id),
  name text not null,
  key_hash text not null unique,
  key_prefix text not null,
  scopes text[] not null default '{read}',
  created_by text references workspace_members(id),
  created_at timestamptz not null default now(),
  last_used_at timestamptz,
  rotated_at timestamptz,
  revoked_at timestamptz
);

create index if not exists workspace_members_workspace_idx on workspace_members(workspace_id, role);
create index if not exists workspace_api_keys_workspace_idx on workspace_api_keys(workspace_id, revoked_at, created_at desc);
create index if not exists workspace_api_keys_hash_idx on workspace_api_keys(key_hash) where revoked_at is null;

insert into workspace_members (id, workspace_id, email, name, role)
values
  ('mem_arc_owner', 'wrk_arc_demo', 'founder@arcsuite.dev', 'Arc Suite Founder', 'owner'),
  ('mem_arc_ops', 'wrk_arc_demo', 'ops@arcsuite.dev', 'Pilot Ops', 'operator')
on conflict (id) do nothing;
