const UserModel = require('./src/models/userModel');

async function checkUsers() {
  try {
    console.log('Checking users in database...');
    const userModel = new UserModel();

    const result = await userModel.executeQuery(
      'SELECT id, email, full_name, created_at FROM users ORDER BY created_at DESC LIMIT 10',
      []
    );

    console.log('Recent users:');
    result.rows.forEach((user) => {
      console.log(`- ${user.id} | ${user.email} | ${user.full_name}`);
    });

    console.log(`\nTotal users found: ${result.rows.length}`);
  } catch (error) {
    console.error('Error checking users:', error);
  }
}

checkUsers();
