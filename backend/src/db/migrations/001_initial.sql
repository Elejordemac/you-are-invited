-- Migration 001: Initial schema for baby shower guest registration
-- Creates guests and admins tables with all constraints and indexes

BEGIN;

-- Guests table
CREATE TABLE IF NOT EXISTS guests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  email VARCHAR(254) NOT NULL,
  rsvp_status VARCHAR(20) NOT NULL CHECK (rsvp_status IN ('Attending', 'Not Attending', 'Undecided')),
  approval_status VARCHAR(20) NOT NULL DEFAULT 'Pending' CHECK (approval_status IN ('Pending', 'Approved')),
  approval_email_sent BOOLEAN NOT NULL DEFAULT FALSE,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_email UNIQUE (LOWER(TRIM(email)))
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_guests_rsvp_status ON guests(rsvp_status);
CREATE INDEX IF NOT EXISTS idx_guests_approval_status ON guests(approval_status);
CREATE INDEX IF NOT EXISTS idx_guests_submitted_at ON guests(submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_guests_name_lower ON guests(LOWER(name));
CREATE INDEX IF NOT EXISTS idx_guests_email_lower ON guests(LOWER(email));

-- Admins table
CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(50) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL
);

COMMIT;
