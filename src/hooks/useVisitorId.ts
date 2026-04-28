'use client';

import { useEffect, useState } from 'react';

const STORAGE_KEY = 'fth_visitor_id';

/** Generate a 32-char hex string (matches visitorIdSchema regex). */
function generateHex(): string {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  }
  // Fallback (should never hit in modern browsers)
  return Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
}

/**
 * Anonymous-safe visitor identifier (B2 audit fix).
 *
 * - Generated client-side, persisted to localStorage.
 * - 32-char hex matches `visitorIdSchema` regex.
 * - Returns `null` on first render to avoid SSR hydration mismatch.
 */
export function useVisitorId(): string | null {
  const [id, setId] = useState<string | null>(null);

  useEffect(() => {
    try {
      let v = localStorage.getItem(STORAGE_KEY);
      if (!v || !/^[a-f0-9]{16,64}$/i.test(v)) {
        v = generateHex();
        localStorage.setItem(STORAGE_KEY, v);
      }
      setId(v);
    } catch {
      // localStorage blocked — fall back to in-memory ID
      setId(generateHex());
    }
  }, []);

  return id;
}
