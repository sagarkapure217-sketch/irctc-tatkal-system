-- Migration: 001_create_users_table.sql
-- Creates the users table for authentication.
-- Run this migration once during initial setup.

CREATE TABLE IF NOT EXISTS users (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(100)        NOT NULL,
    email       VARCHAR(255)        NOT NULL UNIQUE,
    password_hash TEXT              NOT NULL,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index on email for fast lookup during login and duplicate checks
CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);

-- Trigger to automatically update updated_at on row modification
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
