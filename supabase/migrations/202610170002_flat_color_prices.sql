alter table public.orders drop constraint orders_price_check;
alter table public.orders add constraint orders_price_check check (
  price = 100
  or (color = 0 and price = 20)
  or (color = 1 and price = 40)
  or (color = 2 and price = 60)
);

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
  order_price := 100;
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