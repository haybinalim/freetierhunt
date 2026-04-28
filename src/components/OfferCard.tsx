import Link from 'next/link';
import type { OfferWithProduct } from '@/lib/db/queries';
import { OfferActions } from './OfferActions';
import { ClaimLink } from './ClaimLink';

const TYPE_LABEL: Record<OfferWithProduct['type'], string> = {
  free_tier: '🆓 FREE TIER',
  trial: '⏳ TRIAL',
  credit: '💰 CREDIT',
  discount: '🏷️ DISCOUNT',
};

const TYPE_BG: Record<OfferWithProduct['type'], string> = {
  free_tier: 'bg-brutal-green',
  trial: 'bg-brutal-yellow',
  credit: 'bg-brutal-orange',
  discount: 'bg-brutal-red',
};

interface OfferCardProps {
  offer: OfferWithProduct;
  rank?: number;
}

export function OfferCard({ offer, rank }: OfferCardProps) {
  const { product } = offer;
  return (
    <article className="group flex flex-col gap-4 border-3 border-brutal-black bg-brutal-white p-5 shadow-brutal transition-transform hover:-translate-x-1 hover:-translate-y-1 hover:shadow-brutal-lg md:flex-row md:items-center">
      {typeof rank === 'number' && (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center border-3 border-brutal-black bg-brutal-yellow font-mono text-lg font-bold tabular-nums md:h-12 md:w-12 md:text-xl">
          {rank}
        </div>
      )}

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/products/${product.slug}`}
            className="font-mono text-sm font-bold uppercase tracking-wide hover:underline"
          >
            {product.name}
          </Link>
          <span
            className={`border-2 border-brutal-black px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-widest ${TYPE_BG[offer.type]}`}
          >
            {TYPE_LABEL[offer.type]}
          </span>
          {offer.value && (
            <span className="border-2 border-brutal-black bg-brutal-black px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-widest text-brutal-yellow">
              {offer.value}
            </span>
          )}
        </div>
        <h3 className="mt-2 text-base font-bold leading-snug md:text-lg">{offer.headline}</h3>
        {offer.description && (
          <p className="mt-1 line-clamp-2 text-sm text-brutal-black/75">{offer.description}</p>
        )}
        <div className="mt-3 md:hidden">
          <OfferActions offerId={offer.id} compact />
        </div>
      </div>

      <div className="hidden md:block">
        <OfferActions offerId={offer.id} compact />
      </div>

      <ClaimLink
        offerId={offer.id}
        href={product.website ?? `/products/${product.slug}`}
        external={Boolean(product.website)}
        className="inline-flex shrink-0 items-center justify-center border-3 border-brutal-black bg-brutal-black px-4 py-2 font-mono text-xs font-bold uppercase tracking-widest text-brutal-yellow shadow-brutal transition-transform group-hover:-translate-x-0.5 group-hover:-translate-y-0.5"
      >
        Claim →
      </ClaimLink>
    </article>
  );
}
