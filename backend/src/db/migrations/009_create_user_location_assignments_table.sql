-- Migration: Create user_location_assignments table
-- Created: 2025-07-06
-- Purpose: Manages which users can access which restaurant locations

CREATE TABLE IF NOT EXISTS user_location_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL, -- References users(id)
    location_id UUID NOT NULL, -- References restaurant_locations(id)

    -- Assignment details
    is_primary_location BOOLEAN DEFAULT FALSE, -- User's main/default location
    assigned_by UUID, -- References users(id) - who made this assignment

    -- KDS-specific assignments (for KDS operators)
    kds_stations TEXT[], -- Array of KDS station names/IDs this user can access

    -- Audit fields
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    UNIQUE(user_id, location_id) -- User can only be assigned to a location once
);

-- Create indexes for user_location_assignments table
CREATE INDEX IF NOT EXISTS idx_user_location_assignments_user_id ON user_location_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_user_location_assignments_location_id ON user_location_assignments(location_id);
CREATE INDEX IF NOT EXISTS idx_user_location_assignments_primary ON user_location_assignments(user_id, is_primary_location);

-- Add comments for documentation
COMMENT ON TABLE user_location_assignments IS 'Manages user access to specific restaurant locations';
COMMENT ON COLUMN user_location_assignments.is_primary_location IS 'Indicates the users main working location';
COMMENT ON COLUMN user_location_assignments.kds_stations IS 'Array of KDS station identifiers for KDS operators';
