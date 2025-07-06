-- Migration: Create users table
-- Created: 2025-07-02
-- Updated: 2025-07-06 - Enhanced for restaurant management roles

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE, -- Optional for non-admin roles
    username VARCHAR(100) UNIQUE, -- For roles that don't require email
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,

    -- Role management
    role VARCHAR(50) NOT NULL CHECK (role IN (
        'restaurant_administrator',
        'location_administrator',
        'waiter',
        'food_runner',
        'kds_operator',
        'pos_operator'
    )),

    -- Restaurant association (for restaurant_administrator role)
    restaurant_id UUID, -- References restaurants(id), will be added after restaurants table creation

    -- Status and confirmation
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'inactive', 'suspended')),
    email_confirmed BOOLEAN DEFAULT FALSE,
    email_confirmation_token VARCHAR(255),
    email_confirmation_expires TIMESTAMP,

    -- Password management
    first_login_password_change BOOLEAN DEFAULT TRUE, -- Forces password change on first login
    password_changed_at TIMESTAMP,
    password_reset_token VARCHAR(255),
    password_reset_expires TIMESTAMP,

    -- Audit fields
    created_by UUID, -- References users(id) - who created this user
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP
);

-- Create indexes for users table
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username) WHERE username IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_restaurant_id ON users(restaurant_id) WHERE restaurant_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_email_token ON users(email_confirmation_token) WHERE email_confirmation_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_password_reset_token ON users(password_reset_token) WHERE password_reset_token IS NOT NULL;
