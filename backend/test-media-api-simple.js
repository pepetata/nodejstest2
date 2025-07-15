// Test the exact API call that the frontend should be making
const http = require('http');

async function testMediaAPI() {
  return new Promise((resolve, reject) => {
    const restaurantId = '8181755a-6312-4835-b6cd-8e0c3fb30b0c';

    console.log('🔍 Testing media API endpoint...');
    console.log('Restaurant ID:', restaurantId);
    console.log('API URL:', `http://localhost:5000/api/v1/restaurants/${restaurantId}/media`);

    const options = {
      hostname: 'localhost',
      port: 5000,
      path: `/api/v1/restaurants/${restaurantId}/media`,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          console.log('✅ API Response Status:', res.statusCode);
          console.log('✅ API Response Headers:', res.headers);

          if (res.statusCode === 200) {
            const responseData = JSON.parse(data);
            console.log('✅ API Response Data:', JSON.stringify(responseData, null, 2));

            // Check if the response has the expected structure
            if (responseData && responseData.data) {
              const mediaData = responseData.data;
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
          } else {
            console.error('❌ API Error Status:', res.statusCode);
            console.error('❌ API Error Data:', data);

            if (res.statusCode === 401) {
              console.log('🔒 Authentication required - this is expected');
            } else if (res.statusCode === 403) {
              console.log('🚫 Authorization failed - user may not have access to this restaurant');
            }
          }

          resolve();
        } catch (error) {
          console.error('❌ Error parsing response:', error.message);
          console.error('❌ Raw response:', data);
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Request Error:', error.message);
      reject(error);
    });

    req.end();
  });
}

testMediaAPI().catch(console.error);
