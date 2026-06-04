-- ============================================================
--  001_audit_log_safe.sql
--  Bank Management System — Audit Log Migration
--
--  SAFE TO RUN MULTIPLE TIMES (fully idempotent):
--    • CREATE TABLE  ... IF NOT EXISTS
--    • ALTER TABLE   ... ADD COLUMN IF NOT EXISTS
--    • CREATE INDEX  ... IF NOT EXISTS
--    • CREATE OR REPLACE for functions/rules
-- ============================================================

BEGIN;

-- ──────────────────────────────────────────────────────────────
-- 1.  ENUM (create only if missing)
-- ──────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'audit_action') THEN
    CREATE TYPE "audit_action" AS ENUM (
      'LOGIN', 'LOGOUT', 'FAILED_LOGIN',
      'CREATE', 'UPDATE', 'DELETE',
      'TRANSACTION', 'LOAN_APPROVAL', 'CARD_BLOCK',
      'PASSWORD_CHANGE', 'REFUND_APPROVAL', 'ACCOUNT_FREEZE',
      'EXPORT', 'CONFIG_CHANGE'
    );
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'log_status') THEN
    CREATE TYPE "log_status" AS ENUM ('SUCCESS', 'FAILED');
  END IF;
END
$$;

-- ──────────────────────────────────────────────────────────────
-- 2.  TABLE  (create from scratch if missing)
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "audit_log" (
  "log_id"                SERIAL           PRIMARY KEY,
  "action_type"           "audit_action"   NOT NULL,
  "entity_type"           VARCHAR(100)     NOT NULL,
  "entity_id"             INTEGER,
  "performed_by_user_id"  INTEGER          REFERENCES "online_user"("user_id") ON DELETE SET NULL,
  "old_values"            JSONB,
  "new_values"            JSONB,
  "ip_address"            VARCHAR(45),
  "user_agent"            TEXT,
  "details"               TEXT,
  "is_suspicious"         BOOLEAN          NOT NULL DEFAULT FALSE,
  "status"                VARCHAR(10)      NOT NULL DEFAULT 'SUCCESS',
  "timestamp"             TIMESTAMPTZ      NOT NULL DEFAULT NOW()
);

-- ──────────────────────────────────────────────────────────────
-- 3.  ADD MISSING COLUMNS (safe — each uses IF NOT EXISTS)
-- ──────────────────────────────────────────────────────────────
ALTER TABLE "audit_log" ADD COLUMN IF NOT EXISTS "user_agent"    TEXT;
ALTER TABLE "audit_log" ADD COLUMN IF NOT EXISTS "details"       TEXT;
ALTER TABLE "audit_log" ADD COLUMN IF NOT EXISTS "old_values"    JSONB;
ALTER TABLE "audit_log" ADD COLUMN IF NOT EXISTS "new_values"    JSONB;
ALTER TABLE "audit_log" ADD COLUMN IF NOT EXISTS "ip_address"    VARCHAR(45);
ALTER TABLE "audit_log" ADD COLUMN IF NOT EXISTS "is_suspicious" BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE "audit_log" ADD COLUMN IF NOT EXISTS "status"        VARCHAR(10) NOT NULL DEFAULT 'SUCCESS';

-- Back-fill status for any rows that were inserted before this column existed
UPDATE "audit_log" SET "status" = 'SUCCESS' WHERE "status" IS NULL;

-- ──────────────────────────────────────────────────────────────
-- 4.  PERFORMANCE INDEXES  (each uses IF NOT EXISTS)
-- ──────────────────────────────────────────────────────────────

-- Query by actor (most common dashboard filter)
CREATE INDEX IF NOT EXISTS "idx_audit_log_user_id"
  ON "audit_log" ("performed_by_user_id");

-- Query by action type
CREATE INDEX IF NOT EXISTS "idx_audit_log_action_type"
  ON "audit_log" ("action_type");

-- Query by entity (e.g. show all events on a single account)
CREATE INDEX IF NOT EXISTS "idx_audit_log_entity"
  ON "audit_log" ("entity_type", "entity_id");

-- Most recent events first — used by every dashboard query
CREATE INDEX IF NOT EXISTS "idx_audit_log_timestamp_desc"
  ON "audit_log" ("timestamp" DESC);

-- Outcome filter
CREATE INDEX IF NOT EXISTS "idx_audit_log_status"
  ON "audit_log" ("status");

-- Partial index: suspicious-only flag (tiny index, blazing fast)
CREATE INDEX IF NOT EXISTS "idx_audit_log_suspicious"
  ON "audit_log" ("is_suspicious")
  WHERE "is_suspicious" = TRUE;

-- Composite: actor + time window (common admin query pattern)
CREATE INDEX IF NOT EXISTS "idx_audit_log_user_timestamp"
  ON "audit_log" ("performed_by_user_id", "timestamp" DESC);

-- Composite: action + time window
CREATE INDEX IF NOT EXISTS "idx_audit_log_action_timestamp"
  ON "audit_log" ("action_type", "timestamp" DESC);

-- Full-text search on details column (optional but useful for search box)
CREATE INDEX IF NOT EXISTS "idx_audit_log_details_fts"
  ON "audit_log" USING gin (to_tsvector('english', COALESCE("details", '')));

-- ──────────────────────────────────────────────────────────────
-- 5.  APPEND-ONLY PROTECTION
--     PostgreSQL rules silently block any UPDATE/DELETE attempts,
--     even by superuser, ensuring the audit trail is immutable.
--     Uses CREATE OR REPLACE so it is safe to run again.
-- ──────────────────────────────────────────────────────────────
CREATE OR REPLACE RULE "audit_log_no_update"
  AS ON UPDATE TO "audit_log"
  DO INSTEAD NOTHING;

CREATE OR REPLACE RULE "audit_log_no_delete"
  AS ON DELETE TO "audit_log"
  DO INSTEAD NOTHING;

-- ──────────────────────────────────────────────────────────────
-- 6.  COMMENT THE TABLE (documentation in DB itself)
-- ──────────────────────────────────────────────────────────────
COMMENT ON TABLE "audit_log" IS
  'Immutable system-wide audit trail. Append-only enforced at DB level via rules. '
  'Never log passwords, card numbers, or other PII. '
  'Managed by Bank Management System v1.0.';

COMMENT ON COLUMN "audit_log"."status"        IS 'SUCCESS or FAILED — outcome of the action';
COMMENT ON COLUMN "audit_log"."is_suspicious" IS 'TRUE = flagged for security review';
COMMENT ON COLUMN "audit_log"."old_values"    IS 'JSONB snapshot of entity state BEFORE the change';
COMMENT ON COLUMN "audit_log"."new_values"    IS 'JSONB snapshot of entity state AFTER the change (sensitive fields stripped)';

COMMIT;
