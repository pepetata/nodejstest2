-- Migration: Create restaurant_locations table
-- Created: 2025-07-04

CREATE TABLE IF NOT EXISTS restaurant_locations (
  id SERIAL PRIMARY KEY,
  restaurant_id INTEGER NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  url_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  whatsapp VARCHAR(20),
  address_zip_code VARCHAR(10),
  address_street VARCHAR(255),
  address_street_number VARCHAR(10),
  address_complement VARCHAR(255),
  address_city VARCHAR(100),
  address_state VARCHAR(50),
  operating_hours JSONB,
  selected_features TEXT[],
  is_primary BOOLEAN DEFAULT FALSE,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(restaurant_id, url_name)
);

-- Create indexes for restaurant_locations table
CREATE INDEX IF NOT EXISTS idx_locations_restaurant_id ON restaurant_locations(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_locations_url_name ON restaurant_locations(url_name);
CREATE INDEX IF NOT EXISTS idx_locations_primary ON restaurant_locations(restaurant_id, is_primary);
