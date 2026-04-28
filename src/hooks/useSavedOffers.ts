'use client';

import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'fth_saved_offers';
const EVENT_NAME = 'fth:saved-offers-change';

function read(): Set<number> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((n) => typeof n === 'number'));
  } catch {
    return new Set();
  }
}

function write(set: Set<number>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]));
    window.dispatchEvent(new CustomEvent(EVENT_NAME));
  } catch {
    // ignore quota / blocked
  }
}

/**
 * Anonymous "save offer" state via localStorage.
 * Synchronizes across components in the same tab via custom event.
 */
export function useSavedOffers() {
  const [saved, setSaved] = useState<Set<number>>(new Set());

  useEffect(() => {
    setSaved(read());
    const onChange = () => setSaved(read());
    window.addEventListener(EVENT_NAME, onChange);
    window.addEventListener('storage', onChange); // cross-tab sync
    return () => {
      window.removeEventListener(EVENT_NAME, onChange);
      window.removeEventListener('storage', onChange);
    };
  }, []);

  const toggle = useCallback((offerId: number) => {
    const next = new Set(read());
    if (next.has(offerId)) next.delete(offerId);
    else next.add(offerId);
    write(next);
  }, []);

  const isSaved = useCallback((offerId: number) => saved.has(offerId), [saved]);

  return { saved, isSaved, toggle };
}
