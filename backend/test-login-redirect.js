/**
 * Test login response structure for frontend redirect debugging
 */

const http = require('http');

const loginData = JSON.stringify({
  email: 'admin@pizzariabellavista.com.br',
  password: '12345678',
});

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/v1/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(loginData),
  },
};

console.log('🧪 Testing login response structure for redirect...\n');

const req = http.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const response = JSON.parse(data);

      console.log('✅ Login Response Structure:');
      console.log('- Status:', res.statusCode);
      console.log('- User ID:', response.user?.id);
      console.log('- User Email:', response.user?.email);
      console.log('- User Role:', response.user?.role);
      console.log('- Restaurant Name:', response.restaurant?.name);
      console.log('- Restaurant URL (subdomain):', response.restaurant?.url);
      console.log('- Token present:', !!response.token);

      console.log('\n🔄 Frontend Redirect Logic:');
      console.log('- resultAction.payload?.restaurant?.url:', response.restaurant?.url);
      console.log(
        '- Expected redirect URL:',
        `http://${response.restaurant?.url}.localhost:3000/admin?token=${encodeURIComponent(response.token)}&auth=true`
      );

      console.log('\n📊 Roles and Locations:');
      console.log('- Roles count:', response.user?.roles?.length || 0);
      console.log('- Locations count:', response.user?.locations?.length || 0);

      if (response.user?.roles?.length > 0) {
        console.log(
          '- Primary role:',
          response.user.roles.find((r) => r.is_primary_role)?.role_name || 'None'
        );
      }
    } catch (error) {
      console.error('Error parsing response:', error);
      console.log('Raw response:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('Request error:', error);
});

req.write(loginData);
req.end();
