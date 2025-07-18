// Test auth/me endpoint
const fetch = require('node-fetch');

async function testAuthMe() {
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
    console.log('Login response:', loginData);

    // Test auth/me
    const meResponse = await fetch('http://localhost:5000/api/v1/auth/me', {
      headers: { Authorization: `Bearer ${loginData.token}` },
    });

    const meData = await meResponse.json();
    console.log('\n=== AUTH/ME RESPONSE ===');
    console.log(JSON.stringify(meData, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testAuthMe();
