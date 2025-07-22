const http = require('http');

function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            data: JSON.parse(body),
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: body,
          });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function testRestaurantIsolation() {
  console.log('🔒 TESTING RESTAURANT ISOLATION SECURITY');
  console.log('=========================================');

  try {
    // Test 1: Login as Restaurant Administrator
    console.log('🔐 Logging in as flavio_luiz_ferreira@hotmail.com...');

    const loginOptions = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const loginData = {
      email: 'flavio_luiz_ferreira@hotmail.com',
      password: 'admin123',
    };

    const loginResponse = await makeRequest(loginOptions, loginData);

    if (
      loginResponse.status !== 200 ||
      !loginResponse.data ||
      !loginResponse.data.user ||
      !loginResponse.data.token
    ) {
      console.log('❌ TEST ERROR: Invalid login response');
      console.log('Status:', loginResponse.status);
      console.log('Response:', JSON.stringify(loginResponse.data, null, 2));
      return;
    }

    const { user, token } = loginResponse.data;
    const userRestaurantId = user.restaurant_id;

    console.log(`✅ Login successful! User restaurant_id: ${userRestaurantId}`);
    console.log(`👤 User role: ${user.role || user.primaryRole?.role_name}`);

    // Test 2: Get users (should only return users from same restaurant)
    console.log('\n📋 Testing user access...');

    const usersOptions = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/users',
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };

    const usersResponse = await makeRequest(usersOptions);

    if (
      usersResponse.status !== 200 ||
      !usersResponse.data ||
      !usersResponse.data.data ||
      !Array.isArray(usersResponse.data.data)
    ) {
      console.log('❌ TEST ERROR: Invalid users response structure');
      console.log('Status:', usersResponse.status);
      console.log('Response:', JSON.stringify(usersResponse.data, null, 2));
      return;
    }

    const users = usersResponse.data.data;
    console.log(`📊 Total users returned: ${users.length}`);

    // Check if all users belong to the same restaurant
    const uniqueRestaurantIds = [...new Set(users.map((u) => u.restaurant_id))];
    console.log(`🏢 Unique restaurant IDs in results: ${uniqueRestaurantIds.length}`);
    console.log(`🏢 Restaurant IDs found: ${uniqueRestaurantIds.join(', ')}`);

    if (uniqueRestaurantIds.length === 1 && uniqueRestaurantIds[0] === userRestaurantId) {
      console.log('✅ SECURITY CHECK PASSED: All users belong to same restaurant');
      console.log(`✅ Restaurant ID isolation working: ${userRestaurantId}`);
    } else {
      console.log('❌ SECURITY VULNERABILITY: Users from different restaurants found!');
      console.log('Restaurant IDs found:', uniqueRestaurantIds);
      console.log('Expected restaurant ID:', userRestaurantId);

      // Show which users belong to other restaurants
      const foreignUsers = users.filter((u) => u.restaurant_id !== userRestaurantId);
      if (foreignUsers.length > 0) {
        console.log('🚨 FOREIGN USERS FOUND:');
        foreignUsers.forEach((u) => {
          console.log(
            `  - ${u.full_name || 'Unknown Name'} (${u.email || 'No Email'}) from restaurant ${u.restaurant_id}`
          );
        });
      }
    }

    // Show sample users
    console.log('\n👥 Sample users returned:');
    users.slice(0, 3).forEach((u) => {
      console.log(
        `  - ${u.full_name || 'Unknown'} (${u.email || 'No Email'}) - Restaurant: ${u.restaurant_id}`
      );
    });

    console.log('\n📈 SECURITY TEST SUMMARY:');
    console.log('========================');
    if (uniqueRestaurantIds.length === 1 && uniqueRestaurantIds[0] === userRestaurantId) {
      console.log('✅ RESTAURANT ISOLATION: SECURE');
      console.log('✅ All user data properly filtered by restaurant');
    } else {
      console.log('❌ RESTAURANT ISOLATION: VULNERABLE');
      console.log('❌ Cross-restaurant data access detected!');
    }
  } catch (error) {
    console.log('❌ TEST FAILED:', error.message);
    console.log('Error details:', error);
  }
}

testRestaurantIsolation();
