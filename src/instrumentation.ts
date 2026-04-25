/**
 * Next.js 15 instrumentation hook (audit fix B6).
 *
 * Currently NO-OP. Hafta 1 Cuma:
 *   1. Run `npx @sentry/wizard@latest -i nextjs` (creates sentry.{client,server,edge}.config.ts)
 *   2. The wizard rewrites this file to delegate to those configs.
 *
 * Keeping it here ensures Next.js picks up the file early and we don't forget B6.
 */
export async function register() {
  // intentionally empty — Sentry wizard will populate this file
}
