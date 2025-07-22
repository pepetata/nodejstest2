#!/usr/bin/env node

/**
 * Test script to check restaurant data structure returned from login
 */

const https = require('https');
const http = require('http');

const BASE_URL = 'http://localhost:5000/api/v1';

// Test credentials for single and multi-location restaurants
const TEST_USERS = {
  singleLocation: {
    email: 'flavio_luiz_ferreira@hotmail.com',
    password: '12345678',
    expectedBusinessType: 'single',
  },
  multiLocation: {
    email: 'flavio_luiz_ferreira_chain@hotmail.com',
    password: '12345678',
    expectedBusinessType: 'multi-location',
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

async function testLogin(credentials, description) {
  console.log(`\n🔐 Testing ${description}...`);
  console.log(`   Email: ${credentials.email}`);

  const response = await makeRequest(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: credentials.email,
      password: credentials.password,
    }),
  });

  if (!response.ok) {
    console.log('❌ Login failed:', response.data);
    return null;
  }

  console.log('✅ Login successful!');
  console.log('\n📊 RESTAURANT DATA ANALYSIS:');
  console.log('============================');

  // Check if restaurant data exists
  if (response.data && response.data.restaurant) {
    const restaurant = response.data.restaurant;
    console.log('✅ Restaurant object exists');
    console.log(`   Restaurant ID: ${restaurant.id}`);
    console.log(`   Restaurant Name: ${restaurant.name}`);
    console.log(`   Business Type: ${restaurant.business_type || 'NOT FOUND'}`);
    console.log(`   Expected Business Type: ${credentials.expectedBusinessType}`);

    // Check all restaurant fields
    console.log('\n🔍 All restaurant fields:');
    Object.keys(restaurant).forEach((key) => {
      console.log(`   ${key}: ${restaurant[key]}`);
    });

    // Verify business type matches expectation
    if (restaurant.business_type === credentials.expectedBusinessType) {
      console.log('\n✅ Business type matches expectation!');
    } else {
      console.log('\n❌ Business type mismatch!');
      console.log(`   Expected: ${credentials.expectedBusinessType}`);
      console.log(`   Actual: ${restaurant.business_type || 'undefined'}`);
    }
  } else {
    console.log('❌ Restaurant object not found in response');
    console.log('\n🔍 Full response structure:');
    console.log(JSON.stringify(response.data, null, 2));
  }

  return response.data;
}

async function main() {
  console.log('🧪 TESTING RESTAURANT DATA STRUCTURE');
  console.log('=====================================');

  try {
    // Test single-location restaurant
    await testLogin(TEST_USERS.singleLocation, 'Single Location Restaurant (Padre)');

    // Test multi-location restaurant
    await testLogin(TEST_USERS.multiLocation, 'Multi Location Restaurant (Padre2)');

    console.log('\n✅ Testing completed!');
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
  }
}

// Run the test
main();
