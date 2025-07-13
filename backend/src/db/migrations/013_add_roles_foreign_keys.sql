-- Migration: Add foreign key constraints for roles system
-- Created: 2025-07-13
-- Purpose: Add foreign key relationships for the new roles system

-- Add foreign key constraints to user_roles table (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'fk_user_roles_user_id'
        AND table_name = 'user_roles'
    ) THEN
        ALTER TABLE user_roles
        ADD CONSTRAINT fk_user_roles_user_id
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'fk_user_roles_role_id'
        AND table_name = 'user_roles'
    ) THEN
        ALTER TABLE user_roles
        ADD CONSTRAINT fk_user_roles_role_id
        FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'fk_user_roles_restaurant_id'
        AND table_name = 'user_roles'
    ) THEN
        ALTER TABLE user_roles
        ADD CONSTRAINT fk_user_roles_restaurant_id
        FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'fk_user_roles_location_id'
        AND table_name = 'user_roles'
    ) THEN
        ALTER TABLE user_roles
        ADD CONSTRAINT fk_user_roles_location_id
        FOREIGN KEY (location_id) REFERENCES restaurant_locations(id) ON DELETE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'fk_user_roles_assigned_by'
        AND table_name = 'user_roles'
    ) THEN
        ALTER TABLE user_roles
        ADD CONSTRAINT fk_user_roles_assigned_by
        FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Note: Complex context validation will be handled by application logic
-- since PostgreSQL CHECK constraints don't support subqueries

-- Add constraint to ensure only one primary role per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_roles_one_primary
ON user_roles (user_id)
WHERE is_primary_role = TRUE AND is_active = TRUE;

-- Add constraint to ensure valid_until is after valid_from when both are set (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'chk_user_roles_valid_dates'
        AND table_name = 'user_roles'
    ) THEN
        ALTER TABLE user_roles
        ADD CONSTRAINT chk_user_roles_valid_dates
        CHECK (valid_until IS NULL OR valid_until > valid_from);
    END IF;
END $$;

-- Update existing user_location_assignments to reference user_roles
-- Add a user_role_id column to track which role assignment granted location access (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT column_name FROM information_schema.columns
        WHERE table_name = 'user_location_assignments'
        AND column_name = 'user_role_id'
    ) THEN
        ALTER TABLE user_location_assignments
        ADD COLUMN user_role_id UUID;
    END IF;
END $$;

-- Add foreign key for the new column (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'fk_user_location_assignments_user_role_id'
        AND table_name = 'user_location_assignments'
    ) THEN
        ALTER TABLE user_location_assignments
        ADD CONSTRAINT fk_user_location_assignments_user_role_id
        FOREIGN KEY (user_role_id) REFERENCES user_roles(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Create index for the new column
CREATE INDEX IF NOT EXISTS idx_user_location_assignments_user_role_id
ON user_location_assignments(user_role_id);

-- Add comment for the new column
COMMENT ON COLUMN user_location_assignments.user_role_id IS 'References the user_role that grants access to this location';
