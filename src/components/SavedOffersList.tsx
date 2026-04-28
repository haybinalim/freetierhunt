'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useSavedOffers } from '@/hooks/useSavedOffers';
import { OfferCard } from './OfferCard';
import type { OfferWithProduct } from '@/lib/db/queries';

export function SavedOffersList() {
  const { saved } = useSavedOffers();
  const [offers, setOffers] = useState<OfferWithProduct[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const ids = [...saved];
    if (ids.length === 0) {
      setOffers([]);
      return;
    }
    const ctrl = new AbortController();
    setError(false);
    fetch(`/api/offers/by-ids?ids=${ids.join(',')}`, { signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('fetch failed'))))
      .then((data: { offers: OfferWithProduct[] }) => {
        // Preserve user's save order (most recent first based on Set insertion).
        const order = new Map(ids.map((id, i) => [id, i]));
        const sorted = [...data.offers].sort(
          (a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0)
        );
        setOffers(sorted);
      })
      .catch((e) => {
        if ((e as Error).name !== 'AbortError') setError(true);
      });
    return () => ctrl.abort();
  }, [saved]);

  if (offers === null) {
    return (
      <p className="mt-10 border-3 border-dashed border-brutal-black/40 bg-brutal-white p-6 font-mono text-sm">
        Loading…
      </p>
    );
  }

  if (error) {
    return (
      <p className="mt-10 border-3 border-brutal-black bg-brutal-red p-6 font-mono text-sm text-brutal-white">
        Couldn&apos;t load saved offers. Try refreshing.
      </p>
    );
  }

  if (offers.length === 0) {
    return (
      <div className="mt-10 border-3 border-dashed border-brutal-black/40 bg-brutal-white p-8 text-center">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-brutal-black/60">
          Nothing saved yet
        </p>
        <p className="mt-3 text-base">Click the ☆ on any offer to stash it here for later.</p>
        <Link
          href="/"
          className="mt-6 inline-flex items-center justify-center border-3 border-brutal-black bg-brutal-yellow px-4 py-2 font-mono text-xs font-bold uppercase tracking-widest shadow-brutal transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5"
        >
          Browse today&apos;s feed →
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-10 space-y-4">
      <p className="font-mono text-xs uppercase tracking-widest text-brutal-black/60">
        {offers.length} {offers.length === 1 ? 'offer' : 'offers'} saved on this device
      </p>
      {offers.map((offer) => (
        <OfferCard key={offer.id} offer={offer} />
      ))}
    </div>
  );
}
