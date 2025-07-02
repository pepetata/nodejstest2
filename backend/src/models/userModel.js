const db = require('../config/db');

class UserModel {
  async create(userData) {
    const { email, password, name } = userData;
    const query = `
            INSERT INTO users (email, password, name, created_at, updated_at)
            VALUES ($1, $2, $3, NOW(), NOW())
            RETURNING id, email, name, created_at, updated_at
        `;
    const result = await db.query(query, [email, password, name]);
    return result.rows[0];
  }

  async findById(id) {
    const query = 'SELECT id, email, name, created_at, updated_at FROM users WHERE id = $1';
    const result = await db.query(query, [id]);
    return result.rows[0];
  }

  async findByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await db.query(query, [email]);
    return result.rows[0];
  }

  async update(id, updateData) {
    const { name, email } = updateData;
    const query = `
            UPDATE users 
            SET name = COALESCE($2, name), 
                email = COALESCE($3, email), 
                updated_at = NOW()
            WHERE id = $1
            RETURNING id, email, name, created_at, updated_at
        `;
    const result = await db.query(query, [id, name, email]);
    return result.rows[0];
  }

  async delete(id) {
    const query = 'DELETE FROM users WHERE id = $1';
    await db.query(query, [id]);
    return true;
  }
}

module.exports = new UserModel();
