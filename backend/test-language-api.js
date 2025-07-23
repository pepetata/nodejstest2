const token =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIwNTMzZWFjNi1kNGFiLTQwM2EtOTg1Zi0zMmU0OWI4MGZiZTIiLCJpYXQiOjE3NTMyOTU4MTQsImV4cCI6MTc1MzM4MjIxNH0.8wVoyjdeTwVReC-Dalcpk1VyeAwJb6aHcbdzPsy6i0g';
const restaurantId = 'c7742866-f77b-4f68-8586-57d631af301a';

async function testLanguageAPI() {
  console.log('Testing Language API endpoints...\n');

  // Test 1: Get available languages
  console.log('1. Testing GET /api/v1/languages/available');
  try {
    const response = await fetch('http://localhost:5000/api/v1/languages/available', {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('Status:', response.status);
    const data = await response.json();
    console.log('Response:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test 2: Get restaurant languages
  console.log(`2. Testing GET /api/v1/restaurants/${restaurantId}/languages`);
  try {
    const response = await fetch(
      `http://localhost:5000/api/v1/restaurants/${restaurantId}/languages`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('Status:', response.status);
    const data = await response.json();
    console.log('Response:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testLanguageAPI();
