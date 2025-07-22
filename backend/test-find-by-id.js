process.env.DB_NAME = 'alacarte_dev';
process.env.DB_PASSWORD = 'admin';

const UserModel = require('./src/models/userModel');

async function testFindByIdWithRestaurant() {
  const userModel = new UserModel();
  const userId = 'cac1c5de-58d8-437a-af5b-3de78830125a'; // Flavio's user ID

  try {
    console.log('🔍 Testing findByIdWithRestaurant...');
    const userWithRestaurant = await userModel.findByIdWithRestaurant(userId);

    if (userWithRestaurant) {
      console.log('✅ User with restaurant found!');
      console.log('User ID:', userWithRestaurant.id);
      console.log('Email:', userWithRestaurant.email);
      console.log('Primary role (mapped to "role"):', userWithRestaurant.role);
      console.log('Is Admin:', userWithRestaurant.is_admin);
      console.log('Restaurant ID:', userWithRestaurant.restaurant_id);
      console.log('Restaurant name:', userWithRestaurant.restaurant?.name);
      console.log('Restaurant status:', userWithRestaurant.restaurant?.status);
    } else {
      console.log('❌ User not found');
    }
  } catch (error) {
    console.error('❌ Error testing findByIdWithRestaurant:', error.message);
    console.error(error.stack);
  }
}

testFindByIdWithRestaurant().then(() => {
  console.log('\n✅ Test completed successfully!');
  process.exit(0);
});
