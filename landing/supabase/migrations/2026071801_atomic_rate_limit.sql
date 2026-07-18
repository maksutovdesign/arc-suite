create or replace function consume_rate_limit(
  p_workspace_id text,
  p_route text,
  p_bucket_key text,
  p_ip_hash text,
  p_since timestamptz,
  p_max integer
)
returns table(allowed boolean, event_count integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_count integer;
begin
  if p_max < 1 or p_max > 10000 then
    raise exception 'invalid rate limit maximum';
  end if;

  perform pg_advisory_xact_lock(
    hashtextextended(concat_ws(':', p_workspace_id, p_route, p_bucket_key), 0)
  );

  select count(*)::integer
    into current_count
    from rate_limit_events
   where workspace_id = p_workspace_id
     and route = p_route
     and bucket_key = p_bucket_key
     and created_at >= p_since;

  if current_count >= p_max then
    return query select false, current_count;
    return;
  end if;

  insert into rate_limit_events(id, workspace_id, route, bucket_key, ip_hash)
  values (
    'rl_' || replace(gen_random_uuid()::text, '-', ''),
    p_workspace_id,
    p_route,
    p_bucket_key,
    p_ip_hash
  );

  return query select true, current_count + 1;
end;
$$;

revoke all on function consume_rate_limit(text, text, text, text, timestamptz, integer) from public;
grant execute on function consume_rate_limit(text, text, text, text, timestamptz, integer) to service_role;
