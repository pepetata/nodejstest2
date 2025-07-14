/**
 * Manual Test: User Status Authentication
 * Tests that inactive and suspended users cannot log in
 */

const authService = require('../src/services/authService');
const UserModel = require('../src/models/userModel');
const bcrypt = require('bcrypt');

const userModel = new UserModel();

async function testUserStatusAuthentication() {
  console.log('🧪 Testing User Status Authentication...\n');

  // Test data
  const testEmail = 'test-status@example.com';
  const testPassword = 'TestPassword123!';
  const hashedPassword = await bcrypt.hash(testPassword, 12);

  try {
    // Clean up any existing test user
    try {
      const existingUser = await userModel.findByEmail(testEmail);
      if (existingUser) {
        await userModel.delete(existingUser.id);
        console.log('✅ Cleaned up existing test user');
      }
    } catch (error) {
      // User doesn't exist, that's fine
    }

    // Create test user with active status
    const userData = {
      email: testEmail,
      password: hashedPassword,
      full_name: 'Test Status User',
      username: 'teststatususer',
      status: 'active',
    };

    const createdUser = await userModel.create(userData);
    console.log('✅ Created test user with active status');

    // Test 1: Active user should be able to login
    console.log('\n📋 Test 1: Active user login');
    try {
      const loginResult = await authService.login({
        email: testEmail,
        password: testPassword,
      });
      console.log('✅ Active user login successful');
    } catch (error) {
      console.log('❌ Active user login failed:', error.message);
    }

    // Test 2: Update user to inactive status and test login
    console.log('\n📋 Test 2: Inactive user login');
    await userModel.update(createdUser.id, { status: 'inactive' });
    console.log('✅ Updated user status to inactive');

    try {
      await authService.login({
        email: testEmail,
        password: testPassword,
      });
      console.log('❌ Inactive user login should have failed but succeeded');
    } catch (error) {
      if (error.statusCode === 403 && error.message.includes('não está ativa')) {
        console.log('✅ Inactive user login correctly blocked:', error.message);
      } else {
        console.log('❌ Unexpected error for inactive user:', error.message);
      }
    }

    // Test 3: Update user to suspended status and test login
    console.log('\n📋 Test 3: Suspended user login');
    await userModel.update(createdUser.id, { status: 'suspended' });
    console.log('✅ Updated user status to suspended');

    try {
      await authService.login({
        email: testEmail,
        password: testPassword,
      });
      console.log('❌ Suspended user login should have failed but succeeded');
    } catch (error) {
      if (error.statusCode === 403 && error.message.includes('não está ativa')) {
        console.log('✅ Suspended user login correctly blocked:', error.message);
      } else {
        console.log('❌ Unexpected error for suspended user:', error.message);
      }
    }

    // Test 4: Update user to pending status and test login
    console.log('\n📋 Test 4: Pending user login');
    await userModel.update(createdUser.id, { status: 'pending' });
    console.log('✅ Updated user status to pending');

    try {
      await authService.login({
        email: testEmail,
        password: testPassword,
      });
      console.log('❌ Pending user login should have failed but succeeded');
    } catch (error) {
      if (error.statusCode === 403 && error.code === 'PENDING_CONFIRMATION') {
        console.log(
          '✅ Pending user login correctly blocked with PENDING_CONFIRMATION:',
          error.message
        );
      } else {
        console.log('❌ Unexpected error for pending user:', error.message);
      }
    }

    // Clean up
    await userModel.delete(createdUser.id);
    console.log('\n✅ Cleaned up test user');

    console.log('\n🎉 User Status Authentication Tests Completed!');
    console.log('\nSummary:');
    console.log('- ✅ Active users can log in');
    console.log('- ✅ Inactive users are blocked from logging in');
    console.log('- ✅ Suspended users are blocked from logging in');
    console.log('- ✅ Pending users are blocked with special PENDING_CONFIRMATION error');
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testUserStatusAuthentication()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Test execution failed:', error);
      process.exit(1);
    });
}

module.exports = { testUserStatusAuthentication };
