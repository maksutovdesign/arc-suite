-- Arc Wallet OS: custody models, team roles, signing policies and wallet lifecycle.

create table if not exists wallet_accounts (
  id text primary key,
  workspace_id text not null references workspaces(id) on delete cascade,
  name text not null,
  owner_label text not null,
  custody_model text not null check (custody_model in ('developer', 'user', 'modular')),
  account_type text not null check (account_type in ('EOA', 'SCA', 'MSCA')),
  status text not null default 'provisioning' check (status in ('provisioning', 'active', 'recovery', 'suspended', 'retired')),
  network text not null default 'ARC-TESTNET',
  address text,
  circle_wallet_id text,
  circle_wallet_set_id text,
  auth_method text not null check (auth_method in ('entity_secret', 'social', 'email_otp', 'pin', 'passkey')),
  recovery_method text not null check (recovery_method in ('entity_secret_backup', 'security_questions', 'passkey_backup', 'admin_assisted')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_signed_at timestamptz,
  unique (workspace_id, name)
);

create table if not exists wallet_roles (
  id text primary key,
  workspace_id text not null references workspaces(id) on delete cascade,
  wallet_id text not null references wallet_accounts(id) on delete cascade,
  principal text not null,
  role text not null check (role in ('owner', 'approver', 'operator', 'viewer')),
  status text not null default 'active' check (status in ('active', 'revoked')),
  created_at timestamptz not null default now(),
  revoked_at timestamptz,
  unique (wallet_id, principal, role)
);

create table if not exists wallet_signing_policies (
  id text primary key,
  workspace_id text not null references workspaces(id) on delete cascade,
  wallet_id text not null references wallet_accounts(id) on delete cascade unique,
  status text not null default 'active' check (status in ('active', 'paused')),
  approvals_required integer not null default 1 check (approvals_required between 1 and 10),
  transaction_limit_usdc numeric(18, 6) not null default 100 check (transaction_limit_usdc >= 0),
  daily_limit_usdc numeric(18, 6) not null default 1000 check (daily_limit_usdc >= 0),
  allowed_contracts text[] not null default '{}',
  require_shield boolean not null default true,
  require_reputation_score integer not null default 600 check (require_reputation_score between 0 and 1000),
  updated_at timestamptz not null default now(),
  check (transaction_limit_usdc <= daily_limit_usdc)
);

create table if not exists wallet_lifecycle_events (
  id text primary key,
  workspace_id text not null references workspaces(id) on delete cascade,
  wallet_id text not null references wallet_accounts(id) on delete cascade,
  idempotency_key text not null,
  action text not null check (action in ('provision', 'activate', 'sign', 'recover', 'suspend', 'resume', 'retire', 'role_changed', 'policy_changed')),
  status text not null default 'requested' check (status in ('requested', 'submitted', 'confirmed', 'failed')),
  actor text not null,
  detail text not null,
  provider_operation_id text,
  tx_hash text,
  explorer_url text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  unique (workspace_id, idempotency_key)
);

create index if not exists wallet_accounts_workspace_idx on wallet_accounts(workspace_id, updated_at desc);
create index if not exists wallet_roles_wallet_idx on wallet_roles(wallet_id, status);
create index if not exists wallet_events_workspace_idx on wallet_lifecycle_events(workspace_id, created_at desc);

create or replace function request_wallet_lifecycle_action(
  p_event_id text,
  p_workspace_id text,
  p_wallet_id text,
  p_idempotency_key text,
  p_action text,
  p_actor text,
  p_detail text,
  p_metadata jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_wallet wallet_accounts%rowtype;
  v_event wallet_lifecycle_events%rowtype;
  v_next_status text;
begin
  select * into v_event from wallet_lifecycle_events
  where workspace_id = p_workspace_id and idempotency_key = p_idempotency_key;
  if found then return to_jsonb(v_event); end if;

  select * into v_wallet from wallet_accounts
  where id = p_wallet_id and workspace_id = p_workspace_id for update;
  if not found then raise exception 'Wallet not found'; end if;

  if p_action = 'suspend' and v_wallet.status <> 'active' then raise exception 'Only active wallets can be suspended'; end if;
  if p_action = 'resume' and v_wallet.status <> 'suspended' then raise exception 'Only suspended wallets can be resumed'; end if;
  if p_action = 'recover' and v_wallet.status in ('retired', 'provisioning') then raise exception 'Wallet cannot enter recovery'; end if;
  if p_action = 'retire' and v_wallet.status = 'retired' then raise exception 'Wallet is already retired'; end if;

  v_next_status := case p_action
    when 'suspend' then 'suspended'
    when 'resume' then 'active'
    when 'recover' then 'recovery'
    else v_wallet.status
  end;

  insert into wallet_lifecycle_events (
    id, workspace_id, wallet_id, idempotency_key, action, actor, detail, metadata
  ) values (
    p_event_id, p_workspace_id, p_wallet_id, p_idempotency_key, p_action,
    p_actor, p_detail, coalesce(p_metadata, '{}'::jsonb)
  ) returning * into v_event;

  if p_action in ('suspend', 'resume', 'recover') then
    update wallet_accounts set status = v_next_status, updated_at = now() where id = p_wallet_id;
  end if;

  return to_jsonb(v_event);
end;
$$;

create or replace function update_wallet_signing_policy(
  p_workspace_id text,
  p_wallet_id text,
  p_status text,
  p_approvals_required integer,
  p_transaction_limit_usdc numeric,
  p_daily_limit_usdc numeric,
  p_require_shield boolean,
  p_require_reputation_score integer
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_policy wallet_signing_policies%rowtype;
begin
  if p_status not in ('active', 'paused') then raise exception 'Unsupported policy status'; end if;
  if p_approvals_required < 1 or p_approvals_required > 10 then raise exception 'Approvals must be between 1 and 10'; end if;
  if p_transaction_limit_usdc < 0 or p_transaction_limit_usdc > p_daily_limit_usdc then raise exception 'Invalid signing limits'; end if;
  if p_require_reputation_score < 0 or p_require_reputation_score > 1000 then raise exception 'Invalid reputation threshold'; end if;

  update wallet_signing_policies set
    status = p_status,
    approvals_required = p_approvals_required,
    transaction_limit_usdc = p_transaction_limit_usdc,
    daily_limit_usdc = p_daily_limit_usdc,
    require_shield = p_require_shield,
    require_reputation_score = p_require_reputation_score,
    updated_at = now()
  where workspace_id = p_workspace_id and wallet_id = p_wallet_id
  returning * into v_policy;
  if not found then raise exception 'Wallet signing policy not found'; end if;
  return to_jsonb(v_policy);
end;
$$;

insert into wallet_accounts (
  id, workspace_id, name, owner_label, custody_model, account_type, status,
  address, circle_wallet_id, circle_wallet_set_id, auth_method, recovery_method, last_signed_at
) values
  ('wal_ops_01', 'wrk_arc_demo', 'Operations Treasury', 'Arc Corp', 'developer', 'EOA', 'active',
   '0xe587fe4875e8ce65a5473c66488b6bc7d54b80a8', 'circle_demo_ops', 'circle_set_demo', 'entity_secret', 'entity_secret_backup', now() - interval '18 minutes'),
  ('wal_client_01', 'wrk_arc_demo', 'Pilot Client Wallet', 'Northstar Labs', 'user', 'SCA', 'active',
   '0x4f7f8f56d4b8a1eb93e72ec645cdb83f7352473e', 'circle_demo_client', null, 'email_otp', 'security_questions', now() - interval '2 hours'),
  ('wal_modular_01', 'wrk_arc_demo', 'Agent Collective', 'Arc Agents', 'modular', 'MSCA', 'active',
   '0x8f12c0ee986f434d42a9dc31986fd39404f38a64', 'circle_demo_modular', null, 'passkey', 'passkey_backup', now() - interval '37 minutes')
on conflict (id) do nothing;

insert into wallet_roles (id, workspace_id, wallet_id, principal, role) values
  ('wrole_01', 'wrk_arc_demo', 'wal_ops_01', 'operations@arcsuite.app', 'owner'),
  ('wrole_02', 'wrk_arc_demo', 'wal_ops_01', 'finance@arcsuite.app', 'approver'),
  ('wrole_03', 'wrk_arc_demo', 'wal_client_01', 'pilot@northstar.example', 'owner'),
  ('wrole_04', 'wrk_arc_demo', 'wal_modular_01', 'Agent Policy Engine', 'operator')
on conflict (wallet_id, principal, role) do nothing;

insert into wallet_signing_policies (
  id, workspace_id, wallet_id, approvals_required, transaction_limit_usdc,
  daily_limit_usdc, require_shield, require_reputation_score
) values
  ('wpol_01', 'wrk_arc_demo', 'wal_ops_01', 2, 500, 2500, true, 700),
  ('wpol_02', 'wrk_arc_demo', 'wal_client_01', 1, 250, 1000, true, 0),
  ('wpol_03', 'wrk_arc_demo', 'wal_modular_01', 2, 100, 750, true, 800)
on conflict (wallet_id) do nothing;

insert into wallet_lifecycle_events (
  id, workspace_id, wallet_id, idempotency_key, action, status, actor, detail, provider_operation_id, completed_at
) values
  ('wevt_01', 'wrk_arc_demo', 'wal_ops_01', 'seed:wallet:01', 'activate', 'confirmed', 'Arc Corp', 'Developer-controlled wallet activated on Arc Testnet', 'circle_demo_activation_01', now() - interval '1 day'),
  ('wevt_02', 'wrk_arc_demo', 'wal_modular_01', 'seed:wallet:02', 'sign', 'confirmed', 'Agent Policy Engine', 'Two-approval signing policy satisfied', 'circle_demo_sign_01', now() - interval '37 minutes')
on conflict (id) do nothing;

revoke all on function request_wallet_lifecycle_action(text, text, text, text, text, text, text, jsonb) from public, anon, authenticated;
revoke all on function update_wallet_signing_policy(text, text, text, integer, numeric, numeric, boolean, integer) from public, anon, authenticated;
grant execute on function request_wallet_lifecycle_action(text, text, text, text, text, text, text, jsonb) to service_role;
grant execute on function update_wallet_signing_policy(text, text, text, integer, numeric, numeric, boolean, integer) to service_role;

alter table wallet_accounts enable row level security;
alter table wallet_roles enable row level security;
alter table wallet_signing_policies enable row level security;
alter table wallet_lifecycle_events enable row level security;
revoke all on wallet_accounts, wallet_roles, wallet_signing_policies, wallet_lifecycle_events from anon, authenticated;
grant all on wallet_accounts, wallet_roles, wallet_signing_policies, wallet_lifecycle_events to service_role;
