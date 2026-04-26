/**
 * Logo URL helpers — derive a stable favicon for any product website.
 *
 * Strategy:
 *   1. If product.logoUrl is set, use it.
 *   2. Else derive from product.website via DuckDuckGo's favicon service
 *      (allowed in next.config.mjs remotePatterns).
 *   3. Fallback to a transparent 1x1 placeholder.
 */

const TRANSPARENT_1X1 =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"/>';

export function getProductLogo(opts: { logoUrl?: string | null; website?: string | null }): string {
  if (opts.logoUrl) return opts.logoUrl;
  if (!opts.website) return TRANSPARENT_1X1;
  try {
    const host = new URL(opts.website).hostname.replace(/^www\./, '');
    return `https://icons.duckduckgo.com/ip3/${host}.ico`;
  } catch {
    return TRANSPARENT_1X1;
  }
}
