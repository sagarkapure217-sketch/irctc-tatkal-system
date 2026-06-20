-- Migration: 002_create_trains_table.sql
-- Creates the trains table using the FINAL normalized schema.
--
-- source_station_id and destination_station_id are foreign keys into
-- the stations table (created in 004_create_stations_table.sql).
--
-- NOTE: The old schema had free-text source_station / destination_station
-- columns which were later removed by 005. Those columns are intentionally
-- absent here so the migration chain is clean on a fresh deployment.

CREATE TABLE IF NOT EXISTS trains (
    id                    SERIAL  PRIMARY KEY,
    train_number          VARCHAR(10)  NOT NULL UNIQUE,
    train_name            VARCHAR(150) NOT NULL,
    source_station_id      BIGINT       REFERENCES stations(id),
    destination_station_id BIGINT       REFERENCES stations(id),
    created_at            TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at            TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Fast lookup by train number
CREATE INDEX IF NOT EXISTS idx_trains_train_number
    ON trains (train_number);

-- FK-backed indexes for join / search performance
CREATE INDEX IF NOT EXISTS idx_trains_source_station_id
    ON trains (source_station_id);

CREATE INDEX IF NOT EXISTS idx_trains_destination_station_id
    ON trains (destination_station_id);

-- Auto-drop and recreate trigger so this migration is safely re-runnable
DROP TRIGGER IF EXISTS set_trains_updated_at ON trains;

CREATE TRIGGER set_trains_updated_at
    BEFORE UPDATE ON trains
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
