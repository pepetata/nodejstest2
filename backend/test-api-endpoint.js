// Simple test to check if the API endpoint works
const axios = require('axios');

async function testMediaEndpoint() {
  try {
    console.log('Testing media endpoint...');

    // Test with the restaurant ID from the database
    const restaurantId = '8181755a-6312-4835-b6cd-8e0c3fb30b0c';

    const response = await axios.get(
      `http://localhost:3000/api/v1/restaurants/${restaurantId}/media`,
      {
        headers: {
          'Content-Type': 'application/json',
          // You'll need to add authentication token here
          Authorization: 'Bearer YOUR_TOKEN_HERE',
        },
      }
    );

    console.log('✅ API Response:', response.data);
  } catch (error) {
    console.error('❌ API Error:', error.response?.data || error.message);
  }
}

testMediaEndpoint();
