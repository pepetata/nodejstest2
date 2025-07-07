-- Migration: Create restaurants table
-- Created: 2025-07-06
-- Updated: 2025-07-07 - Fixed constraints to match working test database
-- Purpose: Stores restaurant business information (separated from user management)

CREATE TABLE IF NOT EXISTS restaurants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Business Information
    restaurant_name VARCHAR(255) NOT NULL,
    restaurant_url_name VARCHAR(100) UNIQUE NOT NULL,
    business_type VARCHAR(50) DEFAULT 'single' CHECK (business_type IN ('single', 'chain', 'franchise')),
    cuisine_type VARCHAR(100),

    -- Contact Information
    phone VARCHAR(20),
    whatsapp VARCHAR(20),
    website VARCHAR(255),
    description TEXT,

    -- Business Status
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'inactive', 'suspended')),

    -- Subscription Information
    subscription_plan VARCHAR(50) DEFAULT 'starter' CHECK (subscription_plan IN ('starter', 'professional', 'premium', 'enterprise')),
    subscription_status VARCHAR(20) DEFAULT 'active' CHECK (subscription_status IN ('active', 'cancelled', 'expired', 'suspended')),
    subscription_expires_at TIMESTAMP,

    -- Legal and Compliance
    terms_accepted BOOLEAN DEFAULT FALSE,
    terms_accepted_at TIMESTAMP,
    marketing_consent BOOLEAN DEFAULT FALSE,

    -- Audit fields
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for restaurants table
CREATE INDEX IF NOT EXISTS idx_restaurants_url_name ON restaurants(restaurant_url_name);
CREATE INDEX IF NOT EXISTS idx_restaurants_status ON restaurants(status);
CREATE INDEX IF NOT EXISTS idx_restaurants_business_type ON restaurants(business_type);
CREATE INDEX IF NOT EXISTS idx_restaurants_subscription_plan ON restaurants(subscription_plan);
