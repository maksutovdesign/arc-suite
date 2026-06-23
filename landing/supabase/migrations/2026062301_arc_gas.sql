-- Arc Gas: per-agent gas sponsorship policies, decisions and reporting.

create table if not exists gas_policies (
  id text primary key,
  workspace_id text not null references workspaces(id) on delete cascade,
  agent_id text not null references agents(id),
  mode text not null default 'gas_station' check (mode in ('gas_station', 'paymaster')),
  status text not null default 'active' check (status in ('active', 'paused')),
  per_tx_limit_usdc numeric(18, 8) not null default 0.05 check (per_tx_limit_usdc >= 0),
  daily_limit_usdc numeric(18, 8) not null default 0.5 check (daily_limit_usdc >= 0),
  monthly_limit_usdc numeric(18, 8) not null default 5 check (monthly_limit_usdc >= 0),
  daily_spent_usdc numeric(18, 8) not null default 0,
  monthly_spent_usdc numeric(18, 8) not null default 0,
  sponsored_count bigint not null default 0,
  denied_count bigint not null default 0,
  allowed_contracts text[] not null default '{}',
  last_reset_date date not null default current_date,
  current_period_start timestamptz not null default date_trunc('month', now()),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, agent_id)
);

create table if not exists gas_sponsorships (
  id text primary key,
  workspace_id text not null references workspaces(id) on delete cascade,
  policy_id text not null references gas_policies(id),
  agent_id text not null references agents(id),
  idempotency_key text not null,
  mode text not null check (mode in ('gas_station', 'paymaster')),
  network text not null default 'ARC-TESTNET',
  action text not null,
  destination text,
  estimated_fee_usdc numeric(18, 8) not null check (estimated_fee_usdc >= 0),
  actual_fee_usdc numeric(18, 8),
  status text not null check (status in ('sponsored', 'denied', 'submitted', 'confirmed', 'failed')),
  decision_reason text not null,
  provider text not null default 'arc_gas_policy',
  provider_transaction_id text,
  tx_hash text,
  explorer_url text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  confirmed_at timestamptz,
  unique (workspace_id, idempotency_key)
);

create index if not exists gas_policies_workspace_idx on gas_policies(workspace_id, updated_at desc);
create index if not exists gas_sponsorships_workspace_time_idx on gas_sponsorships(workspace_id, created_at desc);
create index if not exists gas_sponsorships_agent_time_idx on gas_sponsorships(agent_id, created_at desc);

