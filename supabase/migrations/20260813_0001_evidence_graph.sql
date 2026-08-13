-- FreeTierHunt v2 evidence graph (additive migration)
-- Apply through the Supabase SQL editor or the project's migration workflow.
-- This migration intentionally preserves existing offers and only adds columns/types/tables.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'source_type') THEN
    CREATE TYPE source_type AS ENUM ('official', 'partner_feed', 'community_submission', 'manual_research');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'source_status') THEN
    CREATE TYPE source_status AS ENUM ('active', 'paused', 'retired');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'evidence_type') THEN
    CREATE TYPE evidence_type AS ENUM ('official_page', 'partner_feed', 'manual_review', 'community_submission');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'verification_outcome') THEN
    CREATE TYPE verification_outcome AS ENUM ('passed', 'failed', 'inconclusive');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'offer_verification_state') THEN
    CREATE TYPE offer_verification_state AS ENUM ('unverified', 'verified', 'needs_review', 'failed');
  END IF;
END $$;

ALTER TYPE offer_status ADD VALUE IF NOT EXISTS 'draft';
ALTER TYPE offer_status ADD VALUE IF NOT EXISTS 'under_review';
ALTER TYPE offer_status ADD VALUE IF NOT EXISTS 'stale';
ALTER TYPE offer_status ADD VALUE IF NOT EXISTS 'withdrawn';
ALTER TYPE offer_status ADD VALUE IF NOT EXISTS 'superseded';

ALTER TABLE products ADD COLUMN IF NOT EXISTS canonical_domain varchar(255);
CREATE INDEX IF NOT EXISTS products_canonical_domain_idx ON products (canonical_domain);

CREATE TABLE IF NOT EXISTS sources (
  id serial PRIMARY KEY,
  name varchar(255) NOT NULL,
  type source_type NOT NULL,
  status source_status NOT NULL DEFAULT 'active',
  base_url varchar(500) NOT NULL,
  canonical_domain varchar(255),
  owner_name varchar(255),
  trust_score integer NOT NULL DEFAULT 50,
  allow_automated_sync boolean NOT NULL DEFAULT false,
  sync_interval_minutes integer,
  notes text,
  last_synced_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT sources_base_url_unique UNIQUE (base_url)
);
CREATE INDEX IF NOT EXISTS sources_status_idx ON sources (status);
CREATE INDEX IF NOT EXISTS sources_type_idx ON sources (type);

CREATE TABLE IF NOT EXISTS source_observations (
  id serial PRIMARY KEY,
  source_id integer NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
  external_id varchar(255),
  url varchar(500) NOT NULL,
  title varchar(500),
  excerpt text,
  content_hash varchar(64) NOT NULL,
  observed_at timestamptz NOT NULL DEFAULT now(),
  fetched_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  CONSTRAINT source_observations_source_hash_unique UNIQUE (source_id, content_hash)
);
CREATE INDEX IF NOT EXISTS source_observations_source_observed_idx ON source_observations (source_id, observed_at);

ALTER TABLE offers ADD COLUMN IF NOT EXISTS source_id integer REFERENCES sources(id) ON DELETE SET NULL;
ALTER TABLE offers ADD COLUMN IF NOT EXISTS verification_state offer_verification_state NOT NULL DEFAULT 'unverified';
ALTER TABLE offers ADD COLUMN IF NOT EXISTS canonical_claim_url varchar(500);
ALTER TABLE offers ADD COLUMN IF NOT EXISTS eligibility jsonb;
ALTER TABLE offers ADD COLUMN IF NOT EXISTS regions jsonb;
ALTER TABLE offers ADD COLUMN IF NOT EXISTS requires_card boolean;
ALTER TABLE offers ADD COLUMN IF NOT EXISTS auto_renews boolean;
ALTER TABLE offers ADD COLUMN IF NOT EXISTS renewal_price numeric(12,2);
ALTER TABLE offers ADD COLUMN IF NOT EXISTS renewal_currency varchar(3);
ALTER TABLE offers ADD COLUMN IF NOT EXISTS billing_cycle varchar(30);
ALTER TABLE offers ADD COLUMN IF NOT EXISTS cancellation_terms text;
ALTER TABLE offers ADD COLUMN IF NOT EXISTS trust_score integer NOT NULL DEFAULT 0;
ALTER TABLE offers ADD COLUMN IF NOT EXISTS last_verified_at timestamptz;
ALTER TABLE offers ADD COLUMN IF NOT EXISTS reverify_at timestamptz;
CREATE INDEX IF NOT EXISTS offers_source_id_idx ON offers (source_id);
CREATE INDEX IF NOT EXISTS offers_reverify_idx ON offers (reverify_at);

CREATE TABLE IF NOT EXISTS offer_evidence (
  id serial PRIMARY KEY,
  offer_id integer NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
  source_observation_id integer REFERENCES source_observations(id) ON DELETE SET NULL,
  type evidence_type NOT NULL,
  url varchar(500) NOT NULL,
  quote text NOT NULL,
  field_claims jsonb,
  observed_at timestamptz NOT NULL DEFAULT now(),
  is_primary boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS offer_evidence_offer_idx ON offer_evidence (offer_id);
CREATE INDEX IF NOT EXISTS offer_evidence_primary_idx ON offer_evidence (offer_id, is_primary);

CREATE TABLE IF NOT EXISTS offer_versions (
  id serial PRIMARY KEY,
  offer_id integer NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
  version integer NOT NULL,
  snapshot jsonb NOT NULL,
  change_summary text,
  created_by varchar(100) NOT NULL DEFAULT 'system',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT offer_versions_offer_version_unique UNIQUE (offer_id, version)
);
CREATE INDEX IF NOT EXISTS offer_versions_offer_created_idx ON offer_versions (offer_id, created_at);

CREATE TABLE IF NOT EXISTS verification_runs (
  id serial PRIMARY KEY,
  offer_id integer NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
  outcome verification_outcome NOT NULL,
  method varchar(100) NOT NULL,
  confidence integer NOT NULL DEFAULT 0,
  details text,
  model_version varchar(150),
  prompt_version varchar(100),
  cost_usd numeric(12,6),
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz
);
CREATE INDEX IF NOT EXISTS verification_runs_offer_started_idx ON verification_runs (offer_id, started_at);
CREATE INDEX IF NOT EXISTS verification_runs_outcome_idx ON verification_runs (outcome);

ALTER TABLE submissions ADD COLUMN IF NOT EXISTS source_url varchar(500);
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS submitter_relationship varchar(50);
CREATE INDEX IF NOT EXISTS submissions_source_url_idx ON submissions (source_url);

-- Existing records have no historical evidence. Keep them visible while they are
-- manually backfilled; do not misrepresent them as independently verified.
UPDATE offers
SET status = 'active'
WHERE status = 'active';
