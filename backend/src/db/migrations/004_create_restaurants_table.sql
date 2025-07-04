-- Migration: Create restaurants table
-- Created: 2025-07-04

CREATE TABLE IF NOT EXISTS restaurants (
  id SERIAL PRIMARY KEY,
  owner_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  email_confirmed BOOLEAN DEFAULT FALSE,
  email_confirmation_token VARCHAR(255),
  email_confirmation_expires TIMESTAMP,
  password VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  whatsapp VARCHAR(20),
  restaurant_name VARCHAR(255) NOT NULL,
  restaurant_url_name VARCHAR(100) UNIQUE NOT NULL,
  business_type VARCHAR(20) CHECK (business_type IN ('single', 'multi-location')) DEFAULT 'single',
  cuisine_type VARCHAR(100),
  website VARCHAR(255),
  description TEXT,
  subscription_plan VARCHAR(50) DEFAULT 'starter',
  marketing_consent BOOLEAN DEFAULT FALSE,
  terms_accepted BOOLEAN DEFAULT FALSE,
  terms_accepted_at TIMESTAMP,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended', 'inactive')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for restaurants table
CREATE INDEX IF NOT EXISTS idx_restaurants_email ON restaurants(email);
CREATE INDEX IF NOT EXISTS idx_restaurants_url_name ON restaurants(restaurant_url_name);
CREATE INDEX IF NOT EXISTS idx_restaurants_status ON restaurants(status);
CREATE INDEX IF NOT EXISTS idx_restaurants_email_confirmation ON restaurants(email_confirmation_token);
