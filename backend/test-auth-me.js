/**
 * Simple test to view the complete /auth/me response
 */

const https = require('http');

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/v1/auth/me',
  method: 'GET',
  headers: {
    Authorization:
      'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI3NzBlODQwMC1lMjliLTQxZDQtYTcxNi00NDY2NTU0NDAwMDEiLCJpYXQiOjE3NTI0ODQ4MDAsImV4cCI6MTc1MjU3MTIwMH0.JX7dHwr9KHts6B438m7Ja_Lt72pPgHKvpyanFvWpboU',
    'Content-Type': 'application/json',
  },
};

const req = https.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      console.log('🎉 /auth/me Response:');
      console.log(JSON.stringify(response, null, 2));

      if (response.user) {
        console.log('\n📊 Summary:');
        console.log('- User ID:', response.user.id);
        console.log('- Email:', response.user.email);
        console.log('- Primary Role:', response.user.role);
        console.log('- Is Admin:', response.user.is_admin);
        console.log('- Roles Count:', response.user.roles?.length || 0);
        console.log('- Locations Count:', response.user.locations?.length || 0);

        if (response.user.roles && response.user.roles.length > 0) {
          console.log('\n👤 User Roles:');
          response.user.roles.forEach((role, index) => {
            console.log(`  ${index + 1}. ${role.role_name} (${role.role_display_name})`);
          });
        }

        if (response.user.locations && response.user.locations.length > 0) {
          console.log('\n📍 Accessible Locations:');
          response.user.locations.forEach((location, index) => {
            console.log(`  ${index + 1}. ${location.name} (${location.access_level})`);
          });
        }
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

req.end();
