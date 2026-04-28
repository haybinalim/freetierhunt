import type { Metadata } from 'next';
import { SavedOffersList } from '@/components/SavedOffersList';

export const metadata: Metadata = {
  title: 'Saved offers',
  description: 'Your locally saved free credits, trials and promo codes.',
  robots: { index: false, follow: false },
};

export default function SavedPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-12 md:py-16">
      <header className="border-3 border-brutal-black bg-brutal-white p-6 shadow-brutal-lg md:p-10">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-brutal-black/60">
          Your stash
        </p>
        <h1 className="mt-3 font-mono text-4xl font-bold uppercase tracking-tight md:text-6xl">
          Saved offers ★
        </h1>
        <p className="mt-4 max-w-2xl text-base md:text-lg">
          Saved offers are stored only on this device&apos;s browser — nothing leaves your machine
          until you click an offer.
        </p>
      </header>

      <SavedOffersList />
    </div>
  );
}
