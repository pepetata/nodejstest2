// Test user creation with the fixes
const fetch = require('node-fetch');

async function testUserCreation() {
  try {
    // Login first
    const loginResponse = await fetch('http://localhost:5000/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'flavio_luiz_ferreira_chain@hotmail.com',
        password: '12345678',
      }),
    });

    const loginData = await loginResponse.json();
    if (!loginData.token) {
      console.log('❌ Login failed:', loginData);
      return;
    }

    console.log('✅ Login successful');

    const token = loginData.token;
    const headers = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };

    // Get roles and locations first
    const [rolesResponse, locationsResponse] = await Promise.all([
      fetch('http://localhost:5000/api/v1/users/roles', { headers }),
      fetch('http://localhost:5000/api/v1/users/locations', { headers }),
    ]);

    const rolesData = await rolesResponse.json();
    const locationsData = await locationsResponse.json();

    const roles = rolesData.data || rolesData;
    const locations = locationsData.data || locationsData;

    console.log('✅ Roles loaded:', roles.length);
    console.log('✅ Locations loaded:', locations.length);

    // Find waiter role and a location
    const waiterRole = roles.find((r) => r.name === 'waiter');
    const location = locations[0];

    if (!waiterRole || !location) {
      console.log('❌ Missing required data:', { waiterRole: !!waiterRole, location: !!location });
      return;
    }

    // Test user creation payload (same as frontend would send)
    const userData = {
      full_name: 'Test User ' + Date.now(),
      email: '', // Test without email (should be optional)
      phone: '(11) 99999-9999',
      whatsapp: '(11) 88888-8888',
      password: '12345678',
      role_location_pairs: [
        {
          role_id: waiterRole.id,
          location_id: location.id,
        },
      ],
      is_active: true,
      is_admin: false,
    };

    console.log('\n=== TESTING USER CREATION ===');
    console.log('Creating user with role:', waiterRole.name);
    console.log('At location:', location.name);
    console.log('With email:', userData.email || '(empty - should be optional)');

    const createResponse = await fetch('http://localhost:5000/api/v1/users', {
      method: 'POST',
      headers,
      body: JSON.stringify(userData),
    });

    const createResult = await createResponse.json();

    console.log('\n=== RESPONSE ===');
    console.log('Status:', createResponse.status);
    console.log('Success:', createResult.success);

    if (createResponse.status === 201) {
      console.log('✅ User created successfully!');
      console.log('User ID:', createResult.data?.id);
      console.log('User Name:', createResult.data?.full_name);

      // Clean up - delete the test user
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
        } else {
          console.log('⚠️  Could not clean up test user');
        }
      }
    } else {
      console.log('❌ User creation failed');
      console.log('Error:', createResult.message);
      console.log('Details:', createResult.details);
    }
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

testUserCreation();
