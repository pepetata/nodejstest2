const http = require('http');

// Test the specific locations endpoint
async function testLocationsEndpoint() {
  // First login
  const loginData = JSON.stringify({
    email: 'flavio_luiz_ferreira@hotmail.com',
    password: '12345678',
  });

  const loginOptions = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/v1/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(loginData),
    },
  };

  const token = await new Promise((resolve, reject) => {
    const req = http.request(loginOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve(response.token);
        } catch (err) {
          reject(err);
        }
      });
    });
    req.on('error', reject);
    req.write(loginData);
    req.end();
  });

  console.log('✅ Login successful, testing /users/locations...');

  // Test locations endpoint
  const locationsOptions = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/v1/users/locations',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  };

  const req = http.request(locationsOptions, (res) => {
    console.log(`Status: ${res.statusCode}`);
    console.log(`Headers:`, res.headers);

    let data = '';
    res.on('data', (chunk) => (data += chunk));
    res.on('end', () => {
      console.log('Raw response:', data);
      try {
        const response = JSON.parse(data);
        console.log('Parsed response:', JSON.stringify(response, null, 2));
      } catch (err) {
        console.log('Failed to parse JSON:', err.message);
      }
    });
  });

  req.on('error', (error) => {
    console.error('Request error:', error);
  });

  req.end();
}

testLocationsEndpoint().catch(console.error);
