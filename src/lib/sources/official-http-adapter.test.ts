import { afterEach, describe, expect, it, vi } from 'vitest';
import { OfficialHttpAdapter } from './official-http-adapter';
import type { SourceRecord } from './types';

const source: SourceRecord = {
  id: 1,
  name: 'Example official source',
  type: 'official',
  status: 'active',
  baseUrl: 'https://example.com/pricing',
  canonicalDomain: 'example.com',
  allowAutomatedSync: true,
  healthStatus: 'healthy',
  consecutiveFailures: 0,
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('OfficialHttpAdapter', () => {
  it('başarılı bir yanıtı içerik karmasıyla kaydeder ve koşullu istek başlıklarını gönderir', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response('<html><title>Pricing</title><body>Free tier</body></html>', {
        status: 200,
        headers: { etag: '"v1"', 'last-modified': 'Wed, 13 Aug 2026 09:00:00 GMT' },
      })
    );
    vi.stubGlobal('fetch', fetchMock);

    const result = await new OfficialHttpAdapter().fetch(source, {
      etag: '"v0"',
      lastModified: 'Tue, 12 Aug 2026 09:00:00 GMT',
    });

    expect(result).toMatchObject({
      status: 'succeeded',
      httpStatus: 200,
      etag: '"v1"',
      contentHash: expect.stringMatching(/^[a-f0-9]{64}$/),
    });
    expect(fetchMock).toHaveBeenCalledOnce();
    const [, options] = fetchMock.mock.calls[0] as [URL, RequestInit];
    expect(new Headers(options.headers).get('if-none-match')).toBe('"v0"');
  });

  it('304 yanıtını içerik indirmeden not_modified olarak işaretler', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 304 })));

    const result = await new OfficialHttpAdapter().fetch(source, { etag: '"v1"' });

    expect(result).toMatchObject({ status: 'not_modified', httpStatus: 304, body: null });
  });

  it('yerel ve özel ağ URL’lerini isteğe çıkmadan reddeder', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const result = await new OfficialHttpAdapter().fetch({
      ...source,
      baseUrl: 'http://127.0.0.1:3000',
    });

    expect(result).toMatchObject({ status: 'failed', errorCode: 'INVALID_SOURCE_URL' });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
