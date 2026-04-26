import { NextRequest } from 'next/server';
import { db } from '@/lib/db/client';
import { submissions } from '@/lib/db/schema';
import { submissionRequestSchema } from '@/lib/schemas';
import { getFlag } from '@/lib/db/queries';
import { badRequest, err, ok } from '@/lib/api/response';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/submissions
 * Community-submitted offer. Behind feature flag `submissions_enabled`.
 * Status defaults to 'pending' for moderator review.
 */
export async function POST(req: NextRequest) {
  const enabled = await getFlag('submissions_enabled');
  if (!enabled) return err('submissions_disabled', 503);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return err('invalid_json', 400);
  }

  const parsed = submissionRequestSchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error);

  const [row] = await db
    .insert(submissions)
    .values({
      productName: parsed.data.productName,
      offerType: parsed.data.offerType,
      code: parsed.data.code ?? null,
      headline: parsed.data.headline,
      description: parsed.data.description ?? null,
      terms: parsed.data.terms ?? null,
      expiresAt: parsed.data.expiresAt ?? null,
      website: parsed.data.website ?? null,
    })
    .returning({ id: submissions.id });

  return ok({ ok: true, submissionId: row?.id }, { status: 201 });
}
