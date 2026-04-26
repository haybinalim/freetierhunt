import { NextRequest } from 'next/server';
import { db } from '@/lib/db/client';
import { offerVotes } from '@/lib/db/schema';
import { idSchema, voteRequestSchema } from '@/lib/schemas';
import { badRequest, err, ok } from '@/lib/api/response';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/offers/[id]/vote
 * Anonymous-safe upvote/downvote. UNIQUE(visitor_id, offer_id) prevents dup.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const idParsed = idSchema.safeParse(id);
  if (!idParsed.success) return badRequest(idParsed.error);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return err('invalid_json', 400);
  }

  const parsed = voteRequestSchema.safeParse({
    ...(body as object),
    offerId: idParsed.data,
  });
  if (!parsed.success) return badRequest(parsed.error);

  try {
    await db
      .insert(offerVotes)
      .values(parsed.data)
      .onConflictDoNothing({
        target: [offerVotes.visitorId, offerVotes.offerId],
      });
    return ok({ ok: true });
  } catch (e) {
    return err('vote_failed', 500, { detail: e instanceof Error ? e.message : 'unknown' });
  }
}
