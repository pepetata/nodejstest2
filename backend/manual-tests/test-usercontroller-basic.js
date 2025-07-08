/**
 * Test script for User Controller
 * Tests basic user management operations
 */
require('dotenv').config();
const axios = require('axios');
const jwt = require('jsonwebtoken');

// Test configuration
const API_URL = process.env.API_URL || 'http://localhost:5000/api';
const JWT_SECRET = process.env.JWT_SECRET || 'test_secret';

// Test admin user for token generation
const testAdminUser = {
  id: '550e8400-e29b-41d4-a716-446655440000', // Test UUID
  email: 'admin@test.com',
  role: 'restaurant_administrator',
  restaurant_id: '550e8400-e29b-41d4-a716-446655440001', // Test restaurant UUID
};

// Generate a valid JWT token for testing
function generateToken(user) {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
      restaurantId: user.restaurant_id,
    },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
}

// Test data for user creation
const newUserData = {
  email: `test_user_${Date.now()}@example.com`,
  password: 'Password123!',
  full_name: 'Test User',
  role: 'waiter',
  restaurant_id: '550e8400-e29b-41d4-a716-446655440001', // Test restaurant UUID
};

// Run tests
async function runTests() {
  try {
    console.log('🔍 Starting User Controller tests...');
    console.log('----------------------------------');

    const token = generateToken(testAdminUser);

    // 1. Create User Test
    console.log('Test 1: Creating a new user');
    try {
      const createResponse = await axios.post(`${API_URL}/v1/users`, newUserData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('✅ User created successfully:');
      console.log(`   User ID: ${createResponse.data.data.id}`);
      console.log(`   Name: ${createResponse.data.data.full_name}`);
      console.log(`   Role: ${createResponse.data.data.role}`);

      // Store user ID for subsequent tests
      const createdUserId = createResponse.data.data.id;

      // 2. Get User Test
      console.log('\nTest 2: Retrieving the created user');
      try {
        const getUserResponse = await axios.get(`${API_URL}/v1/users/${createdUserId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        console.log('✅ User retrieved successfully:');
        console.log(`   Name: ${getUserResponse.data.data.full_name}`);
        console.log(`   Email: ${getUserResponse.data.data.email}`);

        // 3. Update User Test
        console.log('\nTest 3: Updating user information');
        try {
          const updateResponse = await axios.patch(
            `${API_URL}/v1/users/${createdUserId}`,
            {
              full_name: 'Updated Test User',
              status: 'active',
            },
            {
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            }
          );

          console.log('✅ User updated successfully:');
          console.log(`   New name: ${updateResponse.data.data.full_name}`);
          console.log(`   Status: ${updateResponse.data.data.status}`);

          // 4. Get Users by Restaurant Test
          console.log('\nTest 4: Get users by restaurant');
          try {
            const getUsersResponse = await axios.get(
              `${API_URL}/v1/users/restaurant/${testAdminUser.restaurant_id}`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );

            console.log('✅ Users retrieved successfully:');
            console.log(`   Total users: ${getUsersResponse.data.data.length}`);

            // 5. Delete User Test
            console.log('\nTest 5: Deleting user (soft delete)');
            try {
              const deleteResponse = await axios.delete(`${API_URL}/v1/users/${createdUserId}`, {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              });

              console.log('✅ User deleted successfully:');
              console.log(`   Success: ${deleteResponse.data.success}`);
              console.log(`   Message: ${deleteResponse.data.message}`);
            } catch (deleteError) {
              console.error(
                '❌ Error deleting user:',
                deleteError.response?.data?.error?.message || deleteError.message
              );
            }
          } catch (getUsersError) {
            console.error(
              '❌ Error getting users by restaurant:',
              getUsersError.response?.data?.error?.message || getUsersError.message
            );
          }
        } catch (updateError) {
          console.error(
            '❌ Error updating user:',
            updateError.response?.data?.error?.message || updateError.message
          );
        }
      } catch (getUserError) {
        console.error(
          '❌ Error retrieving user:',
          getUserError.response?.data?.error?.message || getUserError.message
        );
      }
    } catch (createError) {
      console.error(
        '❌ Error creating user:',
        createError.response?.data?.error?.message || createError.message
      );
    }

    console.log('\n----------------------------------');
    console.log('🏁 User Controller tests completed');
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

// Run the tests
runTests();
