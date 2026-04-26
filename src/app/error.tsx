'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import * as Sentry from '@sentry/nextjs';

/**
 * Global error boundary. Shown when a route segment throws.
 * Must be a Client Component (Next.js requirement).
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.error('[error.tsx]', error);
    }
  }, [error]);

  return (
    <div className="mx-auto max-w-3xl px-6 py-20">
      <div className="border-3 border-brutal-black bg-brutal-red p-8 text-brutal-white shadow-brutal-lg md:p-12">
        <p className="font-mono text-xs uppercase tracking-[0.3em] opacity-80">Error · 500</p>
        <h1 className="mt-3 font-mono text-3xl font-bold uppercase tracking-tight md:text-5xl">
          Something broke.
        </h1>
        <p className="mt-4 max-w-2xl">
          Bir şeyler ters gitti. Tekrar denemek istersen aşağıdaki butona bas, yine olursa bize
          haber ver.
        </p>
        {error.digest && <p className="mt-4 font-mono text-xs opacity-70">ref: {error.digest}</p>}
        <div className="mt-8 flex flex-wrap gap-4">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center justify-center border-3 border-brutal-black bg-brutal-yellow px-6 py-3 font-mono text-sm font-bold uppercase tracking-widest text-brutal-black shadow-brutal transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5"
          >
            Try again →
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center border-3 border-brutal-black bg-brutal-white px-6 py-3 font-mono text-sm font-bold uppercase tracking-widest text-brutal-black shadow-brutal transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5"
          >
            ← Go home
          </Link>
        </div>
      </div>
    </div>
  );
}
