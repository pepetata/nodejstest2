// Test updating user phone and role_location_pairs
const fetch = require('node-fetch');

async function testUserUpdate() {
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

    // Update user data
    const updateData = {
      full_name: 'Flavio Ferreira Chain Updated',
      phone: '(11) 99999-8888',
      whatsapp: '(11) 99999-7777',
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
    };

    console.log('=== UPDATING USER ===');
    console.log('User ID:', userId);
    console.log('Update Data:', JSON.stringify(updateData, null, 2));

    const updateResponse = await fetch(`http://localhost:5000/api/v1/users/${userId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(updateData),
    });

    const updateResult = await updateResponse.json();
    console.log('\n=== UPDATE RESULT ===');
    console.log('Status:', updateResponse.status);
    console.log('Response:', JSON.stringify(updateResult, null, 2));

    // Get updated user data
    const usersResponse = await fetch('http://localhost:5000/api/v1/users', { headers });
    const usersData = await usersResponse.json();

    const updatedUser = usersData.data?.find((user) => user.id === userId);
    console.log('\n=== UPDATED USER DATA ===');
    console.log('Full Name:', updatedUser.full_name);
    console.log('Phone:', updatedUser.phone);
    console.log('WhatsApp:', updatedUser.whatsapp);
    console.log('Role Location Pairs:', JSON.stringify(updatedUser.role_location_pairs, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testUserUpdate();
