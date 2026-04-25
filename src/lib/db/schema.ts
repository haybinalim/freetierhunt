/**
 * Drizzle Schema — placeholder.
 *
 * Tables will be defined in Hafta 2 (DOSYA 2 → Pazartesi/Salı):
 *   - products, offers, offer_events, offer_votes (anonymous-safe), offer_reports
 *   - users, saved_offers, submissions, digest_log
 *   - llm_calls, firecrawl_usage, extraction_queue, feature_flags
 *
 * Audit fixes already encoded in plan: B2 anonymous votes UNIQUE, B5 views_count,
 * B11 missing indexes, B13 digest_log idempotency, B15 users.role, B16 default 'never'.
 */
export {};
