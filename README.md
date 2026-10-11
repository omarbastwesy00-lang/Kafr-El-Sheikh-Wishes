# Kafr El-Sheikh Wishes

A single-page Arabic/RtL wishes experience with a Supabase/Postgres backend and a private admin console. The public artwork, copy, motion, zoom/pan, sound behavior, and seeded-RNG slot map come from the supplied HTML; there are no sample wishes in production.

## English Quick Start

### Requirements

- Node.js 20 or newer and npm.
- A Supabase project, a Vercel account, and a domain when ready to launch.
- The Supabase CLI for migrations and Edge Functions (`npx supabase`).

### Local frontend

```powershell
Copy-Item .env.example .env
# Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env
npm.cmd install
npm.cmd run dev
```

The visual page still renders if those values are missing or Supabase is unavailable. Order creation then reports a network/configuration error instead of saving a fake order.
Vite embeds `VITE_` values at build time: if using `npm.cmd run preview`, rebuild with `npm.cmd run build` and restart the preview after editing `.env`. The dev server reads the values when it starts.

### Troubleshooting order creation

- If the page says Supabase settings are missing, confirm `.env` has the project URL and anon public key, then restart `npm.cmd run dev` or rebuild/restart preview.
- If a request reaches Supabase but fails, confirm `npx supabase functions deploy create-order` was run, the core migration was applied, Edge secrets include the rate-limit salt, and the current site origin is in `ALLOWED_ORIGINS`.
- The browser must use only the anon public key. `SUPABASE_SERVICE_ROLE_KEY` belongs in the Edge Function environment, never in `VITE_` settings.

### Supabase setup

1. Create a new Supabase project and save its project reference, URL, and **anon public key**. Never use a service-role key in a `VITE_` variable.
2. From the repository root, authenticate/link the CLI and apply the migration:

   ```powershell
   npx supabase login
   npx supabase link --project-ref zexluuncwzbdheiiykcl
   npx supabase db push
   ```

3. Set Edge Function secrets. `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are supplied by Supabase in the Edge runtime; if the project does not inject them, add them as Supabase secrets. Create a random `RATE_LIMIT_SALT` of at least 32 characters in a password manager. Set `ALLOWED_ORIGINS` to the exact Vercel and custom-domain origins, comma-separated. `ABUSE_FILTER_URL` and `ABUSE_FILTER_TOKEN` are optional; when a URL is configured, the endpoint must return `{ "allowed": true }` for accepted text.

   ```powershell
   npx supabase secrets set RATE_LIMIT_SALT=YOUR_RANDOM_SECRET ALLOWED_ORIGINS=http://127.0.0.1:4173,https://YOUR_VERCEL_HOST,https://YOUR_DOMAIN
   npx supabase functions deploy create-order
   npx supabase functions deploy order-status
   ```

4. In Supabase Authentication, create one user with the admin email/password. Disable public sign-ups. In the SQL editor, add that user to the private allowlist:

   ```sql
   insert into private.admin_users (user_id)
   select id from auth.users where email = 'ADMIN_EMAIL'
   on conflict (user_id) do nothing;
   ```

   Only allow one trusted admin account. `/admin/` is intentionally unlinked and marked `noindex`; the database role check is the actual access control.
5. Confirm the expiry job exists: `select * from cron.job where jobname = 'expire-pending-wishes';`. It runs every five minutes. `create_order` and `order_status` also expire stale pending orders lazily.

### Vercel and domain

1. Import this repository into Vercel. Keep the project root at the repository root; `vercel.json` runs `npm run build` and serves `dist/`.
2. Set only `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in Vercel's Production environment. Redeploy after setting them. These are public browser values; the service-role key and rate-limit salt belong only in Supabase Edge Function secrets.
3. Add the custom domain in Vercel's project settings and apply the DNS records Vercel provides. After DNS/HTTPS is active, replace `YOUR_DOMAIN` in `public/index.html`, `public/robots.txt`, and `public/sitemap.xml` with the canonical host, then redeploy. Add the final origin to `ALLOWED_ORIGINS` and redeploy both Edge Functions.
4. Verify `/`, `/terms.html`, `/admin/`, `/robots.txt`, `/sitemap.xml`, and `/og-image.png` on the deployed HTTPS domain. `/admin/` must remain `noindex` and absent from the sitemap.

### Manual Vodafone Cash confirmation

