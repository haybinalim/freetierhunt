import { NextRequest } from 'next/server';
import { listActiveOffers } from '@/lib/db/queries';
import { listOffersQuerySchema } from '@/lib/schemas';
import { badRequest, ok, PUBLIC_CACHE } from '@/lib/api/response';

export const runtime = 'nodejs';
export const revalidate = 300; // ISR 5min

/**
 * GET /api/offers/today
 * Public listing of currently active offers, sorted by score+recency.
 * Query: ?type=free_tier&limit=50&offset=0
 */
export async function GET(req: NextRequest) {
  const params = Object.fromEntries(req.nextUrl.searchParams);
  const parsed = listOffersQuerySchema.safeParse(params);
  if (!parsed.success) return badRequest(parsed.error);

  const offers = await listActiveOffers(parsed.data);
  return ok({ offers, count: offers.length }, { headers: PUBLIC_CACHE });
}
