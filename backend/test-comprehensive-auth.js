// Comprehensive authentication flow test
const fetch = require('node-fetch');

async function testComprehensiveAuth() {
  console.log('🔍 Starting comprehensive authentication test...\n');

  // Test 1: Check rate limit status
  console.log('1. Checking rate limit status...');
  try {
    const response = await fetch('http://localhost:3000/api/v1/auth/me');
    const headers = response.headers;
    console.log('Rate limit remaining:', headers.get('ratelimit-remaining'));
    console.log('Rate limit reset:', headers.get('ratelimit-reset'));
    console.log('Rate limit limit:', headers.get('ratelimit-limit'));

    if (response.status === 429) {
      console.log('❌ Rate limit still active');
      const resetTime = parseInt(headers.get('ratelimit-reset')) || 0;
      console.log(`Rate limit resets in ${resetTime} seconds`);
    } else {
      console.log('✅ Rate limit OK');
    }
  } catch (error) {
    console.error('Error checking rate limit:', error.message);
  }

  // Test 2: Restaurant validation
  console.log('\n2. Testing restaurant validation...');

  const restaurants = ['padre2', 'padre4', 'nonexistent'];
  for (const restaurant of restaurants) {
    try {
      const response = await fetch(`http://localhost:3000/api/v1/restaurants/by-url/${restaurant}`);
      if (response.ok) {
        const data = await response.json();
        console.log(
          `✅ Restaurant ${restaurant} exists: ${data.restaurant?.name || 'name not found'}`
        );
      } else if (response.status === 404) {
        console.log(`❌ Restaurant ${restaurant} not found (404)`);
      } else {
        console.log(`❓ Restaurant ${restaurant} returned status: ${response.status}`);
      }
    } catch (error) {
      console.error(`Error checking restaurant ${restaurant}:`, error.message);
    }
  }

  // Test 3: Try authentication (only if rate limit allows)
  console.log('\n3. Testing authentication...');
  try {
    const response = await fetch('http://localhost:3000/api/v1/auth/me');
    if (response.status === 429) {
      console.log('❌ Cannot test auth due to rate limit');
    } else if (response.status === 401) {
      console.log('✅ Not authenticated (as expected)');
    } else {
      console.log('✅ Already authenticated');
      const data = await response.json();
      console.log('User:', data.user?.email);
      console.log('Restaurant:', data.restaurant?.name);
    }
  } catch (error) {
    console.error('Error testing auth:', error.message);
  }

  console.log('\n🎯 Test completed');
}

testComprehensiveAuth();
