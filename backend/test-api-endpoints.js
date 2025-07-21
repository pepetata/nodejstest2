const http = require('http');

/**
 * Quick API test to verify user management endpoints
 */

const testEndpoints = [
  '/api/v1/users/roles',
  '/api/v1/users/locations',
  '/api/v1/users?page=1&limit=5',
];

async function makeRequest(path, token) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            data: JSON.parse(data),
          });
        } catch (err) {
          resolve({
            status: res.statusCode,
            data: data,
            parseError: err.message,
          });
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function login() {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      email: 'flavio_luiz_ferreira@hotmail.com',
      password: '12345678',
    });

    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/v1/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (response.token) {
            resolve(response.token);
          } else {
            reject(new Error('No token received'));
          }
        } catch (err) {
          reject(err);
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function testAPIs() {
  console.log('🧪 Testing User Management API Endpoints...\n');

  try {
    // Login first
    console.log('🔐 Logging in...');
    const token = await login();
    console.log('✅ Login successful\n');

    // Test each endpoint
    for (const endpoint of testEndpoints) {
      try {
        console.log(`📡 Testing ${endpoint}...`);
        const response = await makeRequest(endpoint, token);

        if (response.status === 200) {
          console.log(`✅ ${endpoint} - SUCCESS (${response.status})`);

          if (endpoint.includes('/roles')) {
            console.log(`   📋 Found ${response.data.data?.length || 0} roles`);
          } else if (endpoint.includes('/locations')) {
            console.log(`   🗺️  Found ${response.data.data?.length || 0} locations`);
          } else if (endpoint.includes('/users')) {
            console.log(
              `   👥 Found ${response.data.data?.users?.length || 0} users (total: ${response.data.data?.pagination?.total || 0})`
            );
          }
        } else {
          console.log(`❌ ${endpoint} - FAILED (${response.status})`);
          console.log(`   Error: ${response.data.message || response.data}`);
        }
      } catch (error) {
        console.log(`❌ ${endpoint} - ERROR: ${error.message}`);
      }
      console.log('');
    }

    console.log('🎉 API Testing Complete!');
  } catch (error) {
    console.error('❌ Login failed:', error.message);
  }
}

testAPIs();
