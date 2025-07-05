const { Pool } = require('pg');
const RestaurantModel = require('./src/models/RestaurantModel');
require('dotenv').config();

async function debugFindById() {
  const testPool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: 'alacarte_test',
    password: process.env.DB_PASSWORD || 'admin',
    port: process.env.DB_PORT || 5432,
  });

  // First, create a test restaurant
  const testData = {
    owner_name: 'Debug Test Owner',
    email: 'debug@example.com',
    password: 'debugpass123',
    restaurant_name: 'Debug Test Restaurant',
    restaurant_url_name: 'debug-test-restaurant',
    terms_accepted: true,
  };

  const created = await RestaurantModel.create(testData);
  console.log('Created restaurant ID:', created.id);

  // Test findById with specific columns including password
  const restaurant = await RestaurantModel.findById(created.id, ['id', 'password']);
  console.log('Result from findById with password:', restaurant);

  // Clean up
  await testPool.query('DELETE FROM restaurants WHERE id = $1', [created.id]);
  await testPool.end();
}

debugFindById().catch(console.error);
