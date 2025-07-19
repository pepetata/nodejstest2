const { pool } = require('./src/config/db');

async function checkUserRoleLocationData() {
  try {
    // Get the user data first
    const userQuery = 'SELECT id, full_name, username FROM users WHERE username = $1';
    const userResult = await pool.query(userQuery, ['carla']);

    if (userResult.rows.length === 0) {
      console.log('❌ User not found');
      return;
    }

    const user = userResult.rows[0];
    console.log('👤 User found:', user);

    // Get role-location pairs for this user using the corrected query
    const pairsQuery = `
      SELECT DISTINCT
        ur.role_id,
        ur.location_id,
        r.name as role_name,
        r.display_name as role_display_name,
        rl.name as location_name
      FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      LEFT JOIN restaurant_locations rl ON ur.location_id = rl.id
      WHERE ur.user_id = $1 AND ur.is_active = true
      ORDER BY r.name, rl.name
    `;

    const pairsResult = await pool.query(pairsQuery, [user.id]);

    console.log('\n📊 Role-Location Pairs in Database:');
    console.log('Total pairs found:', pairsResult.rows.length);

    if (pairsResult.rows.length === 0) {
      console.log('⚠️  No role-location pairs found for this user');
      console.log('Let me check what roles exist for this user in user_roles table...');

      const userRolesQuery = 'SELECT * FROM user_roles WHERE user_id = $1';
      const userRolesResult = await pool.query(userRolesQuery, [user.id]);
      console.log('Raw user_roles entries:', userRolesResult.rows);
    } else {
      pairsResult.rows.forEach((pair, index) => {
        console.log(`\n${index + 1}. Role: ${pair.role_display_name} (${pair.role_name})`);
        console.log(`   Location: ${pair.location_name || 'NULL'}`);
        console.log(`   IDs: role_id=${pair.role_id}, location_id=${pair.location_id}`);
      });
    }
  } catch (error) {
    console.error('❌ Database error:', error.message);
  } finally {
    await pool.end();
  }
}

checkUserRoleLocationData();
