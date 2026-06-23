-- Unified execution worker: leased jobs, retries, provider reconciliation and Circle webhook inbox.

create table if not exists execution_jobs (
  id text primary key,
  workspace_id text not null references workspaces(id) on delete cascade,
  idempotency_key text not null,
  kind text not null check (kind in ('wallet_operation', 'escrow_contract', 'gas_sponsorship', 'billing_settlement')),
  resource_type text not null check (resource_type in ('wallet_event', 'escrow_milestone', 'gas_sponsorship', 'billing_batch')),
  resource_id text not null,
  action text not null,
  status text not null default 'queued' check (status in ('queued', 'leased', 'waiting_provider', 'retry', 'succeeded', 'failed', 'dead')),
  provider text not null default 'circle',
  provider_operation_id text,
  payload jsonb not null default '{}'::jsonb,
  provider_receipt jsonb not null default '{}'::jsonb,
  attempts integer not null default 0,
  max_attempts integer not null default 8 check (max_attempts between 1 and 25),
  next_attempt_at timestamptz not null default now(),
  lease_owner text,
  lease_expires_at timestamptz,
  last_error_code text,
  last_error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz,
  unique (workspace_id, idempotency_key)
);

create table if not exists circle_webhook_events (
  id text primary key,
  workspace_id text not null references workspaces(id) on delete cascade,
  notification_id text not null unique,
  subscription_id text,
  notification_type text not null,
  provider_operation_id text,
  signature_key_id text,
  signature_verified boolean not null default false,
  payload jsonb not null,
  processing_status text not null default 'received' check (processing_status in ('received', 'matched', 'ignored', 'failed')),
  processing_error text,
  received_at timestamptz not null default now(),
  processed_at timestamptz
);

create index if not exists execution_jobs_claim_idx on execution_jobs(status, next_attempt_at, lease_expires_at);
create index if not exists execution_jobs_provider_idx on execution_jobs(provider_operation_id) where provider_operation_id is not null;
create index if not exists execution_jobs_resource_idx on execution_jobs(workspace_id, resource_type, resource_id);
create index if not exists circle_webhook_events_time_idx on circle_webhook_events(received_at desc);

