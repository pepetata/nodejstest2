require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'alacarte_dev',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'admin',
});

async function checkData() {
  try {
    console.log('Checking existing data...');

    // Check restaurants
    const restaurantsResult = await pool.query(
      'SELECT id, restaurant_name FROM restaurants LIMIT 5'
    );
    console.log(`\n✅ Found ${restaurantsResult.rows.length} restaurants:`);
    restaurantsResult.rows.forEach((row) => {
      console.log(`  - ${row.restaurant_name} (${row.id})`);
    });

    // Check menu categories
    const categoriesResult = await pool.query(
      'SELECT id, restaurant_id FROM menu_categories LIMIT 5'
    );
    console.log(`\n✅ Found ${categoriesResult.rows.length} menu categories:`);
    categoriesResult.rows.forEach((row) => {
      console.log(`  - Category ID: ${row.id}, Restaurant: ${row.restaurant_id}`);
    });

    // Check languages
    const languagesResult = await pool.query(
      'SELECT language_code, name FROM languages WHERE is_active = true ORDER BY display_order'
    );
    console.log(`\n✅ Found ${languagesResult.rows.length} active languages:`);
    languagesResult.rows.forEach((row) => {
      console.log(`  - ${row.language_code}: ${row.name}`);
    });
  } catch (error) {
    console.error('Error checking data:', error.message);
  } finally {
    await pool.end();
  }
}

checkData();
