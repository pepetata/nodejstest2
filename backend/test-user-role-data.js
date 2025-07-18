// Test to verify the user data and role matching
const https = require('https');
const http = require('http');

function makeRequest(url, method = 'GET', data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;

    const postData = data ? JSON.stringify(data) : null;

    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    if (postData) {
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = client.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(body);
          resolve({ data: jsonData, status: res.statusCode });
        } catch (e) {
          resolve({ data: body, status: res.statusCode });
        }
      });
    });

    req.on('error', reject);

    if (postData) {
      req.write(postData);
    }

    req.end();
  });
}

async function testUserData() {
  try {
    // Login first
    const loginResponse = await makeRequest('http://localhost:5000/api/v1/auth/login', 'POST', {
      email: 'flavio_luiz_ferreira_chain@hotmail.com',
      password: '12345678',
    });

    if (loginResponse.status !== 200) {
      console.error('Login failed:', loginResponse.data);
      return;
    }

    const token = loginResponse.data.token;
    console.log('✅ Login successful');

    // Get users
    const usersResponse = await makeRequest('http://localhost:5000/api/v1/users', 'GET', null, {
      Authorization: `Bearer ${token}`,
    });

    console.log('\n=== User Data ===');
    const userData = usersResponse.data.data[0];
    console.log('User ID:', userData.id);
    console.log('Full Name:', userData.full_name);
    console.log('Role Location Pairs:', userData.role_location_pairs);

    // Get roles
    const rolesResponse = await makeRequest(
      'http://localhost:5000/api/v1/users/roles',
      'GET',
      null,
      {
        Authorization: `Bearer ${token}`,
      }
    );

    console.log('\n=== Roles Data ===');
    const roles = rolesResponse.data.roles || rolesResponse.data.data || rolesResponse.data;
    console.log('Available roles:', roles);

    // Check if the role_id from user matches any role
    console.log('\n=== Role Matching ===');
    if (userData.role_location_pairs && userData.role_location_pairs.length > 0) {
      const userRoleId = userData.role_location_pairs[0].role_id;
      console.log('User role_id:', userRoleId);

      const matchingRole = roles.find((r) => r.id === userRoleId);
      console.log('Matching role found:', matchingRole);

      if (matchingRole) {
        console.log('✅ Role match found:', matchingRole.name);
      } else {
        console.log('❌ No matching role found');
        console.log(
          'Available role IDs:',
          roles.map((r) => r.id)
        );
      }
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testUserData();
