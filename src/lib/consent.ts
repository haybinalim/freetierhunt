/**
 * GDPR Cookie Consent (audit fix B27).
 *
 * 3-tier consent model:
 *   - 'strict'    → essential cookies only (auth, CSRF). Default until user decides.
 *   - 'analytics' → strict + PostHog / Cloudflare Analytics
 *   - 'all'       → analytics + (future) marketing/tracking
 *
 * Persistence: localStorage key `consent` + version (so we can re-prompt
 * if our policy changes meaningfully — bump CONSENT_VERSION below).
 *
 * Server-safe: every reader returns 'strict' on the server (SSR) so analytics
 * scripts default to off until the client component re-evaluates.
 */

export const CONSENT_LEVELS = ['strict', 'analytics', 'all'] as const;
export type ConsentLevel = (typeof CONSENT_LEVELS)[number];

export const CONSENT_VERSION = 1;
const STORAGE_KEY = 'ftd:consent';
const EVENT_NAME = 'ftd:consent-change';

interface StoredConsent {
  level: ConsentLevel;
  version: number;
  decidedAt: number;
}

function isClient(): boolean {
  return typeof window !== 'undefined';
}

export function getConsent(): ConsentLevel {
  if (!isClient()) return 'strict';
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return 'strict';
    const parsed = JSON.parse(raw) as Partial<StoredConsent>;
    if (parsed.version !== CONSENT_VERSION) return 'strict';
    if (!parsed.level || !CONSENT_LEVELS.includes(parsed.level as ConsentLevel)) return 'strict';
    return parsed.level as ConsentLevel;
  } catch {
    return 'strict';
  }
}

export function hasDecided(): boolean {
  if (!isClient()) return false;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw) as Partial<StoredConsent>;
    return parsed.version === CONSENT_VERSION;
  } catch {
    return false;
  }
}

export function setConsent(level: ConsentLevel): void {
  if (!isClient()) return;
  const payload: StoredConsent = {
    level,
    version: CONSENT_VERSION,
    decidedAt: Date.now(),
  };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: payload }));
}

export function clearConsent(): void {
  if (!isClient()) return;
  window.localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: null }));
}

export function hasAnalyticsConsent(): boolean {
  const level = getConsent();
  return level === 'analytics' || level === 'all';
}

export function hasMarketingConsent(): boolean {
  return getConsent() === 'all';
}

/**
 * Subscribe to consent changes. Fires on setConsent / clearConsent.
 * Returns an unsubscribe function.
 *
 * Usage in a component:
 *   useEffect(() => onConsentChange((level) => setEnabled(level !== 'strict')), []);
 */
export function onConsentChange(callback: (level: ConsentLevel) => void): () => void {
  if (!isClient()) return () => {};
  const handler = () => callback(getConsent());
  window.addEventListener(EVENT_NAME, handler);
  // Cross-tab sync via storage event
  const storageHandler = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) callback(getConsent());
  };
  window.addEventListener('storage', storageHandler);
  return () => {
    window.removeEventListener(EVENT_NAME, handler);
    window.removeEventListener('storage', storageHandler);
  };
}
