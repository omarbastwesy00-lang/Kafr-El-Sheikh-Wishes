-- Demo wishes only. Run against a disposable STAGING project, never production.
-- Set this transaction-local guard to the following exact value before executing:
-- select set_config('app.seed_staging', 'confirm-staging-only', true);
do $$
begin
  if current_setting('app.seed_staging', true) is distinct from 'confirm-staging-only' then
    raise exception 'Staging seed stopped. Set app.seed_staging to confirm-staging-only in this session.';
  end if;
end;
$$;

insert into public.orders (code, name, wish, color, price, sender_phone, status, confirmed_at, no)
values
  ('KS-DEAD000001', 'نور', 'أتمنى النجاح والتوفيق لكل أهل بلدنا', 0, 100, '01020000001', 'confirmed', now(), 1),
  ('KS-DEAD000002', 'مريم', 'يا رب أيامنا الجاية تكون مليانة خير', 1, 100, '01020000002', 'confirmed', now(), 2),
  ('KS-DEAD000003', 'يوسف', 'أتمنى أحقق حلمي وأرجع أخدم بلدي', 2, 100, '01020000003', 'confirmed', now(), 3),
  ('KS-DEAD000004', 'سلمى', 'ربنا يفرّح قلب كل حد مستني خبر حلو', 0, 100, '01020000004', 'confirmed', now(), 4),
  ('KS-DEAD000005', 'عمر', 'أتمنى السلامة والصحة لكل عيلتي', 1, 100, '01020000005', 'confirmed', now(), 5);
