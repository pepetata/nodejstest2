// Test sorting by different columns to see if it's working
const { execSync } = require('child_process');

async function testAllSorting() {
  console.log('Testing all sorting options...\n');

  // Get a valid token
  const tokenOutput = execSync('node generate-valid-token.js', { encoding: 'utf8' });
  const tokenMatch = tokenOutput.match(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/);

  if (!tokenMatch) {
    console.error('❌ Could not extract token');
    return;
  }

  const token = tokenMatch[0];
  console.log('✅ Got token');

  const baseURL = 'http://localhost:5000/api/v1/users';
  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  const tests = [
    { name: 'Sort by full_name ASC', params: 'sortBy=full_name&sortOrder=asc' },
    { name: 'Sort by full_name DESC', params: 'sortBy=full_name&sortOrder=desc' },
    { name: 'Sort by email ASC', params: 'sortBy=email&sortOrder=asc' },
    { name: 'Sort by email DESC', params: 'sortBy=email&sortOrder=desc' },
    { name: 'Sort by created_at ASC', params: 'sortBy=created_at&sortOrder=asc' },
    { name: 'Sort by created_at DESC', params: 'sortBy=created_at&sortOrder=desc' },
  ];

  for (const test of tests) {
    console.log(`\n${test.name}:`);

    try {
      const response = await fetch(`${baseURL}?${test.params}&limit=5`, { headers });
      const data = await response.json();

      if (data.success) {
        console.log('   ✅ Success');
        data.data.forEach((user, i) => {
          const name = user.full_name || 'No name';
          const email = user.email || 'No email';
          const date = user.created_at
            ? new Date(user.created_at).toISOString().split('T')[0]
            : 'No date';
          console.log(`   ${i + 1}. ${name} | ${email} | ${date}`);
        });
      } else {
        console.log('   ❌ Error:', data.error);
      }
    } catch (error) {
      console.log('   ❌ Request failed:', error.message);
    }
  }
}

testAllSorting().catch(console.error);
