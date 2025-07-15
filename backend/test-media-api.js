// Test the exact API call that the frontend should be making
const axios = require('axios');

async function testMediaAPI() {
  try {
    const restaurantId = '8181755a-6312-4835-b6cd-8e0c3fb30b0c';

    console.log('🔍 Testing media API endpoint...');
    console.log('Restaurant ID:', restaurantId);
    console.log('API URL:', `http://localhost:5000/api/v1/restaurants/${restaurantId}/media`);

    // Test the API call without authentication first
    const response = await axios.get(
      `http://localhost:5000/api/v1/restaurants/${restaurantId}/media`
    );

    console.log('✅ API Response Status:', response.status);
    console.log('✅ API Response Headers:', response.headers);
    console.log('✅ API Response Data:', JSON.stringify(response.data, null, 2));

    // Check if the response has the expected structure
    if (response.data && response.data.data) {
      const mediaData = response.data.data;
      console.log('📊 Media Data Structure:');
      console.log('- Logo:', mediaData.logo ? 'Present' : 'null');
      console.log('- Favicon:', mediaData.favicon ? 'Present' : 'null');
      console.log(
        '- Images:',
        Array.isArray(mediaData.images) ? mediaData.images.length : 'not array'
      );
      console.log(
        '- Videos:',
        Array.isArray(mediaData.videos) ? mediaData.videos.length : 'not array'
      );
    }
  } catch (error) {
    console.error('❌ API Error:', error.message);
    console.error('❌ Error Status:', error.response?.status);
    console.error('❌ Error Data:', error.response?.data);

    if (error.response?.status === 401) {
      console.log('🔒 Authentication required - this is expected');
    } else if (error.response?.status === 403) {
      console.log('🚫 Authorization failed - user may not have access to this restaurant');
    }
  }
}

testMediaAPI();
