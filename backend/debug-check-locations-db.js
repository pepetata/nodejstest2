// Load environment variables
require('dotenv').config();

const { Pool } = require('pg');

async function checkLocations() {
  const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'alacarte_dev',
    password: process.env.DB_PASSWORD || 'admin',
    port: process.env.DB_PORT || 5432,
  });

  try {
    console.log('🔍 Checking locations in database...');

    // Check all restaurant_locations
    const allLocations = await pool.query(
      'SELECT * FROM restaurant_locations ORDER BY restaurant_id, name'
    );
    console.log(`📍 Total locations in database: ${allLocations.rows.length}`);
    console.log(
      'All locations:',
      allLocations.rows.map((l) => ({
        id: l.id,
        name: l.name,
        restaurant_id: l.restaurant_id,
      }))
    );

    // Check locations for specific restaurant
    const restaurantId = 'c7742866-f77b-4f68-8586-57d631af301a';
    const restaurantLocations = await pool.query(
      'SELECT * FROM restaurant_locations WHERE restaurant_id = $1',
      [restaurantId]
    );
    console.log(`📍 Locations for restaurant ${restaurantId}: ${restaurantLocations.rows.length}`);

    if (restaurantLocations.rows.length > 0) {
      console.log('Restaurant locations:', restaurantLocations.rows);
    }

    // Check what restaurants exist
    const restaurants = await pool.query('SELECT id, name FROM restaurants ORDER BY name');
    console.log(`🏪 Total restaurants: ${restaurants.rows.length}`);
    console.log('Restaurants:', restaurants.rows);
  } catch (error) {
    console.error('❌ Error checking locations:', error.message);
  } finally {
    await pool.end();
  }
}

checkLocations();
