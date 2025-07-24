require('dotenv').config();
const db = require('../config/db');

/**
 * Restaurant Languages API Helper
 * Complete API functions for restaurant language management
 */

class RestaurantLanguagesAPI {
  // Get all available languages (from languages table)
  static async getAvailableLanguages() {
    try {
      const result = await db.query(`
        SELECT
          id,
          name,
          language_code,
          native_name,
          flag_file,
          display_order
        FROM languages
        WHERE is_active = true
        ORDER BY display_order
      `);
      return result.rows;
    } catch (error) {
      throw new Error(`Failed to get available languages: ${error.message}`);
    }
  }

  // Get restaurant's configured languages
  static async getRestaurantLanguages(restaurantId) {
    try {
      const result = await db.query(
        `
        SELECT
          rl.id,
          rl.restaurant_id,
          rl.language_id,
          rl.display_order,
          rl.is_default,
          rl.is_active,
          l.name as language_name,
          l.language_code,
          l.native_name,
          l.flag_file
        FROM restaurant_languages rl
        JOIN languages l ON rl.language_id = l.id
        WHERE rl.restaurant_id = $1 AND rl.is_active = true
        ORDER BY rl.display_order, l.display_order
      `,
        [restaurantId]
      );

      return result.rows;
    } catch (error) {
      throw new Error(`Failed to get restaurant languages: ${error.message}`);
    }
  }

  // Get restaurant's default language
  static async getDefaultLanguage(restaurantId) {
    try {
      const result = await db.query(
        `
        SELECT
          rl.*,
          l.name as language_name,
          l.language_code,
          l.native_name,
          l.flag_file
        FROM restaurant_languages rl
        JOIN languages l ON rl.language_id = l.id
        WHERE rl.restaurant_id = $1 AND rl.is_default = true AND rl.is_active = true
      `,
        [restaurantId]
      );

      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Failed to get default language: ${error.message}`);
    }
  }

  // Add language to restaurant
  static async addLanguage(restaurantId, languageCode, displayOrder = 0, isDefault = false) {
    try {
      await db.query('BEGIN');

      // Get language ID
      const languageResult = await db.query(
        'SELECT id FROM languages WHERE language_code = $1 AND is_active = true',
        [languageCode]
      );

      if (languageResult.rows.length === 0) {
        throw new Error(`Language '${languageCode}' not found or inactive`);
      }

      const languageId = languageResult.rows[0].id;

      // If setting as default, unset other defaults
      if (isDefault) {
        await db.query(
          'UPDATE restaurant_languages SET is_default = false WHERE restaurant_id = $1',
          [restaurantId]
        );
      }

      // Insert or update
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

      await db.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await db.query('ROLLBACK');
      throw new Error(`Failed to add language: ${error.message}`);
    }
  }

  // Remove language from restaurant
  static async removeLanguage(restaurantId, languageCode) {
    try {
      const result = await db.query(
        `
        UPDATE restaurant_languages rl
        SET is_active = false, updated_at = CURRENT_TIMESTAMP
        FROM languages l
        WHERE rl.language_id = l.id
          AND rl.restaurant_id = $1
          AND l.language_code = $2
        RETURNING rl.*
      `,
        [restaurantId, languageCode]
      );

      if (result.rows.length === 0) {
        throw new Error(`Language '${languageCode}' not found for restaurant`);
      }

      return result.rows[0];
    } catch (error) {
      throw new Error(`Failed to remove language: ${error.message}`);
    }
  }

  // Set default language
  static async setDefaultLanguage(restaurantId, languageCode) {
    try {
      await db.query('BEGIN');

      // Unset all defaults
      await db.query(
        'UPDATE restaurant_languages SET is_default = false WHERE restaurant_id = $1',
        [restaurantId]
      );

      // Set new default
      const result = await db.query(
        `
        UPDATE restaurant_languages rl
        SET is_default = true, updated_at = CURRENT_TIMESTAMP
        FROM languages l
        WHERE rl.language_id = l.id
          AND rl.restaurant_id = $1
          AND l.language_code = $2
          AND rl.is_active = true
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
      throw new Error(`Failed to set default language: ${error.message}`);
    }
  }

  // Update language display order
  static async updateDisplayOrder(restaurantId, languageCode, newOrder) {
    try {
      const result = await db.query(
        `
        UPDATE restaurant_languages rl
        SET display_order = $3, updated_at = CURRENT_TIMESTAMP
        FROM languages l
        WHERE rl.language_id = l.id
          AND rl.restaurant_id = $1
          AND l.language_code = $2
          AND rl.is_active = true
        RETURNING rl.*
      `,
        [restaurantId, languageCode, newOrder]
      );

      if (result.rows.length === 0) {
        throw new Error(`Language '${languageCode}' not found for restaurant`);
      }

      return result.rows[0];
    } catch (error) {
      throw new Error(`Failed to update display order: ${error.message}`);
    }
  }

  // Bulk update language configuration
  static async bulkUpdateLanguages(restaurantId, languages) {
    try {
      await db.query('BEGIN');

      // languages = [{ languageCode, displayOrder, isDefault }]
      const results = [];
      let hasDefault = false;

      // First pass: validate and check for default
      for (const lang of languages) {
        if (lang.isDefault) {
          if (hasDefault) {
            throw new Error('Only one language can be set as default');
          }
          hasDefault = true;
        }
      }

      // Clear all defaults first
      await db.query(
        'UPDATE restaurant_languages SET is_default = false WHERE restaurant_id = $1',
        [restaurantId]
      );

      // Update each language
      for (const lang of languages) {
        const result = await this.addLanguage(
          restaurantId,
          lang.languageCode,
          lang.displayOrder || 0,
          lang.isDefault || false
        );
        results.push(result);
      }

      await db.query('COMMIT');
      return results;
    } catch (error) {
      await db.query('ROLLBACK');
      throw new Error(`Failed to bulk update languages: ${error.message}`);
    }
  }
}

module.exports = RestaurantLanguagesAPI;
