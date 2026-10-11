create extension if not exists pgcrypto with schema extensions;
create extension if not exists pg_cron with schema pg_catalog;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to postgres, service_role;

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  queue_seq bigint generated always as identity unique,
  code text not null unique check (code ~ '^KS-[A-F0-9]{10}$'),
  name text not null check (char_length(name) between 2 and 30),
  wish text not null check (char_length(wish) between 3 and 140),
  color smallint not null check (color between 0 and 2),
  price integer not null check ((color = 0 and price = 20) or (color = 1 and price = 40) or (color = 2 and price = 60)),
  sender_phone text check (sender_phone is null or sender_phone ~ '^01[0125][0-9]{8}$'),
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'expired', 'rejected')),
  created_at timestamptz not null default clock_timestamp(),
  confirmed_at timestamptz,
  no integer unique check (no between 1 and 1000),
  admin_note text,
  check ((status = 'confirmed') = (no is not null)),
  check ((status = 'confirmed') = (confirmed_at is not null))
);
create index orders_pending_created_at_idx on public.orders (created_at) where status = 'pending';
create index orders_sender_phone_pending_idx on public.orders (sender_phone, created_at) where status = 'pending';
create index orders_status_created_at_idx on public.orders (status, created_at desc);
create index orders_wish_match_idx on public.orders (lower(wish));
alter table public.orders enable row level security;
revoke all on public.orders from public, anon, authenticated;
grant all on public.orders to service_role;

create table private.admin_users (user_id uuid primary key references auth.users(id) on delete cascade, created_at timestamptz not null default now());
alter table private.admin_users enable row level security;
revoke all on private.admin_users from public, anon, authenticated, service_role;
create table private.order_attempts (ip_hash text not null, created_at timestamptz not null default now());
create index order_attempts_ip_created_idx on private.order_attempts (ip_hash, created_at desc);
alter table private.order_attempts enable row level security;
revoke all on private.order_attempts from public, anon, authenticated, service_role;
create table private.status_attempts (ip_hash text not null, created_at timestamptz not null default now());
create index status_attempts_ip_created_idx on private.status_attempts (ip_hash, created_at desc);
alter table private.status_attempts enable row level security;
revoke all on private.status_attempts from public, anon, authenticated, service_role;

create or replace function private.is_admin() returns boolean
language sql stable security definer set search_path = ''
as $$ select exists (select 1 from private.admin_users a where a.user_id = (select auth.uid())); $$;
revoke all on function private.is_admin() from public, anon;
grant execute on function private.is_admin() to authenticated, service_role;

create or replace function private.expire_pending() returns integer
language plpgsql security definer set search_path = ''
as $$
declare changed integer;
begin
  update public.orders set status = 'expired'
  where status = 'pending' and created_at <= now() - interval '24 hours';
  get diagnostics changed = row_count;
  return changed;
end;
$$;
revoke all on function private.expire_pending() from public, anon, authenticated;

create or replace function public.create_order(p_name text, p_wish text, p_color integer, p_phone text, p_ip_hash text)
returns table (code text, price integer, pos integer)
language plpgsql security definer set search_path = ''
as $$
declare
  clean_name text;
  clean_wish text;
  next_code text;
  order_price integer;
  confirmed_count integer;
  pending_count integer;
begin
  perform pg_advisory_xact_lock(43718620261011);
  perform private.expire_pending();
  if p_color is null or p_color not between 0 and 2 then raise exception using errcode = '22023', message = 'invalid_color'; end if;
  if p_phone is null or p_phone !~ '^01[0125][0-9]{8}$' then raise exception using errcode = '22023', message = 'invalid_phone'; end if;
  if p_ip_hash is null or p_ip_hash !~ '^[0-9a-f]{64}$' then raise exception using errcode = '22023', message = 'invalid_request'; end if;
  clean_name := btrim(regexp_replace(regexp_replace(p_name, '[[:cntrl:]]', ' ', 'g'), '\s+', ' ', 'g'));
  clean_wish := btrim(regexp_replace(regexp_replace(p_wish, '[[:cntrl:]]', ' ', 'g'), '\s+', ' ', 'g'));
  if clean_name is null or char_length(clean_name) not between 2 and 30 then raise exception using errcode = '22023', message = 'invalid_name'; end if;
  if clean_wish is null or char_length(clean_wish) not between 3 and 140 then raise exception using errcode = '22023', message = 'invalid_wish'; end if;
  select count(*) into confirmed_count from public.orders where status = 'confirmed';
  select count(*) into pending_count from public.orders where status = 'pending';
  if confirmed_count + pending_count >= 1000 then raise exception using errcode = 'P0001', message = 'ordering_closed'; end if;
  if (select count(*) from public.orders where sender_phone = p_phone and status = 'pending') >= 3 then
    raise exception using errcode = 'P0001', message = 'phone_rate_limited';
  end if;
  delete from private.order_attempts where created_at < now() - interval '1 hour';
  if (select count(*) from private.order_attempts where ip_hash = p_ip_hash and created_at >= now() - interval '1 hour') >= 100 then
    raise exception using errcode = 'P0001', message = 'ip_rate_limited';
  end if;
  order_price := case p_color when 0 then 20 when 1 then 40 else 60 end;
  loop
    next_code := 'KS-' || upper(encode(extensions.gen_random_bytes(5), 'hex'));
    exit when not exists (select 1 from public.orders o where o.code = next_code);
  end loop;
  insert into public.orders (code, name, wish, color, price, sender_phone, created_at)
  values (next_code, clean_name, clean_wish, p_color, order_price, p_phone, clock_timestamp());
  insert into private.order_attempts (ip_hash) values (p_ip_hash);
  return query select next_code, order_price, confirmed_count + pending_count + 1;
