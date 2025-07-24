const express = require('express');
const router = express.Router();
const db = require('../config/db');
const authMiddleware = require('../middleware/authMiddleware');
const ValidationMiddleware = require('../middleware/validationMiddleware');

// Apply middleware
router.use(authMiddleware);
router.use(ValidationMiddleware.sanitize());

/**
 * GET /api/v1/languages/available
 * Get all available languages in the system
 */
router.get('/available', async (req, res, next) => {
  try {
    console.log('Fetching available languages...');

    const query = `
      SELECT
        id,
        language_code,
        name,
        native_name,
        flag_file,
        display_order,
        is_active,
        created_at
      FROM languages
      WHERE is_active = true
      ORDER BY display_order ASC, name ASC
    `;

    const result = await db.query(query);

    console.log(`Found ${result.rows.length} available languages`);

    res.status(200).json({
      success: true,
      data: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    console.error('Error fetching available languages:', error);
    next(error);
  }
});

/**
 * GET /api/v1/restaurants/:restaurantId/languages
 * Get languages configured for a specific restaurant
 */
router.get('/:restaurantId/languages', async (req, res, next) => {
  try {
    const { restaurantId } = req.params;
    const { restaurant } = req.user;

    // Basic validation - check if it's a valid UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!restaurantId || !uuidRegex.test(restaurantId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid restaurant ID format',
      });
    }

    // Verify restaurant ownership
    if (restaurant.id !== restaurantId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only access your own restaurant languages.',
      });
    }

    console.log(`Fetching languages for restaurant ID: ${restaurantId}`);

    const query = `
      SELECT
        rl.id,
        rl.restaurant_id,
        rl.language_id,
        rl.display_order,
        rl.is_default,
        rl.is_active,
        rl.created_at,
        rl.updated_at,
        l.language_code,
        l.name as language_name,
        l.native_name,
        l.flag_file
      FROM restaurant_languages rl
      INNER JOIN languages l ON rl.language_id = l.id
      WHERE rl.restaurant_id = $1 AND rl.is_active = true
      ORDER BY rl.display_order ASC, l.name ASC
    `;

    const result = await db.query(query, [restaurantId]);

    console.log(`Found ${result.rows.length} languages for restaurant ${restaurantId}`);

    res.status(200).json({
      success: true,
      data: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    console.error('Error fetching restaurant languages:', error);
    next(error);
  }
});

/**
 * PUT /api/v1/restaurants/:restaurantId/languages
 * Update languages configuration for a specific restaurant
 */
router.put('/:restaurantId/languages', async (req, res, next) => {
  const client = await db.getClient();

  try {
    const { restaurantId } = req.params;
    const { languages } = req.body;
    const { restaurant } = req.user;

    // Basic validation - check if it's a valid UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!restaurantId || !uuidRegex.test(restaurantId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid restaurant ID format',
      });
    }

    if (!languages || !Array.isArray(languages) || languages.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Languages array is required and must not be empty',
      });
    }

    // Verify restaurant ownership
    if (restaurant.id !== restaurantId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only modify your own restaurant languages.',
      });
    }

    // Validate languages array
    for (const lang of languages) {
      if (!lang.languageCode || typeof lang.languageCode !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'Language code is required for all languages',
        });
      }
      if (
        !lang.displayOrder ||
        isNaN(parseInt(lang.displayOrder)) ||
        parseInt(lang.displayOrder) <= 0
      ) {
        return res.status(400).json({
          success: false,
          message: 'Display order must be a positive integer for all languages',
        });
      }
      if (typeof lang.isDefault !== 'boolean') {
        return res.status(400).json({
          success: false,
          message: 'isDefault must be a boolean for all languages',
        });
      }
    }

    // Validate that exactly one language is marked as default
    const defaultLanguages = languages.filter((lang) => lang.isDefault);
    if (defaultLanguages.length !== 1) {
      return res.status(400).json({
        success: false,
        message: 'Exactly one language must be marked as default',
      });
    }

    console.log(`Updating languages for restaurant ID: ${restaurantId}`);
    console.log('New languages configuration:', languages);

    await client.query('BEGIN');

    // Get language IDs for the provided language codes
    const languageCodes = languages.map((lang) => lang.languageCode);
    const languageQuery = `
      SELECT id, language_code
      FROM languages
      WHERE language_code = ANY($1) AND is_active = true
    `;
    const languageResult = await client.query(languageQuery, [languageCodes]);

    if (languageResult.rows.length !== languageCodes.length) {
      const foundCodes = languageResult.rows.map((row) => row.language_code);
      const missingCodes = languageCodes.filter((code) => !foundCodes.includes(code));
      throw new Error(`Invalid language codes: ${missingCodes.join(', ')}`);
    }

    const languageMap = new Map();
    languageResult.rows.forEach((row) => {
      languageMap.set(row.language_code, row.id);
    });

    // First, completely remove all existing restaurant languages to avoid constraint conflicts
    await client.query('DELETE FROM restaurant_languages WHERE restaurant_id = $1', [restaurantId]);

    // Insert the new restaurant languages
    for (const lang of languages) {
      const languageId = languageMap.get(lang.languageCode);

      const insertQuery = `
        INSERT INTO restaurant_languages (
          restaurant_id,
          language_id,
          display_order,
          is_default,
          is_active,
          created_at,
          updated_at
        ) VALUES ($1, $2, $3, $4, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `;

      await client.query(insertQuery, [
        restaurantId,
        languageId,
        lang.displayOrder,
        lang.isDefault,
      ]);
    }

    await client.query('COMMIT');

    // Fetch the updated languages to return
    const updatedQuery = `
      SELECT
        rl.id,
        rl.restaurant_id,
        rl.language_id,
        rl.display_order,
        rl.is_default,
        rl.is_active,
        rl.created_at,
        rl.updated_at,
        l.language_code,
        l.name as language_name,
        l.native_name,
        l.flag_file
      FROM restaurant_languages rl
      INNER JOIN languages l ON rl.language_id = l.id
      WHERE rl.restaurant_id = $1 AND rl.is_active = true
      ORDER BY rl.display_order ASC, l.name ASC
    `;

    const updatedResult = await client.query(updatedQuery, [restaurantId]);

    console.log(`Successfully updated languages for restaurant ${restaurantId}`);

    res.status(200).json({
      success: true,
      message: 'Restaurant languages updated successfully',
      data: updatedResult.rows,
      count: updatedResult.rows.length,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating restaurant languages:', error);

    if (error.message.includes('Invalid language codes')) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    next(error);
  } finally {
    client.release();
  }
});

// Error handling middleware
router.use((error, req, res, next) => {
  console.error('Languages route error:', error);

  // Database connection errors
  if (error.code === 'ECONNREFUSED') {
    return res.status(503).json({
      success: false,
      message: 'Database connection failed',
    });
  }

  // PostgreSQL errors
  if (error.code && error.code.startsWith('23')) {
    return res.status(400).json({
      success: false,
      message: 'Database constraint violation',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }

  // Default error response
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? error.message : undefined,
  });
});

module.exports = router;
