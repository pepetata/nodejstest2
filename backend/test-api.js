const jwt = require('jsonwebtoken');

// Generate a valid token for the user
const token = jwt.sign(
  {
    userId: 'cac1c5de-58d8-437a-af5b-3de78830125a',
    email: 'flavio_luiz_ferreira@hotmail.com',
    restaurantId: 'c7742866-f77b-4f68-8586-57d631af301a',
  },
  'dev-secret-key',
  { expiresIn: '1h' }
);

console.log('Generated token:', token);

// Test the API
async function testAPI() {
  try {
    const response = await fetch('http://localhost:5000/api/v1/menu/categories', {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    console.log('API Response:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testAPI();
