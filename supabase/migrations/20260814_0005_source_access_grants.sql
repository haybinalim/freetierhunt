-- FreeTierHunt P0 authorized channel access grants (additive migration)
-- Telegram message bodies, user profiles and media are deliberately not stored.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'source_access_grant_status') THEN
    CREATE TYPE source_access_grant_status AS ENUM ('active', 'paused', 'revoked', 'expired');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS source_access_grants (
  grant_id varchar(100) PRIMARY KEY,
  source_id integer NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
  telegram_chat_id varchar(32) NOT NULL UNIQUE,
  owner_contact varchar(320) NOT NULL,
  authorization_reference varchar(500) NOT NULL,
  allowed_update_types text[] NOT NULL DEFAULT ARRAY['channel_post']::text[],
  status source_access_grant_status NOT NULL DEFAULT 'active',
  valid_from timestamptz NOT NULL,
  valid_until timestamptz NOT NULL,
  revoked_at timestamptz,
  revoked_reason varchar(500),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT source_access_grant_valid_window CHECK (valid_until > valid_from),
  CONSTRAINT source_access_grant_chat_id_numeric CHECK (telegram_chat_id ~ '^-?[0-9]{1,20}$'),
  CONSTRAINT source_access_grant_channel_posts_only CHECK (allowed_update_types = ARRAY['channel_post']::text[])
);

CREATE INDEX IF NOT EXISTS source_access_grants_active_lookup_idx
  ON source_access_grants (telegram_chat_id, status, valid_from, valid_until);
CREATE INDEX IF NOT EXISTS source_access_grants_source_idx
  ON source_access_grants (source_id);

-- Existing telegram_inbound_updates is the durable, unique update_id receipt.
-- Do not add raw request JSON, post text, sender data or profile fields to this table.

CREATE TABLE IF NOT EXISTS telegram_ingress_audit_events (
  id bigserial PRIMARY KEY,
  update_id integer NOT NULL,
  telegram_chat_id varchar(32) NOT NULL,
  decision varchar(20) NOT NULL CHECK (decision IN ('accepted', 'ignored', 'rejected', 'duplicate')),
  reason_code varchar(100) NOT NULL,
  source_id integer REFERENCES sources(id) ON DELETE SET NULL,
  grant_id varchar(100) REFERENCES source_access_grants(grant_id) ON DELETE SET NULL,
  occurred_at timestamptz NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS telegram_ingress_audit_chat_occurred_idx
  ON telegram_ingress_audit_events (telegram_chat_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS telegram_ingress_audit_decision_occurred_idx
  ON telegram_ingress_audit_events (decision, occurred_at DESC);

-- Audit metadata must contain only operational keys (e.g. route/version). Do not
-- write raw request JSON, post text, sender identifiers, usernames or media metadata.
