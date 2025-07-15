// Test making the actual API call that the frontend would make

// Test the API endpoint directly
async function testApiCall() {
  try {
    console.log('🔍 Testing API call to restaurant media endpoint...');

    const restaurantId = '8181755a-6312-4835-b6cd-8e0c3fb30b0c';
    const response = await fetch(`http://localhost:3000/api/v1/restaurants/${restaurantId}/media`, {
      headers: {
        Authorization: 'Bearer your-test-token-here', // Replace with actual token
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    console.log('✅ API Response Status:', response.status);
    console.log('✅ API Response Data:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('❌ API Error:', error.message);
  }
}

// Test without auth to see if it's an auth issue
async function testApiCallWithoutAuth() {
  try {
    console.log('🔍 Testing API call WITHOUT authentication...');

    const restaurantId = '8181755a-6312-4835-b6cd-8e0c3fb30b0c';
    const response = await fetch(`http://localhost:3000/api/v1/restaurants/${restaurantId}/media`);

    const data = await response.json();
    console.log('✅ API Response Status (no auth):', response.status);
    console.log('✅ API Response Data (no auth):', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('❌ API Error (no auth):', error.message);
  }
}

// Run both tests
async function runTests() {
  console.log('Starting API tests...\n');

  await testApiCallWithoutAuth();
  console.log('\n' + '='.repeat(50) + '\n');
  await testApiCall();

  console.log('\n✅ API tests completed');
}

runTests();
