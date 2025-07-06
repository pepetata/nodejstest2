-- Migration: Add foreign key constraints for users table
-- Created: 2025-07-06
-- Purpose: Add foreign key relationships after all tables are created

-- Add foreign key constraint from users to restaurants
ALTER TABLE users
ADD CONSTRAINT fk_users_restaurant_id
FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE;

-- Add foreign key constraint from users to users (created_by)
ALTER TABLE users
ADD CONSTRAINT fk_users_created_by
FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;

-- Add foreign key constraints for user_location_assignments
ALTER TABLE user_location_assignments
ADD CONSTRAINT fk_user_location_assignments_user_id
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE user_location_assignments
ADD CONSTRAINT fk_user_location_assignments_location_id
FOREIGN KEY (location_id) REFERENCES restaurant_locations(id) ON DELETE CASCADE;

ALTER TABLE user_location_assignments
ADD CONSTRAINT fk_user_location_assignments_assigned_by
FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL;

-- Add check constraints for role-based business logic
-- Restaurant administrators must have a restaurant_id and email
ALTER TABLE users
ADD CONSTRAINT chk_restaurant_admin_requirements
CHECK (
    role != 'restaurant_administrator' OR
    (restaurant_id IS NOT NULL AND email IS NOT NULL)
);

-- Location administrators must have an email
ALTER TABLE users
ADD CONSTRAINT chk_location_admin_requirements
CHECK (
    role != 'location_administrator' OR
    email IS NOT NULL
);

-- Non-admin roles must have a username if they don't have an email
ALTER TABLE users
ADD CONSTRAINT chk_username_or_email_required
CHECK (
    email IS NOT NULL OR username IS NOT NULL
);

-- Only one primary location per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_primary_location_unique
ON user_location_assignments(user_id)
WHERE is_primary_location = TRUE;
