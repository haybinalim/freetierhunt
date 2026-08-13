export type TelegramChannelPost = {
  message_id: number;
  date: number;
  chat: { id: number | string; type: string; title?: string };
  text?: string;
};

export type TelegramUpdate = {
  update_id: number;
  channel_post?: TelegramChannelPost;
  edited_channel_post?: TelegramChannelPost;
};

export type TelegramOfferCandidate = {
  offerType: 'free_tier' | 'trial' | 'credit' | 'discount';
  productName: string;
  headline: string;
  officialUrl: string;
  evidenceQuote: string;
};

const MAX_FIELD_LENGTH = 500;

function isPublicHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase();
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return false;
    if (url.username || url.password) return false;
    if (
      hostname === 'localhost' ||
      hostname.endsWith('.localhost') ||
      hostname.endsWith('.local')
    ) {
      return false;
    }
    if (/^127\./.test(hostname) || /^10\./.test(hostname) || /^192\.168\./.test(hostname)) {
      return false;
    }
    const match = hostname.match(/^172\.(\d{1,3})\./);
    return !(match && Number(match[1]) >= 16 && Number(match[1]) <= 31);
  } catch {
    return false;
  }
}

/**
 * Accepts only an explicit channel command. The bot does not use NLP or inspect
 * arbitrary posts. Required format:
 * /offer offer_type | Product name | concise headline | https://official-provider.example/offer | proof quote
 */
export function parseTelegramOfferCommand(text: string | undefined): TelegramOfferCandidate | null {
  if (!text) return null;
  const normalized = text.trim();
  const commandMatch = normalized.match(/^\/offer(?:@[A-Za-z0-9_]+)?\s+([\s\S]+)$/i);
  if (!commandMatch?.[1]) return null;

  const parts = commandMatch[1].split('|').map((part) => part.trim());
  if (parts.length < 5) return null;

  const [offerType, productName, headline, officialUrl, ...quoteParts] = parts;
  const evidenceQuote = quoteParts.join(' | ').trim();

  if (
    !offerType ||
    !['free_tier', 'trial', 'credit', 'discount'].includes(offerType) ||
    !productName ||
    !headline ||
    !officialUrl ||
    !evidenceQuote ||
    productName.length > 255 ||
    headline.length > 255 ||
    officialUrl.length > MAX_FIELD_LENGTH ||
    evidenceQuote.length > 2_000 ||
    !isPublicHttpUrl(officialUrl)
  ) {
    return null;
  }

  return {
    offerType: offerType as TelegramOfferCandidate['offerType'],
    productName,
    headline,
    officialUrl,
    evidenceQuote,
  };
}

export function parseAllowedChatIds(value: string | undefined): Set<string> {
  return new Set(
    (value ?? '')
      .split(',')
      .map((id) => id.trim())
      .filter((id) => /^-?\d{1,20}$/.test(id))
  );
}

export function getNewChannelPost(update: TelegramUpdate): TelegramChannelPost | null {
  // Edited posts are deliberately ignored to avoid changing a reviewed candidate.
  const post = update.channel_post;
  if (!post || post.chat.type !== 'channel') return null;
  if (!Number.isInteger(update.update_id) || !Number.isInteger(post.message_id)) return null;
  return post;
}
