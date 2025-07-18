-- Quick SQL test to verify sorting and location filter work at database level
-- This assumes the database is running and accessible

-- Test 1: Basic user query with sorting
SELECT
  u.id,
  u.full_name,
  u.email,
  u.status,
  r.restaurant_name
FROM users u
LEFT JOIN restaurants r ON u.restaurant_id = r.id
WHERE u.restaurant_id = 1
ORDER BY u.email DESC
LIMIT 5;

-- Test 2: Location filter query
SELECT DISTINCT
  u.id,
  u.full_name,
  u.email,
  u.status
FROM users u
LEFT JOIN restaurants r ON u.restaurant_id = r.id
WHERE u.restaurant_id = 1
  AND EXISTS (
    SELECT 1 FROM user_location_assignments ula
    WHERE ula.user_id = u.id AND ula.location_id = 1
  )
ORDER BY u.full_name ASC
LIMIT 5;

-- Test 3: Check if user_location_assignments has data
SELECT
  ula.user_id,
  ula.location_id,
  u.full_name,
  rl.name as location_name
FROM user_location_assignments ula
JOIN users u ON ula.user_id = u.id
JOIN restaurant_locations rl ON ula.location_id = rl.id
WHERE u.restaurant_id = 1
LIMIT 10;
