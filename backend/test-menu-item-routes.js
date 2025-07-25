const fetch = require('node-fetch');

async function testMenuItemRoutes() {
  const baseUrl = 'http://localhost:5000';

  console.log('Testing Menu Item API endpoints...\n');

  // Test endpoints without authentication first (should get 401)
  const endpoints = [
    '/api/menu-items',
    '/api/restaurants/test-id/menu-items',
    '/api/restaurants/test-id/menu-categories',
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`Testing: ${endpoint}`);
      const response = await fetch(`${baseUrl}${endpoint}`);
      console.log(`Status: ${response.status} ${response.statusText}`);

      if (response.status === 404) {
        console.log('❌ Route not found - 404 error');
      } else if (response.status === 401) {
        console.log('✅ Route exists - Authentication required (expected)');
      } else {
        console.log(`ℹ️  Unexpected status: ${response.status}`);
      }
      console.log('---');
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
      console.log('---');
    }
  }
}

testMenuItemRoutes().catch(console.error);
