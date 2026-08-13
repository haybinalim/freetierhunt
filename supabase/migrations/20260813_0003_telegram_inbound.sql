-- FreeTierHunt v2 authorized Telegram bot ingress (additive migration)
-- Stores webhook idempotency and structured official URLs only; raw messages are not persisted.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'telegram_inbound_status') THEN
    CREATE TYPE telegram_inbound_status AS ENUM ('received', 'accepted', 'ignored', 'rejected');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS telegram_inbound_updates (
  id serial PRIMARY KEY,
  update_id integer NOT NULL UNIQUE,
  chat_id varchar(32) NOT NULL,
  message_id integer NOT NULL,
  chat_title varchar(255),
  official_url varchar(500),
  submission_id integer REFERENCES submissions(id) ON DELETE SET NULL,
  status telegram_inbound_status NOT NULL DEFAULT 'received',
  reason varchar(500),
  received_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz
);

CREATE INDEX IF NOT EXISTS telegram_inbound_chat_received_idx
  ON telegram_inbound_updates (chat_id, received_at);
CREATE INDEX IF NOT EXISTS telegram_inbound_status_idx
  ON telegram_inbound_updates (status);
