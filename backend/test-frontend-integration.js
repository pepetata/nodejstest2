// Test frontend integration - simulate form submission
const fetch = require('node-fetch');

async function testFrontendIntegration() {
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

    const userId = 'be833b40-af07-4f51-8be0-761eb7c0e64d';

    // Test with the same format that the frontend sends
    const updateData = {
      full_name: 'Flavio Ferreira Chain Final Test',
      email: 'flavio_luiz_ferreira_chain@hotmail.com',
      phone: '(11) 88888-7777',
      whatsapp: '(11) 88888-6666',
      role_location_pairs: [
        {
          role_id: 'aeb91604-e30b-4fa4-b36c-d96ad7327f50',
          location_id: 'ce105616-c754-4693-b309-b1c9eb1d3218',
        },
        {
          role_id: 'aeb91604-e30b-4fa4-b36c-d96ad7327f50',
          location_id: '684a5fdb-57c5-400f-b4e6-802d044c74b5',
        },
      ],
      is_active: true,
      is_admin: false,
    };

    console.log('=== FRONTEND FORMAT TEST ===');
    console.log('Update Data:', JSON.stringify(updateData, null, 2));

    const updateResponse = await fetch(`http://localhost:5000/api/v1/users/${userId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(updateData),
    });

    const updateResult = await updateResponse.json();
    console.log('\n=== RESULT ===');
    console.log('Status:', updateResponse.status);
    console.log('Success:', updateResult.success);
    console.log('Phone:', updateResult.data?.phone);
    console.log('WhatsApp:', updateResult.data?.whatsapp);
    console.log('Full Name:', updateResult.data?.full_name);

    if (updateResult.success) {
      console.log('✅ Frontend integration test PASSED');
    } else {
      console.log('❌ Frontend integration test FAILED');
      console.log('Error:', updateResult.error);
    }
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

testFrontendIntegration();
