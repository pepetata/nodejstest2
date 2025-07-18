const fetch = require('node-fetch');

async function testGetUsers() {
  try {
    // First, let's get a valid token
    const loginResponse = await fetch('http://localhost:5000/api/v1/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'flavio_luiz_ferreira_chain@hotmail.com',
        password: '12345678',
      }),
    });

    const loginData = await loginResponse.json();
    console.log('Login response:', loginData);

    if (!loginData.token) {
      console.error('No access token received');
      return;
    }

    const token = loginData.token;

    // Now test the get users endpoint
    const usersResponse = await fetch('http://localhost:5000/api/v1/users?page=1&limit=10', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const usersData = await usersResponse.json();
    console.log('Users response:', JSON.stringify(usersData, null, 2));

    // Check if the specific user has role_location_pairs
    const targetUser = usersData.data?.find((u) => u.id === 'be833b40-af07-4f51-8be0-761eb7c0e64d');
    if (targetUser) {
      console.log('Target user found:', {
        id: targetUser.id,
        name: targetUser.full_name,
        role_location_pairs: targetUser.role_location_pairs,
      });
    } else {
      console.log('Target user not found in response');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

testGetUsers();
