const db = require('../config/db');

class MenuItemModel {
  // Get all menu items for a restaurant with translations and categories
  static async getByRestaurant(restaurantId, languageCode = 'pt-BR') {
    const query = `
      SELECT
        mi.id,
        mi.restaurant_id,
        mi.sku,
        mi.base_price,
        mi.preparation_time_minutes,
        mi.is_available,
        mi.is_featured,
        mi.display_order,
        mi.created_at,
        mi.updated_at,
        mit.name,
        mit.description,
        mit.ingredients,
        mit.preparation_method,
        mit.language_code,
        -- Get categories for this item
        COALESCE(
          JSON_AGG(
            DISTINCT JSONB_BUILD_OBJECT(
              'id', mc.id,
              'name', mct.name,
              'parent_id', mc.parent_category_id
            )
            ORDER BY mic.display_order
          ) FILTER (WHERE mc.id IS NOT NULL),
          '[]'
        ) as categories
      FROM menu_items mi
      LEFT JOIN menu_item_translations mit ON mi.id = mit.item_id AND mit.language_code = $2
      LEFT JOIN menu_item_categories mic ON mi.id = mic.item_id
      LEFT JOIN menu_categories mc ON mic.category_id = mc.id
      LEFT JOIN menu_category_translations mct ON mc.id = mct.category_id AND mct.language_code = $2
      WHERE mi.restaurant_id = $1
      GROUP BY
        mi.id, mi.restaurant_id, mi.sku, mi.base_price, mi.preparation_time_minutes,
        mi.is_available, mi.is_featured, mi.display_order, mi.created_at, mi.updated_at,
        mit.name, mit.description, mit.ingredients, mit.preparation_method, mit.language_code
      ORDER BY mi.display_order, mit.name
    `;

    const result = await db.query(query, [restaurantId, languageCode]);
    return result.rows;
  }

  // Get single menu item by ID with all translations
  static async getById(itemId) {
    const itemQuery = `
      SELECT
        mi.id,
        mi.restaurant_id,
        mi.sku,
        mi.base_price,
        mi.preparation_time_minutes,
        mi.is_available,
        mi.is_featured,
        mi.display_order,
        mi.created_at,
        mi.updated_at
      FROM menu_items mi
      WHERE mi.id = $1
    `;

    const translationsQuery = `
      SELECT
        mit.language_code,
        mit.name,
        mit.description,
        mit.ingredients,
        mit.preparation_method,
        l.name as language_name,
        l.native_name as language_native_name,
        l.flag_file
      FROM menu_item_translations mit
      JOIN languages l ON mit.language_code = l.code
      WHERE mit.item_id = $1
      ORDER BY l.name
    `;

    const categoriesQuery = `
      SELECT
        mc.id,
        mc.parent_category_id,
        mc.display_order as category_order,
        mic.display_order as item_category_order,
        mct.name,
        mct.language_code
      FROM menu_item_categories mic
      JOIN menu_categories mc ON mic.category_id = mc.id
      LEFT JOIN menu_category_translations mct ON mc.id = mct.category_id
      WHERE mic.item_id = $1
      ORDER BY mic.display_order, mct.language_code
    `;

    const [itemResult, translationsResult, categoriesResult] = await Promise.all([
      db.query(itemQuery, [itemId]),
      db.query(translationsQuery, [itemId]),
      db.query(categoriesQuery, [itemId]),
    ]);

    if (itemResult.rows.length === 0) {
      return null;
    }

    const item = itemResult.rows[0];
    item.translations = translationsResult.rows;
    item.categories = categoriesResult.rows;

    return item;
  }

