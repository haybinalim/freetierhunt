'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { hasDecided, setConsent } from '@/lib/consent';

/**
 * GDPR cookie consent banner (audit fix B27).
 *
 * Renders a brutal-style banner at the bottom of the viewport until the user
 * picks "Accept analytics" or "Essential only". Decision is persisted in
 * localStorage; banner stays hidden on subsequent visits unless we bump
 * CONSENT_VERSION in src/lib/consent.ts.
 *
 * No external deps (react-cookie-consent unmaintained). ~40 lines.
 */
export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Defer to client paint so SSR markup matches initial hydration.
    setVisible(!hasDecided());
  }, []);

  if (!visible) return null;

  const decide = (level: 'strict' | 'analytics') => {
    setConsent(level);
    setVisible(false);
  };

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      className="fixed inset-x-0 bottom-0 z-50 border-t-4 border-brutal-black bg-brutal-yellow shadow-brutal-lg"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-5 md:flex-row md:items-center md:justify-between md:gap-8">
        <div className="flex-1 font-mono text-sm leading-relaxed">
          <p>
            <strong>Cookies, but make them brutal.</strong> We use essential cookies always (login,
            security). Analytics cookies only with your consent — no ads, no third-party tracking,
            ever.
          </p>
          <p className="mt-2 text-xs uppercase tracking-widest text-brutal-black/60">
            Read the{' '}
            <Link href="/privacy" className="underline">
              privacy policy
            </Link>{' '}
            for the full story.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => decide('strict')}
            className="border-3 border-brutal-black bg-brutal-yellow px-5 py-2 font-mono text-xs font-bold uppercase tracking-widest shadow-brutal transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-brutal-lg"
          >
            Essential only
          </button>
          <button
            type="button"
            onClick={() => decide('analytics')}
            className="border-3 border-brutal-black bg-brutal-black px-5 py-2 font-mono text-xs font-bold uppercase tracking-widest text-brutal-yellow shadow-brutal transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-brutal-lg"
          >
            Accept analytics
          </button>
        </div>
      </div>
    </div>
  );
}
