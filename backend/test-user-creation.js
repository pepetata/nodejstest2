// Test user creation with roles
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
    const token = loginData.token;
    const headers = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };

    // Test user creation payload (same as frontend would send)
    const userData = {
      full_name: 'Test User',
      email: 'test@example.com',
      phone: '(11) 99999-9999',
      whatsapp: '(11) 88888-8888',
      password: '12345678',
      role_location_pairs: [
        {
          role_id: 'aeb91604-e30b-4fa4-b36c-d96ad7327f50', // restaurant_administrator
          location_id: '684a5fdb-57c5-400f-b4e6-802d044c74b5', // Localização 2
        },
      ],
      is_active: true,
      is_admin: false,
    };

    console.log('=== TESTING USER CREATION ===');
    console.log('Payload:', JSON.stringify(userData, null, 2));

    const createResponse = await fetch('http://localhost:5000/api/v1/users', {
      method: 'POST',
      headers,
      body: JSON.stringify(userData),
    });

    const createResult = await createResponse.json();

    console.log('\n=== RESPONSE ===');
    console.log('Status:', createResponse.status);
    console.log('Result:', JSON.stringify(createResult, null, 2));

    if (createResponse.status === 201) {
      console.log('✅ User created successfully!');
      console.log('User ID:', createResult.data?.id);

      // Clean up - delete the test user
      if (createResult.data?.id) {
        const deleteResponse = await fetch(
          `http://localhost:5000/api/v1/users/${createResult.data.id}`,
          {
            method: 'DELETE',
            headers,
          }
        );

        if (deleteResponse.status === 200) {
          console.log('✅ Test user cleaned up successfully');
        } else {
          console.log('⚠️  Could not clean up test user');
        }
      }
    } else {
      console.log('❌ User creation failed');
      console.log('Error:', createResult.message);
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testUserCreation();
