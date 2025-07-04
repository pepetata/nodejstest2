-- Migration: Create billing_addresses table
-- Created: 2025-07-04

CREATE TABLE IF NOT EXISTS billing_addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  zip_code VARCHAR(10),
  street VARCHAR(255),
  street_number VARCHAR(10),
  complement VARCHAR(255),
  city VARCHAR(100),
  state VARCHAR(50),
  same_as_restaurant BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for billing_addresses table
CREATE INDEX IF NOT EXISTS idx_billing_restaurant_id ON billing_addresses(restaurant_id);
