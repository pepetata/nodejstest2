const db = require('./src/config/db');
const UserModel = require('./src/models/userModel');

async function testUserAuth() {
  try {
    console.log('Testing user authentication structure...');

    // First, let's see what users exist
    const users = await db.query('SELECT id, username, email FROM users ORDER BY id LIMIT 5');
    console.log('Available users:');
    users.rows.forEach((user) => {
      console.log(`- ID: ${user.id}, Username: ${user.username}, Email: ${user.email}`);
    });

    // Test the userModel.findByIdWithRestaurant method
    const userModel = new UserModel();
    if (users.rows.length > 0) {
      const userId = users.rows[0].id;
      console.log(`\nTesting findByIdWithRestaurant for user ID: ${userId}`);
      const userWithRestaurant = await userModel.findByIdWithRestaurant(userId);
      console.log('User with restaurant:', JSON.stringify(userWithRestaurant, null, 2));
    }
  } catch (error) {
    console.error('Error:', error.message);
  }

  process.exit(0);
}

testUserAuth();
