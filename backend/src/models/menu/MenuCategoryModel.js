const BaseModel = require('../BaseModel');
const Joi = require('joi');
const { logger } = require('../../utils/logger');

/**
 * Menu Category Model
 * Handles menu categories with multilingual support and hierarchical structure
 */
class MenuCategoryModel extends BaseModel {
  constructor() {
    super();
    this.tableName = 'menu_categories';
    this.translationsTable = 'menu_category_translations';
    this.sensitiveFields = [];
    this.logger = logger.child({ model: 'MenuCategoryModel' });
  }

  /**
   * Validation schema for category creation
   */
  get createSchema() {
    return Joi.object({
      restaurant_id: Joi.string().uuid().required(),
      parent_category_id: Joi.number().integer().allow(null).optional(),
      display_order: Joi.number().integer().min(0).default(0),
      status: Joi.string().valid('active', 'inactive').default('active'),
      created_by: Joi.string().uuid().required(),
      translations: Joi.array()
        .items(
          Joi.object({
            language_id: Joi.number().integer().required(),
            name: Joi.string().trim().min(1).max(255).required(),
            description: Joi.string().trim().max(2000).allow('', null).optional(),
          })
        )
        .min(1)
        .required(),
    });
  }

  /**
   * Validation schema for category updates
   */
  get updateSchema() {
    return Joi.object({
      parent_category_id: Joi.number().integer().allow(null).optional(),
      display_order: Joi.number().integer().min(0).optional(),
      status: Joi.string().valid('active', 'inactive').optional(),
      updated_by: Joi.string().uuid().required(),
      translations: Joi.array()
        .items(
          Joi.object({
            language_id: Joi.number().integer().required(),
            name: Joi.string().trim().min(1).max(255).required(),
            description: Joi.string().trim().max(2000).allow('', null).optional(),
          })
        )
        .optional(),
    });
  }

  /**
   * Create a new category with translations
   */
  async create(categoryData) {
    try {
      const { error, value } = this.createSchema.validate(categoryData);
      if (error) {
        throw new Error(`Validation error: ${error.details[0].message}`);
      }

      const { translations, ...categoryFields } = value;

      // Start transaction
      await this.executeQuery('BEGIN');

      try {
        // Insert category
        const categoryQuery = `
          INSERT INTO ${this.tableName}
          (restaurant_id, parent_category_id, display_order, status, created_by, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
          RETURNING *
        `;

        const categoryResult = await this.executeQuery(categoryQuery, [
          categoryFields.restaurant_id,
          categoryFields.parent_category_id,
          categoryFields.display_order,
          categoryFields.status,
          categoryFields.created_by,
        ]);

        const category = categoryResult.rows[0];

        // Insert translations
        const translationPromises = translations.map(async (translation) => {
          const translationQuery = `
            INSERT INTO ${this.translationsTable}
            (category_id, language_id, name, description, created_at, updated_at)
            VALUES ($1, $2, $3, $4, NOW(), NOW())
            RETURNING *
          `;

          return this.executeQuery(translationQuery, [
            category.id,
            translation.language_id,
            translation.name,
            translation.description,
          ]);
        });

        await Promise.all(translationPromises);

        // Commit transaction
        await this.executeQuery('COMMIT');

        // Return category with translations
        return this.findByIdWithTranslations(category.id);
      } catch (error) {
        await this.executeQuery('ROLLBACK');
        throw error;
      }
    } catch (error) {
      this.logger.error('Error creating category:', error);
      throw error;
    }
  }

