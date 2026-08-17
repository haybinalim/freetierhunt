-- FreeTierHunt initial discovery source seed
--
-- Prerequisites:
--   1. Apply migrations through 20260814_0006_discovery_candidates.sql.
--   2. Replace every YOUR_* placeholder before running this script.
--
-- Design boundary:
--   * Official provider pages are automated discovery sources.
--   * Telegram entries are authorized structured-candidate ingress sources only.
--     They MUST keep allow_automated_sync=false: the HTTP worker never scrapes
--     them. The Telegram bot accepts only channel_post updates for access grants
--     that are explicitly recorded below.

BEGIN;

-- -----------------------------------------------------------------------------
-- A. Official sources: eligible for the discovery worker
-- -----------------------------------------------------------------------------
INSERT INTO sources (
  name,
  type,
  status,
  base_url,
  canonical_domain,
  owner_name,
  trust_score,
  allow_automated_sync,
  sync_interval_minutes,
  health_status,
  notes
)
VALUES
  (
    'Google Cloud Startup Program',
    'official',
    'active',
    'https://cloud.google.com/startup',
    'cloud.google.com',
    'Google Cloud',
    100,
    true,
    360,
    'healthy',
    'Official program page; handled by google-cloud-startup-v1 discovery profile.'
  ),
  (
    'AWS Activate Credits',
    'official',
    'active',
    'https://aws.amazon.com/startups/credits/',
    'aws.amazon.com',
    'Amazon Web Services',
    100,
    true,
    360,
    'healthy',
    'Official program page; handled by aws-activate-v1 discovery profile.'
  ),
  (
    'Cloudflare for Startups',
    'official',
    'active',
    'https://www.cloudflare.com/startups/',
    'cloudflare.com',
    'Cloudflare',
    100,
    true,
    360,
    'healthy',
    'Official program page; handled by cloudflare-startups-v1 discovery profile.'
  )
ON CONFLICT (base_url) DO UPDATE SET
  name = EXCLUDED.name,
  owner_name = EXCLUDED.owner_name,
  trust_score = EXCLUDED.trust_score,
  allow_automated_sync = EXCLUDED.allow_automated_sync,
  sync_interval_minutes = EXCLUDED.sync_interval_minutes,
  notes = EXCLUDED.notes,
  updated_at = now();

-- -----------------------------------------------------------------------------
-- B. Authorized Telegram sources: not crawled; bot ingress only
--
-- Replace all placeholders. Each authorization_reference must point to a real,
-- retrievable permission record (signed agreement, owner email confirmation,
-- partner record, etc.). Do NOT use a channel without this authorization.
-- -----------------------------------------------------------------------------
INSERT INTO sources (
  name,
  type,
  status,
  base_url,
  canonical_domain,
  owner_name,
  trust_score,
  allow_automated_sync,
  sync_interval_minutes,
  health_status,
  notes
)
VALUES
  (
    'YOUR_AUTHORIZED_TELEGRAM_CHANNEL_ONE',
    'partner_feed',
    'active',
    'https://t.me/YOUR_AUTHORIZED_TELEGRAM_CHANNEL_ONE',
    't.me',
    'YOUR_CHANNEL_OWNER_OR_ORGANIZATION',
    75,
    false,
    NULL,
    'healthy',
    'Authorized Telegram structured candidate ingress. Bot-only; no HTTP crawling or raw-message retention.'
  ),
  (
    'YOUR_AUTHORIZED_TELEGRAM_CHANNEL_TWO',
    'partner_feed',
    'active',
    'https://t.me/YOUR_AUTHORIZED_TELEGRAM_CHANNEL_TWO',
    't.me',
    'YOUR_CHANNEL_OWNER_OR_ORGANIZATION',
    75,
    false,
    NULL,
    'healthy',
    'Authorized Telegram structured candidate ingress. Bot-only; no HTTP crawling or raw-message retention.'
  )
ON CONFLICT (base_url) DO UPDATE SET
  name = EXCLUDED.name,
  owner_name = EXCLUDED.owner_name,
  trust_score = EXCLUDED.trust_score,
  allow_automated_sync = false,
  sync_interval_minutes = NULL,
  notes = EXCLUDED.notes,
  updated_at = now();

-- -----------------------------------------------------------------------------
-- C. Channel access grants: replace the placeholders before execution
--
-- `telegram_chat_id` is the numeric Telegram supergroup/channel ID, generally
-- beginning with -100. The webhook accepts only `channel_post` and only while
-- the grant is active and inside its validity window.
-- -----------------------------------------------------------------------------
INSERT INTO source_access_grants (
  grant_id,
  source_id,
  telegram_chat_id,
  owner_contact,
  authorization_reference,
  allowed_update_types,
  status,
  valid_from,
  valid_until
)
SELECT
  grant.grant_id,
  source.id,
  grant.telegram_chat_id,
  grant.owner_contact,
  grant.authorization_reference,
  ARRAY['channel_post']::text[],
  'active'::source_access_grant_status,
  grant.valid_from,
  grant.valid_until
FROM (
  VALUES
    (
      'telegram-grant-YOUR_CHANNEL_ONE',
      'https://t.me/YOUR_AUTHORIZED_TELEGRAM_CHANNEL_ONE',
      '-1000000000001',
      'owner@example.com',
      'YOUR_AUTHORIZATION_RECORD_URL_OR_ID',
      timestamptz '2026-08-17 00:00:00+00',
      timestamptz '2027-08-17 00:00:00+00'
    ),
    (
      'telegram-grant-YOUR_CHANNEL_TWO',
      'https://t.me/YOUR_AUTHORIZED_TELEGRAM_CHANNEL_TWO',
      '-1000000000002',
      'owner@example.com',
      'YOUR_AUTHORIZATION_RECORD_URL_OR_ID',
      timestamptz '2026-08-17 00:00:00+00',
      timestamptz '2027-08-17 00:00:00+00'
    )
) AS grant(
  grant_id,
  source_base_url,
  telegram_chat_id,
  owner_contact,
  authorization_reference,
  valid_from,
  valid_until
)
JOIN sources AS source ON source.base_url = grant.source_base_url
ON CONFLICT (grant_id) DO UPDATE SET
  source_id = EXCLUDED.source_id,
  telegram_chat_id = EXCLUDED.telegram_chat_id,
  owner_contact = EXCLUDED.owner_contact,
  authorization_reference = EXCLUDED.authorization_reference,
  allowed_update_types = ARRAY['channel_post']::text[],
  status = 'active'::source_access_grant_status,
  valid_from = EXCLUDED.valid_from,
  valid_until = EXCLUDED.valid_until,
  revoked_at = NULL,
  revoked_reason = NULL,
  updated_at = now();

COMMIT;

-- Optional verification queries after committing:
-- SELECT id, name, type, allow_automated_sync, sync_interval_minutes
-- FROM sources ORDER BY id;
--
-- SELECT grant_id, telegram_chat_id, status, valid_from, valid_until
-- FROM source_access_grants ORDER BY grant_id;
