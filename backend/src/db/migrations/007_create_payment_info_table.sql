-- Migration: Create payment_info table
-- Created: 2025-07-04
-- Note: In production, store only tokenized card data for security

CREATE TABLE IF NOT EXISTS payment_info (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  card_token VARCHAR(255), -- Store tokenized card data only
  cardholder_name VARCHAR(255),
  last_four_digits VARCHAR(4),
  card_type VARCHAR(50),
  expiry_month INTEGER,
  expiry_year INTEGER,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for payment_info table
CREATE INDEX IF NOT EXISTS idx_payment_restaurant_id ON payment_info(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_payment_active ON payment_info(restaurant_id, is_active);
