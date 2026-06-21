-- Arc Billing: metered x402 usage, prepaid balances, invoices and settlement batches.

create table if not exists billing_plans (
  id text primary key,
  workspace_id text not null references workspaces(id) on delete cascade,
  name text not null,
  monthly_fee_usdc numeric(18, 6) not null default 0,
  included_units bigint not null default 0,
  discount_bps integer not null default 0 check (discount_bps between 0 and 10000),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists billing_accounts (
  id text primary key,
  workspace_id text not null references workspaces(id) on delete cascade,
  agent_id text not null references agents(id),
  plan_id text not null references billing_plans(id),
  prepaid_balance_usdc numeric(18, 6) not null default 0 check (prepaid_balance_usdc >= 0),
  low_balance_threshold_usdc numeric(18, 6) not null default 1,
  status text not null default 'active' check (status in ('active', 'paused')),
  current_period_start timestamptz not null default date_trunc('month', now()),
  current_period_end timestamptz not null default date_trunc('month', now()) + interval '1 month',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, agent_id)
);

create table if not exists billing_settlement_batches (
  id text primary key,
  workspace_id text not null references workspaces(id) on delete cascade,
  status text not null default 'ready' check (status in ('ready', 'processing', 'settled', 'failed')),
  usage_count integer not null default 0,
  invoice_count integer not null default 0,
  gross_amount_usdc numeric(18, 6) not null default 0,
  net_amount_usdc numeric(18, 6) not null default 0,
  settlement_id text references arc_settlements(id),
  tx_hash text,
  explorer_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  settled_at timestamptz
);

