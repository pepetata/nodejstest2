// Debug getUserRoleLocationPairs method
require('dotenv').config();
const UserService = require('./src/services/userService');

async function debugUserRoleLocationPairs() {
  console.log('🔍 Testing getUserRoleLocationPairs method...');

  const mockUser = {
    id: 'cac1c5de-58d8-437a-af5b-3de78830125a',
    user_id: 'cac1c5de-58d8-437a-af5b-3de78830125a',
    email: 'flavio_luiz_ferreira@hotmail.com',
    restaurant_id: 'c7742866-f77b-4f68-8586-57d631af301a',
    role: 'restaurant_administrator',
  };

  try {
    const userService = new UserService();

    console.log('📊 Testing with user:', JSON.stringify(mockUser, null, 2));

    console.log('🔍 Calling getUserRoleLocationPairs...');
    const pairs = await userService.getUserRoleLocationPairs(mockUser.id);

    console.log(`✅ Retrieved ${pairs.length} role-location pairs:`);
    pairs.forEach((pair, index) => {
      console.log(
        `   ${index + 1}. Role: ${pair.role_name}, Restaurant: ${pair.restaurant_id}, Location: ${pair.location_id}`
      );
    });

    // Now test the restaurant query directly
    console.log('\n🔍 Testing direct restaurant query...');
    const restaurantIds = [mockUser.restaurant_id];
    console.log('Restaurant IDs to query:', restaurantIds);

    const query = `
          SELECT id, name, restaurant_id, address_street, address_city, address_state, is_primary
          FROM restaurant_locations
          WHERE restaurant_id = ANY($1::uuid[])
          ORDER BY name ASC
        `;

    const result = await userService.db.query(query, [restaurantIds]);
    console.log(`✅ Direct query returned ${result.rows.length} locations:`);
    result.rows.forEach((location, index) => {
      console.log(`   ${index + 1}. ${location.name} (ID: ${location.id})`);
    });
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

debugUserRoleLocationPairs();
