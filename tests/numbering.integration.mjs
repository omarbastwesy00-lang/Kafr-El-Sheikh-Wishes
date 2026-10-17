import assert from 'node:assert/strict';
import { createClient } from '@supabase/supabase-js';

const env = process.env;
const required = ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY', 'ADMIN_EMAIL', 'ADMIN_PASSWORD'];
const missing = required.filter((name) => !env[name]);
if (missing.length || env.INTEGRATION_TARGET !== 'staging' || env.RUN_INTEGRATION_TESTS !== 'YES_I_ACKNOWLEDGE_STAGING') {
  console.error('Refusing integration writes. Set all Supabase/admin variables, INTEGRATION_TARGET=staging, and RUN_INTEGRATION_TESTS=YES_I_ACKNOWLEDGE_STAGING on a disposable, empty staging project.');
  if (missing.length) console.error(`Missing: ${missing.join(', ')}`);
  process.exitCode = 2;
} else {
  await run();
}

async function run() {
  const url = env.SUPABASE_URL;
  const anonKey = env.SUPABASE_ANON_KEY;
  const service = createClient(url, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
  const anonClients = Array.from({ length: 6 }, () => createClient(url, anonKey, { auth: { persistSession: false } }));
  const adminClients = [];
  for (let index = 0; index < 6; index++) {
    const client = createClient(url, anonKey, { auth: { persistSession: false } });
    const result = await client.auth.signInWithPassword({ email: env.ADMIN_EMAIL, password: env.ADMIN_PASSWORD });
    assert.ifError(result.error);
    adminClients.push(client);
  }

  const { data: existing, error: existingError } = await service.from('orders').select('id').limit(1);
  assert.ifError(existingError);
  assert.equal(existing.length, 0, 'Use a new, empty staging database; this test leaves its QA wishes in place.');

  const runId = Date.now().toString(36).toUpperCase();
  const create = async (index, suffix = 'A') => {
    const client = anonClients[index % anonClients.length];
    const response = await client.functions.invoke('create-order', {
      body: {
        name: `اختبار ${index + 1}`,
        wish: `اختبار تزامن ${runId} ${suffix} أمنية رقم ${index + 1}`,
        governorate: 'القاهرة',
        color: index % 3,
        phone: `0109${String(index + 1).padStart(7, '0')}`,
        website: ''
      }
    });
    assert.ifError(response.error);
    return response.data;
  };

  const initial = await Promise.all(Array.from({ length: 30 }, (_, index) => create(index)));
  const tentative = initial.map((order) => order.pos).sort((a, b) => a - b);
  assert.deepEqual(tentative, Array.from({ length: 30 }, (_, index) => index + 1), 'Concurrent tentative positions must be unique and contiguous.');

  const { data: firstOrders, error: firstOrdersError } = await adminClients[0].rpc('admin_orders');
  assert.ifError(firstOrdersError);
  const idsByCode = new Map(firstOrders.map((order) => [order.code, order.id]));
  const confirmed = await Promise.all(initial.map((order, index) => adminClients[index % adminClients.length].rpc('confirm_order', { p_id: idsByCode.get(order.code) })));
  confirmed.forEach((result) => assert.ifError(result.error));
  assert.deepEqual(confirmed.map((result) => result.data).sort((a, b) => a - b), Array.from({ length: 30 }, (_, index) => index + 1), 'Parallel confirmations must assign exactly numbers 1..30.');

  const queued = await Promise.all([create(30, 'EXPIRY'), create(31, 'EXPIRY'), create(32, 'EXPIRY')]);
  assert.deepEqual(queued.map((order) => order.pos).sort((a, b) => a - b), [31, 32, 33]);
  const { data: queueOrders, error: queueError } = await adminClients[0].rpc('admin_orders');
  assert.ifError(queueError);
  const queueByCode = new Map(queueOrders.map((order) => [order.code, order]));
  const expired = queueByCode.get(queued[0].code);
  const backdated = await service.from('orders').update({ created_at: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString() }).eq('id', expired.id);
  assert.ifError(backdated.error);
  const expiryResult = await service.rpc('expire_orders');
  assert.ifError(expiryResult.error);
  const afterExpiry = await create(33, 'AFTER-EXPIRY');
  assert.equal(afterExpiry.pos, 33, 'The expired order must leave the live queue and its tentative position must be reused.');

  const { data: queueAfterExpiry, error: reloadError } = await adminClients[0].rpc('admin_orders');
  assert.ifError(reloadError);
  const ids = [queued[0], queued[1], queued[2], afterExpiry].map((order) => queueAfterExpiry.find((row) => row.code === order.code).id);
  const recovered = await Promise.all(ids.map((id, index) => adminClients[index % adminClients.length].rpc('confirm_order', { p_id: id })));
  recovered.forEach((result) => assert.ifError(result.error));
  assert.deepEqual(recovered.map((result) => result.data).sort((a, b) => a - b), [31, 32, 33, 34], 'Confirming an expired order must still produce a gap-free sequence.');

  const anonymous = createClient(url, anonKey, { auth: { persistSession: false } });
  const directRead = await anonymous.from('orders').select('sender_phone,code,status').limit(1);
  assert.ok(directRead.error, 'Anon must not read the orders table.');
  const directWrite = await anonymous.from('orders').insert({ code: 'KS-FFFFFFFFFF', name: 'No', wish: 'Not allowed', color: 0, price: 100, sender_phone: '01012345678' });
  assert.ok(directWrite.error, 'Anon must not write the orders table.');
  const directConfirm = await anonymous.rpc('confirm_order', { p_id: ids[0] });
  assert.ok(directConfirm.error, 'Anon must not confirm an order.');
  const privateList = await anonymous.rpc('admin_orders');
  assert.ok(privateList.error, 'Anon must not call admin order RPCs.');
  const publicList = await anonymous.rpc('get_public_wishes');
  assert.ifError(publicList.error);
  assert.ok(publicList.data.length === 34);
  assert.ok(publicList.data.every((row) => Object.keys(row).sort().join(',') === 'color,name,no,wish'));
  assert.deepEqual(publicList.data.map((row) => row.no), Array.from({ length: 34 }, (_, index) => index + 1));
  console.log('PASS: 30 concurrent creates/confirms; expiry queue reuse; expired-order confirmation; anon RLS and public field allowlist.');
}
