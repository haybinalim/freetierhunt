-- FreeTierHunt v2 source health and fetch observability (additive migration)

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'source_health') THEN
    CREATE TYPE source_health AS ENUM ('healthy', 'degraded', 'paused', 'retired');
  END IF;
END $$;

ALTER TABLE sources
  ADD COLUMN IF NOT EXISTS health_status source_health NOT NULL DEFAULT 'healthy',
  ADD COLUMN IF NOT EXISTS consecutive_failures integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_fetch_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_successful_fetch_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_health_check_at timestamptz;

CREATE INDEX IF NOT EXISTS sources_health_idx ON sources (health_status);

CREATE TABLE IF NOT EXISTS source_fetch_runs (
  id serial PRIMARY KEY,
  source_id integer NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
  method varchar(20) NOT NULL DEFAULT 'GET',
  request_url varchar(500) NOT NULL,
  status varchar(20) NOT NULL,
  http_status integer,
  duration_ms integer,
  response_etag varchar(500),
  response_last_modified varchar(500),
  content_hash varchar(64),
  error_code varchar(100),
  error_message text,
  fetched_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS source_fetch_runs_source_fetched_idx
  ON source_fetch_runs (source_id, fetched_at);
CREATE INDEX IF NOT EXISTS source_fetch_runs_source_status_idx
  ON source_fetch_runs (source_id, status);
