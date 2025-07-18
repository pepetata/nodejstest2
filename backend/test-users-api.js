// Test the users API with different sorting and filtering options
const axios = require('axios');

async function testUsersAPI() {
  console.log('Testing Users API fixes...\n');

  // First, get a valid token
  const { execSync } = require('child_process');
  const tokenOutput = execSync('node generate-valid-token.js', { encoding: 'utf8' });
  const tokenMatch = tokenOutput.match(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/);

  if (!tokenMatch) {
    console.error('❌ Could not extract token from generator');
    return;
  }

  const token = tokenMatch[0];
  console.log('✅ Got valid token for testing');

  const baseURL = 'http://localhost:5000/api/v1/users';
  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  const tests = [
    {
      name: 'Test 1: Basic fetch with default sorting',
      params: { page: 1, limit: 5 },
    },
    {
      name: 'Test 2: Sort by full_name ascending',
      params: { page: 1, limit: 5, sortBy: 'full_name', sortOrder: 'asc' },
    },
    {
      name: 'Test 3: Sort by full_name descending',
      params: { page: 1, limit: 5, sortBy: 'full_name', sortOrder: 'desc' },
    },
    {
      name: 'Test 4: Sort by email ascending',
      params: { page: 1, limit: 5, sortBy: 'email', sortOrder: 'asc' },
    },
    {
      name: 'Test 5: Sort by created_at descending',
      params: { page: 1, limit: 5, sortBy: 'created_at', sortOrder: 'desc' },
    },
    {
      name: 'Test 6: Filter by status (active)',
      params: { page: 1, limit: 5, status: 'active' },
    },
    {
      name: 'Test 7: Filter by location (if available)',
      params: { page: 1, limit: 5, location: '1' },
    },
  ];

  for (const test of tests) {
    try {
      console.log(`\n${test.name}:`);
      console.log('  Params:', test.params);

      const response = await axios.get(baseURL, {
        params: test.params,
        headers,
      });

      if (response.data.success) {
        const users = response.data.data.users;
        const pagination = response.data.data.pagination;

        console.log(`  ✅ Success: ${users.length} users returned`);
        console.log(
          `  📊 Pagination: ${pagination.page}/${pagination.totalPages} (${pagination.total} total)`
        );

        if (users.length > 0) {
          console.log('  👥 First user:', {
            name: users[0].full_name,
            email: users[0].email,
            status: users[0].status,
            roles: users[0].role_location_pairs?.length || 0,
          });

          // Check if sorting is working by comparing first and last user
          if (users.length > 1) {
            const first = users[0];
            const last = users[users.length - 1];

            if (test.params.sortBy === 'full_name') {
              const comparison = first.full_name?.localeCompare(last.full_name);
              const expectedOrder = test.params.sortOrder === 'asc' ? -1 : 1;
              if (Math.sign(comparison) === expectedOrder || comparison === 0) {
                console.log('  ✅ Sorting appears to be working correctly');
              } else {
                console.log('  ⚠️  Sorting may not be working as expected');
              }
            }
          }
        }
      } else {
        console.log('  ❌ API returned success=false:', response.data.error);
      }
    } catch (error) {
      console.log(`  ❌ Error: ${error.response?.data?.error || error.message}`);
    }
  }

  console.log('\n🎯 Summary:');
  console.log('- If you see successful responses, the API is working');
  console.log(
    '- Check if sorting is working by comparing results between ascending/descending tests'
  );
  console.log('- Check browser console for any duplicate key errors (should be gone)');
  console.log('- Test location filter in the frontend UI to see if it filters correctly');
}

testUsersAPI().catch(console.error);