create table if not exists billing_invoices (
  id text primary key,
  workspace_id text not null references workspaces(id) on delete cascade,
  billing_account_id text not null references billing_accounts(id),
  agent_id text not null references agents(id),
  period_start timestamptz not null,
  period_end timestamptz not null,
  status text not null default 'draft' check (status in ('draft', 'ready', 'settled', 'void')),
  usage_count integer not null default 0,
  subtotal_usdc numeric(18, 6) not null default 0,
  discount_usdc numeric(18, 6) not null default 0,
  total_usdc numeric(18, 6) not null default 0,
  batch_id text references billing_settlement_batches(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (billing_account_id, period_start, period_end)
);

create table if not exists billing_usage_events (
  id text primary key,
  workspace_id text not null references workspaces(id) on delete cascade,
  billing_account_id text not null references billing_accounts(id),
  agent_id text not null references agents(id),
  api_id text not null references api_listings(id),
  idempotency_key text not null,
  units numeric(20, 6) not null check (units > 0),
  unit_price_usdc numeric(18, 8) not null check (unit_price_usdc >= 0),
  gross_amount_usdc numeric(18, 6) not null,
  discount_usdc numeric(18, 6) not null default 0,
  net_amount_usdc numeric(18, 6) not null,
  pricing_unit text not null,
  invoice_id text not null references billing_invoices(id),
  batch_id text references billing_settlement_batches(id),
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (workspace_id, idempotency_key)
);

create index if not exists billing_usage_workspace_time_idx on billing_usage_events(workspace_id, occurred_at desc);
create index if not exists billing_usage_unbatched_idx on billing_usage_events(workspace_id, batch_id) where batch_id is null;
create index if not exists billing_invoices_workspace_time_idx on billing_invoices(workspace_id, created_at desc);
create index if not exists billing_batches_workspace_time_idx on billing_settlement_batches(workspace_id, created_at desc);

insert into billing_plans (id, workspace_id, name, monthly_fee_usdc, included_units, discount_bps)
values
  ('plan_metered', 'wrk_arc_demo', 'Metered', 0, 0, 0),
  ('plan_scale', 'wrk_arc_demo', 'Scale', 25, 100000, 1000)
on conflict (id) do nothing;

insert into billing_accounts (
  id, workspace_id, agent_id, plan_id, prepaid_balance_usdc, low_balance_threshold_usdc
)
select
  'bill_' || a.id,
  a.workspace_id,
  a.id,
  case when a.id in ('agt_01', 'agt_05') then 'plan_scale' else 'plan_metered' end,
  case when a.id in ('agt_01', 'agt_05') then 50 else 10 end,
  2
from agents a
where a.workspace_id = 'wrk_arc_demo'
on conflict (workspace_id, agent_id) do nothing;

create or replace function record_billing_usage(
  p_event_id text,
  p_workspace_id text,
  p_agent_id text,
  p_api_id text,
  p_idempotency_key text,
  p_units numeric,
  p_metadata jsonb default '{}'::jsonb,
  p_occurred_at timestamptz default now()
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_account billing_accounts%rowtype;
  v_plan billing_plans%rowtype;
  v_api api_listings%rowtype;
  v_invoice billing_invoices%rowtype;
  v_gross numeric(18, 6);
  v_discount numeric(18, 6);
  v_net numeric(18, 6);
  v_invoice_id text;
begin
  if p_units <= 0 then raise exception 'Usage units must be positive'; end if;

  select * into v_account from billing_accounts
  where workspace_id = p_workspace_id and agent_id = p_agent_id
  for update;
  if not found then raise exception 'Billing account not found'; end if;
  if v_account.status <> 'active' then raise exception 'Billing account is paused'; end if;

  select * into v_plan from billing_plans where id = v_account.plan_id;
  select * into v_api from api_listings where id = p_api_id;
  if not found then raise exception 'API listing not found'; end if;

  v_gross := round((v_api.price_usdc * p_units)::numeric, 6);
  v_discount := round((v_gross * v_plan.discount_bps / 10000.0)::numeric, 6);
  v_net := greatest(0, v_gross - v_discount);
  if v_account.prepaid_balance_usdc < v_net then raise exception 'Insufficient prepaid balance'; end if;

  v_invoice_id := 'inv_' || replace(v_account.id, 'bill_', '') || '_' || to_char(v_account.current_period_start, 'YYYYMM');
  insert into billing_invoices (
    id, workspace_id, billing_account_id, agent_id, period_start, period_end
  ) values (
    v_invoice_id, p_workspace_id, v_account.id, p_agent_id, v_account.current_period_start, v_account.current_period_end
  ) on conflict (billing_account_id, period_start, period_end) do nothing;

  insert into billing_usage_events (
    id, workspace_id, billing_account_id, agent_id, api_id, idempotency_key,
    units, unit_price_usdc, gross_amount_usdc, discount_usdc, net_amount_usdc,
    pricing_unit, invoice_id, metadata, occurred_at
  ) values (
    p_event_id, p_workspace_id, v_account.id, p_agent_id, p_api_id, p_idempotency_key,
    p_units, v_api.price_usdc, v_gross, v_discount, v_net,
    v_api.pricing_unit, v_invoice_id, coalesce(p_metadata, '{}'::jsonb), p_occurred_at
  ) on conflict (workspace_id, idempotency_key) do nothing;

  if not found then
    return (select to_jsonb(e) from billing_usage_events e
      where e.workspace_id = p_workspace_id and e.idempotency_key = p_idempotency_key);
  end if;

  update billing_accounts
  set prepaid_balance_usdc = prepaid_balance_usdc - v_net, updated_at = now()
  where id = v_account.id;

  update billing_invoices
  set usage_count = usage_count + 1,
      subtotal_usdc = subtotal_usdc + v_gross,
      discount_usdc = discount_usdc + v_discount,
      total_usdc = total_usdc + v_net,
      updated_at = now()
  where id = v_invoice_id;

  return (select to_jsonb(e) from billing_usage_events e where e.id = p_event_id);
end;
$$;

revoke all on function record_billing_usage(text, text, text, text, text, numeric, jsonb, timestamptz) from public, anon, authenticated;
grant execute on function record_billing_usage(text, text, text, text, text, numeric, jsonb, timestamptz) to service_role;

create or replace function top_up_billing_account(
  p_workspace_id text,
  p_agent_id text,
  p_amount_usdc numeric
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_account billing_accounts%rowtype;
begin
  if p_amount_usdc <= 0 then raise exception 'Top-up amount must be positive'; end if;

  update billing_accounts
  set prepaid_balance_usdc = prepaid_balance_usdc + p_amount_usdc,
      updated_at = now()
  where workspace_id = p_workspace_id and agent_id = p_agent_id
  returning * into v_account;

  if not found then raise exception 'Billing account not found'; end if;
  return to_jsonb(v_account);
end;
$$;

create or replace function create_billing_settlement_batch(
  p_batch_id text,
  p_workspace_id text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_usage_count integer;
  v_invoice_count integer;
  v_gross numeric(18, 6);
  v_net numeric(18, 6);
begin
  insert into billing_settlement_batches (id, workspace_id)
  values (p_batch_id, p_workspace_id);

  with selected as (
    select id
    from billing_usage_events
    where workspace_id = p_workspace_id and batch_id is null
    order by occurred_at
    for update skip locked
  ),
  updated as (
    update billing_usage_events
    set batch_id = p_batch_id
    where id in (select id from selected)
    returning invoice_id, gross_amount_usdc, net_amount_usdc
  )
  select
    count(*)::integer,
    count(distinct invoice_id)::integer,
    coalesce(sum(gross_amount_usdc), 0),
    coalesce(sum(net_amount_usdc), 0)
  into v_usage_count, v_invoice_count, v_gross, v_net
  from updated;

  if v_usage_count = 0 then
    delete from billing_settlement_batches where id = p_batch_id;
    return null;
  end if;

  update billing_settlement_batches
  set usage_count = v_usage_count,
      invoice_count = v_invoice_count,
      gross_amount_usdc = v_gross,
      net_amount_usdc = v_net,
      updated_at = now()
  where id = p_batch_id;

  return (select to_jsonb(b) from billing_settlement_batches b where b.id = p_batch_id);
end;
$$;

create or replace function get_billing_summary(p_workspace_id text)
returns jsonb
language sql
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'prepaid_balance_usdc', coalesce((select sum(prepaid_balance_usdc) from billing_accounts where workspace_id = p_workspace_id), 0),
    'metered_usage_usdc', coalesce((select sum(net_amount_usdc) from billing_usage_events where workspace_id = p_workspace_id), 0),
    'unbatched_usage_usdc', coalesce((select sum(net_amount_usdc) from billing_usage_events where workspace_id = p_workspace_id and batch_id is null), 0),
    'active_accounts', (select count(*) from billing_accounts where workspace_id = p_workspace_id and status = 'active'),
    'low_balance_accounts', (select count(*) from billing_accounts where workspace_id = p_workspace_id and prepaid_balance_usdc <= low_balance_threshold_usdc)
  );
$$;

revoke all on function top_up_billing_account(text, text, numeric) from public, anon, authenticated;
revoke all on function create_billing_settlement_batch(text, text) from public, anon, authenticated;
revoke all on function get_billing_summary(text) from public, anon, authenticated;
grant execute on function top_up_billing_account(text, text, numeric) to service_role;
grant execute on function create_billing_settlement_batch(text, text) to service_role;
grant execute on function get_billing_summary(text) to service_role;

alter table billing_plans enable row level security;
alter table billing_accounts enable row level security;
alter table billing_usage_events enable row level security;
alter table billing_invoices enable row level security;
alter table billing_settlement_batches enable row level security;

revoke all on billing_plans, billing_accounts, billing_usage_events, billing_invoices, billing_settlement_batches from anon, authenticated;
grant all on billing_plans, billing_accounts, billing_usage_events, billing_invoices, billing_settlement_batches to service_role;
