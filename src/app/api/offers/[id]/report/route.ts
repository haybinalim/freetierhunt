import { NextRequest } from 'next/server';
import { db } from '@/lib/db/client';
import { offerReports } from '@/lib/db/schema';
import { idSchema, reportRequestSchema } from '@/lib/schemas';
import { badRequest, err, ok } from '@/lib/api/response';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/offers/[id]/report
 * Anonymous flag for spam, expired, broken offers.
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

  const parsed = reportRequestSchema.safeParse({
    ...(body as object),
    offerId: idParsed.data,
  });
  if (!parsed.success) return badRequest(parsed.error);

  await db.insert(offerReports).values({
    offerId: parsed.data.offerId,
    visitorId: parsed.data.visitorId ?? null,
    reason: parsed.data.reason,
    details: parsed.data.details ?? null,
  });

  return ok({ ok: true });
}