  /**
   * Update category with translations
   */
  async update(id, categoryData) {
    try {
      const { error, value } = this.updateSchema.validate(categoryData);
      if (error) {
        throw new Error(`Validation error: ${error.details[0].message}`);
      }

      const { translations, ...categoryFields } = value;

      // Start transaction
      await this.executeQuery('BEGIN');

      try {
        // Update category if there are category fields to update
        if (Object.keys(categoryFields).length > 0) {
          const updateFields = [];
          const values = [];
          let paramIndex = 1;

          Object.entries(categoryFields).forEach(([key, val]) => {
            updateFields.push(`${key} = $${paramIndex}`);
            values.push(val);
            paramIndex++;
          });

          updateFields.push(`updated_at = NOW()`);
          values.push(id);

          const categoryQuery = `
            UPDATE ${this.tableName}
            SET ${updateFields.join(', ')}
            WHERE id = $${paramIndex}
            RETURNING *
          `;

          await this.executeQuery(categoryQuery, values);
        }

        // Update translations if provided
        if (translations && translations.length > 0) {
          // Delete existing translations
          await this.executeQuery(`DELETE FROM ${this.translationsTable} WHERE category_id = $1`, [
            id,
          ]);

          // Insert new translations
          const translationPromises = translations.map(async (translation) => {
            const translationQuery = `
              INSERT INTO ${this.translationsTable}
              (category_id, language_id, name, description, created_at, updated_at)
              VALUES ($1, $2, $3, $4, NOW(), NOW())
              RETURNING *
            `;

            return this.executeQuery(translationQuery, [
              id,
              translation.language_id,
              translation.name,
              translation.description,
            ]);
          });

          await Promise.all(translationPromises);
        }

        // Commit transaction
        await this.executeQuery('COMMIT');

        // Return updated category with translations
        return this.findByIdWithTranslations(id);
      } catch (error) {
        await this.executeQuery('ROLLBACK');
        throw error;
      }
    } catch (error) {
      this.logger.error('Error updating category:', error);
      throw error;
    }
  }

