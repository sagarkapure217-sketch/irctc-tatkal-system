-- Migration: 004_create_stations_table.sql
-- Creates a normalised stations table so train source/destination
-- are stored as foreign keys rather than free-text strings.
-- This eliminates spelling inconsistencies and makes station-based
-- lookups fast and unambiguous.

CREATE TABLE IF NOT EXISTS stations (
    id           BIGSERIAL    PRIMARY KEY,
    station_code VARCHAR(10)  NOT NULL UNIQUE,   -- e.g. 'NDLS', 'HWH'
    station_name VARCHAR(150) NOT NULL,           -- e.g. 'New Delhi'
    city         VARCHAR(100) NOT NULL,
    state        VARCHAR(100),                    -- nullable — some terminals span zones
    created_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Unique index on station_code (also enforced by UNIQUE constraint above,
-- but the explicit index is named for clarity in query plans)
CREATE UNIQUE INDEX IF NOT EXISTS idx_stations_station_code
    ON stations (station_code);

-- Index on city for future city-level search
CREATE INDEX IF NOT EXISTS idx_stations_city
    ON stations (city);

-- Auto-update updated_at on row changes
-- Auto-drop and recreate trigger so this migration is safely re-runnable
DROP TRIGGER IF EXISTS set_stations_updated_at ON stations;

CREATE TRIGGER set_stations_updated_at
    BEFORE UPDATE ON stations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
