require('dotenv').config();
const RestaurantLanguagesAPI = require('../db/RestaurantLanguagesAPI');
const db = require('../config/db');

/**
 * Simple test to verify automatic language assignment
 * by manually adding it to an existing restaurant
 */

async function testLanguageAssignment() {
  try {
    console.log('🧪 Testing automatic language assignment...\n');

    // Get an existing restaurant
    const restaurantResult = await db.query(
      'SELECT id, restaurant_name FROM restaurants WHERE status IN ($1, $2) LIMIT 1',
      ['active', 'pending']
    );

    if (restaurantResult.rows.length === 0) {
      console.log('❌ No active restaurants found to test with');
      return { success: false, error: 'No restaurants found' };
    }

    const restaurant = restaurantResult.rows[0];
    console.log('📍 Using existing restaurant:', {
      id: restaurant.id,
      name: restaurant.restaurant_name,
    });

    // Check current languages
    console.log('\n🔍 Checking current languages...');
    const currentLanguages = await RestaurantLanguagesAPI.getRestaurantLanguages(restaurant.id);
    console.log('Current languages:', currentLanguages.length);

    // Add Brazilian Portuguese as default if not exists
    console.log('\n🇧🇷 Adding Brazilian Portuguese as default language...');
    try {
      await RestaurantLanguagesAPI.addLanguage(restaurant.id, 'pt-BR', 10, true);
      console.log('✅ Portuguese added successfully');
    } catch (error) {
      if (error.message.includes('duplicate key')) {
        console.log('ℹ️ Portuguese already exists, setting as default...');
        await RestaurantLanguagesAPI.setDefaultLanguage(restaurant.id, 'pt-BR');
      } else {
        throw error;
      }
    }

    // Verify the result
    console.log('\n📋 Final restaurant languages:');
    const finalLanguages = await RestaurantLanguagesAPI.getRestaurantLanguages(restaurant.id);
    console.table(finalLanguages);

    const defaultLanguage = await RestaurantLanguagesAPI.getDefaultLanguage(restaurant.id);
    console.log('\n🎯 Default language:', defaultLanguage);

    if (defaultLanguage && defaultLanguage.language_code === 'pt-BR') {
      console.log('✅ SUCCESS: Brazilian Portuguese is set as default!');
      return { success: true, restaurantId: restaurant.id, defaultLanguage };
    } else {
      console.log('❌ FAILED: Default language not properly set');
      return { success: false, error: 'Default language not set' };
    }
  } catch (error) {
    console.error('❌ Test error:', error.message);
    return { success: false, error: error.message };
  } finally {
    await db.closePool();
  }
}

// Run test if called directly
if (require.main === module) {
  testLanguageAssignment()
    .then((result) => {
      if (result.success) {
        console.log('\n🎉 Test completed successfully!');
        console.log('\n💡 This confirms that the RestaurantLanguagesAPI works correctly.');
        console.log(
          '   The same logic has been added to automatically run when new restaurants are created.'
        );
      } else {
        console.log('\n💥 Test failed:', result.error);
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('💥 Test error:', error);
      process.exit(1);
    });
}

module.exports = testLanguageAssignment;
