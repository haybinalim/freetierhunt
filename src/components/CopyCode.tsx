'use client';

import { useState } from 'react';
import { useVisitorId } from '@/hooks/useVisitorId';

interface CopyCodeProps {
  offerId: number;
  code: string;
}

/**
 * Promo-code chip with one-click copy + telemetry.
 * Fires `copy_code` event so we can measure conversion.
 */
export function CopyCode({ offerId, code }: CopyCodeProps) {
  const [copied, setCopied] = useState(false);
  const visitorId = useVisitorId();

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked — silent */
    }
    try {
      const payload = JSON.stringify({
        eventType: 'copy_code',
        visitorId: visitorId ?? undefined,
      });
      const url = `/api/offers/${offerId}/event`;
      if (typeof navigator !== 'undefined' && 'sendBeacon' in navigator) {
        navigator.sendBeacon(url, new Blob([payload], { type: 'application/json' }));
      } else {
        void fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payload,
          keepalive: true,
        });
      }
    } catch {
      /* noop */
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="flex w-full items-center gap-2 border-2 border-dashed border-brutal-black bg-brutal-yellow/40 px-3 py-2 text-left transition-colors hover:bg-brutal-yellow"
      aria-label={`Copy code ${code}`}
    >
      <code className="flex-1 font-mono text-sm font-bold tracking-wider">{code}</code>
      <span className="font-mono text-[10px] uppercase tracking-widest text-brutal-black/70">
        {copied ? '✓ Copied' : 'Click to copy'}
      </span>
    </button>
  );
}
