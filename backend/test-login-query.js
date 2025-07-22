process.env.DB_NAME = 'alacarte_dev';
process.env.DB_PASSWORD = 'admin';

const UserModel = require('./src/models/userModel');

async function testLoginQuery() {
  const userModel = new UserModel();

  try {
    console.log('Testing findUserForLogin...');
    const user = await userModel.findUserForLogin('flavio_luiz_ferreira@hotmail.com');

    if (user) {
      console.log('✅ User found successfully!');
      console.log('User ID:', user.id);
      console.log('Email:', user.email);
      console.log('Role:', user.role);
      console.log('Is Admin:', user.is_admin);
      console.log('Restaurant ID:', user.restaurant_id);
      console.log('Restaurant Name:', user.restaurant?.name || 'None');
    } else {
      console.log('❌ User not found');
    }
  } catch (error) {
    console.error('❌ Error testing login query:', error.message);
  }
}

testLoginQuery().then(() => {
  console.log('Test completed');
  process.exit(0);
});
