const fetch = require('node-fetch');

const testApiEndpoints = async () => {
  console.log('=== Testing API Endpoints Directly ===');

  const baseUrl = 'http://localhost:5000/api/v1';

  try {
    // Test 1: Basic request without sorting
    console.log('\n1. Basic request (no sorting)');
    let response = await fetch(`${baseUrl}/users?page=1&limit=5`);

    if (!response.ok) {
      console.error('Response not OK:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('Error body:', errorText.substring(0, 500));
      return;
    }

    let data = await response.json();
    console.log('Success:', data.success);
    console.log('Users returned:', data.data.length);
    if (data.data.length > 0) {
      console.log('First user:', data.data[0].full_name, data.data[0].email);
      console.log(
        'Last user:',
        data.data[data.data.length - 1].full_name,
        data.data[data.data.length - 1].email
      );
    }

    // Test 2: Sort by email DESC
    console.log('\n2. Sort by email DESC');
    response = await fetch(`${baseUrl}/users?page=1&limit=5&sortBy=email&sortOrder=desc`);

    if (!response.ok) {
      console.error('Response not OK:', response.status, response.statusText);
      return;
    }

    data = await response.json();
    console.log('Success:', data.success);
    console.log('Users returned:', data.data.length);
    if (data.data.length > 0) {
      console.log('=== Email DESC order ===');
      data.data.forEach((user, idx) => {
        console.log(`${idx + 1}. ${user.email || 'NO EMAIL'} - ${user.full_name}`);
      });
    }

    // Test 3: Sort by full_name ASC
    console.log('\n3. Sort by full_name ASC');
    response = await fetch(`${baseUrl}/users?page=1&limit=5&sortBy=full_name&sortOrder=asc`);

    if (!response.ok) {
      console.error('Response not OK:', response.status, response.statusText);
      return;
    }

    data = await response.json();
    console.log('Success:', data.success);
    console.log('Users returned:', data.data.length);
    if (data.data.length > 0) {
      console.log('=== Full Name ASC order ===');
      data.data.forEach((user, idx) => {
        console.log(`${idx + 1}. ${user.full_name} - ${user.email || 'NO EMAIL'}`);
      });
    }

    // Test 4: Location filter
    console.log('\n4. Location filter (location=1)');
    response = await fetch(`${baseUrl}/users?page=1&limit=5&location=1`);

    if (!response.ok) {
      console.error('Response not OK:', response.status, response.statusText);
      return;
    }

    data = await response.json();
    console.log('Success:', data.success);
    console.log('Users with location filter:', data.data.length);
    if (data.data.length > 0) {
      console.log('=== Location filtered users ===');
      data.data.forEach((user, idx) => {
        console.log(`${idx + 1}. ${user.full_name} - ${user.email || 'NO EMAIL'}`);
      });
    } else {
      console.log('No users found with location filter - possible issue');
    }
  } catch (error) {
    console.error('API test error:', error.message);
  }
};

testApiEndpoints();
