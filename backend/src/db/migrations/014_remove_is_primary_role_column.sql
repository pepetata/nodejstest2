-- Migration to remove is_primary_role column from user_roles table
-- Created: 2025-07-22
-- Description: Removes the is_primary_role column as it's no longer needed.
--              Primary role is now determined by the highest role level.

BEGIN;

-- Drop any views that depend on is_primary_role column
DROP VIEW IF EXISTS user_with_primary_role CASCADE;

-- Remove the index on is_primary_role first
DROP INDEX IF EXISTS idx_user_roles_primary;

-- Remove the is_primary_role column with CASCADE to drop dependencies
ALTER TABLE user_roles DROP COLUMN IF EXISTS is_primary_role CASCADE;

-- Create a new index for better performance on role level queries
CREATE INDEX IF NOT EXISTS idx_user_roles_level_lookup
ON user_roles(user_id, is_active)
WHERE is_active = true;

-- Recreate the user_with_primary_role view using role level instead
CREATE OR REPLACE VIEW user_with_primary_role AS
SELECT DISTINCT ON (u.id)
    u.*,
    r.name as primary_role_name,
    r.display_name as primary_role_display,
    r.level as primary_role_level,
    r.is_admin_role as is_admin
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id AND ur.is_active = true
LEFT JOIN roles r ON ur.role_id = r.id
ORDER BY u.id, r.level DESC, ur.created_at ASC;

-- Add comment explaining the new approach
COMMENT ON TABLE user_roles IS 'User role assignments. Primary role is determined by highest role level (roles.level).';
COMMENT ON VIEW user_with_primary_role IS 'Users with their primary role (highest level role).';

COMMIT;
