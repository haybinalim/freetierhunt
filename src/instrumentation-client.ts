/**
 * Browser-side Sentry init (Next.js 15 convention).
 * Loaded automatically by Next.js when present at app root or src/.
 *
 * Silently no-ops if NEXT_PUBLIC_SENTRY_DSN is unset.
 */
import * as Sentry from '@sentry/nextjs';

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? process.env.NODE_ENV ?? 'development',
    tracesSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    replaysSessionSampleRate: 0,
    enabled: process.env.NODE_ENV === 'production',
    integrations: [Sentry.replayIntegration({ maskAllText: true, blockAllMedia: true })],
  });
}

// Required by Next.js 15 for navigation transaction tracking
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
