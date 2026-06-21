-- Real Arc Testnet settlement audit trail.
-- The finalize function atomically records the transaction and updates Treasury/Reputation.

alter table transactions add column if not exists explorer_url text;
alter table transactions add column if not exists source_address text;
alter table transactions add column if not exists chain_id bigint;
alter table transactions add column if not exists settlement_id text;

create unique index if not exists transactions_settlement_idx
  on transactions(settlement_id)
  where settlement_id is not null;

create table if not exists arc_settlements (
  id text primary key,
  workspace_id text not null references workspaces(id),
  idempotency_key text not null,
  agent_id text not null references agents(id),
  api_id text not null references api_listings(id),
  access_decision_id text references access_decisions(id),
  transaction_id text references transactions(id),
  source_address text not null,
  recipient_address text not null,
  amount_usdc numeric(18, 6) not null check (amount_usdc > 0),
  chain_id bigint not null default 5042002,
  network text not null default 'Arc Testnet' check (network = 'Arc Testnet'),
  provider text not null default 'circle_wallets_sdk' check (provider = 'circle_wallets_sdk'),
  status text not null check (status in ('policy_denied', 'approved', 'submitted', 'confirmed', 'failed')),
  tx_hash text,
  explorer_url text,
  gas_estimate jsonb not null default '{}'::jsonb,
  provider_receipt jsonb not null default '{}'::jsonb,
  reputation_score_before integer,
  reputation_score_after integer,
  error_code text,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  confirmed_at timestamptz,
  unique (workspace_id, idempotency_key)
);

create unique index if not exists arc_settlements_tx_hash_idx
  on arc_settlements(tx_hash)
  where tx_hash is not null;

create index if not exists arc_settlements_workspace_time_idx
  on arc_settlements(workspace_id, created_at desc);

create index if not exists arc_settlements_agent_time_idx
  on arc_settlements(agent_id, created_at desc);

create or replace function finalize_arc_settlement(
  p_settlement_id text,
  p_transaction_id text,
  p_tx_hash text,
  p_explorer_url text,
  p_gas_estimate jsonb,
  p_provider_receipt jsonb,
  p_occurred_at timestamptz default now()
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_settlement arc_settlements%rowtype;
  v_agent agents%rowtype;
  v_score_before integer;
  v_score_after integer;
  v_score_delta integer;
begin
  select * into v_settlement
  from arc_settlements
  where id = p_settlement_id
  for update;

  if not found then
    raise exception 'Settlement not found';
  end if;

  if v_settlement.status = 'confirmed' then
    return jsonb_build_object(
      'transactionId', v_settlement.transaction_id,
      'scoreBefore', v_settlement.reputation_score_before,
      'scoreAfter', v_settlement.reputation_score_after,
      'scoreDelta', coalesce(v_settlement.reputation_score_after, 0) - coalesce(v_settlement.reputation_score_before, 0)
    );
  end if;

  if v_settlement.status not in ('approved', 'submitted') then
    raise exception 'Settlement cannot be finalized from status %', v_settlement.status;
  end if;

  select * into v_agent
  from agents
  where id = v_settlement.agent_id
    and workspace_id = v_settlement.workspace_id
  for update;

  if not found then
    raise exception 'Agent not found';
  end if;

  select score into v_score_before
  from reputation_profiles
  where agent_id = v_settlement.agent_id
  for update;

  if v_score_before is null then
    raise exception 'Reputation profile not found';
  end if;

  v_score_delta := case when v_settlement.amount_usdc >= 1 then 2 else 3 end;
  v_score_after := least(1000, v_score_before + v_score_delta);

  insert into transactions (
    id,
    workspace_id,
    agent_id,
    amount_usdc,
    category,
    description,
    status,
    occurred_at,
    tx_hash,
    network,
    recipient,
    explorer_url,
    source_address,
    chain_id,
    settlement_id
  ) values (
    p_transaction_id,
    v_settlement.workspace_id,
    v_settlement.agent_id,
    v_settlement.amount_usdc,
    'api_call',
    'Arc Testnet USDC payment for API ' || v_settlement.api_id,
    'completed',
    p_occurred_at,
    p_tx_hash,
    'Arc',
    v_settlement.recipient_address,
    p_explorer_url,
    v_settlement.source_address,
    v_settlement.chain_id,
    v_settlement.id
  );

  update agents
  set
    address = v_settlement.source_address,
    network = 'Arc',
    balance_usdc = greatest(0, balance_usdc - v_settlement.amount_usdc),
    monthly_spent_usdc = monthly_spent_usdc + v_settlement.amount_usdc,
    daily_spent_usdc = daily_spent_usdc + v_settlement.amount_usdc,
    tx_count = tx_count + 1,
    last_active_at = p_occurred_at
  where id = v_settlement.agent_id;

  update reputation_profiles
  set
    score = v_score_after,
    score_change_30d = score_change_30d + (v_score_after - v_score_before),
    payment_reliability = least(100, payment_reliability + 1),
    tier = case
      when v_score_after >= 900 then 'Platinum'
      when v_score_after >= 750 then 'Gold'
      when v_score_after >= 500 then 'Silver'
      else 'New'
    end,
    updated_at = p_occurred_at
  where agent_id = v_settlement.agent_id;

  update arc_settlements
  set
    transaction_id = p_transaction_id,
    status = 'confirmed',
    tx_hash = p_tx_hash,
    explorer_url = p_explorer_url,
    gas_estimate = coalesce(p_gas_estimate, '{}'::jsonb),
    provider_receipt = coalesce(p_provider_receipt, '{}'::jsonb),
    reputation_score_before = v_score_before,
    reputation_score_after = v_score_after,
    updated_at = now(),
    confirmed_at = p_occurred_at
  where id = v_settlement.id;

  return jsonb_build_object(
    'transactionId', p_transaction_id,
    'scoreBefore', v_score_before,
    'scoreAfter', v_score_after,
    'scoreDelta', v_score_after - v_score_before
  );
end;
$$;

revoke all on function finalize_arc_settlement(text, text, text, text, jsonb, jsonb, timestamptz) from public;
revoke all on function finalize_arc_settlement(text, text, text, text, jsonb, jsonb, timestamptz) from anon;
revoke all on function finalize_arc_settlement(text, text, text, text, jsonb, jsonb, timestamptz) from authenticated;
grant execute on function finalize_arc_settlement(text, text, text, text, jsonb, jsonb, timestamptz) to service_role;
