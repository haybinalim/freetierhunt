import Link from 'next/link';
import { notFound } from 'next/navigation';
import slugify from 'slugify';
import type { Metadata } from 'next';
import {
  getVoteCountsBatch,
  listActiveOffers,
  listCategories,
  listProductsByCategory,
} from '@/lib/db/queries';
import { OfferCard } from '@/components/OfferCard';

export const dynamic = 'force-dynamic';
export const dynamicParams = true;

/** Resolve slug back to the original category name (case-insensitive). */
async function resolveCategory(slug: string): Promise<string | null> {
  const cats = await listCategories();
  const match = cats.find((c) => slugify(c.category, { lower: true, strict: true }) === slug);
  return match?.category ?? null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = await resolveCategory(slug);
  if (!category) return { title: 'Category not found' };
  return {
    title: `${category} — Free tiers & promo codes`,
    description: `${category} kategorisindeki AI tool'lar için aktif ücretsiz tier'lar, trial'lar ve promo kodlar. Günlük güncellenir.`,
  };
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const category = await resolveCategory(slug);
  if (!category) notFound();

  const productList = await listProductsByCategory(category);
  const productIds = new Set(productList.map((p) => p.id));

  // All currently active offers, then filter to this category in-memory (small N).
  const allActive = await listActiveOffers({ limit: 100 });
  const offers = allActive.filter((o) => productIds.has(o.productId));
  const voteCounts = await getVoteCountsBatch(offers.map((o) => o.id));

  return (
    <div className="mx-auto max-w-6xl px-6 py-12 md:py-16">
      <nav className="font-mono text-xs uppercase tracking-widest text-brutal-black/60">
        <Link href="/" className="hover:underline">
          Home
        </Link>{' '}
        /{' '}
        <Link href="/categories" className="hover:underline">
          Categories
        </Link>{' '}
        / <span>{category}</span>
      </nav>

      <header className="mt-6 border-3 border-brutal-black bg-brutal-white p-6 shadow-brutal-lg md:p-10">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-brutal-black/60">
          Category
        </p>
        <h1 className="mt-3 font-mono text-4xl font-bold uppercase tracking-tight md:text-6xl">
          {category}
        </h1>
        <p className="mt-4 max-w-2xl text-base md:text-lg">
          {productList.length} ürün · {offers.length} aktif teklif
        </p>
      </header>

      {/* Products grid */}
      <section className="mt-10">
        <h2 className="font-mono text-2xl font-bold uppercase tracking-tight md:text-3xl">
          Products
        </h2>
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {productList.map((p) => (
            <Link
              key={p.id}
              href={`/products/${p.slug}`}
              className="group block border-3 border-brutal-black bg-brutal-white p-5 shadow-brutal transition-transform hover:-translate-x-1 hover:-translate-y-1 hover:shadow-brutal-lg"
            >
              <h3 className="font-mono text-lg font-bold uppercase tracking-tight group-hover:underline">
                {p.name}
              </h3>
              {p.description && (
                <p className="mt-2 line-clamp-2 text-sm text-brutal-black/75">{p.description}</p>
              )}
            </Link>
          ))}
        </div>
      </section>

      {/* Active offers */}
      {offers.length > 0 && (
        <section className="mt-12">
          <h2 className="font-mono text-2xl font-bold uppercase tracking-tight md:text-3xl">
            🔥 Active offers
          </h2>
          <div className="mt-6 space-y-4">
            {offers.map((offer, i) => (
              <OfferCard
                key={offer.id}
                offer={offer}
                rank={i + 1}
                voteCounts={voteCounts.get(offer.id)}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
