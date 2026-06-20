-- Migration: 005_alter_trains_add_station_fks.sql
-- Refactors the trains table to replace the free-text
-- source_station / destination_station columns with proper
-- foreign keys referencing the stations table.
--
-- Run AFTER 004_create_stations_table.sql and AFTER stations are seeded.

-- Step 1: Drop the old free-text station string columns
ALTER TABLE trains
    DROP COLUMN IF EXISTS source_station,
    DROP COLUMN IF EXISTS destination_station;

-- Step 2: Drop the now-stale text-based indexes
DROP INDEX IF EXISTS idx_trains_source_station;
DROP INDEX IF EXISTS idx_trains_destination_station;

-- Step 3: Add normalised foreign key columns
ALTER TABLE trains
    ADD COLUMN source_station_id      BIGINT NOT NULL REFERENCES stations(id),
    ADD COLUMN destination_station_id BIGINT NOT NULL REFERENCES stations(id);

-- Step 4: Create FK-backed indexes for join and search performance
CREATE INDEX IF NOT EXISTS idx_trains_source_station_id
    ON trains (source_station_id);

CREATE INDEX IF NOT EXISTS idx_trains_destination_station_id
    ON trains (destination_station_id);
