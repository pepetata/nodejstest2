const fetch = require('node-fetch');

const token =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxOGVlYzFkOC04ZTJhLTRkZjAtOGFjMS0zNTVhZjgwMmIzYmMiLCJ1c2VybmFtZSI6Im93bmVyIiwicmVzdGF1cmFudElkIjoiYzc3NDI4NjYtZjc3Yi00ZjY4LTg1ODYtNTdkNjMxYWYzMDFhIiwiaWF0IjoxNzM3ODEwMjczLCJleHAiOjE3Mzc4OTY2NzN9.ZnJCW6GDLhXyR-FoopGOFa8_hTPcMLwqXbHMKPM1Azs';

async function testMenuItemsAPI() {
  try {
    console.log('Testing Menu Items API...\n');

    // Test GET all menu items
    console.log('1. Testing GET /api/v1/menu-items');
    const response = await fetch('http://localhost:5000/api/v1/menu-items', {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('Status:', response.status);
    const data = await response.json();
    console.log('Response:', JSON.stringify(data, null, 2));

    if (data.data && data.data.length > 0) {
      const firstItem = data.data[0];
      console.log('\n2. Testing GET single menu item');
      const singleResponse = await fetch(
        `http://localhost:5000/api/v1/menu-items/${firstItem.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('Single item status:', singleResponse.status);
      const singleData = await singleResponse.json();
      console.log('Single item response:', JSON.stringify(singleData, null, 2));
    }
  } catch (error) {
    console.error('Error testing API:', error.message);
  }
}

testMenuItemsAPI();
