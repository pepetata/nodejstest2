const db = require('../config/db');

class MenuItemModel {
  async create(menuItemData) {
    const { name, description, price, category, image, isAvailable } = menuItemData;
    const query = `
            INSERT INTO menu_items (name, description, price, category, image, is_available, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
            RETURNING *
        `;
    const result = await db.query(query, [name, description, price, category, image, isAvailable]);
    return result.rows[0];
  }

  async findAll() {
    const query = 'SELECT * FROM menu_items ORDER BY category, name';
    const result = await db.query(query);
    return result.rows;
  }

  async findById(id) {
    const query = 'SELECT * FROM menu_items WHERE id = $1';
    const result = await db.query(query, [id]);
    return result.rows[0];
  }

  async findByCategory(category) {
    const query = 'SELECT * FROM menu_items WHERE category = $1 ORDER BY name';
    const result = await db.query(query, [category]);
    return result.rows;
  }

  async update(id, updateData) {
    const { name, description, price, category, image, isAvailable } = updateData;
    const query = `
            UPDATE menu_items 
            SET name = COALESCE($2, name),
                description = COALESCE($3, description),
                price = COALESCE($4, price),
                category = COALESCE($5, category),
                image = COALESCE($6, image),
                is_available = COALESCE($7, is_available),
                updated_at = NOW()
            WHERE id = $1
            RETURNING *
        `;
    const result = await db.query(query, [
      id,
      name,
      description,
      price,
      category,
      image,
      isAvailable,
    ]);
    return result.rows[0];
  }

  async delete(id) {
    const query = 'DELETE FROM menu_items WHERE id = $1';
    await db.query(query, [id]);
    return true;
  }
}

module.exports = new MenuItemModel();
