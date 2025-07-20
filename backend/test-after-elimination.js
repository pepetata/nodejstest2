// Test script to verify everything works after eliminating user_location_assignments
// Run: node test-after-elimination.js

// Set correct DB credentials
process.env.DB_USER = 'admin';
process.env.DB_PASSWORD = 'admin';
process.env.DB_NAME = 'alacarte_dev';

const UserService = require('./src/services/userService');

async function testAfterElimination() {
  try {
    console.log('=== Testing UserService after elimination ===\n');

    const userService = new UserService();

    // Test 1: Get users with role_location_pairs (frontend data structure)
    console.log('Test 1: Getting users with role_location_pairs...');
    try {
      // Create a mock superadmin user for testing
      const mockCurrentUser = {
        id: 'test-user-id',
        role: 'superadmin', // Superadmin can see all users
        restaurant_id: null,
      };

      const users = await userService.getUsers(
        {
          limit: 3,
          sortBy: 'full_name',
          sortOrder: 'ASC',
        },
        mockCurrentUser
      );

      console.log(`✅ Found ${users.users.length} users`);

      users.users.forEach((user) => {
        console.log(`User: ${user.full_name}`);
        console.log(`Role-Location pairs: ${user.role_location_pairs.length} pairs`);
        if (user.role_location_pairs.length > 0) {
          user.role_location_pairs.forEach((pair) => {
            console.log(`  - ${pair.role_display_name} at ${pair.location_name}`);
          });
        }
        console.log('---');
      });
    } catch (error) {
      console.error('❌ Error in Test 1:', error.message);
    }

    // Test 2: Get accessible locations for a user
    console.log('\nTest 2: Getting accessible locations for a user...');
    try {
      // Create a mock superadmin user for testing
      const mockCurrentUser = {
        id: 'test-user-id',
        role: 'superadmin',
        restaurant_id: null,
      };

      // Get first user ID
      const users = await userService.getUsers({ limit: 1 }, mockCurrentUser);
      if (users.users.length > 0) {
        const userId = users.users[0].id;
        const locations = await userService.getUserAccessibleLocations(userId);

        console.log(
          `✅ User ${users.users[0].full_name} has access to ${locations.length} locations`
        );
        locations.forEach((location) => {
          console.log(`  - ${location.name} (${location.access_level} access)`);
        });
      }
    } catch (error) {
      console.error('❌ Error in Test 2:', error.message);
    }

    // Test 3: Get primary location for a user
    console.log('\nTest 3: Getting primary location for a user...');
    try {
      const mockCurrentUser = {
        id: 'test-user-id',
        role: 'superadmin',
        restaurant_id: null,
      };

      const users = await userService.getUsers({ limit: 1 }, mockCurrentUser);
      if (users.users.length > 0) {
        const userId = users.users[0].id;
        const primaryLocation = await userService.getUserPrimaryLocation(userId);

        if (primaryLocation) {
          console.log(`✅ Primary location: ${primaryLocation.location_name}`);
        } else {
          console.log('⚠️ No primary location found');
        }
      }
    } catch (error) {
      console.error('❌ Error in Test 3:', error.message);
    }

    // Test 4: Verify table doesn't exist
    console.log('\nTest 4: Verifying user_location_assignments table is gone...');
    try {
      const db = require('./src/config/db');
      const tableCheck = await db.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_name = 'user_location_assignments'
        );
      `);

      if (tableCheck.rows[0].exists) {
        console.log('❌ Table still exists!');
      } else {
        console.log('✅ user_location_assignments table successfully removed');
      }
    } catch (error) {
      console.error('❌ Error in Test 4:', error.message);
    }

    console.log('\n🎉 All tests completed!');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    process.exit(0);
  }
}

testAfterElimination();
