// Test script to verify sorting and location filtering
const axios = require('axios');

async function testUserAPI() {
  console.log('Testing User API fixes...\n');

  // Generate a fresh token
  const tokenResponse = await axios.post('http://localhost:5000/api/auth/login', {
    email: 'flavio_luiz_ferreira_chain@hotmail.com',
    password: '12345678',
  });

  const token = tokenResponse.data.token;
  console.log('✅ Login successful, token obtained');

  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  // Test 1: Sort by full_name ascending
  console.log('\n1. Testing sort by full_name ascending...');
  try {
    const response1 = await axios.get(
      'http://localhost:5000/api/v1/users?sortBy=full_name&sortOrder=asc&limit=5',
      { headers }
    );
    console.log(`   ✅ Request successful - ${response1.data.data.length} users returned`);
    console.log(`   Users: ${response1.data.data.map((u) => u.full_name).join(', ')}`);
  } catch (error) {
    console.log(`   ❌ Error: ${error.response?.data?.error || error.message}`);
  }

  // Test 2: Sort by full_name descending
  console.log('\n2. Testing sort by full_name descending...');
  try {
    const response2 = await axios.get(
      'http://localhost:5000/api/v1/users?sortBy=full_name&sortOrder=desc&limit=5',
      { headers }
    );
    console.log(`   ✅ Request successful - ${response2.data.data.length} users returned`);
    console.log(`   Users: ${response2.data.data.map((u) => u.full_name).join(', ')}`);
  } catch (error) {
    console.log(`   ❌ Error: ${error.response?.data?.error || error.message}`);
  }

  // Test 3: Sort by email
  console.log('\n3. Testing sort by email...');
  try {
    const response3 = await axios.get(
      'http://localhost:5000/api/v1/users?sortBy=email&sortOrder=asc&limit=5',
      { headers }
    );
    console.log(`   ✅ Request successful - ${response3.data.data.length} users returned`);
    console.log(
      `   Users: ${response3.data.data.map((u) => `${u.full_name} (${u.email})`).join(', ')}`
    );
  } catch (error) {
    console.log(`   ❌ Error: ${error.response?.data?.error || error.message}`);
  }

  // Test 4: Location filter (if locations exist)
  console.log('\n4. Testing location filter...');
  try {
    const response4 = await axios.get('http://localhost:5000/api/v1/users?location=1&limit=5', {
      headers,
    });
    console.log(`   ✅ Request successful - ${response4.data.data.length} users returned`);
    console.log(`   Users: ${response4.data.data.map((u) => u.full_name).join(', ')}`);
  } catch (error) {
    console.log(`   ❌ Error: ${error.response?.data?.error || error.message}`);
  }

  console.log('\n✅ API tests completed!');
}

testUserAPI().catch(console.error);