  /**
   * Find category by ID with translations
   */
  async findByIdWithTranslations(id) {
    try {
      const query = `
        SELECT
          c.*,
          COALESCE(
            JSON_AGG(
              JSON_BUILD_OBJECT(
                'language_id', t.language_id,
                'name', t.name,
                'description', t.description
              ) ORDER BY t.language_id
            ) FILTER (WHERE t.id IS NOT NULL),
            '[]'::json
          ) as translations
        FROM ${this.tableName} c
        LEFT JOIN ${this.translationsTable} t ON c.id = t.category_id
        WHERE c.id = $1
        GROUP BY c.id
      `;

      const result = await this.executeQuery(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      this.logger.error('Error finding category by ID:', error);
      throw error;
    }
  }

  /**
   * Find all categories for a restaurant with translations
   */
  async findByRestaurantWithTranslations(restaurantId, languageId = null) {
    try {
      const query = `
        SELECT
          c.*,
          COALESCE(
            JSON_AGG(
              JSON_BUILD_OBJECT(
                'language_id', t.language_id,
                'name', t.name,
                'description', t.description
              ) ORDER BY t.language_id
            ) FILTER (WHERE t.id IS NOT NULL),
            '[]'::json
          ) as translations,
          ${
            languageId
              ? `(SELECT name FROM ${this.translationsTable} WHERE category_id = c.id AND language_id = $2 LIMIT 1) as display_name`
              : 'NULL as display_name'
          }
        FROM ${this.tableName} c
        LEFT JOIN ${this.translationsTable} t ON c.id = t.category_id
        WHERE c.restaurant_id = $1
        GROUP BY c.id
        ORDER BY c.display_order ASC, c.id ASC
      `;

      const params = languageId ? [restaurantId, languageId] : [restaurantId];
      const result = await this.executeQuery(query, params);
      return result.rows;
    } catch (error) {
      this.logger.error('Error finding categories by restaurant:', error);
      throw error;
    }
  }

  /**
   * Update display order for categories
   */
  async updateDisplayOrder(categoryOrders) {
    try {
      await this.executeQuery('BEGIN');

      const updatePromises = categoryOrders.map(async ({ id, display_order }) => {
        const query = `
          UPDATE ${this.tableName}
          SET display_order = $1, updated_at = NOW()
          WHERE id = $2
          RETURNING id, display_order
        `;
        return this.executeQuery(query, [display_order, id]);
      });

      await Promise.all(updatePromises);
      await this.executeQuery('COMMIT');

      return { success: true, message: 'Display order updated successfully' };
    } catch (error) {
      await this.executeQuery('ROLLBACK');
      this.logger.error('Error updating display order:', error);
      throw error;
    }
  }

  /**
   * Check if category can be deleted (no menu items depend on it)
   */
  async canDelete(id) {
    try {
      const query = `
        SELECT COUNT(*) as item_count
        FROM menu_items
        WHERE category_id = $1
      `;

      const result = await this.executeQuery(query, [id]);
      const itemCount = parseInt(result.rows[0].item_count, 10);

      // Also check for subcategories
      const subcategoryQuery = `
        SELECT COUNT(*) as subcategory_count
        FROM ${this.tableName}
        WHERE parent_category_id = $1
      `;

      const subcategoryResult = await this.executeQuery(subcategoryQuery, [id]);
      const subcategoryCount = parseInt(subcategoryResult.rows[0].subcategory_count, 10);

      return {
        canDelete: itemCount === 0 && subcategoryCount === 0,
        itemCount,
        subcategoryCount,
      };
    } catch (error) {
      this.logger.error('Error checking if category can be deleted:', error);
      throw error;
    }
  }

  /**
   * Delete category
   */
  async delete(id) {
    try {
      const canDeleteResult = await this.canDelete(id);
      if (!canDeleteResult.canDelete) {
        throw new Error(
          `Cannot delete category. It has ${canDeleteResult.itemCount} menu items and ${canDeleteResult.subcategoryCount} subcategories.`
        );
      }

      await this.executeQuery('BEGIN');

      // Delete translations first
      await this.executeQuery(`DELETE FROM ${this.translationsTable} WHERE category_id = $1`, [id]);

      // Delete category
      const result = await this.executeQuery(
        `DELETE FROM ${this.tableName} WHERE id = $1 RETURNING *`,
        [id]
      );

      await this.executeQuery('COMMIT');

      return result.rows[0];
    } catch (error) {
      await this.executeQuery('ROLLBACK');
      this.logger.error('Error deleting category:', error);
      throw error;
    }
  }

  /**
   * Get category hierarchy for a restaurant
   */
  async getHierarchy(restaurantId, languageId = null) {
    try {
      const categories = await this.findByRestaurantWithTranslations(restaurantId, languageId);

      // Build hierarchy
      const categoryMap = new Map();
      const rootCategories = [];

      // First pass: create category map
      categories.forEach((category) => {
        categoryMap.set(category.id, { ...category, subcategories: [] });
      });

      // Second pass: build hierarchy
      categories.forEach((category) => {
        if (category.parent_category_id) {
          const parent = categoryMap.get(category.parent_category_id);
          if (parent) {
            parent.subcategories.push(categoryMap.get(category.id));
          }
        } else {
          rootCategories.push(categoryMap.get(category.id));
        }
      });

      return rootCategories;
    } catch (error) {
      this.logger.error('Error getting category hierarchy:', error);
      throw error;
    }
  }

  /**
   * Get available languages for a restaurant
   */
  async getRestaurantLanguages(restaurantId) {
    try {
      const query = `
        SELECT
          rl.id,
          rl.language_id,
          rl.is_default,
          rl.is_active,
          rl.display_order,
          l.name as language_name,
          l.language_code,
          l.native_name,
          l.flag_file
        FROM restaurant_languages rl
        JOIN languages l ON rl.language_id = l.id
        WHERE rl.restaurant_id = $1 AND rl.is_active = true
        ORDER BY rl.display_order ASC, l.name ASC
      `;

      const result = await this.executeQuery(query, [restaurantId]);
      return result.rows;
    } catch (error) {
      this.logger.error('Error getting restaurant languages:', error);
      throw error;
    }
  }

  /**
   * Validate that translation languages belong to restaurant
   */
  async validateTranslationLanguages(restaurantId, languageIds) {
    try {
      const restaurantLanguages = await this.getRestaurantLanguages(restaurantId);
      const validLanguageIds = restaurantLanguages.map((lang) => lang.language_id);

      const invalidLanguages = languageIds.filter((langId) => !validLanguageIds.includes(langId));

      if (invalidLanguages.length > 0) {
        throw new Error(`Invalid language IDs for restaurant: ${invalidLanguages.join(', ')}`);
      }

      return true;
    } catch (error) {
      this.logger.error('Error validating translation languages:', error);
      throw error;
    }
  }

  /**
   * Create a new category with translation validation
   */
  async createWithLanguageValidation(categoryData) {
    try {
      // Validate that all translation languages are configured for the restaurant
      const translationLanguageIds = categoryData.translations.map((t) => t.language_id);
      await this.validateTranslationLanguages(categoryData.restaurant_id, translationLanguageIds);

      // Create the category
      return await this.create(categoryData);
    } catch (error) {
      this.logger.error('Error creating category with language validation:', error);
      throw error;
    }
  }
}

module.exports = MenuCategoryModel;