  // Create new menu item
  static async create(itemData, translations, categoryIds = []) {
    const client = await db.getClient();

    try {
      await client.query('BEGIN');

      // Insert main item
      const itemQuery = `
        INSERT INTO menu_items (
          restaurant_id, sku, base_price, preparation_time_minutes,
          is_available, is_featured, display_order
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;

      const itemValues = [
        itemData.restaurant_id,
        itemData.sku || null,
        itemData.base_price,
        itemData.preparation_time_minutes || null,
        itemData.is_available !== undefined ? itemData.is_available : true,
        itemData.is_featured !== undefined ? itemData.is_featured : false,
        itemData.display_order || 0,
      ];

      const itemResult = await client.query(itemQuery, itemValues);
      const newItem = itemResult.rows[0];

      // Insert translations
      for (const translation of translations) {
        const translationQuery = `
          INSERT INTO menu_item_translations (
            item_id, language_code, name, description, ingredients, preparation_method
          ) VALUES ($1, $2, $3, $4, $5, $6)
        `;

        const translationValues = [
          newItem.id,
          translation.language_code,
          translation.name,
          translation.description,
          translation.ingredients || null,
          translation.preparation_method || null,
        ];

        await client.query(translationQuery, translationValues);
      }

      // Insert category relationships
      for (let i = 0; i < categoryIds.length; i++) {
        const categoryQuery = `
          INSERT INTO menu_item_categories (item_id, category_id, display_order)
          VALUES ($1, $2, $3)
        `;
        await client.query(categoryQuery, [newItem.id, categoryIds[i], i]);
      }

      await client.query('COMMIT');
      return newItem;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Update menu item
  static async update(itemId, itemData, translations, categoryIds = []) {
    const client = await db.getClient();

    try {
      await client.query('BEGIN');

      // Update main item
      const itemQuery = `
        UPDATE menu_items SET
          sku = $2,
          base_price = $3,
          preparation_time_minutes = $4,
          is_available = $5,
          is_featured = $6,
          display_order = $7,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
      `;

      const itemValues = [
        itemId,
        itemData.sku || null,
        itemData.base_price,
        itemData.preparation_time_minutes || null,
        itemData.is_available,
        itemData.is_featured,
        itemData.display_order,
      ];

      const itemResult = await client.query(itemQuery, itemValues);

      // Delete existing translations and recreate them
      await client.query('DELETE FROM menu_item_translations WHERE item_id = $1', [itemId]);

      // Insert new translations
      for (const translation of translations) {
        const translationQuery = `
          INSERT INTO menu_item_translations (
            item_id, language_code, name, description, ingredients, preparation_method
          ) VALUES ($1, $2, $3, $4, $5, $6)
        `;

        const translationValues = [
          itemId,
          translation.language_code,
          translation.name,
          translation.description,
          translation.ingredients || null,
          translation.preparation_method || null,
        ];

        await client.query(translationQuery, translationValues);
      }

      // Delete existing category relationships and recreate them
      await client.query('DELETE FROM menu_item_categories WHERE item_id = $1', [itemId]);

      // Insert new category relationships
      for (let i = 0; i < categoryIds.length; i++) {
        const categoryQuery = `
          INSERT INTO menu_item_categories (item_id, category_id, display_order)
          VALUES ($1, $2, $3)
        `;
        await client.query(categoryQuery, [itemId, categoryIds[i], i]);
      }

      await client.query('COMMIT');
      return itemResult.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Delete menu item
  static async delete(itemId) {
    const query = 'DELETE FROM menu_items WHERE id = $1 RETURNING *';
    const result = await db.query(query, [itemId]);
    return result.rows[0];
  }

  // Search menu items
  static async search(restaurantId, searchTerm, categoryId = null, languageCode = 'pt-BR') {
    let query = `
      SELECT
        mi.id,
        mi.restaurant_id,
        mi.sku,
        mi.base_price,
        mi.preparation_time_minutes,
        mi.is_available,
        mi.is_featured,
        mi.display_order,
        mit.name,
        mit.description,
        mit.ingredients,
        mit.preparation_method
      FROM menu_items mi
      LEFT JOIN menu_item_translations mit ON mi.id = mit.item_id AND mit.language_code = $2
      WHERE mi.restaurant_id = $1
    `;

    const params = [restaurantId, languageCode];
    let paramCount = 2;

    if (searchTerm) {
      paramCount++;
      query += ` AND (mit.name ILIKE $${paramCount} OR mit.description ILIKE $${paramCount} OR mit.ingredients ILIKE $${paramCount})`;
      params.push(`%${searchTerm}%`);
    }

    if (categoryId) {
      paramCount++;
      query += ` AND EXISTS (SELECT 1 FROM menu_item_categories mic WHERE mic.item_id = mi.id AND mic.category_id = $${paramCount})`;
      params.push(categoryId);
    }

    query += ` ORDER BY mi.display_order, mit.name`;

    const result = await db.query(query, params);
    return result.rows;
  }

  // Toggle availability
  static async toggleAvailability(itemId) {
    const query = `
      UPDATE menu_items
      SET is_available = NOT is_available, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;
    const result = await db.query(query, [itemId]);
    return result.rows[0];
  }

  // Get items by category
  static async getByCategory(categoryId, languageCode = 'pt-BR') {
    const query = `
      SELECT
        mi.id,
        mi.restaurant_id,
        mi.sku,
        mi.base_price,
        mi.preparation_time_minutes,
        mi.is_available,
        mi.is_featured,
        mi.display_order,
        mit.name,
        mit.description,
        mit.ingredients,
        mit.preparation_method,
        mic.display_order as category_order
      FROM menu_items mi
      JOIN menu_item_categories mic ON mi.id = mic.item_id
      LEFT JOIN menu_item_translations mit ON mi.id = mit.item_id AND mit.language_code = $2
      WHERE mic.category_id = $1
      ORDER BY mic.display_order, mi.display_order, mit.name
    `;

    const result = await db.query(query, [categoryId, languageCode]);
    return result.rows;
  }
}

module.exports = MenuItemModel;
