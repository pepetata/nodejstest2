// Test what the users API returns for a specific user
const fetch = require('node-fetch');

async function testUserData() {
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
    const headers = { Authorization: `Bearer ${token}` };

    // Get users data
    const usersResponse = await fetch('http://localhost:5000/api/v1/users', { headers });
    const usersData = await usersResponse.json();

    const targetUser = usersData.data?.find(
      (user) => user.id === 'be833b40-af07-4f51-8be0-761eb7c0e64d'
    );

    console.log('=== USER DATA FROM API ===');
    console.log('User ID:', targetUser.id);
    console.log('Full Name:', targetUser.full_name);
    console.log('Email:', targetUser.email);
    console.log('Phone:', targetUser.phone);
    console.log('WhatsApp:', targetUser.whatsapp);
    console.log('Role Location Pairs:', JSON.stringify(targetUser.role_location_pairs, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testUserData();
