import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getOffersByIds } from '@/lib/db/queries';
import { badRequest, ok } from '@/lib/api/response';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** ?ids=1,2,3 (max 50) */
const querySchema = z.object({
  ids: z
    .string()
    .min(1)
    .transform((s) =>
      s
        .split(',')
        .map((x) => Number.parseInt(x.trim(), 10))
        .filter((n) => Number.isFinite(n) && n > 0)
    )
    .pipe(z.array(z.number().int().positive()).min(1).max(50)),
});

/**
 * GET /api/offers/by-ids?ids=1,2,3
 * Used by the /saved page to hydrate localStorage IDs into full offer rows.
 */
export async function GET(req: NextRequest) {
  const params = Object.fromEntries(req.nextUrl.searchParams);
  const parsed = querySchema.safeParse(params);
  if (!parsed.success) return badRequest(parsed.error);

  const offers = await getOffersByIds(parsed.data.ids);
  return ok(
    { offers },
    {
      headers: { 'Cache-Control': 'private, max-age=30' },
    }
  );
}
