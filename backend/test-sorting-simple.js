// Simple test to check if sorting works
const { execSync } = require('child_process');

async function testSorting() {
  console.log('Testing sorting fix...\n');

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

  try {
    // Test sorting by full_name ascending
    console.log('\n1. Testing sort by full_name ASC:');
    const response1 = await fetch(`${baseURL}?sortBy=full_name&sortOrder=asc&limit=5`, { headers });
    const data1 = await response1.json();

    if (data1.success) {
      console.log('   ✅ Success');
      data1.data.forEach((user, i) => {
        console.log(`   ${i + 1}. ${user.full_name || user.name || 'No name'}`);
      });
    } else {
      console.log('   ❌ Error:', data1.error);
    }

    // Test sorting by full_name descending
    console.log('\n2. Testing sort by full_name DESC:');
    const response2 = await fetch(`${baseURL}?sortBy=full_name&sortOrder=desc&limit=5`, {
      headers,
    });
    const data2 = await response2.json();

    if (data2.success) {
      console.log('   ✅ Success');
      data2.data.forEach((user, i) => {
        console.log(`   ${i + 1}. ${user.full_name || user.name || 'No name'}`);
      });
    } else {
      console.log('   ❌ Error:', data2.error);
    }
  } catch (error) {
    console.log('❌ Request failed:', error.message);
  }
}

testSorting().catch(console.error);
