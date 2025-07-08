#!/usr/bin/env node

/**
 * API Versioning and Rate Limiting Test Script
 *
 * This script demonstrates the implemented API versioning (v1) and rate limiting features.
 * Run this with: node test-api-versioning.js
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

async function testAPIVersioning() {
  console.log('🔄 Testing API Versioning...\n');

  try {
    // Test 1: Access v1 API endpoint
    console.log('1. Testing v1 API endpoint...');
    const v1Response = await axios.get(`${BASE_URL}/api/v1/health`);
    console.log('✅ v1 Health Check:', v1Response.data);
    console.log('   Response Headers:');
    console.log(`   - X-API-Version: ${v1Response.headers['x-api-version']}`);
    console.log(`   - RateLimit-Limit: ${v1Response.headers['ratelimit-limit']}`);
    console.log(`   - RateLimit-Remaining: ${v1Response.headers['ratelimit-remaining']}`);
    console.log();

    // Test 2: API Documentation endpoint
    console.log('2. Testing API documentation endpoint...');
    const docsResponse = await axios.get(`${BASE_URL}/api/v1/docs`);
    console.log('✅ v1 API Documentation:', {
      version: docsResponse.data.version,
      title: docsResponse.data.title,
      rateLimit: docsResponse.data.rateLimit,
    });
    console.log();

    // Test 3: Main API endpoint
    console.log('3. Testing main API endpoint...');
    const mainResponse = await axios.get(`${BASE_URL}/api`);
    console.log('✅ Main API Info:', {
      name: mainResponse.data.name,
      versions: mainResponse.data.versions,
      rateLimit: mainResponse.data.rateLimit,
    });
    console.log();

    // Test 4: Test version header support
    console.log('4. Testing version header support...');
    const headerResponse = await axios.get(`${BASE_URL}/api/v1/restaurants`, {
      headers: {
        'X-API-Version': '1',
      },
    });
    console.log(
      '✅ Version header accepted, API Version:',
      headerResponse.headers['x-api-version']
    );
    console.log();
  } catch (error) {
    console.error('❌ API Versioning test failed:', error.response?.data || error.message);
  }
}

async function testRateLimiting() {
  console.log('🚦 Testing Rate Limiting...\n');

  try {
    // Test 1: General rate limiting
    console.log('1. Testing general rate limiting...');
    const response = await axios.get(`${BASE_URL}/api/v1/restaurants`);
    console.log('✅ Rate Limit Headers:');
    console.log(`   - RateLimit-Limit: ${response.headers['ratelimit-limit']}`);
    console.log(`   - RateLimit-Remaining: ${response.headers['ratelimit-remaining']}`);
    console.log(`   - RateLimit-Reset: ${response.headers['ratelimit-reset']}`);
    console.log();

    // Test 2: Authentication rate limiting (stricter)
    console.log('2. Testing authentication rate limiting...');
    try {
      const authResponse = await axios.post(`${BASE_URL}/api/v1/auth/login`, {
        email: 'test@example.com',
        password: 'invalidpassword',
      });
    } catch (authError) {
      if (authError.response) {
        console.log('✅ Auth Rate Limit Headers:');
        console.log(`   - RateLimit-Limit: ${authError.response.headers['ratelimit-limit']}`);
        console.log(
          `   - RateLimit-Remaining: ${authError.response.headers['ratelimit-remaining']}`
        );
        console.log('   Note: Auth endpoints have stricter limits (5 per 15 minutes)');
      }
    }
    console.log();

    // Test 3: Demonstrate rate limiting in action
    console.log('3. Testing rapid requests to demonstrate rate limiting...');
    const promises = [];
    for (let i = 0; i < 5; i++) {
      promises.push(
        axios
          .get(`${BASE_URL}/api/v1/restaurants`)
          .then((res) => ({
            success: true,
            remaining: res.headers['ratelimit-remaining'],
          }))
          .catch((err) => ({
            success: false,
            status: err.response?.status,
            message: err.response?.data?.message,
          }))
      );
    }

    const results = await Promise.all(promises);
    results.forEach((result, index) => {
      if (result.success) {
        console.log(`   Request ${index + 1}: ✅ Success, ${result.remaining} requests remaining`);
      } else {
        console.log(`   Request ${index + 1}: ❌ ${result.status} - ${result.message}`);
      }
    });
  } catch (error) {
    console.error('❌ Rate limiting test failed:', error.response?.data || error.message);
  }
}

async function testLegacyCompatibility() {
  console.log('🔄 Testing Legacy Compatibility...\n');

  try {
    // Test legacy routes still work
    console.log('1. Testing legacy route compatibility...');
    const legacyResponse = await axios.get(`${BASE_URL}/api/restaurants`);
    console.log('✅ Legacy routes still accessible');
    console.log(`   Status: ${legacyResponse.status}`);
    console.log();

    // Test that legacy routes have rate limiting too
    console.log('2. Testing legacy route rate limiting...');
    console.log(`   RateLimit-Limit: ${legacyResponse.headers['ratelimit-limit']}`);
    console.log(`   RateLimit-Remaining: ${legacyResponse.headers['ratelimit-remaining']}`);
  } catch (error) {
    console.error('❌ Legacy compatibility test failed:', error.response?.data || error.message);
  }
}

async function runTests() {
  console.log('🚀 API Versioning and Rate Limiting Test Suite\n');
  console.log('===============================================\n');

  // Check if server is running
  try {
    await axios.get(`${BASE_URL}/health`);
    console.log('✅ Server is running at', BASE_URL);
    console.log();
  } catch (error) {
    console.error('❌ Server is not running. Please start the server first with: npm start');
    console.error('   Or run in development mode with: npm run dev');
    process.exit(1);
  }

  await testAPIVersioning();
  await testRateLimiting();
  await testLegacyCompatibility();

  console.log('🎉 All tests completed!\n');
  console.log('Summary of implemented features:');
  console.log('✅ API Versioning (v1) with header support');
  console.log('✅ Rate Limiting with multiple strategies');
  console.log('✅ Backward compatibility with legacy routes');
  console.log('✅ Comprehensive API documentation');
  console.log('✅ Request tracking and logging');
}

if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { testAPIVersioning, testRateLimiting, testLegacyCompatibility };