end;
$$;
revoke all on function public.create_order(text, text, integer, text, text) from public, anon, authenticated;
grant execute on function public.create_order(text, text, integer, text, text) to service_role;

create or replace function public.expire_orders() returns integer
language plpgsql security definer set search_path = ''
as $$
declare changed integer;
begin
  perform pg_advisory_xact_lock(43718620261011);
  changed := private.expire_pending();
  delete from private.order_attempts where created_at < now() - interval '1 hour';
  delete from private.status_attempts where created_at < now() - interval '1 hour';
  update public.orders set sender_phone = null
  where sender_phone is not null and status <> 'pending'
    and created_at <= now() - interval '365 days';
  return changed;
end;
$$;
revoke all on function public.expire_orders() from public, anon, authenticated;
grant execute on function public.expire_orders() to service_role;

create or replace function public.order_status(p_code text, p_ip_hash text)
returns table (status text, no integer)
language plpgsql security definer set search_path = ''
as $$
declare attempts integer;
begin
  if p_ip_hash is null or p_ip_hash !~ '^[0-9a-f]{64}$' then raise exception using errcode = '22023', message = 'invalid_request'; end if;
  perform pg_advisory_xact_lock(hashtextextended('status:' || p_ip_hash, 0));
  delete from private.status_attempts where created_at < now() - interval '1 hour';
  select count(*) into attempts from private.status_attempts where ip_hash = p_ip_hash and created_at >= now() - interval '1 minute';
  if attempts >= 60 then raise exception using errcode = 'P0001', message = 'status_rate_limited'; end if;
  insert into private.status_attempts (ip_hash) values (p_ip_hash);
  update public.orders set status = 'expired'
  where code = upper(btrim(p_code)) and p_code ~ '^KS-[A-F0-9]{10}$'
    and status = 'pending' and created_at <= clock_timestamp() - interval '24 hours';
  return query
  select coalesce(o.status, 'not_found'), case when o.status = 'confirmed' then o.no else null end
  from (select 1) seed left join public.orders o on o.code = upper(btrim(p_code)) and p_code ~ '^KS-[A-F0-9]{10}$';
end;
$$;
revoke all on function public.order_status(text, text) from public, anon, authenticated;
grant execute on function public.order_status(text, text) to service_role;

create or replace function public.get_public_wishes()
returns table (no integer, name text, wish text, color smallint)
language sql stable security definer set search_path = ''
as $$ select o.no, o.name, o.wish, o.color from public.orders o where o.status = 'confirmed' order by o.no; $$;
revoke all on function public.get_public_wishes() from public;
grant execute on function public.get_public_wishes() to anon, authenticated, service_role;

create or replace function public.admin_orders()
returns table (id uuid, queue_seq bigint, code text, name text, wish text, color smallint, price integer, sender_phone text, status text, created_at timestamptz, confirmed_at timestamptz, no integer, admin_note text)
language plpgsql stable security definer set search_path = ''
as $$
begin
  if not private.is_admin() then raise exception using errcode = '42501', message = 'admin_only'; end if;
  return query select o.id, o.queue_seq, o.code, o.name, o.wish, o.color, o.price, o.sender_phone, o.status, o.created_at, o.confirmed_at, o.no, o.admin_note from public.orders o order by o.created_at desc;
