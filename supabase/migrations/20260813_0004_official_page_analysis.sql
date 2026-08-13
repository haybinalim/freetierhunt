-- FreeTierHunt v2 official-page AI analysis (additive migration)
-- Analysis accepts only official provider page text; no Telegram message body is persisted.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'official_analysis_status') THEN
    CREATE TYPE official_analysis_status AS ENUM ('pending', 'succeeded', 'needs_review', 'failed');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS official_page_analyses (
  id serial PRIMARY KEY,
  submission_id integer NOT NULL UNIQUE REFERENCES submissions(id) ON DELETE CASCADE,
  source_observation_id integer REFERENCES source_observations(id) ON DELETE SET NULL,
  status official_analysis_status NOT NULL DEFAULT 'pending',
  category varchar(100),
  offer_type offer_type,
  confidence integer,
  official_url varchar(500) NOT NULL,
  evidence_quote text,
  structured_claims jsonb,
  review_reason text,
  model varchar(150),
  prompt_version varchar(100),
  input_hash varchar(64),
  cost_usd numeric(12,6),
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

CREATE INDEX IF NOT EXISTS official_page_analyses_status_idx
  ON official_page_analyses (status);
CREATE INDEX IF NOT EXISTS official_page_analyses_source_observation_idx
  ON official_page_analyses (source_observation_id);
