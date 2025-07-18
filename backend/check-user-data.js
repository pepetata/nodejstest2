const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'alacarte_dev',
  password: 'admin',
  port: 5432,
});

async function checkUser() {
  try {
    const userId = 'be833b40-af07-4f51-8be0-761eb7c0e64d';

    // Get user basic info
    const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
    console.log('User data:', userResult.rows[0]);

    // Get user's role-location pairs
    const roleLocationResult = await pool.query(
      `
      SELECT
        ula.user_id,
        ur.role_id,
        ula.location_id,
        r.name as role_name,
        rl.name as location_name
      FROM user_location_assignments ula
      JOIN user_roles ur ON ula.user_id = ur.user_id
      JOIN roles r ON ur.role_id = r.id
      JOIN restaurant_locations rl ON ula.location_id = rl.id
      WHERE ula.user_id = $1
      ORDER BY r.name, rl.name
    `,
      [userId]
    );

    console.log('Role-location pairs:', roleLocationResult.rows);

    // Let's also check user_roles table separately
    const userRolesResult = await pool.query(
      `
      SELECT ur.*, r.name as role_name
      FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = $1
    `,
      [userId]
    );

    console.log('User roles:', userRolesResult.rows);

    // And user_location_assignments separately
    const userLocationsResult = await pool.query(
      `
      SELECT ula.*, rl.name as location_name
      FROM user_location_assignments ula
      JOIN restaurant_locations rl ON ula.location_id = rl.id
      WHERE ula.user_id = $1
    `,
      [userId]
    );

    console.log('User locations:', userLocationsResult.rows);

    // Get all roles
    const rolesResult = await pool.query('SELECT * FROM roles ORDER BY name');
    console.log('All roles:', rolesResult.rows);

    // Get all locations
    const locationsResult = await pool.query('SELECT * FROM restaurant_locations ORDER BY name');
    console.log('All locations:', locationsResult.rows);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    pool.end();
  }
}

checkUser();
