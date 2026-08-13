import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import {
  getProductBySlug,
  listEvidenceForOffer,
  listOffersForProduct,
  type Offer,
} from '@/lib/db/queries';
import { formatLastVerified, resolveOfferFreshness } from '@/lib/offers/state';
import { OfferActions } from '@/components/OfferActions';
import { ClaimLink } from '@/components/ClaimLink';
import { CopyCode } from '@/components/CopyCode';

// Product and offer data is only available at runtime. Keeping this route dynamic
// allows clean builds in environments that intentionally have no database credentials.
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: 'Not found' };
  return {
    title: `${product.name} Free Credits, Trials & Promo Codes | FreeTierHunt`,
    description:
      product.description ??
      `Verified free tier and promo offers for ${product.name}, updated daily.`,
  };
}

const TYPE_LABEL: Record<Offer['type'], string> = {
  free_tier: '🆓 FREE TIER',
  trial: '⏳ TRIAL',
  credit: '💰 CREDIT',
  discount: '🏷️ DISCOUNT',
};

const TYPE_BG: Record<Offer['type'], string> = {
  free_tier: 'bg-brutal-green',
  trial: 'bg-brutal-yellow',
  credit: 'bg-brutal-orange',
  discount: 'bg-brutal-red',
};

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const offers = await listOffersForProduct(product.id);
  const evidenceEntries = await Promise.all(
    offers.map(async (offer) => [offer.id, await listEvidenceForOffer(offer.id)] as const)
  );
  const evidenceByOffer = new Map(evidenceEntries);

  return (
    <div className="mx-auto max-w-6xl px-6 py-12 md:py-16">
      {/* Breadcrumb */}
      <nav className="font-mono text-xs uppercase tracking-widest text-brutal-black/60">
        <Link href="/" className="hover:underline">
          Home
        </Link>{' '}
        / <span>{product.name}</span>
      </nav>

      {/* Header */}
      <header className="mt-6 border-3 border-brutal-black bg-brutal-white p-6 shadow-brutal-lg md:p-10">
        <div className="flex flex-wrap items-baseline gap-3">
          <h1 className="font-mono text-3xl font-bold uppercase tracking-tight md:text-5xl">
            {product.name}
          </h1>
          {product.category && (
            <span className="border-2 border-brutal-black bg-brutal-yellow px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-widest">
              {product.category}
            </span>
          )}
        </div>
        {product.description && (
          <p className="mt-4 max-w-3xl text-base md:text-lg">{product.description}</p>
        )}
        {product.website && (
          <a
            href={product.website}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="mt-4 inline-flex items-center font-mono text-sm font-bold uppercase tracking-widest underline underline-offset-4"
          >
            Visit site →
          </a>
        )}
      </header>

      {/* Offers */}
      <section className="mt-10">
        <h2 className="font-mono text-2xl font-bold uppercase tracking-tight md:text-3xl">
          🎁 Active Offers ({offers.length})
        </h2>

        {offers.length === 0 ? (
          <p className="mt-6 border-3 border-dashed border-brutal-black/40 bg-brutal-white p-6 font-mono text-sm">
            No active offers yet for {product.name}.
          </p>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
            {offers.map((offer) => {
              const evidence = evidenceByOffer.get(offer.id) ?? [];
              const primaryEvidence = evidence.find((item) => item.isPrimary) ?? evidence[0];
              const freshness = resolveOfferFreshness({
                status: offer.status,
                verificationState: offer.verificationState,
                expiresAt: offer.expiresAt,
                lastVerifiedAt: offer.lastVerifiedAt,
                reverifyAt: offer.reverifyAt,
              });

              return (
                <article
                  key={offer.id}
                  className="flex flex-col gap-3 border-3 border-brutal-black bg-brutal-white p-5 shadow-brutal"
                >
                  <div className="flex flex-wrap items-center gap-2">
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

                  <h3 className="text-lg font-bold leading-snug">{offer.headline}</h3>
                  {offer.description && (
                    <p className="text-sm text-brutal-black/75">{offer.description}</p>
                  )}

                  {offer.code && <CopyCode offerId={offer.id} code={offer.code} />}

                  <div className="border-2 border-dashed border-brutal-black/40 bg-brutal-yellow/20 p-3">
                    <p className="font-mono text-[10px] font-bold uppercase tracking-widest">
                      {primaryEvidence ? 'Source proof' : 'Evidence pending'}
                    </p>
                    {primaryEvidence ? (
                      <>
                        <p className="mt-1 text-xs text-brutal-black/75">
                          “{primaryEvidence.quote}”
                        </p>
                        <a
                          href={primaryEvidence.url}
                          target="_blank"
                          rel="noopener noreferrer nofollow"
                          className="mt-2 inline-block font-mono text-[10px] font-bold uppercase tracking-widest underline"
                        >
                          Open source →
                        </a>
                      </>
                    ) : (
                      <p className="mt-1 text-xs text-brutal-black/70">
                        This offer is not yet source-backed. Claiming is disabled until it is
                        rechecked.
                      </p>
                    )}
                  </div>

                  <div className="mt-auto flex flex-wrap items-center justify-between gap-3">
                    <span className="font-mono text-[10px] uppercase tracking-widest text-brutal-black/60">
                      {offer.expiresAt
                        ? `Expires ${new Date(offer.expiresAt).toLocaleDateString()}`
                        : 'No expiry'}{' '}
                      ·{' '}
                      {freshness.isStale
                        ? freshness.label
                        : formatLastVerified(offer.lastVerifiedAt)}
                    </span>
                    <OfferActions offerId={offer.id} compact />
                  </div>

                  {freshness.isClaimable && (offer.canonicalClaimUrl ?? product.website) ? (
                    <ClaimLink
                      offerId={offer.id}
                      href={
                        offer.canonicalClaimUrl ?? product.website ?? `/products/${product.slug}`
                      }
                      external
                      className="inline-flex items-center justify-center border-3 border-brutal-black bg-brutal-black px-4 py-2 font-mono text-xs font-bold uppercase tracking-widest text-brutal-yellow shadow-brutal transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5"
                    >
                      Get offer →
                    </ClaimLink>
                  ) : (
                    <span className="inline-flex items-center justify-center border-3 border-brutal-black bg-brutal-white px-4 py-2 font-mono text-xs font-bold uppercase tracking-widest text-brutal-black/60">
                      {freshness.label}
                    </span>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
