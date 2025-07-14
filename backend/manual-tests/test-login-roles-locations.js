/**
 * Manual Test: Login with Roles and Locations
 * Tests that login returns user roles and accessible locations
 */

const authService = require('../src/services/authService');
const UserService = require('../src/services/userService');

const userService = new UserService();

async function testLoginWithRolesAndLocations() {
  console.log('🧪 Testing Login with Roles and Locations...\n');

  try {
    // Test with a known user (you may need to adjust the email based on your data)
    const testEmail = 'admin@pizzariabellavista.com.br'; // Adjust this to an existing user
    const testPassword = '12345678'; // Adjust this to the correct password

    console.log('📋 Test: Login and check roles/locations');
    console.log(`Attempting login with: ${testEmail}`);

    try {
      const loginResult = await authService.login({
        email: testEmail,
        password: testPassword,
      });

      console.log('✅ Login successful!');
      console.log('\n📊 Login Response Structure:');
      console.log('- User ID:', loginResult.user.id);
      console.log('- Email:', loginResult.user.email);
      console.log('- Primary Role:', loginResult.user.role);
      console.log('- Is Admin:', loginResult.user.is_admin);
      console.log('- Roles Count:', loginResult.user.roles?.length || 0);
      console.log('- Locations Count:', loginResult.user.locations?.length || 0);

      if (loginResult.user.roles && loginResult.user.roles.length > 0) {
        console.log('\n👤 User Roles:');
        loginResult.user.roles.forEach((role, index) => {
          console.log(`  ${index + 1}. Role: ${role.role_name}`);
          console.log(`     Display: ${role.role_display_name}`);
          console.log(`     Restaurant: ${role.restaurant_name || 'N/A'}`);
          console.log(`     Location: ${role.location_name || 'N/A'}`);
          console.log(`     Is Primary: ${role.is_primary_role}`);
          console.log(`     Is Admin: ${role.is_admin_role}`);
          console.log('');
        });
      } else {
        console.log('\n⚠️  No roles found for user');
      }

      if (loginResult.user.locations && loginResult.user.locations.length > 0) {
        console.log('\n📍 Accessible Locations:');
        loginResult.user.locations.forEach((location, index) => {
          console.log(`  ${index + 1}. Location: ${location.name}`);
          console.log(`     URL Name: ${location.url_name}`);
          console.log(`     Access Level: ${location.access_level}`);
          console.log(`     Via Role: ${location.via_role}`);
          console.log(`     Address: ${location.address || 'N/A'}`);
          console.log('');
        });
      } else {
        console.log('\n⚠️  No accessible locations found');
      }

      if (loginResult.restaurant) {
        console.log('\n🏪 Restaurant Info:');
        console.log('- Restaurant ID:', loginResult.restaurant.id);
        console.log('- Restaurant Name:', loginResult.restaurant.name);
        console.log('- Restaurant URL:', loginResult.restaurant.url);
      }
    } catch (error) {
      if (error.statusCode === 401) {
        console.log('❌ Login failed: Invalid credentials');
        console.log('💡 Please check if the test email/password exists in your database');
      } else {
        console.log('❌ Login failed:', error.message);
        console.log('Error details:', error);
      }
    }

    console.log('\n🎉 Test completed!');
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testLoginWithRolesAndLocations()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Test execution failed:', error);
      process.exit(1);
    });
}

module.exports = { testLoginWithRolesAndLocations };
