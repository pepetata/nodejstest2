require('dotenv').config();
const db = require('../config/db');

/**
 * Restaurant Languages Management
 * Provides functions to manage language settings for restaurants
 */

// Add language support to a restaurant
async function addRestaurantLanguage(
  restaurantId,
  languageCode,
  displayOrder = 0,
  isDefault = false
) {
  try {
    // Get language ID
    const languageResult = await db.query(
      'SELECT id FROM languages WHERE language_code = $1 AND is_active = true',
      [languageCode]
    );

    if (languageResult.rows.length === 0) {
      throw new Error(`Language with code '${languageCode}' not found or inactive`);
    }

    const languageId = languageResult.rows[0].id;

    // If setting as default, unset other defaults first
    if (isDefault) {
      await db.query(
        'UPDATE restaurant_languages SET is_default = false WHERE restaurant_id = $1',
        [restaurantId]
      );
    }

    // Insert or update restaurant language
    const result = await db.query(
      `
      INSERT INTO restaurant_languages (restaurant_id, language_id, display_order, is_default, is_active)
      VALUES ($1, $2, $3, $4, true)
      ON CONFLICT (restaurant_id, language_id)
      DO UPDATE SET
        display_order = $3,
        is_default = $4,
        is_active = true,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `,
      [restaurantId, languageId, displayOrder, isDefault]
    );

    return result.rows[0];
  } catch (error) {
    console.error('Error adding restaurant language:', error);
    throw error;
  }
}

// Get all languages for a restaurant
async function getRestaurantLanguages(restaurantId) {
  try {
    const result = await db.query(
      `
      SELECT
        rl.*,
        l.name as language_name,
        l.language_code,
        l.icon_file
      FROM restaurant_languages rl
      JOIN languages l ON rl.language_id = l.id
      WHERE rl.restaurant_id = $1 AND rl.is_active = true
      ORDER BY rl.display_order, l.display_order
    `,
      [restaurantId]
    );

    return result.rows;
  } catch (error) {
    console.error('Error getting restaurant languages:', error);
    throw error;
  }
}

// Set default language for a restaurant
async function setDefaultLanguage(restaurantId, languageCode) {
  try {
    // Start transaction
    await db.query('BEGIN');

    // Unset all defaults for this restaurant
    await db.query('UPDATE restaurant_languages SET is_default = false WHERE restaurant_id = $1', [
      restaurantId,
    ]);

    // Set new default
    const result = await db.query(
      `
      UPDATE restaurant_languages rl
      SET is_default = true, updated_at = CURRENT_TIMESTAMP
      FROM languages l
      WHERE rl.language_id = l.id
        AND rl.restaurant_id = $1
        AND l.language_code = $2
      RETURNING rl.*
    `,
      [restaurantId, languageCode]
    );

    if (result.rows.length === 0) {
      throw new Error(`Language '${languageCode}' not found for restaurant or not active`);
    }

    await db.query('COMMIT');
    return result.rows[0];
  } catch (error) {
    await db.query('ROLLBACK');
    console.error('Error setting default language:', error);
    throw error;
  }
}

// Setup default languages for a restaurant (Brazilian restaurant example)
async function setupDefaultRestaurantLanguages(restaurantId) {
  try {
    console.log(`Setting up default languages for restaurant: ${restaurantId}`);

    // Add Portuguese as default
    await addRestaurantLanguage(restaurantId, 'pt-BR', 10, true);
    console.log('✓ Added Portuguese (default)');

    // Add English
    await addRestaurantLanguage(restaurantId, 'en', 20, false);
    console.log('✓ Added English');

    // Add Spanish
    await addRestaurantLanguage(restaurantId, 'es', 30, false);
    console.log('✓ Added Spanish');

    const languages = await getRestaurantLanguages(restaurantId);
    console.log('\n📋 Restaurant languages:');
    console.table(languages);

    return languages;
  } catch (error) {
    console.error('Error setting up default languages:', error);
    throw error;
  }
}

// Example usage
async function example() {
  try {
    // Get first restaurant
    const restaurantResult = await db.query('SELECT id, restaurant_name FROM restaurants LIMIT 1');

    if (restaurantResult.rows.length === 0) {
      console.log('No restaurants found. Please create a restaurant first.');
      return;
    }

    const restaurant = restaurantResult.rows[0];
    console.log(`Working with restaurant: ${restaurant.restaurant_name} (${restaurant.id})`);

    // Setup default languages
    await setupDefaultRestaurantLanguages(restaurant.id);
  } catch (error) {
    console.error('Example error:', error);
  } finally {
    await db.closePool();
  }
}

module.exports = {
  addRestaurantLanguage,
  getRestaurantLanguages,
  setDefaultLanguage,
  setupDefaultRestaurantLanguages,
};

// Run example if called directly
if (require.main === module) {
  example();
}
