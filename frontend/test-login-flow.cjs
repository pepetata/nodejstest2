// Test login flow for padre4 (inactive restaurant)
const http = require('http');
const querystring = require('querystring');

function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: JSON.parse(data)
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: data
          });
        }
      });
    });
    
    req.on('error', (err) => {
      reject(err);
    });
    
    if (postData) {
      req.write(postData);
    }
    
    req.end();
  });
}

async function testLogin() {
  console.log('Testing login for padre4 (inactive restaurant)...');
  
  try {
    // First, test login with flavio_luiz_ferreira@hotmail.com (padre restaurant)
    const loginData = querystring.stringify({
      email: 'flavio_luiz_ferreira@hotmail.com',
      password: '12345678'
    });
    
    const loginOptions = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(loginData)
      }
    };
    
    const loginResponse = await makeRequest(loginOptions, loginData);
    console.log('Login response status:', loginResponse.status);
    console.log('Login response data:', loginResponse.data);
    
    if (loginResponse.status === 200 && loginResponse.data.token) {
      console.log('✅ Login successful!');
      console.log('User role:', loginResponse.data.user.role);
      console.log('User restaurant:', loginResponse.data.restaurant?.restaurant_url_name);
      
      // Now test restaurant validation for padre4
      const padre4Response = await makeRequest({
        hostname: 'localhost',
        port: 5000,
        path: '/api/restaurants/by-url/padre4',
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${loginResponse.data.token}`
        }
      });
      
      console.log('\nRestaurant padre4 data:');
      console.log('Status:', padre4Response.data.data.status);
      console.log('Name:', padre4Response.data.data.restaurant_name);
      
      console.log('\n🎯 Expected behavior for padre4.localhost:3000:');
      console.log('- Should show admin interface (user is admin)');
      console.log('- Should show inactive modal (restaurant status is inactive)');
      console.log('- Modal should say "Restaurante do Padre" is inactive');
      
    } else {
      console.log('❌ Login failed');
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testLogin();
