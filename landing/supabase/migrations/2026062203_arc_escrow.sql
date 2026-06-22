-- Arc Escrow: programmable agent deals, milestones, disputes and onchain receipts.

create table if not exists escrow_deals (
  id text primary key,
  workspace_id text not null references workspaces(id) on delete cascade,
  idempotency_key text not null,
  title text not null,
  description text not null default '',
  buyer_agent_id text not null references agents(id),
  seller_agent_id text not null references agents(id),
  total_amount_usdc numeric(18, 6) not null check (total_amount_usdc > 0),
  released_amount_usdc numeric(18, 6) not null default 0,
  refunded_amount_usdc numeric(18, 6) not null default 0,
  status text not null default 'active' check (status in ('draft', 'active', 'disputed', 'completed', 'refunded', 'cancelled')),
  contract_address text,
  contract_deal_id text,
  funding_tx_hash text,
  explorer_url text,
  dispute_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz,
  unique (workspace_id, idempotency_key),
  check (buyer_agent_id <> seller_agent_id)
);

create table if not exists escrow_milestones (
  id text primary key,
  workspace_id text not null references workspaces(id) on delete cascade,
  deal_id text not null references escrow_deals(id) on delete cascade,
  position integer not null check (position >= 0),
  title text not null,
  description text not null default '',
  amount_usdc numeric(18, 6) not null check (amount_usdc > 0),
  status text not null default 'pending' check (status in ('pending', 'submitted', 'released', 'refunded', 'disputed')),
  due_at timestamptz,
  submitted_at timestamptz,
  released_at timestamptz,
  refunded_at timestamptz,
  tx_hash text,
  explorer_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (deal_id, position)
);

