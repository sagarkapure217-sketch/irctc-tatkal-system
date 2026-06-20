-- Migration: 002_create_trains_table.sql
-- Creates the trains table to store train master data.

CREATE TABLE IF NOT EXISTS trains (
    id               SERIAL PRIMARY KEY,
    train_number     VARCHAR(10)  NOT NULL UNIQUE,
    train_name       VARCHAR(150) NOT NULL,
    source_station   VARCHAR(100) NOT NULL,
    destination_station VARCHAR(100) NOT NULL,
    created_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Fast lookup by train number (login / detail views)
CREATE INDEX IF NOT EXISTS idx_trains_train_number
    ON trains (train_number);

-- Searches by source and destination (search endpoint)
CREATE INDEX IF NOT EXISTS idx_trains_source_station
    ON trains (source_station);

CREATE INDEX IF NOT EXISTS idx_trains_destination_station
    ON trains (destination_station);

-- Auto-update updated_at on row changes
CREATE TRIGGER set_trains_updated_at
    BEFORE UPDATE ON trains
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
