/**
 * Next.js 15 instrumentation hook (audit fix B6).
 * Initializes Sentry for server + edge runtimes. Browser init lives in
 * src/instrumentation-client.ts.
 *
 * If SENTRY_DSN is unset (local dev / no account yet) Sentry silently no-ops
 * — safe to ship without DSN.
 */
import * as Sentry from '@sentry/nextjs';

export async function register() {
  const dsn = process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (!dsn) return;

  const common = {
    dsn,
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? 'development',
    release: process.env.VERCEL_GIT_COMMIT_SHA,
    tracesSampleRate: 0.1,
    enabled: process.env.NODE_ENV === 'production',
  } as const;

  if (process.env.NEXT_RUNTIME === 'nodejs') {
    Sentry.init(common);
  } else if (process.env.NEXT_RUNTIME === 'edge') {
    Sentry.init(common);
  }
}

export const onRequestError = Sentry.captureRequestError;
