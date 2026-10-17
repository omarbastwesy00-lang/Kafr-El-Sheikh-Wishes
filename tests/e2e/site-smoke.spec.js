import { expect, test } from '@playwright/test';

const origin = 'https://backend.test';
const user = {
  id: '3f8debd0-bb2f-4c2a-9f31-41d47e8b3111',
  aud: 'authenticated',
  role: 'authenticated',
  email: 'admin@example.test',
  app_metadata: { provider: 'email', providers: ['email'] },
  user_metadata: {},
  created_at: '2026-01-01T00:00:00.000Z'
};

function json(body, headers = {}) {
  return { status: 200, contentType: 'application/json', headers, body: JSON.stringify(body) };
}

test('mobile visitor flow, admin confirmation, and live wish display', async ({ browser }, testInfo) => {
  const state = { order: null, confirmed: false, createBody: null, confirmedAt: 0, publicSeenAt: 0 };
  const accessToken = `eyJhbGciOiJub25lIn0.${Buffer.from(JSON.stringify({ sub: user.id, role: 'authenticated', aud: 'authenticated', exp: Math.floor(Date.now() / 1000) + 3600, iat: Math.floor(Date.now() / 1000) })).toString('base64url')}.test-signature`;
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  await context.route(`${origin}/**`, async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const cors = {
      'Access-Control-Allow-Origin': 'http://127.0.0.1:4175',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info'
    };
    if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: cors });
    if (url.pathname === '/functions/v1/create-order') {
      state.createBody = request.postDataJSON();
      state.order = {
        id: 'order-1', code: 'KS-1A2B3C4D5E', name: state.createBody.name,
        wish: state.createBody.wish, color: state.createBody.color, price: 100,
        sender_phone: state.createBody.phone, governorate: state.createBody.governorate, status: 'pending', no: null,
        created_at: new Date().toISOString(), admin_note: null
      };
      return route.fulfill(json({ code: state.order.code, price: state.order.price, pos: 1 }, cors));
    }
    if (url.pathname === '/functions/v1/order-status') {
      return route.fulfill(json({ status: state.confirmed ? 'confirmed' : 'pending', no: state.confirmed ? 1 : null }, cors));
    }
    if (url.pathname === '/rest/v1/rpc/get_public_wishes') {
      if (state.confirmed && !state.publicSeenAt) state.publicSeenAt = Date.now();
      const wishes = state.confirmed && state.order ? [{ no: 1, name: state.order.name, wish: state.order.wish, color: state.order.color }] : [];
      return route.fulfill(json(wishes, cors));
    }
    if (url.pathname === '/auth/v1/token') {
      return route.fulfill(json({ access_token: accessToken, token_type: 'bearer', expires_in: 3600, refresh_token: 'test-refresh-token', user }, cors));
    }
    if (url.pathname === '/auth/v1/user') return route.fulfill(json(user, cors));
    if (url.pathname === '/rest/v1/rpc/admin_orders') {
      return route.fulfill(json(state.order ? [{ ...state.order, status: state.confirmed ? 'confirmed' : 'pending', no: state.confirmed ? 1 : null }] : [], cors));
    }
    if (url.pathname === '/rest/v1/rpc/admin_stats') {
      return route.fulfill(json({ pending: state.confirmed ? 0 : 1, confirmed: state.confirmed ? 1 : 0, expired: 0, rejected: 0, today: 1, revenue: { '0': 0, '1': state.confirmed ? 100 : 0, '2': 0 } }, cors));
    }
    if (url.pathname === '/rest/v1/rpc/confirm_order') {
      state.confirmed = true;
      state.confirmedAt = Date.now();
      return route.fulfill(json(1, cors));
    }
    return route.fulfill(json({ error: `Unexpected mock request: ${url.pathname}` }, cors));
  });

  const page = await context.newPage();
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  await page.goto('/');
  await expect(page.locator('h1')).toHaveText('Egyptian Wishes');
  await expect.poll(() => page.locator('#c').evaluate((canvas) => {
    const context = canvas.getContext('2d');
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    let visible = 0;
    for (let index = 3; index < pixels.length; index += 4) if (pixels[index]) visible++;
    return visible;
  })).toBeGreaterThan(1000);
  await expect(page.locator('#snd')).not.toHaveClass(/off/);
  const soundAndTitle = await page.evaluate(() => {
    const sound = document.querySelector('#snd').getBoundingClientRect();
    const range = document.createRange();
    range.selectNodeContents(document.querySelector('h1'));
    const title = range.getBoundingClientRect();
    return sound.right <= title.left || sound.left >= title.right || sound.bottom <= title.top || sound.top >= title.bottom;
  });
  expect(soundAndTitle).toBe(true);

  await page.getByRole('button', { name: 'اكتب أمنيتك' }).click();
  await page.locator('#wt').fill('أتمنى الخير لكل أهل بلدنا');
  await page.locator('#wn').fill('نور');
  const cairoChoice = page.locator('#governorate-strip').getByRole('button', { name: 'القاهرة', exact: true });
  await cairoChoice.click();
  await expect(page.locator('#governorate')).toHaveValue('القاهرة');
  await page.locator('#governorate').fill('المنوفية');
  await page.locator('#wp').fill('01012345678');
  await page.locator('#wc').locator('.tier').nth(1).click();
  expect(await page.locator('#wc .tier span').allTextContents()).toEqual(['100 جنيه', '100 جنيه', '100 جنيه']);
  await expect(page.locator('#cash-price')).toHaveText('100');
  await expect(page.locator('.cash-number')).toHaveText('01043668450');
  await expect(page.locator('.pay-order-note')).toContainText('بعد تأكيد الدفع');
  await expect(page.locator('#go')).toBeEnabled();
  await page.locator('#go').click();
  await expect(page.locator('#pay')).toBeVisible();
  await expect(page.locator('#pa')).toHaveText('100');
  await expect(page.locator('#pc')).toHaveText('KS-1A2B3C4D5E');
  expect(state.createBody).toMatchObject({ name: 'نور', governorate: 'المنوفية', color: 1, phone: '01012345678' });

  const wheelCancelled = await page.locator('#c').evaluate((canvas) => {
    const event = new WheelEvent('wheel', { deltaY: -250, clientX: 190, clientY: 420, cancelable: true });
    return !canvas.dispatchEvent(event);
  });
  expect(wheelCancelled).toBe(true);
  await page.locator('#snd').click();
  await expect(page.locator('#snd')).toHaveClass(/off/);
  await page.screenshot({ path: testInfo.outputPath('mobile-payment.png'), fullPage: true });

  const admin = await context.newPage();
  admin.on('dialog', (dialog) => dialog.accept());
  await admin.goto('/admin/');
  await admin.locator('#email').fill('admin@example.test');
  await admin.locator('#password').fill('test-password');
  await admin.locator('#login-form button[type="submit"]').click();
  await expect(admin.locator('#dashboard')).toBeVisible();
  await expect(admin.locator('#orders')).toContainText('المنوفية');
  await admin.locator('.confirm').click();
  await expect(admin.locator('#message')).toContainText('رقم الأمنية ١');
  await expect(page.locator('#rt')).toContainText('أتمنى الخير لكل أهل بلدنا', { timeout: 14000 });
  expect(state.publicSeenAt - state.confirmedAt).toBeLessThanOrEqual(10000);
  await expect(page.getByRole('button', { name: 'شارك أمنيتك' })).toHaveCount(0);
  await page.locator('#x').click();
  const barTopBeforeSearch = await page.locator('.bar').evaluate((bar) => bar.getBoundingClientRect().top);
  await page.locator('#search-toggle').click();
  await expect(page.locator('#wish-search-form')).toBeVisible();
  await page.locator('#wish-number').fill('١');
  await page.locator('#wish-search-form button[type="submit"]').click();
  await expect(page.locator('#rt')).toContainText('أتمنى الخير لكل أهل بلدنا');
  const searchLayout = await page.evaluate(() => {
    const bar = document.querySelector('.bar').getBoundingClientRect();
    return { barTop: bar.top, viewportWidth: innerWidth, searchHidden: document.querySelector('.wish-search').hidden };
  });
  expect(searchLayout.barTop).toBe(barTopBeforeSearch);
  expect(searchLayout.searchHidden).toBe(true);
  expect(searchLayout.viewportWidth).toBe(390);
  expect(pageErrors).toEqual([]);
  await context.close();
});
