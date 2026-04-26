'use client';

/* eslint-disable @next/next/no-html-link-for-pages -- root layout crashed; cannot use next/link */

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

/**
 * Catches errors in the root layout that `app/error.tsx` cannot reach.
 * Must render its own <html>/<body> because the root layout itself failed.
 */
export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          fontFamily: 'system-ui, sans-serif',
          background: '#FFD700',
          color: '#000',
          padding: '4rem 1.5rem',
          minHeight: '100vh',
        }}
      >
        <main style={{ maxWidth: '720px', margin: '0 auto' }}>
          <p style={{ fontSize: '0.75rem', letterSpacing: '0.3em', textTransform: 'uppercase' }}>
            Fatal · Root crash
          </p>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginTop: '0.5rem' }}>
            FREETIERHUNT broke completely.
          </h1>
          <p style={{ marginTop: '1rem' }}>
            Üzgünüz, sayfa açılırken kök bir hata oluştu. Tekrar dene.
          </p>
          <a
            href="/"
            style={{
              display: 'inline-block',
              marginTop: '1.5rem',
              padding: '0.75rem 1.5rem',
              background: '#000',
              color: '#FFD700',
              border: '3px solid #000',
              fontWeight: 700,
              textDecoration: 'none',
              boxShadow: '4px 4px 0 0 #000',
            }}
          >
            ← Reload home
          </a>
        </main>
      </body>
    </html>
  );
}
