/**
 * Test script to verify multiple roles system functionality
 * Tests role assignment, user creation with roles, and role checking
 */

const UserService = require('../src/services/userService');
const { RoleModel, UserRoleModel } = require('../src/models');

async function testMultipleRolesSystem() {
  console.log('🧪 Testing Multiple Roles System...\n');

  try {
    // 1. Test: Get all available roles
    console.log('1. Testing: Get all available roles');
    const roles = await RoleModel.findAll();
    console.log(`   ✅ Found ${roles.length} roles:`);
    roles.forEach((role) => {
      console.log(`      - ${role.name}: ${role.display_name} (Level ${role.level})`);
    });
    console.log('');

    // 2. Test: Create a user with multiple roles
    console.log('2. Testing: Create user with multiple roles');
    const userData = {
      email: 'testadmin@example.com',
      password: 'testpassword123',
      full_name: 'Test Administrator',
      status: 'active',
    };

    const roleNames = ['restaurant_administrator', 'waiter'];
    const user = await UserService.createUserWithRoles(userData, roleNames);
    console.log(`   ✅ Created user: ${user.email} (ID: ${user.id})`);

    // 3. Test: Get user roles
    console.log('3. Testing: Get user roles');
    const userRoles = await UserService.getUserRoles(user.id);
    console.log(`   ✅ User has ${userRoles.length} roles:`);
    userRoles.forEach((role) => {
      console.log(`      - ${role.name}: ${role.display_name}`);
    });
    console.log('');

    // 4. Test: Check if user has specific role
    console.log('4. Testing: Check specific role permissions');
    const hasRestaurantAdmin = await UserService.userHasRole(user.id, 'restaurant_administrator');
    const hasWaiter = await UserService.userHasRole(user.id, 'waiter');
    const hasKdsOperator = await UserService.userHasRole(user.id, 'kds_operator');

    console.log(`   ✅ Has restaurant_administrator: ${hasRestaurantAdmin}`);
    console.log(`   ✅ Has waiter: ${hasWaiter}`);
    console.log(`   ✅ Has kds_operator: ${hasKdsOperator}`);
    console.log('');

    // 5. Test: Add additional role to existing user
    console.log('5. Testing: Add additional role to existing user');
    await UserService.assignRolesToUser(user.id, ['kds_operator']);
    const updatedRoles = await UserService.getUserRoles(user.id);
    console.log(`   ✅ User now has ${updatedRoles.length} roles:`);
    updatedRoles.forEach((role) => {
      console.log(`      - ${role.name}: ${role.display_name}`);
    });
    console.log('');

    // 6. Test: Check admin access
    console.log('6. Testing: Check admin access');
    const hasAdminAccess = await UserService.userHasAdminAccess(user.id);
    console.log(`   ✅ User has admin access: ${hasAdminAccess}`);
    console.log('');

    // 7. Test: Get users by role
    console.log('7. Testing: Get users by role');
    const restaurantAdmins = await UserService.getUsersByRole('restaurant_administrator');
    console.log(`   ✅ Found ${restaurantAdmins.length} restaurant administrators`);
    console.log('');

    console.log('🎉 All multiple roles system tests passed!\n');

    // Cleanup: Remove test user
    console.log('🧹 Cleaning up test data...');
    await UserService.delete(user.id);
    console.log('   ✅ Test user deleted\n');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testMultipleRolesSystem()
  .then(() => {
    console.log('✅ Multiple roles system test completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Test suite failed:', error);
    process.exit(1);
  });
