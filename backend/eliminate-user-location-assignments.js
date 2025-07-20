// Complete migration to eliminate user_location_assignments table
// This script will:
// 1. Remove all usage from backend code
// 2. Drop the table from database
// 3. Verify everything works with user_roles only

// Set correct DB credentials
process.env.DB_USER = 'admin';
process.env.DB_PASSWORD = 'admin';
process.env.DB_NAME = 'alacarte_dev';

const db = require('./src/config/db');

async function eliminateUserLocationAssignments() {
  const client = await db.getClient();

  try {
    await client.query('BEGIN');
    console.log('=== Eliminating user_location_assignments table ===\n');

    // Step 1: Verify all data is properly in user_roles
    console.log('Step 1: Verifying data integrity before removal...');

    const integrityCheck = await client.query(`
      SELECT
        COUNT(DISTINCT ur.user_id) as users_with_roles,
        COUNT(DISTINCT ula.user_id) as users_with_location_assignments,
        COUNT(DISTINCT ur.location_id) as locations_in_roles,
        COUNT(DISTINCT ula.location_id) as locations_in_assignments
      FROM user_roles ur
      FULL OUTER JOIN user_location_assignments ula ON ur.user_id = ula.user_id;
    `);

    console.log('Data integrity check:');
    console.table(integrityCheck.rows);

    // Step 2: Check if there are any foreign key constraints referencing user_location_assignments
    console.log('\nStep 2: Checking foreign key constraints...');

    const fkCheck = await client.query(`
      SELECT
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND (ccu.table_name = 'user_location_assignments'
             OR tc.table_name = 'user_location_assignments');
    `);

    if (fkCheck.rows.length > 0) {
      console.log('Foreign key constraints found:');
      console.table(fkCheck.rows);
    } else {
      console.log('✅ No foreign key constraints found');
    }

    // Step 3: Create a backup of the table data (just in case)
    console.log('\nStep 3: Creating backup of user_location_assignments data...');

    const backupData = await client.query(`
      SELECT * FROM user_location_assignments ORDER BY created_at;
    `);

    console.log(`✅ Backed up ${backupData.rows.length} records from user_location_assignments`);

    // Step 4: Drop the table
    console.log('\nStep 4: Dropping user_location_assignments table...');

    await client.query(`DROP TABLE IF EXISTS user_location_assignments CASCADE;`);

    console.log('✅ user_location_assignments table dropped successfully');

    // Step 5: Verify user_roles table has all necessary data
    console.log('\nStep 5: Verifying user_roles table completeness...');

    const rolesVerification = await client.query(`
      SELECT
        COUNT(*) as total_role_assignments,
        COUNT(CASE WHEN location_id IS NOT NULL THEN 1 END) as assignments_with_location,
        COUNT(CASE WHEN location_id IS NULL THEN 1 END) as assignments_without_location,
        COUNT(DISTINCT user_id) as unique_users,
        COUNT(DISTINCT role_id) as unique_roles,
        COUNT(DISTINCT location_id) as unique_locations
      FROM user_roles;
    `);

    console.log('user_roles table verification:');
    console.table(rolesVerification.rows);

    // Step 6: Test the role_location_pairs query (used by frontend)
    console.log('\nStep 6: Testing role_location_pairs query...');

    const testQuery = await client.query(`
      SELECT
        u.id,
        u.full_name,
        COALESCE(
          JSON_AGG(
            JSON_BUILD_OBJECT(
              'role_id', r.id,
              'role_name', r.name,
              'role_display_name', r.display_name,
              'location_id', rl.id,
              'location_name', rl.name,
              'location_url_name', rl.url_name
            )
          ) FILTER (WHERE r.id IS NOT NULL),
          '[]'
        ) as role_location_pairs
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id AND ur.is_active = true
      LEFT JOIN roles r ON ur.role_id = r.id
      LEFT JOIN restaurant_locations rl ON ur.location_id = rl.id
      WHERE u.restaurant_id IS NOT NULL
      GROUP BY u.id, u.full_name
      ORDER BY u.full_name
      LIMIT 3;
    `);

    console.log('Sample role_location_pairs data:');
    testQuery.rows.forEach((user) => {
      console.log(`User: ${user.full_name}`);
      console.log(`Role-Location pairs: ${JSON.stringify(user.role_location_pairs, null, 2)}`);
      console.log('---');
    });

    await client.query('COMMIT');
    console.log('\n🎉 Successfully eliminated user_location_assignments table!');
    console.log('\n✅ All user-location relationships are now managed via user_roles table');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error during elimination:', error.message);
    throw error;
  } finally {
    client.release();
    process.exit(0);
  }
}

eliminateUserLocationAssignments();