create or replace function request_gas_sponsorship(
  p_id text,
  p_workspace_id text,
  p_agent_id text,
  p_idempotency_key text,
  p_action text,
  p_destination text,
  p_estimated_fee_usdc numeric,
  p_metadata jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_policy gas_policies%rowtype;
  v_status text := 'sponsored';
  v_reason text := 'Policy limits passed';
  v_existing gas_sponsorships%rowtype;
begin
  if p_estimated_fee_usdc < 0 then raise exception 'Estimated fee cannot be negative'; end if;

  select * into v_existing
  from gas_sponsorships
  where workspace_id = p_workspace_id and idempotency_key = p_idempotency_key;
  if found then return to_jsonb(v_existing); end if;

  select * into v_policy
  from gas_policies
  where workspace_id = p_workspace_id and agent_id = p_agent_id
  for update;
  if not found then raise exception 'Gas policy not found'; end if;

  if v_policy.last_reset_date < current_date then
    v_policy.daily_spent_usdc := 0;
    v_policy.last_reset_date := current_date;
  end if;
  if v_policy.current_period_start < date_trunc('month', now()) then
    v_policy.monthly_spent_usdc := 0;
    v_policy.current_period_start := date_trunc('month', now());
  end if;

  if v_policy.status <> 'active' then
    v_status := 'denied';
    v_reason := 'Gas sponsorship policy is paused';
  elsif p_estimated_fee_usdc > v_policy.per_tx_limit_usdc then
    v_status := 'denied';
    v_reason := 'Per-transaction gas limit exceeded';
  elsif v_policy.daily_spent_usdc + p_estimated_fee_usdc > v_policy.daily_limit_usdc then
    v_status := 'denied';
    v_reason := 'Daily gas sponsorship limit exceeded';
  elsif v_policy.monthly_spent_usdc + p_estimated_fee_usdc > v_policy.monthly_limit_usdc then
    v_status := 'denied';
    v_reason := 'Monthly gas sponsorship limit exceeded';
  elsif cardinality(v_policy.allowed_contracts) > 0
    and (p_destination is null or not (lower(p_destination) = any(v_policy.allowed_contracts))) then
    v_status := 'denied';
    v_reason := 'Destination contract is not allowlisted';
  end if;

  insert into gas_sponsorships (
    id, workspace_id, policy_id, agent_id, idempotency_key, mode,
    action, destination, estimated_fee_usdc, status, decision_reason, metadata
  ) values (
    p_id, p_workspace_id, v_policy.id, p_agent_id, p_idempotency_key, v_policy.mode,
    p_action, lower(nullif(p_destination, '')), p_estimated_fee_usdc, v_status, v_reason,
    coalesce(p_metadata, '{}'::jsonb)
  ) returning * into v_existing;

  update gas_policies
  set daily_spent_usdc = case when v_status = 'sponsored' then v_policy.daily_spent_usdc + p_estimated_fee_usdc else v_policy.daily_spent_usdc end,
      monthly_spent_usdc = case when v_status = 'sponsored' then v_policy.monthly_spent_usdc + p_estimated_fee_usdc else v_policy.monthly_spent_usdc end,
      sponsored_count = sponsored_count + case when v_status = 'sponsored' then 1 else 0 end,
      denied_count = denied_count + case when v_status = 'denied' then 1 else 0 end,
      last_reset_date = v_policy.last_reset_date,
      current_period_start = v_policy.current_period_start,
      updated_at = now()
  where id = v_policy.id;

  return to_jsonb(v_existing);
end;
$$;

create or replace function update_gas_policy(
  p_workspace_id text,
  p_agent_id text,
  p_mode text,
  p_status text,
  p_per_tx_limit_usdc numeric,
  p_daily_limit_usdc numeric,
  p_monthly_limit_usdc numeric
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_policy gas_policies%rowtype;
begin
  if p_mode not in ('gas_station', 'paymaster') then raise exception 'Unsupported gas mode'; end if;
  if p_status not in ('active', 'paused') then raise exception 'Unsupported policy status'; end if;
  if least(p_per_tx_limit_usdc, p_daily_limit_usdc, p_monthly_limit_usdc) < 0 then raise exception 'Limits cannot be negative'; end if;
  if p_per_tx_limit_usdc > p_daily_limit_usdc or p_daily_limit_usdc > p_monthly_limit_usdc then
    raise exception 'Gas limits must satisfy per-tx <= daily <= monthly';
  end if;

  update gas_policies
  set mode = p_mode,
      status = p_status,
      per_tx_limit_usdc = p_per_tx_limit_usdc,
      daily_limit_usdc = p_daily_limit_usdc,
      monthly_limit_usdc = p_monthly_limit_usdc,
      updated_at = now()
  where workspace_id = p_workspace_id and agent_id = p_agent_id
  returning * into v_policy;
  if not found then raise exception 'Gas policy not found'; end if;
  return to_jsonb(v_policy);
end;
$$;

insert into gas_policies (
  id, workspace_id, agent_id, mode, per_tx_limit_usdc, daily_limit_usdc,
  monthly_limit_usdc, daily_spent_usdc, monthly_spent_usdc, sponsored_count, denied_count
)
select
  'gas_' || a.id,
  a.workspace_id,
  a.id,
  case when a.id in ('agt_01', 'agt_05') then 'paymaster' else 'gas_station' end,
  case when a.id = 'agt_02' then 0.02 else 0.05 end,
  case when a.id = 'agt_02' then 0.15 else 0.5 end,
  case when a.id = 'agt_02' then 1.5 else 5 end,
  case when a.id = 'agt_01' then 0.084 else 0 end,
  case when a.id = 'agt_01' then 0.612 else 0 end,
  case when a.id = 'agt_01' then 14 else 0 end,
  0
from agents a
where a.workspace_id = 'wrk_arc_demo'
on conflict (workspace_id, agent_id) do nothing;

insert into gas_sponsorships (
  id, workspace_id, policy_id, agent_id, idempotency_key, mode, action,
  destination, estimated_fee_usdc, actual_fee_usdc, status, decision_reason,
  provider, tx_hash, explorer_url, created_at, updated_at, confirmed_at
) values
  (
    'gsp_demo_01', 'wrk_arc_demo', 'gas_agt_01', 'agt_01', 'seed:gas:01',
    'paymaster', 'market data settlement', '0x55e0dd25cd5f917e24de571d98d97c3b243709b2',
    0.0064, 0.0059, 'confirmed', 'Policy limits passed',
    'circle_paymaster', '0x94c0a5b6b57e1d2c0a8597aab1db623f4b0eddef36e10169b2cb5f7fc1500001',
    'https://testnet.arcscan.app/tx/0x94c0a5b6b57e1d2c0a8597aab1db623f4b0eddef36e10169b2cb5f7fc1500001',
    now() - interval '22 minutes', now() - interval '21 minutes', now() - interval '21 minutes'
  ),
  (
    'gsp_demo_02', 'wrk_arc_demo', 'gas_agt_02', 'agt_02', 'seed:gas:02',
    'gas_station', 'DEX rebalance', null,
    0.031, null, 'denied', 'Per-transaction gas limit exceeded',
    'arc_gas_policy', null, null,
    now() - interval '9 minutes', now() - interval '9 minutes', null
  )
on conflict (id) do nothing;

revoke all on function request_gas_sponsorship(text, text, text, text, text, text, numeric, jsonb) from public, anon, authenticated;
revoke all on function update_gas_policy(text, text, text, text, numeric, numeric, numeric) from public, anon, authenticated;
grant execute on function request_gas_sponsorship(text, text, text, text, text, text, numeric, jsonb) to service_role;
grant execute on function update_gas_policy(text, text, text, text, numeric, numeric, numeric) to service_role;

alter table gas_policies enable row level security;
alter table gas_sponsorships enable row level security;
revoke all on gas_policies, gas_sponsorships from anon, authenticated;
grant all on gas_policies, gas_sponsorships to service_role;
