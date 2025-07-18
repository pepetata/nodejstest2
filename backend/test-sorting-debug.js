const UserModel = require('./src/models/userModel');
const userModel = new UserModel();

// Test sorting with email descending
const testSorting = async () => {
  try {
    console.log('=== Testing Email DESC sorting ===');
    const result1 = await userModel.findWithPagination(
      { restaurant_id: 1 },
      { page: 1, limit: 10, orderBy: 'email DESC' }
    );
    console.log('Total users:', result1.total);
    console.log('Users returned:', result1.users.length);
    console.log('=== User emails (should be DESC) ===');
    result1.users.forEach((user, idx) => {
      console.log(`${idx + 1}. ${user.email} (${user.full_name})`);
    });

    console.log('\n=== Testing Full Name ASC sorting ===');
    const result2 = await userModel.findWithPagination(
      { restaurant_id: 1 },
      { page: 1, limit: 10, orderBy: 'full_name ASC' }
    );
    console.log('=== User names (should be ASC) ===');
    result2.users.forEach((user, idx) => {
      console.log(`${idx + 1}. ${user.full_name} (${user.email})`);
    });

    console.log('\n=== Testing Location Filter ===');
    const result3 = await userModel.findWithPagination(
      { restaurant_id: 1, location: 1 },
      { page: 1, limit: 10, orderBy: 'full_name ASC' }
    );
    console.log('Users with location filter:', result3.users.length);
    result3.users.forEach((user, idx) => {
      console.log(`${idx + 1}. ${user.full_name} (${user.email})`);
    });
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
  }
  process.exit(0);
};

testSorting();
