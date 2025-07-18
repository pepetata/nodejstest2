const https = require('https');
const http = require('http');
const { URL } = require('url');

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;

    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {},
    };

    const req = client.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsedData });
        } catch (error) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}

async function testUserTypeFiltering() {
  try {
    console.log('🔧 Testing User Type Filtering...\n');

    // Login
    const loginResponse = await makeRequest('http://localhost:5000/api/v1/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        email: 'flavio_luiz_ferreira@hotmail.com',
        password: '12345678',
        restaurantUrl: 'padre',
      },
    });

    const token = loginResponse.data.token;
    const authHeaders = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };

    // Test admin users
    console.log('1. Testing admin users filter...');
    const adminResponse = await makeRequest('http://localhost:5000/api/v1/users?is_admin=true', {
      method: 'GET',
      headers: authHeaders,
    });

    console.log('Admin users response:', JSON.stringify(adminResponse, null, 2));

    // Test regular users
    console.log('\n2. Testing regular users filter...');
    const regularResponse = await makeRequest('http://localhost:5000/api/v1/users?is_admin=false', {
      method: 'GET',
      headers: authHeaders,
    });

    console.log('Regular users response:', JSON.stringify(regularResponse, null, 2));
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testUserTypeFiltering();