create table if not exists escrow_events (
  id text primary key,
  workspace_id text not null references workspaces(id) on delete cascade,
  deal_id text not null references escrow_deals(id) on delete cascade,
  milestone_id text references escrow_milestones(id) on delete set null,
  type text not null check (type in ('created', 'funded', 'submitted', 'released', 'refunded', 'disputed', 'resolved')),
  actor text not null,
  detail text not null,
  amount_usdc numeric(18, 6) not null default 0,
  tx_hash text,
  explorer_url text,
  provider_receipt jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists escrow_deals_workspace_time_idx on escrow_deals(workspace_id, created_at desc);
create index if not exists escrow_milestones_deal_position_idx on escrow_milestones(deal_id, position);
create index if not exists escrow_events_deal_time_idx on escrow_events(deal_id, created_at desc);

create or replace function create_escrow_deal(
  p_id text,
  p_workspace_id text,
  p_idempotency_key text,
  p_title text,
  p_description text,
  p_buyer_agent_id text,
  p_seller_agent_id text,
  p_milestones jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_total numeric(18, 6);
  v_deal escrow_deals%rowtype;
  v_item jsonb;
  v_position integer := 0;
begin
  if p_buyer_agent_id = p_seller_agent_id then raise exception 'Buyer and seller must be different agents'; end if;
  if jsonb_typeof(p_milestones) <> 'array' or jsonb_array_length(p_milestones) = 0 then raise exception 'At least one milestone is required'; end if;

  select coalesce(sum((item->>'amountUsdc')::numeric), 0)
  into v_total
  from jsonb_array_elements(p_milestones) item;
  if v_total <= 0 then raise exception 'Milestone total must be positive'; end if;

  insert into escrow_deals (
    id, workspace_id, idempotency_key, title, description,
    buyer_agent_id, seller_agent_id, total_amount_usdc
  ) values (
    p_id, p_workspace_id, p_idempotency_key, p_title, coalesce(p_description, ''),
    p_buyer_agent_id, p_seller_agent_id, v_total
  )
  on conflict (workspace_id, idempotency_key) do nothing;

  if not found then
    return (select to_jsonb(deal) from escrow_deals deal where deal.workspace_id = p_workspace_id and deal.idempotency_key = p_idempotency_key);
  end if;

  for v_item in select * from jsonb_array_elements(p_milestones)
  loop
    insert into escrow_milestones (
      id, workspace_id, deal_id, position, title, description, amount_usdc, due_at
    ) values (
      'mile_' || replace(gen_random_uuid()::text, '-', ''),
      p_workspace_id,
      p_id,
      v_position,
      v_item->>'title',
      coalesce(v_item->>'description', ''),
      (v_item->>'amountUsdc')::numeric,
      nullif(v_item->>'dueAt', '')::timestamptz
    );
    v_position := v_position + 1;
  end loop;

  insert into escrow_events (id, workspace_id, deal_id, type, actor, detail, amount_usdc)
  values ('evt_' || replace(gen_random_uuid()::text, '-', ''), p_workspace_id, p_id, 'created', 'operator', 'Escrow deal created', v_total);

  select * into v_deal from escrow_deals where id = p_id;
  return to_jsonb(v_deal);
end;
$$;

create or replace function apply_escrow_action(
  p_workspace_id text,
  p_deal_id text,
  p_milestone_id text,
  p_action text,
  p_actor text,
  p_detail text,
  p_tx_hash text default null,
  p_explorer_url text default null,
  p_provider_receipt jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_deal escrow_deals%rowtype;
  v_milestone escrow_milestones%rowtype;
  v_event_type text;
  v_released numeric(18, 6);
  v_refunded numeric(18, 6);
  v_remaining integer;
begin
  select * into v_deal from escrow_deals where id = p_deal_id and workspace_id = p_workspace_id for update;
  if not found then raise exception 'Escrow deal not found'; end if;

  select * into v_milestone from escrow_milestones
  where id = p_milestone_id and deal_id = p_deal_id and workspace_id = p_workspace_id
  for update;
  if not found then raise exception 'Escrow milestone not found'; end if;

  if p_action = 'submit' then
    if v_milestone.status <> 'pending' then raise exception 'Only pending milestones can be submitted'; end if;
    update escrow_milestones set status = 'submitted', submitted_at = now(), updated_at = now() where id = p_milestone_id;
    v_event_type := 'submitted';
  elsif p_action = 'dispute' then
    if v_milestone.status not in ('pending', 'submitted') then raise exception 'Milestone cannot be disputed'; end if;
    update escrow_milestones set status = 'disputed', updated_at = now() where id = p_milestone_id;
    update escrow_deals set status = 'disputed', dispute_reason = p_detail, updated_at = now() where id = p_deal_id;
    v_event_type := 'disputed';
  elsif p_action = 'release' then
    if v_milestone.status not in ('submitted', 'disputed') then raise exception 'Milestone is not releasable'; end if;
    if p_tx_hash is null then raise exception 'Confirmed transaction hash is required for release'; end if;
    update escrow_milestones
    set status = 'released', released_at = now(), tx_hash = p_tx_hash, explorer_url = p_explorer_url, updated_at = now()
    where id = p_milestone_id;
    v_event_type := 'released';
  elsif p_action = 'refund' then
    if v_milestone.status not in ('pending', 'submitted', 'disputed') then raise exception 'Milestone is not refundable'; end if;
    if p_tx_hash is null then raise exception 'Confirmed transaction hash is required for refund'; end if;
    update escrow_milestones
    set status = 'refunded', refunded_at = now(), tx_hash = p_tx_hash, explorer_url = p_explorer_url, updated_at = now()
    where id = p_milestone_id;
    v_event_type := 'refunded';
  else
    raise exception 'Unsupported escrow action';
  end if;

  select
    coalesce(sum(amount_usdc) filter (where status = 'released'), 0),
    coalesce(sum(amount_usdc) filter (where status = 'refunded'), 0),
    count(*) filter (where status not in ('released', 'refunded'))
  into v_released, v_refunded, v_remaining
  from escrow_milestones where deal_id = p_deal_id;

  update escrow_deals
  set released_amount_usdc = v_released,
      refunded_amount_usdc = v_refunded,
      status = case
        when v_remaining = 0 and v_released = total_amount_usdc then 'completed'
        when v_remaining = 0 and v_refunded = total_amount_usdc then 'refunded'
        when status = 'disputed' and p_action in ('release', 'refund') then 'active'
        else status
      end,
      completed_at = case when v_remaining = 0 then now() else completed_at end,
      updated_at = now()
  where id = p_deal_id;

  insert into escrow_events (
    id, workspace_id, deal_id, milestone_id, type, actor, detail,
    amount_usdc, tx_hash, explorer_url, provider_receipt
  ) values (
    'evt_' || replace(gen_random_uuid()::text, '-', ''),
    p_workspace_id, p_deal_id, p_milestone_id, v_event_type, p_actor, p_detail,
    case when p_action in ('release', 'refund') then v_milestone.amount_usdc else 0 end,
    p_tx_hash, p_explorer_url, coalesce(p_provider_receipt, '{}'::jsonb)
  );

  return (select to_jsonb(deal) from escrow_deals deal where deal.id = p_deal_id);
end;
$$;

insert into escrow_deals (
  id, workspace_id, idempotency_key, title, description, buyer_agent_id, seller_agent_id, total_amount_usdc
) values (
  'esc_demo_market_data', 'wrk_arc_demo', 'seed:escrow:market-data',
  'Autonomous market data integration',
  'Three-stage delivery between an agent buyer and an API provider agent.',
  'agt_03', 'agt_01', 12
) on conflict (id) do nothing;

insert into escrow_milestones (id, workspace_id, deal_id, position, title, description, amount_usdc, status)
values
  ('mile_demo_schema', 'wrk_arc_demo', 'esc_demo_market_data', 0, 'Schema delivery', 'Provider publishes and validates the feed schema.', 3, 'released'),
  ('mile_demo_stream', 'wrk_arc_demo', 'esc_demo_market_data', 1, 'Live data stream', 'Seven-day stable stream at agreed SLA.', 6, 'submitted'),
  ('mile_demo_handoff', 'wrk_arc_demo', 'esc_demo_market_data', 2, 'Production handoff', 'Keys, documentation and monitoring handoff.', 3, 'pending')
on conflict (id) do nothing;

update escrow_deals set released_amount_usdc = 3 where id = 'esc_demo_market_data';

insert into escrow_events (id, workspace_id, deal_id, milestone_id, type, actor, detail, amount_usdc)
values
  ('evt_demo_created', 'wrk_arc_demo', 'esc_demo_market_data', null, 'created', 'operator', 'Escrow deal created', 12),
  ('evt_demo_released', 'wrk_arc_demo', 'esc_demo_market_data', 'mile_demo_schema', 'released', 'operator', 'Schema milestone released in demo ledger', 3),
  ('evt_demo_submitted', 'wrk_arc_demo', 'esc_demo_market_data', 'mile_demo_stream', 'submitted', 'agt_01', 'Live stream submitted for review', 0)
on conflict (id) do nothing;

revoke all on function create_escrow_deal(text, text, text, text, text, text, text, jsonb) from public, anon, authenticated;
revoke all on function apply_escrow_action(text, text, text, text, text, text, text, text, jsonb) from public, anon, authenticated;
grant execute on function create_escrow_deal(text, text, text, text, text, text, text, jsonb) to service_role;
grant execute on function apply_escrow_action(text, text, text, text, text, text, text, text, jsonb) to service_role;

alter table escrow_deals enable row level security;
alter table escrow_milestones enable row level security;
alter table escrow_events enable row level security;
revoke all on escrow_deals, escrow_milestones, escrow_events from anon, authenticated;
grant all on escrow_deals, escrow_milestones, escrow_events to service_role;
