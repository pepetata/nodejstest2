// Manual test to check token authentication
// This simulates what the frontend should be doing

// You can get the token from browser localStorage by opening dev tools and running:
// localStorage.getItem('token') || sessionStorage.getItem('token')

const http = require('http');

// Replace this with the actual token from your browser
const TOKEN = 'YOUR_TOKEN_HERE'; // You need to replace this with the actual token

async function testAuthenticatedAPI() {
  return new Promise((resolve, reject) => {
    const restaurantId = '8181755a-6312-4835-b6cd-8e0c3fb30b0c';

    console.log('🔍 Testing authenticated media API endpoint...');
    console.log('Restaurant ID:', restaurantId);
    console.log('Token:', TOKEN.substring(0, 20) + '...');

    const options = {
      hostname: 'localhost',
      port: 5000,
      path: `/api/v1/restaurants/${restaurantId}/media`,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${TOKEN}`,
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
              console.log('🔒 Authentication failed - token may be invalid or expired');
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

if (TOKEN === 'YOUR_TOKEN_HERE') {
  console.log('⚠️  Please replace TOKEN with the actual token from your browser');
  console.log(
    '⚠️  Open browser dev tools and run: localStorage.getItem("token") || sessionStorage.getItem("token")'
  );
} else {
  testAuthenticatedAPI().catch(console.error);
}
