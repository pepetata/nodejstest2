-- Migration: Add foreign key constraints for users table
-- Created: 2025-07-06
-- Purpose: Add foreign key relationships after all tables are created

-- Add foreign key constraint from users to restaurants (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'fk_users_restaurant_id'
        AND table_name = 'users'
    ) THEN
        ALTER TABLE users
        ADD CONSTRAINT fk_users_restaurant_id
        FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Add foreign key constraint from users to users (created_by) (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'fk_users_created_by'
        AND table_name = 'users'
    ) THEN
        ALTER TABLE users
        ADD CONSTRAINT fk_users_created_by
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Add foreign key constraints for user_location_assignments (if not exists)
-- COMMENTED OUT: user_location_assignments table was eliminated
-- DO $$
-- BEGIN
--     IF NOT EXISTS (
--         SELECT 1 FROM information_schema.table_constraints
--         WHERE constraint_name = 'fk_user_location_assignments_user_id'
--         AND table_name = 'user_location_assignments'
--     ) THEN
--         ALTER TABLE user_location_assignments
--         ADD CONSTRAINT fk_user_location_assignments_user_id
--         FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
--     END IF;
-- END $$;

-- DO $$
-- BEGIN
--     IF NOT EXISTS (
--         SELECT 1 FROM information_schema.table_constraints
--         WHERE constraint_name = 'fk_user_location_assignments_location_id'
--         AND table_name = 'user_location_assignments'
--     ) THEN
--         ALTER TABLE user_location_assignments
--         ADD CONSTRAINT fk_user_location_assignments_location_id
--         FOREIGN KEY (location_id) REFERENCES restaurant_locations(id) ON DELETE CASCADE;
--     END IF;
-- END $$;

-- DO $$
-- BEGIN
--     IF NOT EXISTS (
--         SELECT 1 FROM information_schema.table_constraints
--         WHERE constraint_name = 'fk_user_location_assignments_assigned_by'
--         AND table_name = 'user_location_assignments'
--     ) THEN
--         ALTER TABLE user_location_assignments
--         ADD CONSTRAINT fk_user_location_assignments_assigned_by
--         FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL;
--     END IF;
-- END $$;

-- Note: Role-based constraints have been moved to the multiple roles system
-- Role business logic is now handled by the application layer with user_roles table

-- Basic constraint: Users must have either email or username
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'chk_username_or_email_required'
        AND table_name = 'users'
    ) THEN
        ALTER TABLE users
        ADD CONSTRAINT chk_username_or_email_required
        CHECK (email IS NOT NULL OR username IS NOT NULL);
    END IF;
END $$;

-- Only one primary location per user
-- COMMENTED OUT: user_location_assignments table was eliminated
-- CREATE UNIQUE INDEX IF NOT EXISTS idx_user_primary_location_unique
-- ON user_location_assignments(user_id)
-- WHERE is_primary_location = TRUE;
