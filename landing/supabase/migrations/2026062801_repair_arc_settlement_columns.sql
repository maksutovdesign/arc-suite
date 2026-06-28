-- Repair production Arc settlement schema after early MVP migrations.
-- Safe to run more than once.

alter table transactions add column if not exists explorer_url text;
alter table transactions add column if not exists source_address text;
alter table transactions add column if not exists chain_id bigint;
alter table transactions add column if not exists settlement_id text;
alter table transactions add column if not exists memo_label text;
alter table transactions add column if not exists memo jsonb not null default '{}'::jsonb;

create unique index if not exists transactions_settlement_idx
  on transactions(settlement_id)
  where settlement_id is not null;

alter table arc_settlements add column if not exists memo_label text;
alter table arc_settlements add column if not exists memo jsonb not null default '{}'::jsonb;
alter table arc_settlements add column if not exists gas_estimate jsonb not null default '{}'::jsonb;
alter table arc_settlements add column if not exists provider_receipt jsonb not null default '{}'::jsonb;
alter table arc_settlements add column if not exists error_code text;
alter table arc_settlements add column if not exists error_message text;
alter table arc_settlements add column if not exists explorer_url text;
alter table arc_settlements add column if not exists tx_hash text;
alter table arc_settlements add column if not exists confirmed_at timestamptz;
alter table arc_settlements add column if not exists updated_at timestamptz not null default now();

create unique index if not exists arc_settlements_tx_hash_idx
  on arc_settlements(tx_hash)
  where tx_hash is not null;

create index if not exists arc_settlements_workspace_time_idx
  on arc_settlements(workspace_id, created_at desc);

create index if not exists arc_settlements_agent_time_idx
  on arc_settlements(agent_id, created_at desc);

notify pgrst, 'reload schema';