A payment gateway callback is not part of this project. A person with the admin account must compare the incoming Vodafone Cash transfer against the sender number and amount shown for the pending order. The order's price is fixed by Postgres from the selected color (20/40/60 EGP); the browser cannot set it. Open `/admin/`, search by code/phone/name, verify the transfer in the Vodafone Cash account, then choose **تأكيد**. The confirmation RPC assigns the next number inside one locked database transaction. An expired request can still be confirmed; a rejected one cannot. Do not confirm based only on a screenshot or the visitor's claim.

### Backups and data retention

Use Supabase's managed backup/PITR option appropriate to the selected plan and verify a restore before launch. Also take a logical database dump on a regular schedule, encrypt it with your organization's approved tool, and store it outside this repository:

```powershell
New-Item -ItemType Directory -Force backups
npx supabase db dump --linked --file backups/kfs-YYYY-MM-DD.sql
```

Never commit dumps, customer exports, `.env`, or credentials. Sender phone numbers are removed from completed order rows after one year; salted IP hashes used for rate limiting are deleted after one hour. Confirmed public names/wishes remain on the board. Review this retention and the refund wording with the project owner before accepting payments.

## التشغيل السريع بالعربية

### المتطلبات

- Node.js إصدار 20 أو أحدث وnpm.
- مشروع Supabase وحساب Vercel، ونطاق عند الاستعداد للإطلاق.
- أداة Supabase CLI عبر `npx supabase`.

### تشغيل الواجهة محليًا

```powershell
Copy-Item .env.example .env
# ضع VITE_SUPABASE_URL وVITE_SUPABASE_ANON_KEY في .env
npm.cmd install
npm.cmd run dev
```

الواجهة والرسوم تظل ظاهرة إذا تعذر الاتصال أو لم تُضف الإعدادات؛ لن يُنشأ طلب وهمي.

### إعداد Supabase

1. أنشئ مشروعًا جديدًا، واحتفظ بمرجع المشروع والرابط ومفتاح `anon public` فقط للواجهة. لا تضع مفتاح `service_role` في أي متغير يبدأ بـ `VITE_`.
2. من مجلد المشروع اربط Supabase وطبّق الترحيل:

   ```powershell
   npx supabase login
      npx supabase link --project-ref zexluuncwzbdheiiykcl
   npx supabase db push
   ```

3. اضبط أسرار Edge Functions في Supabase. يوفّر Supabase عادةً `SUPABASE_URL` و`SUPABASE_SERVICE_ROLE_KEY` داخل بيئة الوظيفة. أنشئ `RATE_LIMIT_SALT` عشوائيًا بطول 32 حرفًا أو أكثر، واضبط `ALLOWED_ORIGINS` على نطاق Vercel والنطاق المخصص. مرشح الإساءة اختياري: عند ضبط `ABUSE_FILTER_URL` يجب أن يعيد `{ "allowed": true }` للنص المقبول.

   ```powershell
   npx supabase secrets set RATE_LIMIT_SALT=YOUR_RANDOM_SECRET ALLOWED_ORIGINS=http://127.0.0.1:4173,https://YOUR_VERCEL_HOST,https://YOUR_DOMAIN
   npx supabase functions deploy create-order
   npx supabase functions deploy order-status
   ```

4. أنشئ مستخدمًا واحدًا للإدارة من Supabase Authentication، ثم عطّل التسجيل العام. أضف معرّف المستخدم إلى قائمة السماح الخاصة:

   ```sql
   insert into private.admin_users (user_id)
   select id from auth.users where email = 'ADMIN_EMAIL'
   on conflict (user_id) do nothing;
   ```

   صفحة `/admin/` غير مرتبطة بالواجهة وموسومة `noindex`، لكن الحماية الفعلية من صلاحيات قاعدة البيانات.
5. تحقق من مهمة انتهاء الطلبات كل خمس دقائق:

   ```sql
   select * from cron.job where jobname = 'expire-pending-wishes';
   ```

### النشر والنطاق

1. اربط المستودع بـ Vercel من جذر المشروع. إعداد `vercel.json` يبني إلى `dist/`.
2. أضف `VITE_SUPABASE_URL` و`VITE_SUPABASE_ANON_KEY` في إعدادات Production في Vercel ثم أعد النشر. المفاتيح السرية تبقى في Supabase فقط.
3. أضف النطاق من إعدادات Vercel واضبط سجلات DNS كما يطلب Vercel. استبدل `YOUR_DOMAIN` في `public/index.html` و`public/robots.txt` و`public/sitemap.xml` بالنطاق المعتمد، ثم أعد النشر. أضف النطاق إلى `ALLOWED_ORIGINS` وأعد نشر الوظيفتين.
4. اختبر صفحات الموقع والشروط والإدارة وملفات `robots.txt` و`sitemap.xml` و`og-image.png` عبر HTTPS.

