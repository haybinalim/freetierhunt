-- ============================================================================
-- Row Level Security (RLS) Policies — Hafta 2 Çarşamba
-- ============================================================================
-- Run this in Supabase Dashboard → SQL Editor → New query → Paste → Run
--
-- Strategy:
--   - Public read for active offers, products, votes (aggregated counts only)
--   - Authenticated users manage their own saved_offers, submissions
--   - Anonymous votes/reports allowed (no user_id required)
--   - Internal tables (llm_calls, firecrawl_usage, extraction_queue,
--     digest_log, feature_flags) → service_role only
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE "products" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "offers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "offer_events" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "offer_votes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "offer_reports" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "saved_offers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "submissions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "digest_log" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "llm_calls" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "firecrawl_usage" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "extraction_queue" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "feature_flags" ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PRODUCTS — public read, service_role write
-- ============================================================================
DROP POLICY IF EXISTS "products_public_read" ON "products";
CREATE POLICY "products_public_read" ON "products"
  FOR SELECT TO anon, authenticated USING (true);

-- ============================================================================
-- OFFERS — public read of active, service_role write
-- ============================================================================
DROP POLICY IF EXISTS "offers_public_read_active" ON "offers";
CREATE POLICY "offers_public_read_active" ON "offers"
  FOR SELECT TO anon, authenticated
  USING (status = 'active');

-- ============================================================================
-- OFFER_EVENTS — anyone can insert (telemetry), service_role reads
-- ============================================================================
DROP POLICY IF EXISTS "offer_events_anyone_insert" ON "offer_events";
CREATE POLICY "offer_events_anyone_insert" ON "offer_events"
  FOR INSERT TO anon, authenticated WITH CHECK (true);

-- ============================================================================
-- OFFER_VOTES — anonymous votes allowed (visitor_id), unique enforced
-- ============================================================================
DROP POLICY IF EXISTS "votes_public_read" ON "offer_votes";
CREATE POLICY "votes_public_read" ON "offer_votes"
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "votes_anyone_insert" ON "offer_votes";
CREATE POLICY "votes_anyone_insert" ON "offer_votes"
  FOR INSERT TO anon, authenticated WITH CHECK (true);

-- ============================================================================
-- OFFER_REPORTS — anyone can insert
-- ============================================================================
DROP POLICY IF EXISTS "reports_anyone_insert" ON "offer_reports";
CREATE POLICY "reports_anyone_insert" ON "offer_reports"
  FOR INSERT TO anon, authenticated WITH CHECK (true);

-- ============================================================================
-- USERS — user can read/update self only
-- ============================================================================
DROP POLICY IF EXISTS "users_self_read" ON "users";
CREATE POLICY "users_self_read" ON "users"
  FOR SELECT TO authenticated
  USING (id = (current_setting('request.jwt.claims', true)::jsonb->>'sub')::int);

DROP POLICY IF EXISTS "users_self_update" ON "users";
CREATE POLICY "users_self_update" ON "users"
  FOR UPDATE TO authenticated
  USING (id = (current_setting('request.jwt.claims', true)::jsonb->>'sub')::int);

-- ============================================================================
-- SAVED_OFFERS — user manages own
-- ============================================================================
DROP POLICY IF EXISTS "saved_self_all" ON "saved_offers";
CREATE POLICY "saved_self_all" ON "saved_offers"
  FOR ALL TO authenticated
  USING (user_id = (current_setting('request.jwt.claims', true)::jsonb->>'sub')::int)
  WITH CHECK (user_id = (current_setting('request.jwt.claims', true)::jsonb->>'sub')::int);

-- ============================================================================
-- SUBMISSIONS — user inserts/reads own; admin via service_role
-- ============================================================================
DROP POLICY IF EXISTS "submissions_self_read" ON "submissions";
CREATE POLICY "submissions_self_read" ON "submissions"
  FOR SELECT TO authenticated
  USING (user_id = (current_setting('request.jwt.claims', true)::jsonb->>'sub')::int);

DROP POLICY IF EXISTS "submissions_anyone_insert" ON "submissions";
CREATE POLICY "submissions_anyone_insert" ON "submissions"
  FOR INSERT TO anon, authenticated WITH CHECK (true);

-- ============================================================================
-- INTERNAL TABLES — service_role only (no policies = blocked for anon/auth)
-- ============================================================================
-- digest_log, llm_calls, firecrawl_usage, extraction_queue, feature_flags
-- intentionally have NO policies. RLS enabled + no policy = deny all
-- except service_role (bypasses RLS).
