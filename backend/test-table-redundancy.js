// Test script to analyze table redundancy
// Run: node test-table-redundancy.js

// Set correct DB credentials
process.env.DB_USER = 'admin';
process.env.DB_PASSWORD = 'admin';
process.env.DB_NAME = 'alacarte_dev';

const db = require('./src/config/db');

async function analyzeTableRedundancy() {
  try {
    console.log('=== Analyzing Table Redundancy ===\n');

    // Check user_roles table structure and data
    console.log('=== user_roles table ===');
    const userRolesQuery = `
      SELECT
        ur.user_id,
        u.full_name,
        ur.role_id,
        r.display_name as role_name,
        ur.location_id,
        rl.name as location_name,
        ur.is_primary_role
      FROM user_roles ur
      JOIN users u ON ur.user_id = u.id
      JOIN roles r ON ur.role_id = r.id
      LEFT JOIN restaurant_locations rl ON ur.location_id = rl.id
      ORDER BY u.full_name, r.display_name
      LIMIT 10;
    `;

    const userRolesResult = await db.query(userRolesQuery);
    console.log('Sample user_roles data:');
    console.table(userRolesResult.rows);

    // Check user_location_assignments table structure and data
    console.log('\n=== user_location_assignments table ===');
    const userLocationQuery = `
      SELECT
        ula.user_id,
        u.full_name,
        ula.location_id,
        rl.name as location_name,
        ula.is_primary_location
      FROM user_location_assignments ula
      JOIN users u ON ula.user_id = u.id
      JOIN restaurant_locations rl ON ula.location_id = rl.id
      ORDER BY u.full_name, rl.name
      LIMIT 10;
    `;

    const userLocationResult = await db.query(userLocationQuery);
    console.log('Sample user_location_assignments data:');
    console.table(userLocationResult.rows);

    // Check for discrepancies between the two tables
    console.log('\n=== Checking for Discrepancies ===');
    const discrepancyQuery = `
      WITH user_role_locations AS (
        SELECT DISTINCT user_id, location_id
        FROM user_roles
        WHERE location_id IS NOT NULL
      ),
      user_location_assignments_data AS (
        SELECT DISTINCT user_id, location_id
        FROM user_location_assignments
      )
      SELECT
        'Only in user_roles' as source,
        COUNT(*) as count
      FROM user_role_locations url
      WHERE NOT EXISTS (
        SELECT 1 FROM user_location_assignments_data ula
        WHERE ula.user_id = url.user_id AND ula.location_id = url.location_id
      )
      UNION ALL
      SELECT
        'Only in user_location_assignments' as source,
        COUNT(*) as count
      FROM user_location_assignments_data ula
      WHERE NOT EXISTS (
        SELECT 1 FROM user_role_locations url
        WHERE url.user_id = ula.user_id AND url.location_id = ula.location_id
      );
    `;

    const discrepancyResult = await db.query(discrepancyQuery);
    console.log('Data discrepancies:');
    console.table(discrepancyResult.rows);

    // Count total records in each table
    const countsQuery = `
      SELECT
        'user_roles' as table_name,
        COUNT(*) as total_records
      FROM user_roles
      UNION ALL
      SELECT
        'user_location_assignments' as table_name,
        COUNT(*) as total_records
      FROM user_location_assignments;
    `;

    const countsResult = await db.query(countsQuery);
    console.log('\nTable record counts:');
    console.table(countsResult.rows);
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    process.exit(0);
  }
}

analyzeTableRedundancy();
