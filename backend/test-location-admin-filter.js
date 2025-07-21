/**
 * Test script to verify that location_administrator role
 * is only available for multi-location restaurants
 */

// Test credentials
const testUsers = {
  singleLocation: {
    email: 'flavio_luiz_ferreira@hotmail.com',
    password: '12345678',
    restaurantUrl: 'padre', // Single location restaurant
  },
  multiLocation: {
    email: 'flavio_luiz_ferreira_chain@hotmail.com',
    password: '12345678',
    restaurantUrl: 'padre2', // Multi location restaurant
  },
};

const BASE_URL = 'http://localhost:5000/api';

async function login(credentials) {
  try {
    const response = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: credentials.email,
        password: credentials.password,
      }),
    });

    const data = await response.json();
    if (data.success) {
      return data.token;
    }
    throw new Error(data.message || 'Login failed');
  } catch (error) {
    console.error('❌ Login failed:', error.message);
    throw error;
  }
}

async function getLocations(token) {
  try {
    const response = await fetch(`${BASE_URL}/users/locations`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await response.json();
    if (data.success) {
      return data.data;
    }
    throw new Error(data.message || 'Failed to get locations');
  } catch (error) {
    console.error('❌ Failed to get locations:', error.message);
    throw error;
  }
}

async function getRoles(token) {
  try {
    const response = await fetch(`${BASE_URL}/users/roles`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await response.json();
    if (data.success) {
      return data.data;
    }
    throw new Error(data.message || 'Failed to get roles');
  } catch (error) {
    console.error('❌ Failed to get roles:', error.message);
    throw error;
  }
}

async function testLocationAdminFiltering() {
  console.log('🧪 Testing Location Administrator Role Filtering\n');

  try {
    // Test 1: Single Location Restaurant
    console.log('📍 Test 1: Single Location Restaurant');
    console.log('Logging in as single location restaurant admin...');

    const singleLocationToken = await login(testUsers.singleLocation);
    const singleLocations = await getLocations(singleLocationToken);
    const singleRoles = await getRoles(singleLocationToken);

    console.log(`✅ Restaurant has ${singleLocations.length} location(s):`);
    singleLocations.forEach((loc, i) => {
      console.log(`   ${i + 1}. ${loc.name}`);
    });

    const hasLocationAdmin = singleRoles.some((role) => role.name === 'location_administrator');
    console.log(`📋 Available roles: ${singleRoles.map((r) => r.name).join(', ')}`);
    console.log(
      `🎯 Location Administrator available: ${hasLocationAdmin ? '❌ YES (should be NO)' : '✅ NO (correct)'}`
    );

    // Test 2: Multi Location Restaurant
    console.log('\n📍 Test 2: Multi Location Restaurant');
    console.log('Logging in as multi location restaurant admin...');

    const multiLocationToken = await login(testUsers.multiLocation);
    const multiLocations = await getLocations(multiLocationToken);
    const multiRoles = await getRoles(multiLocationToken);

    console.log(`✅ Restaurant has ${multiLocations.length} location(s):`);
    multiLocations.forEach((loc, i) => {
      console.log(`   ${i + 1}. ${loc.name}`);
    });

    const hasLocationAdminMulti = multiRoles.some((role) => role.name === 'location_administrator');
    console.log(`📋 Available roles: ${multiRoles.map((r) => r.name).join(', ')}`);
    console.log(
      `🎯 Location Administrator available: ${hasLocationAdminMulti ? '✅ YES (correct)' : '❌ NO (should be YES)'}`
    );

    // Summary
    console.log('\n📊 Test Results Summary:');
    console.log(
      `Single location (${singleLocations.length} location): Location Admin role ${hasLocationAdmin ? 'SHOWN ❌' : 'HIDDEN ✅'}`
    );
    console.log(
      `Multi location (${multiLocations.length} locations): Location Admin role ${hasLocationAdminMulti ? 'SHOWN ✅' : 'HIDDEN ❌'}`
    );

    const testPassed = !hasLocationAdmin && hasLocationAdminMulti;
    console.log(`\n🎉 Overall test result: ${testPassed ? 'PASSED ✅' : 'FAILED ❌'}`);

    if (testPassed) {
      console.log('✅ Location Administrator role filtering is working correctly!');
    } else {
      console.log('❌ Location Administrator role filtering needs adjustment.');
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testLocationAdminFiltering();
