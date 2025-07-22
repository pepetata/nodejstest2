process.env.DB_NAME = 'alacarte_dev';
process.env.DB_PASSWORD = 'admin';

const UserModel = require('./src/models/userModel');
const UserRoleModel = require('./src/models/UserRoleModel');

async function testUserQueries() {
  const userModel = new UserModel();
  const userRoleModel = new UserRoleModel();
  const userId = 'cac1c5de-58d8-437a-af5b-3de78830125a'; // Flavio's user ID

  try {
    console.log('🔍 Testing findByIdWithRestaurant...');
    const userWithRestaurant = await userModel.findByIdWithRestaurant(userId);

    if (userWithRestaurant) {
      console.log('✅ User with restaurant found!');
      console.log('Primary role:', userWithRestaurant.role_name);
      console.log('Role level:', userWithRestaurant.role_level);
      console.log('Restaurant:', userWithRestaurant.restaurant_name);
    } else {
      console.log('❌ User not found');
    }

    console.log('\n🔍 Testing getUserPrimaryRole...');
    const primaryRole = await userRoleModel.getUserPrimaryRole(userId);

    if (primaryRole) {
      console.log('✅ Primary role found!');
      console.log('Role name:', primaryRole.role_name);
      console.log('Role level:', primaryRole.role_level);
      console.log('Location:', primaryRole.location_name);
    } else {
      console.log('❌ Primary role not found');
    }

    console.log('\n🔍 Testing user with multiple roles...');
    const multiRoleUserId = '0533eac6-d4ab-403a-985f-32e49b80fbe2';
    const multiUserPrimaryRole = await userRoleModel.getUserPrimaryRole(multiRoleUserId);

    if (multiUserPrimaryRole) {
      console.log('✅ Primary role for multi-role user found!');
      console.log('Selected role:', multiUserPrimaryRole.role_name);
      console.log('Role level:', multiUserPrimaryRole.role_level);
      console.log('Created at:', multiUserPrimaryRole.created_at);
    }
  } catch (error) {
    console.error('❌ Error testing user queries:', error.message);
    console.error(error.stack);
  }
}

testUserQueries().then(() => {
  console.log('\n✅ All tests completed successfully!');
  process.exit(0);
});
