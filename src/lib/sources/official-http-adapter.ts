import { createHash } from 'node:crypto';
import type {
  AdapterFetchResult,
  SourceAdapter,
  SourceCursor,
  SourceHealthCheck,
  SourceRecord,
} from './types';

const MAX_RESPONSE_BYTES = 1_500_000;
const REQUEST_TIMEOUT_MS = 15_000;
const USER_AGENT = 'FreeTierHuntBot/0.1 (+https://freetierhunt.com/bot)';

function isBlockedHostname(hostname: string): boolean {
  const value = hostname.toLowerCase();
  if (value === 'localhost' || value.endsWith('.localhost') || value.endsWith('.local'))
    return true;
  if (value === '0.0.0.0' || value === '::1' || value === '[::1]') return true;
  if (/^127\./.test(value) || /^10\./.test(value) || /^192\.168\./.test(value)) return true;

  const match = value.match(/^172\.(\d{1,3})\./);
  if (match && Number(match[1]) >= 16 && Number(match[1]) <= 31) return true;
  return false;
}

function validatePublicHttpUrl(rawUrl: string): URL {
  const url = new URL(rawUrl);
  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new Error('Only HTTP(S) source URLs are supported');
  }
  if (url.username || url.password || isBlockedHostname(url.hostname)) {
    throw new Error('Source URL is not a public HTTP endpoint');
  }
  return url;
}

function errorCodeFor(error: unknown): string {
  if (error instanceof DOMException && error.name === 'TimeoutError') return 'TIMEOUT';
  if (error instanceof Error && /abort|timeout/i.test(error.message)) return 'TIMEOUT';
  return 'NETWORK_ERROR';
}

export class OfficialHttpAdapter implements SourceAdapter {
  readonly key = 'official-http-v1';
  readonly sourceType = 'official' as const;
  readonly rateLimit = { requests: 1, windowMs: 2_000 };

  async fetch(source: SourceRecord, cursor?: SourceCursor): Promise<AdapterFetchResult> {
    let url: URL;
    try {
      url = validatePublicHttpUrl(source.baseUrl);
    } catch (error) {
      return {
        status: 'failed',
        requestUrl: source.baseUrl,
        httpStatus: null,
        durationMs: 0,
        etag: null,
        lastModified: null,
        body: null,
        contentHash: null,
        errorCode: 'INVALID_SOURCE_URL',
        errorMessage: error instanceof Error ? error.message : 'Invalid source URL',
      };
    }

    const headers = new Headers({
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,text/plain;q=0.8,*/*;q=0.5',
      'User-Agent': USER_AGENT,
    });
    if (cursor?.etag) headers.set('If-None-Match', cursor.etag);
    if (cursor?.lastModified) headers.set('If-Modified-Since', cursor.lastModified);

    const startedAt = performance.now();
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers,
        redirect: 'follow',
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
      const durationMs = Math.round(performance.now() - startedAt);
      const etag = response.headers.get('etag');
      const lastModified = response.headers.get('last-modified');

      if (response.status === 304) {
        return {
          status: 'not_modified',
          requestUrl: response.url || url.toString(),
          httpStatus: response.status,
          durationMs,
          etag,
          lastModified,
          body: null,
          contentHash: null,
          errorCode: null,
          errorMessage: null,
        };
      }

      if (!response.ok) {
        return {
          status: 'failed',
          requestUrl: response.url || url.toString(),
          httpStatus: response.status,
          durationMs,
          etag,
          lastModified,
          body: null,
          contentHash: null,
          errorCode: response.status === 429 ? 'RATE_LIMITED' : `HTTP_${response.status}`,
          errorMessage: `Source returned HTTP ${response.status}`,
        };
      }

      const declaredLength = Number(response.headers.get('content-length') ?? '0');
      if (declaredLength > MAX_RESPONSE_BYTES) {
        return {
          status: 'failed',
          requestUrl: response.url || url.toString(),
          httpStatus: response.status,
          durationMs,
          etag,
          lastModified,
          body: null,
          contentHash: null,
          errorCode: 'RESPONSE_TOO_LARGE',
          errorMessage: `Response exceeds ${MAX_RESPONSE_BYTES} byte safety limit`,
        };
      }

      const body = await response.text();
      if (Buffer.byteLength(body, 'utf8') > MAX_RESPONSE_BYTES) {
        return {
          status: 'failed',
          requestUrl: response.url || url.toString(),
          httpStatus: response.status,
          durationMs,
          etag,
          lastModified,
          body: null,
          contentHash: null,
          errorCode: 'RESPONSE_TOO_LARGE',
          errorMessage: `Response exceeds ${MAX_RESPONSE_BYTES} byte safety limit`,
        };
      }

      return {
        status: 'succeeded',
        requestUrl: response.url || url.toString(),
        httpStatus: response.status,
        durationMs,
        etag,
        lastModified,
        body,
        contentHash: createHash('sha256').update(body).digest('hex'),
        errorCode: null,
        errorMessage: null,
      };
    } catch (error) {
      return {
        status: 'failed',
        requestUrl: url.toString(),
        httpStatus: null,
        durationMs: Math.round(performance.now() - startedAt),
        etag: null,
        lastModified: null,
        body: null,
        contentHash: null,
        errorCode: errorCodeFor(error),
        errorMessage: error instanceof Error ? error.message : 'Unknown network error',
      };
    }
  }

  async healthCheck(source: SourceRecord): Promise<SourceHealthCheck> {
    const result = await this.fetch(source);
    return {
      status: result.status === 'failed' ? 'degraded' : 'healthy',
      reason:
        result.status === 'failed'
          ? (result.errorMessage ?? 'Source fetch failed')
          : result.status === 'not_modified'
            ? 'Source reachable; content unchanged'
            : 'Source reachable',
      checkedAt: new Date(),
    };
  }
}
