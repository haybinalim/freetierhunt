import { describe, expect, it } from 'vitest';
import { getNewChannelPost, parseAllowedChatIds, parseTelegramOfferCommand } from './offer-parser';

describe('parseTelegramOfferCommand', () => {
  it('yalnızca eksiksiz yapılandırılmış offer komutunu aday olarak kabul eder', () => {
    expect(
      parseTelegramOfferCommand(
        '/offer credit | Example AI | $50 startup credit | https://example.com/startups | Verified startups can apply for $50 credit.'
      )
    ).toEqual({
      offerType: 'credit',
      productName: 'Example AI',
      headline: '$50 startup credit',
      officialUrl: 'https://example.com/startups',
      evidenceQuote: 'Verified startups can apply for $50 credit.',
    });
  });

  it('rastgele mesajları, eksik alanları ve özel ağ URL’lerini reddeder', () => {
    expect(parseTelegramOfferCommand('new deal, check this out')).toBeNull();
    expect(
      parseTelegramOfferCommand('/offer credit | Product | Title | https://example.com')
    ).toBeNull();
    expect(
      parseTelegramOfferCommand(
        '/offer credit | Product | Title | http://127.0.0.1:3000 | hidden endpoint'
      )
    ).toBeNull();
  });
});

describe('parseAllowedChatIds', () => {
  it('yalnızca geçerli sayısal chat kimliklerini kabul eder', () => {
    expect([...parseAllowedChatIds('-1001, 42, not-an-id')]).toEqual(['-1001', '42']);
  });
});

describe('getNewChannelPost', () => {
  it('yalnızca yeni kanal gönderisini kabul eder; düzenlenmiş veya grup mesajını yok sayar', () => {
    expect(
      getNewChannelPost({
        update_id: 1,
        channel_post: {
          message_id: 2,
          date: 0,
          chat: { id: -1001, type: 'channel', title: 'Partner' },
          text: '/offer credit | Product | Title | https://example.com | proof',
        },
      })
    ).toMatchObject({ message_id: 2 });
    expect(
      getNewChannelPost({
        update_id: 2,
        edited_channel_post: {
          message_id: 2,
          date: 0,
          chat: { id: -1001, type: 'channel' },
        },
      })
    ).toBeNull();
    expect(
      getNewChannelPost({
        update_id: 3,
        channel_post: { message_id: 3, date: 0, chat: { id: -1001, type: 'supergroup' } },
      })
    ).toBeNull();
  });
});
