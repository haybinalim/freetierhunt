'use client';

import Link from 'next/link';
import { useVisitorId } from '@/hooks/useVisitorId';

interface ClaimLinkProps {
  offerId: number;
  href: string;
  external?: boolean;
  className?: string;
  children: React.ReactNode;
  /** When true, fires `copy_code` event before navigating. */
  copyEvent?: boolean;
}

/**
 * Wraps the "Claim" CTA so we can record a `click` event before the user leaves.
 * Uses sendBeacon when available so the request survives page navigation.
 */
export function ClaimLink({
  offerId,
  href,
  external = false,
  className,
  children,
  copyEvent = false,
}: ClaimLinkProps) {
  const visitorId = useVisitorId();

  function track(eventType: 'click' | 'copy_code') {
    const payload = JSON.stringify({
      eventType,
      visitorId: visitorId ?? undefined,
    });
    const url = `/api/offers/${offerId}/event`;
    try {
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
      /* swallow — telemetry must never break navigation */
    }
  }

  const onClick = () => track(copyEvent ? 'copy_code' : 'click');

  if (external) {
    return (
      <a
        href={href}
        onClick={onClick}
        target="_blank"
        rel="noopener noreferrer sponsored"
        className={className}
      >
        {children}
      </a>
    );
  }

  return (
    <Link href={href} onClick={onClick} className={className}>
      {children}
    </Link>
  );
}
