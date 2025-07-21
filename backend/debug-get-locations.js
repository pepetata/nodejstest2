// Load environment variables
require('dotenv').config();

const UserService = require('./src/services/userService');

async function testGetAvailableLocations() {
  console.log('🔍 Testing getAvailableLocations method directly...');

  try {
    const userService = new UserService();

    // Mock user data based on what we know works
    const mockUser = {
      id: 'cac1c5de-58d8-437a-af5b-3de78830125a',
      email: 'flavio_luiz_ferreira@hotmail.com',
      restaurant_id: 'c7742866-f77b-4f68-8586-57d631af301a',
      role: 'restaurant_administrator',
      primaryRole: {
        role_name: 'restaurant_administrator',
      },
    };

    console.log('📤 Mock user:', JSON.stringify(mockUser, null, 2));

    const locations = await userService.getAvailableLocations(mockUser);

    console.log('✅ Successfully retrieved locations');
    console.log(`📍 Found ${locations.length} locations:`);
    console.log(JSON.stringify(locations, null, 2));
  } catch (error) {
    console.error('❌ Error testing getAvailableLocations:');
    console.error('Message:', error.message);
    console.error('Stack:', error.stack);
  }
}

testGetAvailableLocations();
