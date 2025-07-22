require('dotenv').config();
const AuthService = require('./src/services/authService');

// Test login with all different users
async function testUsers() {
  console.log('=== COMPREHENSIVE LOGIN TESTING ===');
  console.log('Testing all users with password: 12345678\n');

  const users = [
    {
      identifier: 'flavio_luiz_ferreira@hotmail.com',
      description: 'restaurant administrator, single location (padre)',
    },
    {
      identifier: 'joaores',
      description: 'restaurant administrator, single location, single role (padre)',
    },
    {
      identifier: 'joao1',
      description: 'restaurant administrator, single location, multiple roles (padre)',
    },
    {
      identifier: 'flavio_luiz_ferreira_chain@hotmail.com',
      description: 'restaurant administrator, multiple location (padre2)',
    },
  ];

  for (const user of users) {
    console.log('='.repeat(80));
    console.log(`Testing: ${user.identifier}`);
    console.log(`Expected: ${user.description}`);
    console.log('='.repeat(80));

    try {
      const result = await AuthService.login({
        email: user.identifier,
        password: '12345678',
      });

      console.log('✅ LOGIN SUCCESSFUL');
      console.log('User ID:', result.user.id);
      console.log('Full Name:', result.user.full_name);
      console.log('Email:', result.user.email || 'N/A');
      console.log('Username:', result.user.username || 'N/A');
      console.log('Status:', result.user.status);

      // Restaurant info
      if (result.restaurant) {
        console.log('Restaurant:', result.restaurant.name);
        console.log('Restaurant URL:', result.restaurant.url);
        console.log('Business Type:', result.restaurant.business_type);
      } else {
        console.log('Restaurant: Not found in response');
      }

      // Role information
      console.log('Total Roles:', result.user.roles?.length || 0);
      console.log('Primary Role:', result.user.primaryRole?.role_display_name || 'N/A');
      console.log('Is Admin:', result.user.is_admin || false);

      if (result.user.roles && result.user.roles.length > 0) {
        console.log('All Roles:');
        result.user.roles.forEach((role, index) => {
          console.log(`  ${index + 1}. ${role.role_display_name} (${role.role_name})`);
          console.log(`     Level: ${role.role_level}, Admin: ${role.is_admin_role}`);
          if (role.location_name) {
            console.log(`     Location: ${role.location_name}`);
          }
        });
      }

      // Location information
      if (result.user.locations && result.user.locations.length > 0) {
        console.log('Accessible Locations:', result.user.locations.length);
        result.user.locations.forEach((location, index) => {
          console.log(`  ${index + 1}. ${location.name} (ID: ${location.id})`);
        });
      } else {
        console.log('Accessible Locations: 0');
      }
    } catch (error) {
      console.log('❌ LOGIN FAILED');
      console.log('Error:', error.message);
      console.log('Error Code:', error.code || 'N/A');
    }

    console.log('\n');
  }

  console.log('=== TESTING COMPLETE ===');
}

testUsers().catch(console.error);
