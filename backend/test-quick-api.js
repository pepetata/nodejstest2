// Quick test of the users API fixes using built-in fetch
const { execSync } = require('child_process');

async function testUsersAPI() {
  console.log('Testing Users API fixes...\n');

  // Get a valid token
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
      params: '?page=1&limit=3',
    },
    {
      name: 'Test 2: Sort by full_name ascending',
      params: '?page=1&limit=3&sortBy=full_name&sortOrder=asc',
    },
    {
      name: 'Test 3: Sort by full_name descending',
      params: '?page=1&limit=3&sortBy=full_name&sortOrder=desc',
    },
    {
      name: 'Test 4: Sort by email ascending',
      params: '?page=1&limit=3&sortBy=email&sortOrder=asc',
    },
    {
      name: 'Test 5: Filter by status (active)',
      params: '?page=1&limit=3&status=active',
    },
    {
      name: 'Test 6: Filter by location (location=1)',
      params: '?page=1&limit=3&location=1',
    },
  ];

  for (const test of tests) {
    console.log(`\n${test.name}`);
    try {
      const response = await fetch(`${baseURL}${test.params}`, { headers });

      if (!response.ok) {
        const errorText = await response.text();
        console.log(`   ❌ HTTP ${response.status}: ${errorText}`);
        continue;
      }

      const data = await response.json();

      if (data.success) {
        console.log(`   ✅ Success - ${data.data.length} users returned`);
        if (data.pagination) {
          console.log(`   Total: ${data.pagination.total}, Page: ${data.pagination.page}`);
        }

        if (data.data.length > 0) {
          console.log(`   Users:`);
          data.data.forEach((user, index) => {
            console.log(
              `     ${index + 1}. ${user.full_name} (${user.email || 'no email'}) - ${user.status}`
            );
          });
        }
      } else {
        console.log(`   ❌ API Error: ${data.error}`);
      }
    } catch (error) {
      console.log(`   ❌ Request failed: ${error.message}`);
    }
  }

  console.log('\n✅ API tests completed!');
}

testUsersAPI().catch(console.error);
