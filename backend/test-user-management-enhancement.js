/**
 * Test script for User Management Enhancement
 * Tests the new single location role assignment functionality
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

// Test users and credentials
const testUsers = {
  singleLocation: {
    email: 'flavio_luiz_ferreira@hotmail.com',
    password: '12345678',
    restaurantUrl: 'padre',
  },
  multiLocation: {
    email: 'flavio_luiz_ferreira_chain@hotmail.com',
    password: '12345678',
    restaurantUrl: 'padre2',
  },
};

let authToken = null;

/**
 * Login and get authentication token
 */
async function login(credentials) {
  try {
    console.log(`\n🔐 Logging in as ${credentials.email}...`);

    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email: credentials.email,
      password: credentials.password,
    });

    if (response.data.success) {
      authToken = response.data.data.token;
      console.log('✅ Login successful');
      console.log(`   User: ${response.data.data.user.full_name}`);
      console.log(`   Role: ${response.data.data.user.role}`);
      console.log(`   Restaurant: ${response.data.data.user.restaurant_name}`);
      return response.data.data;
    } else {
      throw new Error('Login failed');
    }
  } catch (error) {
    console.error('❌ Login failed:', error.response?.data?.message || error.message);
    throw error;
  }
}

/**
 * Get restaurant locations
 */
async function getLocations() {
  try {
    console.log('\n📍 Fetching restaurant locations...');

    const response = await axios.get(`${BASE_URL}/admin/locations`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    if (response.data.success) {
      const locations = response.data.data;
      console.log(`✅ Found ${locations.length} location(s):`);
      locations.forEach((location, index) => {
        console.log(`   ${index + 1}. ${location.name} (ID: ${location.id})`);
      });
      return locations;
    }
  } catch (error) {
    console.error('❌ Failed to fetch locations:', error.response?.data?.message || error.message);
    throw error;
  }
}

/**
 * Get available roles
 */
async function getRoles() {
  try {
    console.log('\n👥 Fetching available roles...');

    const response = await axios.get(`${BASE_URL}/admin/roles`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    if (response.data.success) {
      const roles = response.data.data;
      console.log(`✅ Found ${roles.length} role(s):`);
      roles.forEach((role, index) => {
        console.log(`   ${index + 1}. ${role.name} (ID: ${role.id})`);
      });
      return roles;
    }
  } catch (error) {
    console.error('❌ Failed to fetch roles:', error.response?.data?.message || error.message);
    throw error;
  }
}

/**
 * Test user creation with role-location pairs
 */
async function testUserCreation(locations, roles, testSingleLocation = true) {
  try {
    const testUserData = {
      full_name: `Test User ${Date.now()}`,
      email: `testuser${Date.now()}@example.com`,
      username: `testuser${Date.now()}`,
      password: '12345678',
      phone: '(11) 99999-9999',
      whatsapp: '(11) 98888-8888',
    };

    if (testSingleLocation && locations.length === 1) {
      // Test single location mode: multiple roles assigned to the same location
      console.log('\n🧪 Testing Single Location Mode - Multiple Roles...');

      // Select first 3 available roles for testing
      const selectedRoles = roles.slice(0, Math.min(3, roles.length));
      const singleLocationId = locations[0].id;

      testUserData.role_location_pairs = selectedRoles.map((role) => ({
        role_id: role.id,
        location_id: singleLocationId,
      }));

      console.log(`   Assigning ${selectedRoles.length} roles to location: ${locations[0].name}`);
      selectedRoles.forEach((role) => {
        console.log(`   - ${role.name}`);
      });
    } else if (locations.length > 1) {
      // Test multi-location mode: different roles for different locations
      console.log('\n🧪 Testing Multi-Location Mode - Role-Location Pairs...');

      testUserData.role_location_pairs = [
        {
          role_id: roles[0].id,
          location_id: locations[0].id,
        },
        {
          role_id: roles[1]?.id || roles[0].id,
          location_id: locations[1]?.id || locations[0].id,
        },
      ];

      console.log(`   Role-Location Pairs:`);
      testUserData.role_location_pairs.forEach((pair, index) => {
        const role = roles.find((r) => r.id === pair.role_id);
        const location = locations.find((l) => l.id === pair.location_id);
        console.log(`   ${index + 1}. ${role?.name} at ${location?.name}`);
      });
    }

    console.log('\n➡️ Creating user...');

    const response = await axios.post(`${BASE_URL}/admin/users`, testUserData, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    if (response.data.success) {
      console.log('✅ User created successfully!');
      console.log(`   User ID: ${response.data.data.id}`);
      console.log(`   Name: ${response.data.data.full_name}`);
      console.log(`   Email: ${response.data.data.email}`);

      // Verify role assignments
      if (response.data.data.role_location_pairs) {
        console.log('   Role Assignments:');
        response.data.data.role_location_pairs.forEach((pair, index) => {
          const role = roles.find((r) => r.id === pair.role_id);
          const location = locations.find((l) => l.id === pair.location_id);
          console.log(`   ${index + 1}. ${role?.name} at ${location?.name}`);
        });
      }

      return response.data.data;
    }
  } catch (error) {
    console.error('❌ User creation failed:', error.response?.data?.message || error.message);
    if (error.response?.data?.details) {
      console.error('   Details:', JSON.stringify(error.response.data.details, null, 2));
    }
    throw error;
  }
}

/**
 * Main test function
 */
async function runTests() {
  console.log('🚀 Starting User Management Enhancement Tests\n');

  try {
    // Test single location restaurant first
    console.log('='.repeat(60));
    console.log('TESTING SINGLE LOCATION RESTAURANT');
    console.log('='.repeat(60));

    const singleLocationUser = await login(testUsers.singleLocation);
    const singleLocations = await getLocations();
    const singleRoles = await getRoles();

    if (singleLocations.length === 1) {
      await testUserCreation(singleLocations, singleRoles, true);
    } else {
      console.log('⚠️  Restaurant has multiple locations, testing multi-location mode instead');
      await testUserCreation(singleLocations, singleRoles, false);
    }

    // Test multi-location restaurant
    console.log('\n' + '='.repeat(60));
    console.log('TESTING MULTI-LOCATION RESTAURANT');
    console.log('='.repeat(60));

    const multiLocationUser = await login(testUsers.multiLocation);
    const multiLocations = await getLocations();
    const multiRoles = await getRoles();

    await testUserCreation(multiLocations, multiRoles, false);

    console.log('\n🎉 All tests completed successfully!');
  } catch (error) {
    console.error('\n💥 Test suite failed:', error.message);
    process.exit(1);
  }
}

// Run the tests
runTests().catch(console.error);
