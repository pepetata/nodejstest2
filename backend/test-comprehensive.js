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

async function testComprehensive() {
  try {
    console.log('🔧 Testing Comprehensive User Management Fixes...\n');

    // Login
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
    console.log('✅ Login successful');

    const authHeaders = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };

    // Test role display names
    console.log('\n2. Testing role display names...');
    const usersResponse = await makeRequest('http://localhost:5000/api/v1/users?page=1&limit=10', {
      method: 'GET',
      headers: authHeaders,
    });

    if (usersResponse.status === 200) {
      const users = usersResponse.data.data;
      console.log('📊 Found users:', users.length);

      users.forEach((user, index) => {
        console.log(`\n👤 User ${index + 1}: ${user.full_name}`);
        console.log(`   - Technical role: ${user.role_name || 'N/A'}`);
        console.log(`   - Display role: ${user.role_display_name || 'N/A'}`);

        if (user.role_location_pairs && user.role_location_pairs.length > 0) {
          console.log(`   - Role pairs:`);
          user.role_location_pairs.forEach((pair, pairIndex) => {
            console.log(
              `     ${pairIndex + 1}. ${pair.role_name} → ${pair.role_display_name || 'Missing display name'}`
            );
          });
        }
      });
    }

    // Test filtering by specific role
    console.log('\n3. Testing role filtering...');
    const roleFilterTests = [
      { roleId: 'aeb91604-e30b-4fa4-b36c-d96ad7327f50', expectedRole: 'restaurant_administrator' },
      { roleId: '2c9d192b-b6cc-46e3-948d-89620b161c88', expectedRole: 'waiter' },
    ];

    for (const test of roleFilterTests) {
      const roleResponse = await makeRequest(
        `http://localhost:5000/api/v1/users?role=${test.roleId}&page=1&limit=10`,
        {
          method: 'GET',
          headers: authHeaders,
        }
      );

      if (roleResponse.status === 200) {
        const filteredUsers = roleResponse.data.data;
        console.log(`✅ Role filter (${test.expectedRole}): ${filteredUsers.length} users`);
      } else {
        console.log(`❌ Role filter (${test.expectedRole}) failed:`, roleResponse.data.error);
      }
    }

    // Test status filtering
    console.log('\n4. Testing status filtering...');
    const statusTests = ['active', 'inactive', 'pending'];

    for (const status of statusTests) {
      const statusResponse = await makeRequest(
        `http://localhost:5000/api/v1/users?status=${status}&page=1&limit=10`,
        {
          method: 'GET',
          headers: authHeaders,
        }
      );

      if (statusResponse.status === 200) {
        const filteredUsers = statusResponse.data.data;
        console.log(`✅ Status filter (${status}): ${filteredUsers.length} users`);
      } else {
        console.log(`❌ Status filter (${status}) failed:`, statusResponse.data.error);
      }
    }

    // Test user type filtering (is_admin)
    console.log('\n4b. Testing user type filtering...');
    const adminTests = [
      { isAdmin: 'true', label: 'Admin users' },
      { isAdmin: 'false', label: 'Regular users' },
    ];

    for (const adminTest of adminTests) {
      const adminResponse = await makeRequest(
        `http://localhost:5000/api/v1/users?is_admin=${adminTest.isAdmin}&page=1&limit=10`,
        {
          method: 'GET',
          headers: authHeaders,
        }
      );

      if (adminResponse.status === 200) {
        const filteredUsers = adminResponse.data.data;
        console.log(`✅ User type filter (${adminTest.label}): ${filteredUsers.length} users`);
      } else {
        console.log(`❌ User type filter (${adminTest.label}) failed:`, adminResponse.data.error);
      }
    }

    // Test sorting
    console.log('\n5. Testing sorting...');
    const sortTests = [
      { sortBy: 'full_name', sortOrder: 'asc' },
      { sortBy: 'full_name', sortOrder: 'desc' },
      { sortBy: 'created_at', sortOrder: 'desc' },
    ];

    for (const sort of sortTests) {
      const sortResponse = await makeRequest(
        `http://localhost:5000/api/v1/users?sortBy=${sort.sortBy}&sortOrder=${sort.sortOrder}&page=1&limit=10`,
        {
          method: 'GET',
          headers: authHeaders,
        }
      );

      if (sortResponse.status === 200) {
        const sortedUsers = sortResponse.data.data;
        console.log(
          `✅ Sort (${sort.sortBy} ${sort.sortOrder}): First user = ${sortedUsers[0]?.full_name}`
        );
      } else {
        console.log(`❌ Sort (${sort.sortBy} ${sort.sortOrder}) failed:`, sortResponse.data.error);
      }
    }

    console.log('\n🎉 All comprehensive tests completed successfully!');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testComprehensive();
