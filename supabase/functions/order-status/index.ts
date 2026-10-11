import { createClient } from 'npm:@supabase/supabase-js@2';
import { allowedOrigin, hashedClientIp, jsonResponse, preflight } from '../_shared/http.ts';

Deno.serve(async (request: Request) => {
  const response = preflight(request);
  if (response) return response;
  const origin = request.headers.get('origin');
  if (!allowedOrigin(origin)) return jsonResponse(origin, { error: 'origin_not_allowed' }, 403);

  try {
    const body = await request.json();
    const code = typeof body?.code === 'string' ? body.code.trim().toUpperCase() : '';
    if (!/^KS-[A-F0-9]{10}$/.test(code)) return jsonResponse(origin, { error: 'invalid_code' }, 400);

    const url = Deno.env.get('SUPABASE_URL');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!url || !serviceKey) throw new Error('backend_not_configured');
    const supabase = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data, error } = await supabase.rpc('order_status', {
      p_code: code,
      p_ip_hash: await hashedClientIp(request)
    }).single();
    if (error) {
      const limited = error.message?.includes('status_rate_limited');
      return jsonResponse(origin, { error: limited ? 'rate_limited' : 'status_unavailable' }, limited ? 429 : 503);
    }
    return jsonResponse(origin, { status: data.status, no: data.no });
  } catch {
    return jsonResponse(origin, { error: 'status_unavailable' }, 503);
  }
});
