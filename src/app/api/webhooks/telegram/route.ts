import { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { submissions, telegramInboundUpdates } from '@/lib/db/schema';
import { env } from '@/lib/env';
import { safeEqual } from '@/lib/admin/guard';
import {
  getNewChannelPost,
  parseAllowedChatIds,
  parseTelegramOfferCommand,
  type TelegramUpdate,
} from '@/lib/telegram/offer-parser';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SECRET_HEADER = 'x-telegram-bot-api-secret-token';

function hasValidWebhookSecret(request: NextRequest): boolean {
  const expected = env.TELEGRAM_WEBHOOK_SECRET;
  const received = request.headers.get(SECRET_HEADER);
  return Boolean(expected && received && safeEqual(received, expected));
}

function isTelegramUpdate(value: unknown): value is TelegramUpdate {
  return (
    typeof value === 'object' &&
    value !== null &&
    'update_id' in value &&
    Number.isInteger((value as { update_id?: unknown }).update_id)
  );
}

/**
 * Receives only `channel_post` updates from explicit partner channels. Each post
 * must use the `/offer` command with an official provider URL; arbitrary text is
 * ignored and never persisted.
 */
export async function POST(request: NextRequest) {
  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_WEBHOOK_SECRET) {
    return Response.json({ error: 'telegram_not_configured' }, { status: 503 });
  }
  if (!hasValidWebhookSecret(request)) {
    return Response.json({ error: 'invalid_webhook_secret' }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: 'invalid_json' }, { status: 400 });
  }
  if (!isTelegramUpdate(payload)) {
    return Response.json({ error: 'invalid_update' }, { status: 400 });
  }

  const post = getNewChannelPost(payload);
  if (!post) return Response.json({ ok: true, status: 'ignored' });

  const allowedChats = parseAllowedChatIds(env.TELEGRAM_ALLOWED_CHAT_IDS);
  const chatId = String(post.chat.id);
  if (allowedChats.size === 0 || !allowedChats.has(chatId)) {
    return Response.json({ ok: true, status: 'ignored' });
  }

  const now = new Date();
  const [inbound] = await db
    .insert(telegramInboundUpdates)
    .values({
      updateId: payload.update_id,
      chatId,
      messageId: post.message_id,
      chatTitle: post.chat.title ?? null,
      status: 'received',
      receivedAt: now,
    })
    .onConflictDoNothing()
    .returning({ id: telegramInboundUpdates.id });

  if (!inbound) {
    return Response.json({ ok: true, status: 'duplicate' });
  }

  const candidate = parseTelegramOfferCommand(post.text);
  if (!candidate) {
    await db
      .update(telegramInboundUpdates)
      .set({ status: 'rejected', reason: 'invalid_offer_command', processedAt: now })
      .where(eq(telegramInboundUpdates.id, inbound.id));
    return Response.json({ ok: true, status: 'rejected' });
  }

  const [submission] = await db
    .insert(submissions)
    .values({
      productName: candidate.productName,
      offerType: candidate.offerType,
      headline: candidate.headline,
      description: candidate.evidenceQuote,
      website: candidate.officialUrl,
      sourceUrl: candidate.officialUrl,
      submitterRelationship: 'researcher',
      status: 'pending',
    })
    .returning({ id: submissions.id });

  await db
    .update(telegramInboundUpdates)
    .set({
      status: 'accepted',
      officialUrl: candidate.officialUrl,
      submissionId: submission?.id ?? null,
      processedAt: now,
    })
    .where(eq(telegramInboundUpdates.id, inbound.id));

  return Response.json({ ok: true, status: 'accepted', submissionId: submission?.id });
}