end;
$$;
revoke all on function public.admin_orders() from public, anon;
grant execute on function public.admin_orders() to authenticated, service_role;

create or replace function public.admin_stats() returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
declare result jsonb;
begin
  if not private.is_admin() then raise exception using errcode = '42501', message = 'admin_only'; end if;
  select jsonb_build_object(
    'pending', count(*) filter (where status = 'pending'),
    'confirmed', count(*) filter (where status = 'confirmed'),
    'expired', count(*) filter (where status = 'expired'),
    'rejected', count(*) filter (where status = 'rejected'),
    'today', count(*) filter (where created_at >= date_trunc('day', now() at time zone 'Africa/Cairo') at time zone 'Africa/Cairo'),
    'revenue', jsonb_build_object(
      '0', coalesce(sum(price) filter (where status = 'confirmed' and color = 0), 0),
      '1', coalesce(sum(price) filter (where status = 'confirmed' and color = 1), 0),
      '2', coalesce(sum(price) filter (where status = 'confirmed' and color = 2), 0)
    )
  ) into result from public.orders;
  return result;
end;
$$;
revoke all on function public.admin_stats() from public, anon;
grant execute on function public.admin_stats() to authenticated, service_role;

create or replace function public.confirm_order(p_id uuid) returns integer
language plpgsql security definer set search_path = ''
as $$
declare target public.orders%rowtype; next_no integer;
begin
  if not private.is_admin() then raise exception using errcode = '42501', message = 'admin_only'; end if;
  perform pg_advisory_xact_lock(43718620261011);
  perform private.expire_pending();
  select * into target from public.orders where id = p_id for update;
  if not found then raise exception using errcode = 'P0002', message = 'order_not_found'; end if;
  if target.status not in ('pending', 'expired') then raise exception using errcode = 'P0001', message = 'order_not_confirmable'; end if;
  select count(*) + 1 into next_no from public.orders where status = 'confirmed';
  if next_no > 1000 then raise exception using errcode = 'P0001', message = 'ordering_closed'; end if;
  update public.orders set status = 'confirmed', no = next_no, confirmed_at = now() where id = p_id;
  return next_no;
end;
$$;
revoke all on function public.confirm_order(uuid) from public, anon;
grant execute on function public.confirm_order(uuid) to authenticated, service_role;

create or replace function public.reject_order(p_id uuid) returns boolean
language plpgsql security definer set search_path = ''
as $$
declare changed integer;
begin
  if not private.is_admin() then raise exception using errcode = '42501', message = 'admin_only'; end if;
  perform pg_advisory_xact_lock(43718620261011);
  perform private.expire_pending();
  update public.orders set status = 'rejected' where id = p_id and status in ('pending', 'expired');
  get diagnostics changed = row_count;
  if changed = 0 then raise exception using errcode = 'P0001', message = 'order_not_rejectable'; end if;
  return true;
end;
$$;
revoke all on function public.reject_order(uuid) from public, anon;
grant execute on function public.reject_order(uuid) to authenticated, service_role;

create or replace function public.admin_update_order(p_id uuid, p_wish text, p_admin_note text) returns boolean
language plpgsql security definer set search_path = ''
as $$
declare clean_wish text; clean_note text; changed integer;
begin
  if not private.is_admin() then raise exception using errcode = '42501', message = 'admin_only'; end if;
  clean_wish := btrim(regexp_replace(regexp_replace(p_wish, '[[:cntrl:]]', ' ', 'g'), '\s+', ' ', 'g'));
  clean_note := nullif(btrim(regexp_replace(regexp_replace(coalesce(p_admin_note, ''), '[[:cntrl:]]', ' ', 'g'), '\s+', ' ', 'g')), '');
  if clean_wish is null or char_length(clean_wish) not between 3 and 140 then raise exception using errcode = '22023', message = 'invalid_wish'; end if;
  if clean_note is not null and char_length(clean_note) > 1000 then raise exception using errcode = '22023', message = 'invalid_admin_note'; end if;
  update public.orders set wish = clean_wish, admin_note = clean_note where id = p_id and status <> 'rejected';
  get diagnostics changed = row_count;
  if changed = 0 then raise exception using errcode = 'P0002', message = 'order_not_editable'; end if;
  return true;
end;
$$;
revoke all on function public.admin_update_order(uuid, text, text) from public, anon;
grant execute on function public.admin_update_order(uuid, text, text) to authenticated, service_role;

select cron.schedule('expire-pending-wishes', '*/5 * * * *', 'select public.expire_orders();');
