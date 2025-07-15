/**
 * Create Test Restaurant for Media Upload Testing
 */

const { Pool } = require('pg');
require('dotenv').config();

// Create database connection
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'alacarte_dev',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
});

async function createTestRestaurant() {
  const client = await pool.connect();

  try {
    console.log('🏗️  Creating test restaurant for media upload testing...');

    // Insert test restaurant
    const restaurantQuery = `
      INSERT INTO restaurants (
        id,
        name,
        restaurant_url_name,
        description,
        is_active,
        created_at,
        updated_at
      ) VALUES (
        'test-restaurant-id',
        'Test Restaurant',
        'test-restaurant-url',
        'Test restaurant for media upload testing',
        true,
        NOW(),
        NOW()
      ) ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        restaurant_url_name = EXCLUDED.restaurant_url_name,
        description = EXCLUDED.description,
        updated_at = NOW()
      RETURNING id, name, restaurant_url_name;
    `;

    const restaurantResult = await client.query(restaurantQuery);
    console.log('✅ Test restaurant created:', restaurantResult.rows[0]);

    // Insert test location
    const locationQuery = `
      INSERT INTO restaurant_locations (
        id,
        restaurant_id,
        url_name,
        address,
        city,
        is_active,
        created_at,
        updated_at
      ) VALUES (
        'test-location-id',
        'test-restaurant-id',
        'test-location-url',
        '123 Test Street',
        'Test City',
        true,
        NOW(),
        NOW()
      ) ON CONFLICT (id) DO UPDATE SET
        url_name = EXCLUDED.url_name,
        address = EXCLUDED.address,
        city = EXCLUDED.city,
        updated_at = NOW()
      RETURNING id, url_name, address;
    `;

    const locationResult = await client.query(locationQuery);
    console.log('✅ Test location created:', locationResult.rows[0]);

    console.log('\n🎯 Test data ready for media upload testing!');
    console.log('Restaurant ID: test-restaurant-id');
    console.log('Restaurant URL: test-restaurant-url');
    console.log('Location ID: test-location-id');
    console.log('Location URL: test-location-url');
  } catch (error) {
    console.error('❌ Error creating test restaurant:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the function
if (require.main === module) {
  createTestRestaurant();
}

module.exports = { createTestRestaurant };
