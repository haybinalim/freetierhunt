import { NextRequest } from 'next/server';
import { getProductBySlug, listOffersForProduct } from '@/lib/db/queries';
import { slugSchema } from '@/lib/schemas';
import { badRequest, err, ok, PUBLIC_CACHE } from '@/lib/api/response';

export const runtime = 'nodejs';
export const revalidate = 300;

/**
 * GET /api/products/[slug]
 * Public product detail with active offers.
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const parsed = slugSchema.safeParse(slug);
  if (!parsed.success) return badRequest(parsed.error);

  const product = await getProductBySlug(parsed.data);
  if (!product) return err('not_found', 404);

  const offers = await listOffersForProduct(product.id);
  return ok({ product, offers }, { headers: PUBLIC_CACHE });
}
