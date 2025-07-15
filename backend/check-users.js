// Check existing users in the database
const UserModel = require('./src/models/userModel');

async function checkExistingUsers() {
  try {
    const userModel = new UserModel();

    console.log('🔍 Checking existing users in database...');

    // Try to get all users (this method might not exist, so we'll try different approaches)
    try {
      const users = await userModel.getAll();
      console.log('✅ Found users:', users.length);

      users.forEach((user, index) => {
        console.log(`User ${index + 1}:`);
        console.log(`  ID: ${user.id}`);
        console.log(`  Email: ${user.email}`);
        console.log(`  Name: ${user.name}`);
        console.log(`  Status: ${user.status}`);
        console.log(`  Restaurant ID: ${user.restaurant_id}`);
        console.log('');
      });
    } catch (error) {
      console.log('❌ getAll method not available, trying database query...');

      // Try direct database query
      const db = require('./src/config/db');
      const result = await db.query(
        'SELECT id, email, name, status, restaurant_id FROM users LIMIT 10'
      );

      console.log('✅ Found users via direct query:', result.rows.length);

      result.rows.forEach((user, index) => {
        console.log(`User ${index + 1}:`);
        console.log(`  ID: ${user.id}`);
        console.log(`  Email: ${user.email}`);
        console.log(`  Name: ${user.name}`);
        console.log(`  Status: ${user.status}`);
        console.log(`  Restaurant ID: ${user.restaurant_id}`);
        console.log('');
      });
    }
  } catch (error) {
    console.error('❌ Error checking users:', error.message);
  }
}

checkExistingUsers();
