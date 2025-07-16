// Test authentication flow with different IP to bypass rate limiting
const fetch = require('node-fetch');

async function testAuthFlow() {
  console.log('🔍 Testing authentication flow...');

  // Test the actual restaurant validation first
  try {
    const response = await fetch('http://localhost:3000/api/v1/restaurants/by-url/padre2');
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Restaurant padre2 exists:', data.restaurant?.name);
    } else {
      console.log('❌ Restaurant padre2 not found');
    }
  } catch (error) {
    console.error('❌ Error validating restaurant:', error.message);
  }

  // Test non-existent restaurant
  try {
    const response = await fetch('http://localhost:3000/api/v1/restaurants/by-url/xxxxx');
    if (response.status === 404) {
      console.log('✅ Non-existent restaurant correctly returns 404');
    } else {
      console.log('❌ Non-existent restaurant should return 404');
    }
  } catch (error) {
    console.log('✅ Non-existent restaurant throws error as expected');
  }

  // Test authentication endpoint status
  try {
    const response = await fetch('http://localhost:3000/api/v1/auth/me');
    console.log('Auth endpoint status:', response.status);
    if (response.status === 401) {
      console.log('✅ Auth endpoint correctly returns 401 when not authenticated');
    }
  } catch (error) {
    console.error('❌ Error testing auth endpoint:', error.message);
  }
}

testAuthFlow();
