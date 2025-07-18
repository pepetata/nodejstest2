const fetch = require('node-fetch');

async function testMultipleUsersWithEmptyEmail() {
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
    if (!loginData.token) {
      console.log('❌ Login failed');
      return;
    }

    const token = loginData.token;
    const headers = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };

    // Get roles and locations
    const [rolesResponse, locationsResponse] = await Promise.all([
      fetch('http://localhost:5000/api/v1/users/roles', { headers }),
      fetch('http://localhost:5000/api/v1/users/locations', { headers }),
    ]);

    const rolesData = await rolesResponse.json();
    const locationsData = await locationsResponse.json();

    const roles = rolesData.data || rolesData;
    const locations = locationsData.data || locationsData;

    const waiterRole = roles.find((r) => r.name === 'waiter');
    const location = locations[0];

    // Create two users with empty emails
    for (let i = 1; i <= 2; i++) {
      const userData = {
        full_name: `Test User No Email ${i}`,
        email: '', // Empty email
        password: '12345678',
        role_location_pairs: [
          {
            role_id: waiterRole.id,
            location_id: location.id,
          },
        ],
      };

      console.log(`\n=== Creating User ${i} ===`);
      const createResponse = await fetch('http://localhost:5000/api/v1/users', {
        method: 'POST',
        headers,
        body: JSON.stringify(userData),
      });

      const createResult = await createResponse.json();

      if (createResponse.status === 201) {
        console.log(`✅ User ${i} created successfully!`);
        console.log(`   User ID: ${createResult.data?.id}`);
        console.log(`   Username: ${createResult.data?.username}`);
      } else {
        console.log(`❌ User ${i} creation failed:`, createResult.error?.message);
      }
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

testMultipleUsersWithEmptyEmail();
