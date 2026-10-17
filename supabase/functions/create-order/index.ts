import { createClient } from 'npm:@supabase/supabase-js@2';
import { allowedOrigin, hashedClientIp, jsonResponse, preflight } from '../_shared/http.ts';

const phonePattern = /^01[0125]\d{8}$/;

Deno.serve(async (request: Request) => {
  const response = preflight(request);
  if (response) return response;
  const origin = request.headers.get('origin');
  if (!allowedOrigin(origin)) return jsonResponse(origin, { error: 'origin_not_allowed' }, 403);

  try {
    const length = Number(request.headers.get('content-length') ?? 0);
    if (length > 8192) return jsonResponse(origin, { error: 'request_too_large' }, 413);
    const body = await request.json();
    if (!body || typeof body !== 'object' || typeof body.website === 'string' && body.website.trim()) {
      return jsonResponse(origin, { error: 'invalid_request' }, 400);
    }

    const name = typeof body.name === 'string' ? body.name : '';
    const wish = typeof body.wish === 'string' ? body.wish : '';
    const governorate = typeof body.governorate === 'string' ? body.governorate : '';
    const color = body.color;
    const phone = typeof body.phone === 'string' ? body.phone : '';
    if (name.trim().length < 2 || name.trim().length > 30 || wish.trim().length < 3 || wish.trim().length > 140
      || governorate.trim().length < 2 || governorate.trim().length > 40
      || typeof color !== 'number' || !Number.isInteger(color) || color < 0 || color > 2 || !phonePattern.test(phone.trim())) {
      return jsonResponse(origin, { error: 'invalid_input' }, 400);
    }

    const filterUrl = Deno.env.get('ABUSE_FILTER_URL');
    if (filterUrl) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4000);
      try {
        const filter = await fetch(filterUrl, {
          method: 'POST',
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
            ...(Deno.env.get('ABUSE_FILTER_TOKEN') ? { Authorization: `Bearer ${Deno.env.get('ABUSE_FILTER_TOKEN')}` } : {})
          },
          body: JSON.stringify({ name: name.trim(), wish: wish.trim() })
        });
        if (!filter.ok || (await filter.json()).allowed !== true) {
          return jsonResponse(origin, { error: 'wish_not_accepted' }, 422);
        }
      } finally {
        clearTimeout(timeout);
      }
    }

    const ipHash = await hashedClientIp(request);
    const url = Deno.env.get('SUPABASE_URL');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!url || !serviceKey) throw new Error('backend_not_configured');
    const supabase = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data, error } = await supabase.rpc('create_order', {
      p_name: name.trim(), p_wish: wish.trim(), p_governorate: governorate.trim(), p_color: color, p_phone: phone.trim(), p_ip_hash: ipHash
    }).single();
    if (error) {
      const message = error.message ?? '';
      if (message.includes('PGRST202') || message.toLowerCase().includes('schema cache') || message.toLowerCase().includes('could not find the function')) {
        return jsonResponse(origin, { error: 'database_schema_missing' }, 503);
      }
      const status = message.includes('rate_limited') ? 429 : message.includes('ordering_closed') ? 409 : message.includes('invalid_') ? 400 : 500;
      return jsonResponse(origin, { error: status === 500 ? 'order_unavailable' : message }, status);
    }
    return jsonResponse(origin, { code: data.code, price: data.price, pos: data.pos });
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    const status = message.includes('rate_limit_not_configured') || message.includes('backend_not_configured') ? 503 : 500;
    return jsonResponse(origin, { error: status === 503 ? 'backend_not_configured' : 'order_unavailable' }, status);
  }
});
