require('dotenv').config();
const RestaurantService = require('../services/restaurantService');
const RestaurantLanguagesAPI = require('../db/RestaurantLanguagesAPI');
const db = require('../config/db');

/**
 * Test script to verify automatic language assignment
 * when creating a new restaurant
 */

async function testRestaurantLanguageCreation() {
  try {
    console.log('🧪 Testing automatic language assignment for new restaurants...\n');

    // Test data for a new restaurant
    const testRestaurantData = {
      restaurant_name: 'Test Restaurant Language Creation',
      restaurant_url_name: `test-lang-${Date.now()}`,
      business_type: 'single',
      description: 'Test restaurant for language creation',
      phone: '11999887766',
      terms_accepted: true,
      locations: [
        {
          name: 'Main Location',
          url_name: 'main-location',
          location_name: 'Main Location',
          address: 'Test Address 123',
          city: 'São Paulo',
          state: 'SP',
          postal_code: '01234-567',
          phone: '11999887766',
          operating_hours: {
            monday: { open: '09:00', close: '18:00', closed: false },
            tuesday: { open: '09:00', close: '18:00', closed: false },
            wednesday: { open: '09:00', close: '18:00', closed: false },
            thursday: { open: '09:00', close: '18:00', closed: false },
            friday: { open: '09:00', close: '18:00', closed: false },
            saturday: { open: '09:00', close: '16:00', closed: false },
            sunday: { open: '10:00', close: '16:00', closed: false },
          },
        },
      ],
      userPayload: {
        username: `testuser${Date.now()}`,
        email: `testlang${Date.now()}@test.com`,
        password: 'TestPassword123!',
        full_name: 'Test User Language',
        phone: '11999887766',
      },
    };

    console.log('📝 Creating restaurant with data:', {
      name: testRestaurantData.restaurant_name,
      urlName: testRestaurantData.restaurant_url_name,
      businessType: testRestaurantData.business_type,
    });

    // Create restaurant using the service
    const restaurantService = require('../services/restaurantService');
    const newRestaurant = await restaurantService.createRestaurant(testRestaurantData);

    console.log('✅ Restaurant created successfully:', {
      id: newRestaurant.id,
      name: newRestaurant.restaurant_name,
    });

    // Check if default language was automatically added
    console.log('\n🔍 Checking restaurant languages...');
    const languages = await RestaurantLanguagesAPI.getRestaurantLanguages(newRestaurant.id);

    console.log('📋 Restaurant languages found:');
    console.table(languages);

    // Verify default language
    const defaultLanguage = await RestaurantLanguagesAPI.getDefaultLanguage(newRestaurant.id);
    console.log('\n🇧🇷 Default language:', defaultLanguage);

    // Verify it's Brazilian Portuguese
    if (
      defaultLanguage &&
      defaultLanguage.language_code === 'pt-BR' &&
      defaultLanguage.is_default
    ) {
      console.log('✅ SUCCESS: Default Brazilian Portuguese language automatically assigned!');
    } else {
      console.log('❌ FAILED: Default language not properly assigned');
    }

    return {
      success: true,
      restaurantId: newRestaurant.id,
      languages: languages,
      defaultLanguage: defaultLanguage,
    };
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return {
      success: false,
      error: error.message,
    };
  } finally {
    await db.closePool();
  }
}

// Run test if called directly
if (require.main === module) {
  testRestaurantLanguageCreation()
    .then((result) => {
      if (result.success) {
        console.log('\n🎉 Test completed successfully!');
      } else {
        console.log('\n💥 Test failed!');
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('💥 Test error:', error);
      process.exit(1);
    });
}

module.exports = testRestaurantLanguageCreation;