### مراجعة تحويل فودافون كاش

لا يوجد تأكيد آلي من مزود الدفع. يراجع المسؤول التحويل يدويًا في حساب فودافون كاش، ويطابق رقم المرسل والمبلغ مع الطلب، ثم يفتح `/admin/` ويختار **تأكيد**. السعر يُحسب في قاعدة البيانات حسب اللون (20/40/60 جنيهًا)، والرقم النهائي يُخصص ذريًا عند التأكيد فقط. يمكن تأكيد الطلب المنتهي، ولا يمكن تأكيد المرفوض. لا تعتمد على صورة إيصال وحدها.

## Backend Rules

- `orders` has RLS enabled and no public table grants. Anonymous visitors can call only the safe public-wishes RPC and the rate-limited Edge endpoints. The public wish response contains exactly `no`, `name`, `wish`, and `color`.
- Prices, input validation, queue positions, status changes, and star numbers are database controlled. Create/confirm/reject/expiry share a transaction advisory lock; unique `no` is a second guard. Confirmed numbers are `1..N` without gaps.
- Order codes use `KS-` plus 10 random hexadecimal characters. Tentative positions are recomputed from confirmed count and live pending insertion sequence; expired orders leave the queue.
- Limits: three live pending orders per sender phone, 100 successful creates per hashed IP per hour, and 60 status lookups per hashed IP per minute. The browser stores order codes only.
- The moderation hook is off unless an Edge secret URL is configured. User content is rendered as text, never interpolated as HTML.

`supabase/seed-staging.sql` is for demos only. Its guard is intentionally stopped by default; only use it on a disposable staging project. Never insert demo wishes into production.

## Tests and QA

```powershell
npm.cmd run build
npm.cmd run test:smoke
```

The Playwright smoke suite uses a mobile Chromium viewport and mocked Supabase endpoints. It exercises order/payment UI, preview, canvas drawing, zoom, sound, admin login/confirmation, and the public wish update. It is not a substitute for staging verification.

The real numbering/RLS integration test writes and confirms 34 wishes and leaves them in the database. Run it only against a new, empty, disposable staging project after setting `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD`:

```powershell
$env:INTEGRATION_TARGET = 'staging'
$env:RUN_INTEGRATION_TESTS = 'YES_I_ACKNOWLEDGE_STAGING'
npm.cmd run test:integration
```

It checks 30 parallel creates/confirms, exact `1..30` numbering, expiry/queue reuse, confirming an expired order, anon table/RPC restrictions, and the public field allowlist. The suite is intentionally not safe for production and does not clean its test data.

For a local mobile Lighthouse report, build first, leave the preview server running in one terminal, then run the audit from another:

```powershell
npm.cmd run build
npm.cmd run preview -- --host 127.0.0.1 --port 4173
npm.cmd run test:lighthouse
```

The report is written to `lighthouse-report.html`. A local build without Supabase environment values tests render/performance while the backend is offline; it does not measure production API latency.

## Launch Checklist

- [ ] Fill in the canonical custom domain in metadata, `robots.txt`, and `sitemap.xml`.
- [ ] Set Vercel Production URL/anon key and Supabase Edge secrets/origins; confirm no service-role key exists in built assets.
- [ ] Apply migrations to a fresh project and verify the `pg_cron` job is active.
- [ ] Create one admin user, add its UUID to `private.admin_users`, and disable public sign-up.
- [ ] Complete the refund policy and publish a real support/contact channel on the terms page.
- [ ] Review the one-year phone retention and public display of confirmed names/wishes with the project owner.
- [ ] Verify an actual small Vodafone Cash test transfer end to end; confirm through `/admin/` and see it on a second device within 10 seconds.
- [ ] Run the guarded integration suite on disposable staging; run Lighthouse mobile against the production build and review the score/report.
- [ ] Configure/verify backups and a restore; confirm Vercel HTTPS, CSP, HSTS, robots, sitemap, and social image on the final domain.

## Manual Items Before Launch

Create the Supabase and Vercel accounts/projects, make and securely store the admin credentials and Supabase keys, generate the rate-limit salt, buy/connect the domain, set DNS and exact allowed origins, complete the refund/contact wording, verify a real Vodafone Cash transfer, and enable a backup plan. The payment confirmation remains intentionally manual because no Vodafone Cash callback/API credentials were supplied.
