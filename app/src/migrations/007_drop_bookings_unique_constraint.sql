-- Migration: 007_drop_bookings_unique_constraint.sql
--
-- Drops the unique constraint on (user_id, train_id, journey_date, travel_class)
-- from the bookings table.
--
-- Rationale:
--   Duplicate-request prevention is handled at the application layer by
--   idempotency keys stored in Redis (idempotency:{Idempotency-Key}, TTL 24h).
--   A client that retries an identical HTTP request receives the original cached
--   response; the BullMQ worker is never invoked a second time for the same
--   Idempotency-Key, so no duplicate row is ever attempted.
--
--   A database-level uniqueness constraint here would also incorrectly block
--   legitimate multi-seat bookings (e.g., a user booking for family members on
--   the same train and date), which is a valid business use case.
--
--   The two supporting indexes (idx_bookings_user_id, idx_bookings_train_date)
--   are retained for query performance.

ALTER TABLE bookings
    DROP CONSTRAINT IF EXISTS uq_booking_user_train_date_class;
