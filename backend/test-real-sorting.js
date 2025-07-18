// Test actual database sorting
const UserService = require('./src/services/userService');

async function testRealSorting() {
  console.log('Testing real database sorting...\n');

  const userService = new UserService();

  // Mock current user
  const mockCurrentUser = {
    id: 'be833b40-af07-4f51-8be0-761eb7c0e64d',
    role: 'restaurant_administrator',
    restaurant_id: '550e8400-e29b-41d4-a716-446655440001',
  };

  const tests = [
    {
      name: 'Sort by full_name ASC',
      options: { page: 1, limit: 10, sortBy: 'full_name', sortOrder: 'asc' },
    },
    {
      name: 'Sort by full_name DESC',
      options: { page: 1, limit: 10, sortBy: 'full_name', sortOrder: 'desc' },
    },
    {
      name: 'Sort by email ASC',
      options: { page: 1, limit: 10, sortBy: 'email', sortOrder: 'asc' },
    },
    {
      name: 'Sort by created_at DESC',
      options: { page: 1, limit: 10, sortBy: 'created_at', sortOrder: 'desc' },
    },
  ];

  for (const test of tests) {
    console.log(`\n${test.name}:`);

    try {
      const result = await userService.getUsers(test.options, mockCurrentUser);

      if (result.users && result.users.length > 0) {
        console.log(`   ✅ ${result.users.length} users returned`);
        result.users.forEach((user, index) => {
          const email = user.email || 'no email';
          const createdAt = user.created_at
            ? new Date(user.created_at).toISOString().split('T')[0]
            : 'no date';
          console.log(`     ${index + 1}. ${user.full_name} (${email}) - ${createdAt}`);
        });
      } else {
        console.log(`   ❌ No users returned`);
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }
}

testRealSorting().catch(console.error);
