-- Migration: Add phone fields to users table
-- Created: 2025-07-17
-- Purpose: Add phone and whatsapp fields for user contact information

ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS whatsapp VARCHAR(20);

-- Add indexes for phone fields
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone) WHERE phone IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_whatsapp ON users(whatsapp) WHERE whatsapp IS NOT NULL;

-- Add comments
COMMENT ON COLUMN users.phone IS 'User primary phone number';
COMMENT ON COLUMN users.whatsapp IS 'User WhatsApp number (can be different from phone)';
