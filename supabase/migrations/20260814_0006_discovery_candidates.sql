-- FreeTierHunt proactive discovery candidates (additive migration)
-- Automatically discovered candidates are never published offers by default.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'discovery_candidate_status') THEN
    CREATE TYPE discovery_candidate_status AS ENUM ('pending', 'accepted', 'dismissed', 'superseded');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS discovery_candidates (
  id serial PRIMARY KEY,
  source_id integer NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
  source_observation_id integer REFERENCES source_observations(id) ON DELETE SET NULL,
  fingerprint varchar(64) NOT NULL UNIQUE,
  official_url varchar(500) NOT NULL,
  headline varchar(255) NOT NULL,
  offer_type offer_type,
  value varchar(100),
  evidence_quote text NOT NULL,
  structured_claims jsonb,
  discovery_method varchar(100) NOT NULL,
  priority integer NOT NULL DEFAULT 0,
  status discovery_candidate_status NOT NULL DEFAULT 'pending',
  review_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS discovery_candidates_source_status_idx
  ON discovery_candidates (source_id, status);
CREATE INDEX IF NOT EXISTS discovery_candidates_observation_idx
  ON discovery_candidates (source_observation_id);
CREATE INDEX IF NOT EXISTS discovery_candidates_priority_idx
  ON discovery_candidates (status, priority DESC);

-- A candidate must be explicitly accepted and independently verified before an
-- offer is created. Do not store social-message bodies in this table.
