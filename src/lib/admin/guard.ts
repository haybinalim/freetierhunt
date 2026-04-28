/**
 * Interim admin gate — single shared secret in `ADMIN_TOKEN`.
 * Replaced by Supabase role='admin' check in Hafta 9.
 */
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { env } from '@/lib/env';

export const ADMIN_COOKIE = 'fth_admin';

/** Constant-time string compare to deter timing attacks. */
export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

export async function isAdmin(): Promise<boolean> {
  if (!env.ADMIN_TOKEN) return false;
  const jar = await cookies();
  const token = jar.get(ADMIN_COOKIE)?.value;
  if (!token) return false;
  return safeEqual(token, env.ADMIN_TOKEN);
}

/**
 * Use in Server Components / Route Handlers. Redirects to /admin/login on failure.
 * Throws if ADMIN_TOKEN is not configured (so we fail loudly in dev/prod).
 */
export async function requireAdmin(): Promise<void> {
  if (!env.ADMIN_TOKEN) {
    throw new Error('ADMIN_TOKEN is not configured');
  }
  if (!(await isAdmin())) {
    redirect('/admin/login');
  }
}
