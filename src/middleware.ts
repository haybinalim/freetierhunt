import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

/**
 * Security middleware — applies CSP + hardening headers and refreshes Supabase
 * auth tokens on every request. CSP nonce is generated per-request.
 *
 * NOTE: Hafta 8 Auth integration will extend this to redirect /admin/* without session.
 */
export async function middleware(req: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');

  const csp = [
    `default-src 'self'`,
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://static.cloudflareinsights.com https://*.posthog.com`,
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' data: https://ph-files.imgix.net https://*.indiehackers.com https://*.supabase.co https://*.r2.cloudflarestorage.com https://icons.duckduckgo.com https://www.google.com https://cdn.simpleicons.org`,
    `font-src 'self' data:`,
    `connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.posthog.com https://api.resend.com`,
    `frame-ancestors 'none'`,
    `form-action 'self'`,
    `base-uri 'self'`,
    `object-src 'none'`,
    `upgrade-insecure-requests`,
  ].join('; ');

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-nonce', nonce);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set('Content-Security-Policy', csp);
  response.headers.set('x-nonce', nonce);
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  // Refresh Supabase session cookies (no-op if env not set yet).
  return updateSession(req, response);
}

export const config = {
  matcher: '/((?!_next/static|_next/image|favicon.ico|api/health).*)',
};
