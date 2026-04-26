import { NextRequest } from 'next/server';
import { z } from 'zod';
import { search } from '@/lib/db/queries';
import { badRequest, ok } from '@/lib/api/response';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const searchQuerySchema = z.object({
  q: z.string().min(1).max(100),
  limit: z.coerce.number().int().min(1).max(20).default(8),
});

/**
 * GET /api/search?q=cursor&limit=8
 * Public, fast ILIKE search across products + active offers.
 * Replaced by Meilisearch in Hafta 7.
 */
export async function GET(req: NextRequest) {
  const params = Object.fromEntries(req.nextUrl.searchParams);
  const parsed = searchQuerySchema.safeParse(params);
  if (!parsed.success) return badRequest(parsed.error);

  const results = await search(parsed.data.q, parsed.data.limit);
  return ok(results, {
    headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' },
  });
}
