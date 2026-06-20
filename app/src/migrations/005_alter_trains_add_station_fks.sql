-- Migration: 005_alter_trains_add_station_fks.sql
-- SAFE NO-OP — retained for migration order continuity only.
--
-- This migration originally:
--   1. Dropped the old free-text source_station / destination_station columns.
--   2. Added source_station_id / destination_station_id FK columns.
--
-- That work has been folded into 002_create_trains_table.sql which now
-- creates the trains table with the final normalized schema directly.
--
-- Running this file on a fresh database (where 002 already created the
-- normalized columns and the old text columns never existed) is a no-op:
--
--   DROP COLUMN IF EXISTS  — silently skips missing columns.
--   DROP INDEX IF EXISTS   — silently skips missing indexes.
--   ADD COLUMN IF NOT EXISTS — silently skips existing columns.
--   CREATE INDEX IF NOT EXISTS — silently skips existing indexes.
--
-- The file is kept in the sequence so that databases deployed before the
-- 002 refactor continue to migrate cleanly without renumbering.

-- Step 1: Drop old free-text columns if they still exist (legacy DBs only)
ALTER TABLE trains
    DROP COLUMN IF EXISTS source_station,
    DROP COLUMN IF EXISTS destination_station;

-- Step 2: Drop stale text-based indexes if they still exist (legacy DBs only)
DROP INDEX IF EXISTS idx_trains_source_station;
DROP INDEX IF EXISTS idx_trains_destination_station;

-- Step 3: Add FK columns if they are somehow absent (defensive guard)
ALTER TABLE trains
    ADD COLUMN IF NOT EXISTS source_station_id      BIGINT REFERENCES stations(id),
    ADD COLUMN IF NOT EXISTS destination_station_id BIGINT REFERENCES stations(id);

-- Step 4: Create FK indexes if not already present
CREATE INDEX IF NOT EXISTS idx_trains_source_station_id
    ON trains (source_station_id);

CREATE INDEX IF NOT EXISTS idx_trains_destination_station_id
    ON trains (destination_station_id);
