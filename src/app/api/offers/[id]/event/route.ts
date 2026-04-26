import { NextRequest } from 'next/server';
import { createHash } from 'node:crypto';
import { db } from '@/lib/db/client';
import { offerEvents } from '@/lib/db/schema';
import { idSchema, eventRequestSchema } from '@/lib/schemas';
import { badRequest, err, ok } from '@/lib/api/response';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function hashIp(ip: string | null): string | null {
  if (!ip) return null;
  return createHash('sha256').update(ip).digest('hex').slice(0, 32);
}

/**
 * POST /api/offers/[id]/event
 * Telemetry: view, click, copy_code, verify_attempt.
 * IP hashed (not stored raw) for privacy + analytics.
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

  const parsed = eventRequestSchema.safeParse({
    ...(body as object),
    offerId: idParsed.data,
  });
  if (!parsed.success) return badRequest(parsed.error);

  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    null;

  await db.insert(offerEvents).values({
    offerId: parsed.data.offerId,
    eventType: parsed.data.eventType,
    visitorId: parsed.data.visitorId ?? null,
    ipHash: hashIp(ip),
    userAgent: req.headers.get('user-agent')?.slice(0, 500) ?? null,
    referrer: req.headers.get('referer')?.slice(0, 500) ?? null,
  });

  return ok({ ok: true });
}
