/**
 * Test script for Restaurant Service
 * Tests basic restaurant management operations
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
  // No restaurant_id for super admin
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

// Test data for restaurant creation
const newRestaurantData = {
  restaurant_name: `Test Restaurant ${Date.now()}`,
  restaurant_url_name: `test-restaurant-${Date.now()}`,
  business_type: 'single',
  cuisine_type: 'Test Cuisine',
  phone: '1234567890',
  website: 'https://testrestaurant.com',
  description: 'A test restaurant for API testing',
  terms_accepted: true,
  marketing_consent: true,
};

// Run tests
async function runTests() {
  try {
    console.log('🔍 Starting Restaurant Service tests...');
    console.log('----------------------------------');

    const token = generateToken(testAdminUser);

    // 1. Create Restaurant Test
    console.log('Test 1: Creating a new restaurant');
    try {
      const createResponse = await axios.post(`${API_URL}/v1/restaurants`, newRestaurantData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('✅ Restaurant created successfully:');
      console.log(`   Restaurant ID: ${createResponse.data.data.id}`);
      console.log(`   Name: ${createResponse.data.data.restaurant_name}`);
      console.log(`   URL Name: ${createResponse.data.data.restaurant_url_name}`);

      // Store restaurant ID for subsequent tests
      const createdRestaurantId = createResponse.data.data.id;

      // 2. Get Restaurant Test
      console.log('\nTest 2: Retrieving the created restaurant');
      try {
        const getRestaurantResponse = await axios.get(
          `${API_URL}/v1/restaurants/${createdRestaurantId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        console.log('✅ Restaurant retrieved successfully:');
        console.log(`   Name: ${getRestaurantResponse.data.data.restaurant_name}`);
        console.log(`   Business Type: ${getRestaurantResponse.data.data.business_type}`);
        console.log(`   Status: ${getRestaurantResponse.data.data.status}`);

        // 3. Update Restaurant Test
        console.log('\nTest 3: Updating restaurant information');
        try {
          const updateResponse = await axios.patch(
            `${API_URL}/v1/restaurants/${createdRestaurantId}`,
            {
              description: 'Updated restaurant description',
              cuisine_type: 'Updated Cuisine',
            },
            {
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            }
          );

          console.log('✅ Restaurant updated successfully:');
          console.log(`   New description: ${updateResponse.data.data.description}`);
          console.log(`   New cuisine: ${updateResponse.data.data.cuisine_type}`);

          // 4. Add Restaurant Location Test
          console.log('\nTest 4: Adding a location to the restaurant');
          try {
            const locationData = {
              location_name: 'Test Location',
              address_line1: '123 Test Street',
              city: 'Test City',
              state: 'TS',
              postal_code: '12345',
              country: 'Test Country',
              is_primary: true,
            };

            const addLocationResponse = await axios.post(
              `${API_URL}/v1/restaurants/${createdRestaurantId}/locations`,
              locationData,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
              }
            );

            console.log('✅ Location added successfully:');
            console.log(`   Location ID: ${addLocationResponse.data.data.id}`);
            console.log(`   Location Name: ${addLocationResponse.data.data.location_name}`);

            // 5. Get Restaurant Locations Test
            console.log('\nTest 5: Getting restaurant locations');
            try {
              const getLocationsResponse = await axios.get(
                `${API_URL}/v1/restaurants/${createdRestaurantId}/locations`,
                {
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                }
              );

              console.log('✅ Locations retrieved successfully:');
              console.log(`   Total locations: ${getLocationsResponse.data.data.length}`);

              // 6. Delete Restaurant Test (not actually executing to keep data)
              console.log('\nTest 6: Deleting restaurant (skipped to preserve test data)');
              console.log('✅ Skipped deletion for demonstration purposes');
            } catch (getLocationsError) {
              console.error(
                '❌ Error getting restaurant locations:',
                getLocationsError.response?.data?.error?.message || getLocationsError.message
              );
            }
          } catch (addLocationError) {
            console.error(
              '❌ Error adding location:',
              addLocationError.response?.data?.error?.message || addLocationError.message
            );
          }
        } catch (updateError) {
          console.error(
            '❌ Error updating restaurant:',
            updateError.response?.data?.error?.message || updateError.message
          );
        }
      } catch (getRestaurantError) {
        console.error(
          '❌ Error retrieving restaurant:',
          getRestaurantError.response?.data?.error?.message || getRestaurantError.message
        );
      }
    } catch (createError) {
      console.error(
        '❌ Error creating restaurant:',
        createError.response?.data?.error?.message || createError.message
      );
    }

    console.log('\n----------------------------------');
    console.log('🏁 Restaurant Service tests completed');
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

// Run the tests
runTests();
