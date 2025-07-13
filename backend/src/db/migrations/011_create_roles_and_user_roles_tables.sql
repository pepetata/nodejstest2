-- Migration: Create roles and user_roles tables for multiple role support
-- Created: 2025-07-13
-- Purpose: Implement many-to-many relationship between users and roles

-- Create roles table
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,

    -- Role hierarchy and permissions
    level INTEGER NOT NULL DEFAULT 1, -- Higher level = more permissions (1=basic, 5=admin)
    is_admin_role BOOLEAN DEFAULT FALSE, -- Can access admin panels
    can_manage_users BOOLEAN DEFAULT FALSE, -- Can create/edit other users
    can_manage_locations BOOLEAN DEFAULT FALSE, -- Can manage multiple locations

    -- Scope of role
    scope VARCHAR(20) DEFAULT 'location' CHECK (scope IN ('system', 'restaurant', 'location')),

    -- Status
    is_active BOOLEAN DEFAULT TRUE,

    -- Audit fields
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default roles (only if they don't exist)
INSERT INTO roles (name, display_name, description, level, is_admin_role, can_manage_users, can_manage_locations, scope) VALUES
('superadmin', 'Super Administrator', 'Full system access for a la carte platform management', 5, TRUE, TRUE, TRUE, 'system'),
('restaurant_administrator', 'Restaurant Administrator', 'Full restaurant management access across all locations', 4, TRUE, TRUE, TRUE, 'restaurant'),
('location_administrator', 'Location Administrator', 'Management access for multiple specific locations', 3, TRUE, TRUE, TRUE, 'location'),
('waiter', 'Waiter', 'Service staff for taking orders and serving customers', 2, FALSE, FALSE, FALSE, 'location'),
('food_runner', 'Food Runner', 'Staff responsible for delivering food to customers', 2, FALSE, FALSE, FALSE, 'location'),
('kds_operator', 'Kitchen Display Operator', 'Kitchen staff managing food preparation workflow', 2, FALSE, FALSE, FALSE, 'location'),
('pos_operator', 'POS Operator', 'Staff operating point-of-sale systems', 2, FALSE, FALSE, FALSE, 'location')
ON CONFLICT (name) DO NOTHING;

-- Create user_roles junction table
CREATE TABLE IF NOT EXISTS user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL, -- References users(id)
    role_id UUID NOT NULL, -- References roles(id)

    -- Role assignment context
    restaurant_id UUID, -- References restaurants(id) - for restaurant-scoped roles
    location_id UUID, -- References restaurant_locations(id) - for location-scoped roles

    -- Assignment details
    assigned_by UUID, -- References users(id) - who assigned this role
    is_primary_role BOOLEAN DEFAULT FALSE, -- User's main role for UI purposes

    -- Role-specific configurations
    permissions_override JSONB, -- Custom permissions for this role assignment

    -- Status and validity
    is_active BOOLEAN DEFAULT TRUE,
    valid_from TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    valid_until TIMESTAMP, -- Optional expiration date

    -- Audit fields
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    UNIQUE(user_id, role_id, restaurant_id, location_id) -- Prevent duplicate role assignments
);

-- Create indexes for roles table
CREATE INDEX IF NOT EXISTS idx_roles_name ON roles(name);
CREATE INDEX IF NOT EXISTS idx_roles_level ON roles(level);
CREATE INDEX IF NOT EXISTS idx_roles_scope ON roles(scope);
CREATE INDEX IF NOT EXISTS idx_roles_admin ON roles(is_admin_role);

-- Create indexes for user_roles table
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON user_roles(role_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_restaurant_id ON user_roles(restaurant_id) WHERE restaurant_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_user_roles_location_id ON user_roles(location_id) WHERE location_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_user_roles_active ON user_roles(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_user_roles_primary ON user_roles(user_id, is_primary_role);

-- Add comments for documentation
COMMENT ON TABLE roles IS 'Defines available user roles with their permissions and hierarchy';
COMMENT ON TABLE user_roles IS 'Many-to-many relationship between users and roles with context';
COMMENT ON COLUMN user_roles.restaurant_id IS 'Restaurant context for restaurant-scoped roles';
COMMENT ON COLUMN user_roles.location_id IS 'Location context for location-scoped roles';
COMMENT ON COLUMN user_roles.is_primary_role IS 'Primary role used for UI display and default permissions';
COMMENT ON COLUMN user_roles.permissions_override IS 'JSON object with custom permission overrides for this assignment';
