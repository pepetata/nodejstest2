const fetch = require('node-fetch');

async function testExplicitRestaurantId() {
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

    console.log('✅ Login successful');
    console.log('Current user restaurant_id:', loginData.user.restaurant_id);

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

    // Create user data WITH explicit restaurant_id (should be preserved)
    const userData = {
      full_name: 'Test Explicit Restaurant ID User',
      email: '',
      password: '12345678',
      restaurant_id: loginData.user.restaurant_id, // Explicitly set
      role_location_pairs: [
        {
          role_id: waiterRole.id,
          location_id: location.id,
        },
      ],
    };

    console.log('\n=== Creating User With Explicit Restaurant ID ===');
    console.log('User data (with restaurant_id):', JSON.stringify(userData, null, 2));

    const createResponse = await fetch('http://localhost:5000/api/v1/users', {
      method: 'POST',
      headers,
      body: JSON.stringify(userData),
    });

    const createResult = await createResponse.json();

    if (createResponse.status === 201) {
      console.log('✅ User created successfully!');
      console.log('🔍 Restaurant ID saved:', createResult.data.restaurant_id);

      if (createResult.data.restaurant_id === userData.restaurant_id) {
        console.log('✅ Explicit restaurant ID correctly preserved!');
      } else {
        console.log('❌ Restaurant ID mismatch!');
        console.log('Expected:', userData.restaurant_id);
        console.log('Got:', createResult.data.restaurant_id);
      }

      // Clean up
      if (createResult.data?.id) {
        const deleteResponse = await fetch(
          `http://localhost:5000/api/v1/users/${createResult.data.id}`,
          {
            method: 'DELETE',
            headers,
          }
        );

        if (deleteResponse.ok) {
          console.log('✅ Test user cleaned up successfully');
        }
      }
    } else {
      console.log('❌ User creation failed');
      console.log('Status:', createResponse.status);
      console.log('Error:', createResult.error?.message);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

testExplicitRestaurantId();
