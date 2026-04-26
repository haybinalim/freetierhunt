/**
 * Query helpers — typed data access layer.
 *
 * All public-facing reads go through here for:
 *   - Consistent filtering (status='active', expires_at)
 *   - Joinable shapes for components
 *   - Eventual caching (unstable_cache wrappers in Hafta 5+)
 */
import { and, desc, eq, gt, isNull, or, sql } from 'drizzle-orm';
import { db } from './client';
import { offers, products, offerVotes, featureFlags } from './schema';

// ----------------------------------------------------------------------------
// Types — derived from schema for full inference
// ----------------------------------------------------------------------------
export type Product = typeof products.$inferSelect;
export type Offer = typeof offers.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
export type NewOffer = typeof offers.$inferInsert;

export type OfferWithProduct = Offer & { product: Product };

// ----------------------------------------------------------------------------
// Active offer filter (status + not-expired)
// ----------------------------------------------------------------------------
const isActive = () =>
  and(eq(offers.status, 'active'), or(isNull(offers.expiresAt), gt(offers.expiresAt, new Date())));

// ----------------------------------------------------------------------------
// Reads
// ----------------------------------------------------------------------------
export async function listActiveOffers(
  opts: {
    limit?: number;
    offset?: number;
    type?: Offer['type'];
  } = {}
): Promise<OfferWithProduct[]> {
  const { limit = 50, offset = 0, type } = opts;

  const where = type ? and(isActive(), eq(offers.type, type)) : isActive();

  const rows = await db
    .select({
      offer: offers,
      product: products,
    })
    .from(offers)
    .innerJoin(products, eq(offers.productId, products.id))
    .where(where)
    .orderBy(desc(offers.score), desc(offers.createdAt))
    .limit(limit)
    .offset(offset);

  return rows.map((r) => ({ ...r.offer, product: r.product }));
}

export async function getOfferById(id: number): Promise<OfferWithProduct | null> {
  const rows = await db
    .select({ offer: offers, product: products })
    .from(offers)
    .innerJoin(products, eq(offers.productId, products.id))
    .where(eq(offers.id, id))
    .limit(1);

  const first = rows[0];
  if (!first) return null;
  return { ...first.offer, product: first.product };
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const rows = await db.select().from(products).where(eq(products.slug, slug)).limit(1);
  return rows[0] ?? null;
}

export async function listOffersForProduct(productId: number): Promise<Offer[]> {
  return db
    .select()
    .from(offers)
    .where(and(eq(offers.productId, productId), isActive()))
    .orderBy(desc(offers.score), desc(offers.createdAt));
}

// ----------------------------------------------------------------------------
// Vote aggregates (anonymous-safe)
// ----------------------------------------------------------------------------
export async function getVoteCounts(offerId: number): Promise<{ up: number; down: number }> {
  const rows = await db
    .select({
      vote: offerVotes.vote,
      count: sql<number>`count(*)::int`,
    })
    .from(offerVotes)
    .where(eq(offerVotes.offerId, offerId))
    .groupBy(offerVotes.vote);

  const result = { up: 0, down: 0 };
  for (const r of rows) {
    if (r.vote === 'up') result.up = r.count;
    else if (r.vote === 'down') result.down = r.count;
  }
  return result;
}

// ----------------------------------------------------------------------------
// Feature flags
// ----------------------------------------------------------------------------
export async function getFlag(key: string): Promise<boolean> {
  const rows = await db
    .select({ enabled: featureFlags.enabled })
    .from(featureFlags)
    .where(eq(featureFlags.key, key))
    .limit(1);
  return rows[0]?.enabled ?? false;
}

// ----------------------------------------------------------------------------
// Counts (for stats)
// ----------------------------------------------------------------------------
export async function getStats(): Promise<{ products: number; activeOffers: number }> {
  const [p] = await db.select({ c: sql<number>`count(*)::int` }).from(products);
  const [o] = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(offers)
    .where(isActive());
  return { products: p?.c ?? 0, activeOffers: o?.c ?? 0 };
}
