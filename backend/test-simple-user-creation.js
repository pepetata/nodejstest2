const fetch = require('node-fetch');

async function testUserCreationSimple() {
  try {
    // Login first
    const loginResponse = await fetch('http://localhost:5000/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'flavio_luiz_ferreira@hotmail.com',
        password: '12345678',
      }),
    });

    const loginData = await loginResponse.json();
    console.log('Login response:', loginData);

    if (!loginData.token) {
      console.log('❌ Login failed');
      return;
    }

    const token = loginData.token;
    const headers = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };

    // Test user creation with minimal data
    const userData = {
      full_name: 'Test User Simple',
      password: '12345678',
      role_location_pairs: [
        {
          role_id: 'c4b2e1f4-6789-4def-9012-34567890abcd',
          location_id: 'b3c2d1e4-5678-4abc-9012-34567890abcd',
        },
      ],
    };

    console.log('Sending user data:', JSON.stringify(userData, null, 2));

    const createResponse = await fetch('http://localhost:5000/api/v1/users', {
      method: 'POST',
      headers,
      body: JSON.stringify(userData),
    });

    console.log('Response status:', createResponse.status);
    console.log('Response headers:', createResponse.headers);

    const responseText = await createResponse.text();
    console.log('Response text:', responseText);

    try {
      const createResult = JSON.parse(responseText);
      console.log('Parsed response:', createResult);
    } catch (e) {
      console.log('Failed to parse response as JSON');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

testUserCreationSimple();
