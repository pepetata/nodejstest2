// Migration script to fix data consistency issues
// Run: node fix-user-data-consistency.js

// Set correct DB credentials
process.env.DB_USER = 'admin';
process.env.DB_PASSWORD = 'admin';
process.env.DB_NAME = 'alacarte_dev';

const db = require('./src/config/db');

async function fixUserDataConsistency() {
  const client = await db.getClient();

  try {
    await client.query('BEGIN');
    console.log('Starting data consistency fixes...\n');

    // Fix 1: Convert empty strings to NULL for phone fields
    console.log('=== Fix 1: Clean phone fields ===');
    const phoneCleanup = await client.query(`
      UPDATE users
      SET
        phone = CASE WHEN phone = '' THEN NULL ELSE phone END,
        whatsapp = CASE WHEN whatsapp = '' THEN NULL ELSE whatsapp END
      WHERE phone = '' OR whatsapp = '';
    `);
    console.log(`Cleaned ${phoneCleanup.rowCount} user phone records`);

    // Fix 2: Add missing location_id to user_roles for users who have location assignments but NULL location_id
    console.log('\n=== Fix 2: Add missing location_id to user_roles ===');

    // First, let's see which users have roles with NULL location_id but have location assignments
    const missingLocationRoles = await client.query(`
      SELECT DISTINCT
        ur.id as user_role_id,
        ur.user_id,
        u.full_name,
        ur.role_id,
        r.display_name as role_name,
        ula.location_id,
        rl.name as location_name,
        ula.is_primary_location
      FROM user_roles ur
      JOIN users u ON ur.user_id = u.id
      JOIN roles r ON ur.role_id = r.id
      JOIN user_location_assignments ula ON ur.user_id = ula.user_id
      JOIN restaurant_locations rl ON ula.location_id = rl.id
      WHERE ur.location_id IS NULL
      ORDER BY u.full_name, r.display_name, ula.is_primary_location DESC;
    `);

    console.log('Users with roles missing location_id:');
    console.table(missingLocationRoles.rows);

    if (missingLocationRoles.rows.length > 0) {
      // For each user with missing location in roles, we need to create proper role-location assignments
      // We'll update existing records or create new ones as needed

      for (const row of missingLocationRoles.rows) {
        // Update the user_role record to include the location_id
        const updateResult = await client.query(
          `
          UPDATE user_roles
          SET location_id = $1
          WHERE id = $2
        `,
          [row.location_id, row.user_role_id]
        );

        console.log(
          `Updated user_role ${row.user_role_id} for ${row.full_name} - ${row.role_name} at ${row.location_name}`
        );
      }
    }

    // Fix 3: Verify data consistency after fixes
    console.log('\n=== Fix 3: Verify consistency after fixes ===');
    const consistencyCheck = await client.query(`
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
    `);

    console.log('Data consistency after fixes:');
    console.table(consistencyCheck.rows);

    await client.query('COMMIT');
    console.log('\n✅ All fixes applied successfully!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error during migration:', error.message);
    throw error;
  } finally {
    client.release();
    process.exit(0);
  }
}

fixUserDataConsistency();
