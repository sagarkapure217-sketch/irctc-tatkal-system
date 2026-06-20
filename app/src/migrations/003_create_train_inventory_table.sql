-- Migration: 003_create_train_inventory_table.sql
-- Creates the train_inventory table to track seat availability
-- per train, journey date, and travel class.

CREATE TABLE IF NOT EXISTS train_inventory (
    id               SERIAL PRIMARY KEY,
    train_id         INTEGER      NOT NULL REFERENCES trains(id) ON DELETE CASCADE,
    journey_date     DATE         NOT NULL,
    travel_class     VARCHAR(10)  NOT NULL,   -- e.g. 'Sleeper', 'AC3', 'AC2', 'AC1'
    total_seats      INTEGER      NOT NULL,
    available_seats  INTEGER      NOT NULL,
    created_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Each (train, date, class) combination must be unique
    CONSTRAINT uq_inventory_train_date_class
        UNIQUE (train_id, journey_date, travel_class),

    -- available_seats cannot exceed total_seats
    CONSTRAINT chk_available_lte_total
        CHECK (available_seats <= total_seats),

    -- available_seats cannot be negative
    CONSTRAINT chk_available_non_negative
        CHECK (available_seats >= 0),

    -- total_seats must be positive
    CONSTRAINT chk_total_positive
        CHECK (total_seats > 0)
);

-- Composite index for the primary read pattern:
-- "given a train, date, and class — how many seats are free?"
CREATE INDEX IF NOT EXISTS idx_inventory_train_date_class
    ON train_inventory (train_id, journey_date, travel_class);

-- Auto-update updated_at on row changes
-- Auto-drop and recreate trigger so this migration is safely re-runnable
DROP TRIGGER IF EXISTS set_train_inventory_updated_at ON train_inventory;

CREATE TRIGGER set_train_inventory_updated_at
    BEFORE UPDATE ON train_inventory
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
