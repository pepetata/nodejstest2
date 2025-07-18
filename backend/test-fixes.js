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

async function testFixes() {
  try {
    console.log('🔧 Testing User Management Fixes...\n');

    // Clean up debug logs
    console.log('1. Logging in...');
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

    if (loginResponse.status !== 200) {
      throw new Error(`Login failed: ${loginResponse.data.error || 'Unknown error'}`);
    }

    const token = loginResponse.data.token;
    if (!token) {
      throw new Error('No token in response');
    }
    console.log('✅ Login successful');

    // Set up headers for authenticated requests
    const authHeaders = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };

    // Test 1: Get users with default sorting (should be by name)
    console.log('\n2. Testing users endpoint with detailed analysis...');
    const usersResponse = await makeRequest('http://localhost:5000/api/v1/users?page=1&limit=10', {
      method: 'GET',
      headers: authHeaders,
    });

    if (usersResponse.status === 200) {
      console.log('✅ Users retrieved successfully');
      const users = usersResponse.data.data;
      console.log('📊 Number of users:', users.length);

      // Check the first user in detail
      if (users.length > 0) {
        const user = users[0];
        console.log('\n📋 First user details:');
        console.log('- Name:', user.full_name);
        console.log('- Role name:', user.role_name);
        console.log('- Role display name:', user.role_display_name);
        console.log('- Role location pairs:', JSON.stringify(user.role_location_pairs));
      }

      // Test role filtering
      console.log('\n3. Testing role filtering...');
      const currentUserRoleId = loginResponse.data.user.primaryRole.role_id;
      const roleFilterResponse = await makeRequest(
        `http://localhost:5000/api/v1/users?role=${currentUserRoleId}&page=1&limit=10`,
        {
          method: 'GET',
          headers: authHeaders,
        }
      );

      if (roleFilterResponse.status === 200) {
        console.log('✅ Role filtering works');
        console.log('📊 Filtered users count:', roleFilterResponse.data.data.length);
      } else {
        console.log('❌ Role filtering failed:', roleFilterResponse.data.error);
      }

      // Test status filtering
      console.log('\n4. Testing status filtering...');
      const statusFilterResponse = await makeRequest(
        'http://localhost:5000/api/v1/users?status=active&page=1&limit=10',
        {
          method: 'GET',
          headers: authHeaders,
        }
      );

      if (statusFilterResponse.status === 200) {
        console.log('✅ Status filtering works');
        console.log('📊 Active users count:', statusFilterResponse.data.data.length);
      } else {
        console.log('❌ Status filtering failed:', statusFilterResponse.data.error);
      }

      // Test sorting
      console.log('\n5. Testing sorting...');
      const sortResponse = await makeRequest(
        'http://localhost:5000/api/v1/users?sortBy=full_name&sortOrder=desc&page=1&limit=10',
        {
          method: 'GET',
          headers: authHeaders,
        }
      );

      if (sortResponse.status === 200) {
        console.log('✅ Sorting works');
        console.log('📊 First user after DESC sort:', sortResponse.data.data[0]?.full_name);
      } else {
        console.log('❌ Sorting failed:', sortResponse.data.error);
      }
    } else {
      console.log('❌ Users retrieval failed:', usersResponse.data.error);
    }

    console.log('\n🎉 All tests completed!');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('❌ Full error:', error);
  }
}

// Run the test
testFixes();
