create or replace function public.order_status(p_code text, p_ip_hash text)
returns table (status text, no integer)
language plpgsql security definer set search_path = ''
as $$
declare attempts integer;
begin
  if p_ip_hash is null or p_ip_hash !~ '^[0-9a-f]{64}$' then
    raise exception using errcode = '22023', message = 'invalid_request';
  end if;
  perform pg_advisory_xact_lock(hashtextextended('status:' || p_ip_hash, 0));
  delete from private.status_attempts where created_at < now() - interval '1 hour';
  select count(*) into attempts
  from private.status_attempts
  where ip_hash = p_ip_hash and created_at >= now() - interval '1 minute';
  if attempts >= 60 then
    raise exception using errcode = 'P0001', message = 'status_rate_limited';
  end if;
  insert into private.status_attempts (ip_hash) values (p_ip_hash);

  update public.orders as o
  set status = 'expired'
  where o.code = upper(btrim(p_code)) and p_code ~ '^KS-[A-F0-9]{10}$'
    and o.status = 'pending' and o.created_at <= clock_timestamp() - interval '24 hours';

  return query
  select coalesce(o.status, 'not_found'), case when o.status = 'confirmed' then o.no else null end
  from (select 1) seed
  left join public.orders o on o.code = upper(btrim(p_code)) and p_code ~ '^KS-[A-F0-9]{10}$';
end;
$$;
