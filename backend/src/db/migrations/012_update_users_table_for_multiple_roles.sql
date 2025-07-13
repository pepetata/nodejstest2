-- Migration: Update users table for multiple roles support
-- Created: 2025-07-13
-- Purpose: Remove single role column and prepare users table for multiple roles

-- First, let's preserve existing role data by creating user_roles entries
-- This should be done before dropping the role column

-- Create a temporary function to migrate existing roles
DO $$
DECLARE
    user_record RECORD;
    role_uuid UUID;
BEGIN
    -- Only proceed if the role column exists and user_roles table exists
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'role') AND
       EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_roles') THEN

        -- Migrate existing users with roles
        FOR user_record IN
            SELECT id, role, restaurant_id
            FROM users
            WHERE role IS NOT NULL
        LOOP
            -- Find the corresponding role in the roles table
            SELECT id INTO role_uuid FROM roles WHERE name = user_record.role;

            IF role_uuid IS NOT NULL THEN
                -- Insert into user_roles table
                INSERT INTO user_roles (
                    user_id,
                    role_id,
                    restaurant_id,
                    is_primary_role,
                    is_active,
                    assigned_by,
                    created_at
                ) VALUES (
                    user_record.id,
                    role_uuid,
                    user_record.restaurant_id,
                    TRUE, -- Set as primary role since it was the only role
                    TRUE,
                    user_record.id, -- Self-assigned for migration
                    CURRENT_TIMESTAMP
                ) ON CONFLICT (user_id, role_id, restaurant_id, location_id) DO NOTHING;
            END IF;
        END LOOP;

        RAISE NOTICE 'Successfully migrated existing user roles to user_roles table';
    END IF;
END $$;

-- Now remove the old role column from users table
ALTER TABLE users DROP COLUMN IF EXISTS role;

-- Remove the old role check constraint if it exists
-- (This might have already been removed when we dropped the column, but just to be safe)
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- Add a computed field to get primary role for backward compatibility
-- This will be used in queries to get the user's primary role
CREATE OR REPLACE VIEW user_with_primary_role AS
SELECT
    u.*,
    r.name as primary_role,
    r.display_name as primary_role_display,
    r.level as primary_role_level,
    r.is_admin_role as is_admin,
    ur.restaurant_id as primary_restaurant_id,
    ur.location_id as primary_location_id
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id AND ur.is_primary_role = TRUE AND ur.is_active = TRUE
LEFT JOIN roles r ON ur.role_id = r.id
WHERE u.status != 'deleted' OR u.status IS NULL;

-- Create a helper function to get all user roles
CREATE OR REPLACE FUNCTION get_user_roles(user_uuid UUID)
RETURNS TABLE(
    role_name VARCHAR(50),
    role_display_name VARCHAR(100),
    role_level INTEGER,
    is_admin_role BOOLEAN,
    restaurant_id UUID,
    location_id UUID,
    is_primary BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        r.name,
        r.display_name,
        r.level,
        r.is_admin_role,
        ur.restaurant_id,
        ur.location_id,
        ur.is_primary_role
    FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = user_uuid
      AND ur.is_active = TRUE
      AND (ur.valid_until IS NULL OR ur.valid_until > CURRENT_TIMESTAMP)
    ORDER BY ur.is_primary_role DESC, r.level DESC;
END;
$$ LANGUAGE plpgsql;

-- Create a helper function to check if user has a specific role
CREATE OR REPLACE FUNCTION user_has_role(user_uuid UUID, role_name_param VARCHAR(50))
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = user_uuid
          AND r.name = role_name_param
          AND ur.is_active = TRUE
          AND (ur.valid_until IS NULL OR ur.valid_until > CURRENT_TIMESTAMP)
    );
END;
$$ LANGUAGE plpgsql;

-- Create a helper function to check if user has admin access
CREATE OR REPLACE FUNCTION user_has_admin_access(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = user_uuid
          AND r.is_admin_role = TRUE
          AND ur.is_active = TRUE
          AND (ur.valid_until IS NULL OR ur.valid_until > CURRENT_TIMESTAMP)
    );
END;
$$ LANGUAGE plpgsql;

-- Add comments for the new functions
COMMENT ON FUNCTION get_user_roles(UUID) IS 'Returns all active roles for a user with context information';
COMMENT ON FUNCTION user_has_role(UUID, VARCHAR) IS 'Checks if a user has a specific role';
COMMENT ON FUNCTION user_has_admin_access(UUID) IS 'Checks if a user has any admin role';
COMMENT ON VIEW user_with_primary_role IS 'View that includes user data with their primary role information for backward compatibility';