create or replace function enqueue_execution_job(
  p_id text,
  p_workspace_id text,
  p_idempotency_key text,
  p_kind text,
  p_resource_type text,
  p_resource_id text,
  p_action text,
  p_provider_operation_id text default null,
  p_payload jsonb default '{}'::jsonb,
  p_initial_status text default 'queued'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_job execution_jobs%rowtype;
begin
  if p_initial_status not in ('queued', 'waiting_provider', 'succeeded') then raise exception 'Unsupported initial execution status'; end if;
  insert into execution_jobs (
    id, workspace_id, idempotency_key, kind, resource_type, resource_id, action,
    provider_operation_id, payload, status, completed_at
  ) values (
    p_id, p_workspace_id, p_idempotency_key, p_kind, p_resource_type, p_resource_id, p_action,
    nullif(p_provider_operation_id, ''), coalesce(p_payload, '{}'::jsonb), p_initial_status,
    case when p_initial_status = 'succeeded' then now() else null end
  )
  on conflict (workspace_id, idempotency_key) do update set
    provider_operation_id = coalesce(execution_jobs.provider_operation_id, excluded.provider_operation_id),
    payload = execution_jobs.payload || excluded.payload,
    updated_at = now()
  returning * into v_job;
  return to_jsonb(v_job);
end;
$$;

create or replace function claim_execution_jobs(
  p_workspace_id text,
  p_worker_id text,
  p_limit integer default 10,
  p_lease_seconds integer default 55
)
returns setof execution_jobs
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  with candidates as (
    select id from execution_jobs
    where workspace_id = p_workspace_id
      and (
        (status in ('queued', 'retry') and next_attempt_at <= now())
        or (status = 'waiting_provider' and provider_operation_id is not null and next_attempt_at <= now())
        or (status = 'leased' and lease_expires_at < now())
      )
    order by next_attempt_at asc, created_at asc
    for update skip locked
    limit greatest(1, least(p_limit, 50))
  )
  update execution_jobs j set
    status = 'leased',
    lease_owner = p_worker_id,
    lease_expires_at = now() + make_interval(secs => greatest(10, least(p_lease_seconds, 300))),
    attempts = attempts + 1,
    updated_at = now()
  from candidates c
  where j.id = c.id
  returning j.*;
end;
$$;

create or replace function finish_execution_job(
  p_workspace_id text,
  p_job_id text,
  p_worker_id text,
  p_status text,
  p_provider_operation_id text default null,
  p_provider_receipt jsonb default '{}'::jsonb,
  p_error_code text default null,
  p_error_message text default null,
  p_retry_seconds integer default 60
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_job execution_jobs%rowtype;
  v_final_status text := p_status;
begin
  select * into v_job from execution_jobs
  where id = p_job_id and workspace_id = p_workspace_id for update;
  if not found then raise exception 'Execution job not found'; end if;
  if v_job.lease_owner is distinct from p_worker_id then raise exception 'Execution lease owner mismatch'; end if;
  if p_status not in ('waiting_provider', 'retry', 'succeeded', 'failed') then raise exception 'Unsupported execution result'; end if;
  if p_status = 'retry' and v_job.attempts >= v_job.max_attempts then v_final_status := 'dead'; end if;

  update execution_jobs set
    status = v_final_status,
    provider_operation_id = coalesce(nullif(p_provider_operation_id, ''), provider_operation_id),
    provider_receipt = provider_receipt || coalesce(p_provider_receipt, '{}'::jsonb),
    next_attempt_at = case when v_final_status in ('retry', 'waiting_provider') then now() + make_interval(secs => greatest(5, p_retry_seconds)) else next_attempt_at end,
    lease_owner = null,
    lease_expires_at = null,
    last_error_code = p_error_code,
    last_error_message = left(p_error_message, 1000),
    updated_at = now(),
    completed_at = case when v_final_status in ('succeeded', 'failed', 'dead') then now() else null end
  where id = p_job_id
  returning * into v_job;
  return to_jsonb(v_job);
end;
$$;

create or replace function record_circle_webhook(
  p_id text,
  p_workspace_id text,
  p_notification_id text,
  p_subscription_id text,
  p_notification_type text,
  p_provider_operation_id text,
  p_signature_key_id text,
  p_signature_verified boolean,
  p_payload jsonb,
  p_provider_state text,
  p_tx_hash text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event circle_webhook_events%rowtype;
  v_status text;
  v_matched integer := 0;
begin
  insert into circle_webhook_events (
    id, workspace_id, notification_id, subscription_id, notification_type,
    provider_operation_id, signature_key_id, signature_verified, payload
  ) values (
    p_id, p_workspace_id, p_notification_id, p_subscription_id, p_notification_type,
    nullif(p_provider_operation_id, ''), p_signature_key_id, p_signature_verified, p_payload
  )
  on conflict (notification_id) do update set notification_id = excluded.notification_id
  returning * into v_event;

  if v_event.processed_at is not null then return jsonb_build_object('event', to_jsonb(v_event), 'duplicate', true, 'matched', 0); end if;

  v_status := case
    when upper(coalesce(p_provider_state, '')) in ('COMPLETE', 'COMPLETED', 'CONFIRMED', 'SUCCESS', 'SUCCEEDED') then 'succeeded'
    when upper(coalesce(p_provider_state, '')) in ('FAILED', 'DENIED', 'CANCELLED', 'CANCELED') then 'failed'
    else 'waiting_provider'
  end;

  if nullif(p_provider_operation_id, '') is not null then
    update execution_jobs set
      status = v_status,
      provider_receipt = provider_receipt || jsonb_build_object(
        'lastWebhookType', p_notification_type,
        'lastWebhookState', p_provider_state,
        'txHash', p_tx_hash,
        'notificationId', p_notification_id
      ),
      last_error_code = case when v_status = 'failed' then 'circle_provider_failed' else null end,
      last_error_message = case when v_status = 'failed' then 'Circle provider operation failed' else null end,
      updated_at = now(),
      completed_at = case when v_status in ('succeeded', 'failed') then now() else null end
    where workspace_id = p_workspace_id and provider_operation_id = p_provider_operation_id;
    get diagnostics v_matched = row_count;
  end if;

  update circle_webhook_events set
    processing_status = case when v_matched > 0 then 'matched' else 'ignored' end,
    processed_at = now()
  where id = v_event.id
  returning * into v_event;

  return jsonb_build_object('event', to_jsonb(v_event), 'duplicate', false, 'matched', v_matched);
end;
$$;

revoke all on function enqueue_execution_job(text, text, text, text, text, text, text, text, jsonb, text) from public, anon, authenticated;
revoke all on function claim_execution_jobs(text, text, integer, integer) from public, anon, authenticated;
revoke all on function finish_execution_job(text, text, text, text, text, jsonb, text, text, integer) from public, anon, authenticated;
revoke all on function record_circle_webhook(text, text, text, text, text, text, text, boolean, jsonb, text, text) from public, anon, authenticated;
grant execute on function enqueue_execution_job(text, text, text, text, text, text, text, text, jsonb, text) to service_role;
grant execute on function claim_execution_jobs(text, text, integer, integer) to service_role;
grant execute on function finish_execution_job(text, text, text, text, text, jsonb, text, text, integer) to service_role;
grant execute on function record_circle_webhook(text, text, text, text, text, text, text, boolean, jsonb, text, text) to service_role;

alter table execution_jobs enable row level security;
alter table circle_webhook_events enable row level security;
revoke all on execution_jobs, circle_webhook_events from anon, authenticated;
grant all on execution_jobs, circle_webhook_events to service_role;
