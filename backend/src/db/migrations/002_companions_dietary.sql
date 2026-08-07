-- Migration 002: Add companions and dietary_restrictions columns
-- These are optional fields for guest registration

BEGIN;

ALTER TABLE guests ADD COLUMN IF NOT EXISTS companions INTEGER NOT NULL DEFAULT 0;
ALTER TABLE guests ADD COLUMN IF NOT EXISTS dietary_restrictions VARCHAR(200) NOT NULL DEFAULT '';

COMMIT;
