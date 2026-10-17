alter table public.orders add column governorate text;
alter table public.orders add constraint orders_governorate_check check (
  governorate is null or governorate in (
    'القاهرة', 'الإسكندرية', 'بورسعيد', 'السويس', 'دمياط', 'الدقهلية', 'الشرقية',
    'القليوبية', 'كفر الشيخ', 'الغربية', 'المنوفية', 'البحيرة', 'الإسماعيلية',
    'الجيزة', 'بني سويف', 'الفيوم', 'المنيا', 'أسيوط', 'سوهاج', 'قنا', 'أسوان',
    'الأقصر', 'البحر الأحمر', 'الوادي الجديد', 'مطروح', 'شمال سيناء', 'جنوب سيناء'
  )
);

create or replace function public.create_order(
  p_name text,
  p_wish text,
  p_governorate text,
  p_color integer,
  p_phone text,
  p_ip_hash text
)
returns table (code text, price integer, pos integer)
language plpgsql security definer set search_path = ''
as $$
declare
  clean_governorate text;
  created record;
begin
  clean_governorate := btrim(regexp_replace(regexp_replace(p_governorate, '[[:cntrl:]]', ' ', 'g'), '\s+', ' ', 'g'));
  if clean_governorate is null or clean_governorate not in (
    'القاهرة', 'الإسكندرية', 'بورسعيد', 'السويس', 'دمياط', 'الدقهلية', 'الشرقية',
    'القليوبية', 'كفر الشيخ', 'الغربية', 'المنوفية', 'البحيرة', 'الإسماعيلية',
    'الجيزة', 'بني سويف', 'الفيوم', 'المنيا', 'أسيوط', 'سوهاج', 'قنا', 'أسوان',
    'الأقصر', 'البحر الأحمر', 'الوادي الجديد', 'مطروح', 'شمال سيناء', 'جنوب سيناء'
  ) then
    raise exception using errcode = '22023', message = 'invalid_governorate';
  end if;

  select * into created
  from public.create_order(p_name, p_wish, p_color, p_phone, p_ip_hash);

  update public.orders set governorate = clean_governorate where code = created.code;
  return query select created.code, created.price, created.pos;
end;
$$;
revoke all on function public.create_order(text, text, text, integer, text, text) from public, anon, authenticated;
grant execute on function public.create_order(text, text, text, integer, text, text) to service_role;

drop function public.admin_orders();
create function public.admin_orders()
returns table (id uuid, queue_seq bigint, code text, name text, governorate text, wish text, color smallint, price integer, sender_phone text, status text, created_at timestamptz, confirmed_at timestamptz, no integer, admin_note text)
language plpgsql stable security definer set search_path = ''
as $$
begin
  if not private.is_admin() then raise exception using errcode = '42501', message = 'admin_only'; end if;
  return query
  select o.id, o.queue_seq, o.code, o.name, o.governorate, o.wish, o.color, o.price, o.sender_phone, o.status, o.created_at, o.confirmed_at, o.no, o.admin_note
  from public.orders o order by o.created_at desc;
end;
$$;
revoke all on function public.admin_orders() from public, anon;
grant execute on function public.admin_orders() to authenticated, service_role;