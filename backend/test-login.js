// Test login to get a valid token
const bcrypt = require('bcrypt');

// Test login using the auth service
async function testLogin() {
  try {
    console.log('🔍 Testing login to get valid token...');

    // Use fetch to call the login endpoint
    const response = await fetch('http://localhost:3000/api/v1/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'flavio_luiz_ferreira@hotmail.com', // User's actual email
        password: '12345678', // User's actual password
      }),
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ Login successful!');
      console.log('✅ Token:', data.token);
      console.log('✅ User:', data.user);
      console.log('✅ Restaurant:', data.restaurant);

      // Now test the media API with the valid token
      return await testMediaApiWithToken(data.token);
    } else {
      console.log('❌ Login failed:', data);

      // Try another common email/password combination
      return await testAlternativeLogin();
    }
  } catch (error) {
    console.error('❌ Login error:', error.message);
    return await testAlternativeLogin();
  }
}

async function testAlternativeLogin() {
  try {
    console.log('🔍 Trying alternative login credentials...');

    const response = await fetch('http://localhost:3000/api/v1/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@test.com',
        password: '123456',
      }),
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ Alternative login successful!');
      console.log('✅ Token:', data.token);
      return await testMediaApiWithToken(data.token);
    } else {
      console.log('❌ Alternative login failed:', data);
      console.log('ℹ️  You may need to create a user first or check existing users');
      return null;
    }
  } catch (error) {
    console.error('❌ Alternative login error:', error.message);
    return null;
  }
}

async function testMediaApiWithToken(token) {
  try {
    console.log('\n🔍 Testing media API with valid token...');

    const restaurantId = '8181755a-6312-4835-b6cd-8e0c3fb30b0c';
    const response = await fetch(`http://localhost:3000/api/v1/restaurants/${restaurantId}/media`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    console.log('✅ Media API Response Status:', response.status);
    console.log('✅ Media API Response:', JSON.stringify(data, null, 2));

    return data;
  } catch (error) {
    console.error('❌ Media API error:', error.message);
    return null;
  }
}

// Run the test
testLogin();
