const localOrigin = /^http:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?$/;

export function allowedOrigin(origin: string | null): boolean {
  if (!origin) return true;
  const configured = (Deno.env.get('ALLOWED_ORIGINS') ?? '').split(',').map((item) => item.trim()).filter(Boolean);
  return configured.includes(origin) || localOrigin.test(origin);
}

export function corsHeaders(origin: string | null): HeadersInit {
  const headers: Record<string, string> = {
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin'
  };
  if (origin && allowedOrigin(origin)) headers['Access-Control-Allow-Origin'] = origin;
  return headers;
}

export function jsonResponse(origin: string | null, data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders(origin), 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }
  });
}

export async function hashedClientIp(request: Request): Promise<string> {
  const salt = Deno.env.get('RATE_LIMIT_SALT');
  if (!salt || salt.length < 32) throw new Error('rate_limit_not_configured');
  const ip = request.headers.get('cf-connecting-ip')
    ?? request.headers.get('x-real-ip')
    ?? request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  if (!ip) throw new Error('client_ip_unavailable');
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${salt}:${ip}`));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

export function preflight(request: Request): Response | null {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders(request.headers.get('origin')) });
  if (request.method !== 'POST') return jsonResponse(request.headers.get('origin'), { error: 'method_not_allowed' }, 405);
  const origin = request.headers.get('origin');
  if (!allowedOrigin(origin)) return jsonResponse(origin, { error: 'origin_not_allowed' }, 403);
  return null;
}
