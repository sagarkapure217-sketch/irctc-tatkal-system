-- Migration: 006_create_bookings_table.sql
-- Creates the bookings table to persist confirmed seat reservations.
-- Populated by the BullMQ booking worker after a successful Redis reservation.

CREATE TABLE IF NOT EXISTS bookings (
    id           BIGSERIAL    PRIMARY KEY,
    user_id      INTEGER      NOT NULL REFERENCES users(id),
    train_id     INTEGER      NOT NULL REFERENCES trains(id),
    journey_date DATE         NOT NULL,
    travel_class VARCHAR(10)  NOT NULL,
    status       VARCHAR(20)  NOT NULL DEFAULT 'PENDING',
    created_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Ensure a user cannot hold two bookings for the same slot
    CONSTRAINT uq_booking_user_train_date_class
        UNIQUE (user_id, train_id, journey_date, travel_class)
);

-- Index for looking up bookings by user (e.g. "my bookings" page)
CREATE INDEX IF NOT EXISTS idx_bookings_user_id
    ON bookings (user_id);

-- Index for looking up bookings by train + date (e.g. manifest)
CREATE INDEX IF NOT EXISTS idx_bookings_train_date
    ON bookings (train_id, journey_date);
