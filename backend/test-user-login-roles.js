process.env.DB_NAME = 'alacarte_dev';
process.env.DB_PASSWORD = 'admin';

const UserModel = require('./src/models/userModel');
const UserRoleModel = require('./src/models/UserRoleModel');
const UserService = require('./src/services/userService');
const bcrypt = require('bcrypt');

async function testUserLoginAndRoles() {
  console.log('🔍 TESTING USER LOGIN AND ROLES');
  console.log('='.repeat(50));

  const userModel = new UserModel();
  const userRoleModel = new UserRoleModel();
  const userService = new UserService();

  const testUsers = [
    { identifier: 'joaores', password: '12345678' },
    { identifier: 'joao1', password: '12345678' },
  ];

  for (const testUser of testUsers) {
    console.log(`\n📝 Testing user: ${testUser.identifier}`);
    console.log('-'.repeat(30));

    try {
      // Try to find user by email first, then by username
      let user = await userModel.findByEmail(testUser.identifier);
      if (!user) {
        user = await userModel.findByUsername(testUser.identifier);
      }

      if (!user) {
        console.log(`❌ User '${testUser.identifier}' not found`);
        continue;
      }

      console.log(
        `✅ User found: ${user.full_name || user.username} (${user.email || 'no email'})`
      );
      console.log(`   Status: ${user.status}`);
      console.log(`   User ID: ${user.id}`);

      // Test password verification
      try {
        if (user.password) {
          const isValidPassword = await bcrypt.compare(testUser.password, user.password);
          console.log(`   Password check: ${isValidPassword ? '✅ Valid' : '❌ Invalid'}`);
        } else {
          console.log(`   Password check: ❌ No password in database`);
        }
      } catch (pwError) {
        console.log(`   Password check: ❌ Error - ${pwError.message}`);
      }

      // Test login query (findUserForLogin only works with email)
      if (user.email) {
        try {
          const loginData = await userModel.findUserForLogin(user.email);
          if (loginData) {
            console.log(`   Login query (email): ✅ Success`);
            console.log(`   Primary role: ${loginData.role || 'None'}`);
            console.log(`   Is admin: ${loginData.is_admin ? '✅ Yes' : '❌ No'}`);
            console.log(`   Restaurant: ${loginData.restaurant?.name || 'None'}`);
          } else {
            console.log(`   Login query (email): ❌ Failed`);
          }
        } catch (loginError) {
          console.log(`   Login query (email): ❌ Error - ${loginError.message}`);
        }
      } else {
        console.log(`   Login query: ⚠️  Skipped (no email, findUserForLogin requires email)`);

        // Test findByIdWithRestaurant instead for username-only users
        try {
          const userWithRestaurant = await userModel.findByIdWithRestaurant(user.id);
          if (userWithRestaurant) {
            console.log(`   findByIdWithRestaurant: ✅ Success`);
            console.log(`   Primary role: ${userWithRestaurant.role || 'None'}`);
            console.log(`   Is admin: ${userWithRestaurant.is_admin ? '✅ Yes' : '❌ No'}`);
            console.log(`   Restaurant: ${userWithRestaurant.restaurant?.name || 'None'}`);
          }
        } catch (idError) {
          console.log(`   findByIdWithRestaurant: ❌ Error - ${idError.message}`);
        }
      }

      // Get primary role
      try {
        const primaryRole = await userRoleModel.getUserPrimaryRole(user.id);
        if (primaryRole) {
          console.log(`   Primary role details:`);
          console.log(`     Role: ${primaryRole.role_name}`);
          console.log(`     Level: ${primaryRole.role_level}`);
          console.log(`     Is admin role: ${primaryRole.is_admin_role ? '✅ Yes' : '❌ No'}`);
          console.log(`     Location: ${primaryRole.location_name || 'None'}`);
        } else {
          console.log(`   Primary role: ❌ None found`);
        }
      } catch (roleError) {
        console.log(`   Primary role: ❌ Error - ${roleError.message}`);
      }

      // Get all roles
      try {
        const allRoles = await userRoleModel.getUserRoles(user.id);
        console.log(`   All roles (${allRoles.length}):`);
        allRoles.forEach((role, index) => {
          console.log(`     ${index + 1}. ${role.role_name} (Level: ${role.role_level})`);
          console.log(`        Location: ${role.location_name || 'None'}`);
          console.log(`        Admin: ${role.is_admin_role ? 'Yes' : 'No'}`);
        });
      } catch (rolesError) {
        console.log(`   All roles: ❌ Error - ${rolesError.message}`);
      }

      // Test UserService admin check methods
      try {
        const isAdmin = userService.isAdmin(user);
        console.log(`   UserService.isAdmin(): ${isAdmin ? '✅ Yes' : '❌ No'}`);

        const isSuperAdmin = userService.isSuperAdmin(user);
        console.log(`   UserService.isSuperAdmin(): ${isSuperAdmin ? '✅ Yes' : '❌ No'}`);
      } catch (serviceError) {
        console.log(`   UserService checks: ❌ Error - ${serviceError.message}`);
      }
    } catch (error) {
      console.error(`❌ Error testing user '${testUser.identifier}': ${error.message}`);
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('🎉 User testing completed!');
}

testUserLoginAndRoles()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });
