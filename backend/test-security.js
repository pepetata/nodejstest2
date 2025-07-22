#!/usr/bin/env node

/**
 * Test script to verify restaurant isolation security fix
 * Tests that users can only see users from their own restaurant
 */

const https = require('https');
const http = require('http');

const BASE_URL = 'http://localhost:5000/api/v1';

// Test credentials
const RESTAURANTS = {
  padre: {
    username: 'joaores',
    password: '12345678',
    expectedRestaurant: 'c7742866-f77b-4f68-8586-57d631af301a',
  },
  padre2: {
    username: 'joao2',
    password: '12345678',
    expectedRestaurant: '430c05f9-4298-4a68-a377-0c2188f4bfe1',
  },
};

// Simple HTTP request function
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const { request } = urlObj.protocol === 'https:' ? require('https') : require('http');

    const reqOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {},
    };

    const req = request(reqOptions, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const parsedData = JSON.parse(data);
          resolve({
            ok: res.statusCode >= 200 && res.statusCode < 300,
            status: res.statusCode,
            data: parsedData,
          });
        } catch (error) {
          resolve({
            ok: res.statusCode >= 200 && res.statusCode < 300,
            status: res.statusCode,
            data: data,
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (options.body) {
      req.write(options.body);
    }

    req.end();
  });
}

async function login(credentials) {
  console.log(`\n🔐 Logging in as ${credentials.username}...`);

  const response = await makeRequest(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: credentials.username, // API field is called 'email' but accepts username too
      password: credentials.password,
    }),
  });

  if (!response.ok) {
    console.log('Login error response:', response.data);
    throw new Error(`Login failed: ${response.status}`);
  }

  console.log('Login response structure:', Object.keys(response.data));

  if (!response.data || !response.data.user) {
    console.log('Full response:', JSON.stringify(response.data, null, 2));
    throw new Error('Invalid response structure');
  }

  console.log(`✅ Logged in successfully as ${response.data.user.full_name}`);
  console.log(`   Restaurant: ${response.data.restaurant.name} (${response.data.restaurant.id})`);
  console.log(`   Role: ${response.data.user.role}`);

  return response.data.token;
}

async function getUsers(token) {
  console.log('\n👥 Fetching users...');

  const response = await makeRequest(`${BASE_URL}/users`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch users: ${response.status}`);
  }

  // Check if response has data nested structure
  const users = response.data.data ? response.data.data : response.data;

  console.log(`   Retrieved ${users.length} users:`);

  users.forEach((user) => {
    console.log(
      `   - ${user.full_name} (${user.username}) - Restaurant: ${user.restaurant?.name || 'N/A'} (${user.restaurant_id})`
    );
  });

  return users;
}

async function testSecurityIsolation() {
  console.log('🔒 TESTING RESTAURANT ISOLATION SECURITY');
  console.log('=========================================');

  try {
    // Test restaurant 1 (padre)
    const token1 = await login(RESTAURANTS.padre);
    const users1 = await getUsers(token1);

    // Test restaurant 2 (padre2)
    const token2 = await login(RESTAURANTS.padre2);
    const users2 = await getUsers(token2);

    // Security analysis
    console.log('\n🔍 SECURITY ANALYSIS');
    console.log('=====================');

    const restaurant1Users = new Set(users1.map((user) => user.restaurant_id));
    const restaurant2Users = new Set(users2.map((user) => user.restaurant_id));

    console.log(
      `Restaurant 1 user sees ${restaurant1Users.size} restaurant(s): ${Array.from(restaurant1Users).join(', ')}`
    );
    console.log(
      `Restaurant 2 user sees ${restaurant2Users.size} restaurant(s): ${Array.from(restaurant2Users).join(', ')}`
    );

    // Check if each user only sees their own restaurant
    const restaurant1Secure =
      restaurant1Users.size === 1 && restaurant1Users.has(RESTAURANTS.padre.expectedRestaurant);
    const restaurant2Secure =
      restaurant2Users.size === 1 && restaurant2Users.has(RESTAURANTS.padre2.expectedRestaurant);

    if (restaurant1Secure && restaurant2Secure) {
      console.log('\n✅ SECURITY TEST PASSED!');
      console.log('   ✅ Each user can only see users from their own restaurant');
      console.log('   ✅ Restaurant isolation is working correctly');
    } else {
      console.log('\n❌ SECURITY TEST FAILED!');
      console.log('   ❌ Users can see data from other restaurants');
      console.log('   ❌ SECURITY VULNERABILITY DETECTED!');

      if (!restaurant1Secure) {
        console.log(`   ❌ Restaurant 1 user sees: ${Array.from(restaurant1Users).join(', ')}`);
        console.log(`   ❌ Expected only: ${RESTAURANTS.padre.expectedRestaurant}`);
      }

      if (!restaurant2Secure) {
        console.log(`   ❌ Restaurant 2 user sees: ${Array.from(restaurant2Users).join(', ')}`);
        console.log(`   ❌ Expected only: ${RESTAURANTS.padre2.expectedRestaurant}`);
      }
    }
  } catch (error) {
    console.error('\n❌ TEST ERROR:', error.message);
  }
}

// Run the test
testSecurityIsolation();
