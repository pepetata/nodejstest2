/**
 * Database Test Helper
 * Provides utilities for database operations in tests
 */

const { Pool } = require('pg');

class DatabaseTestHelper {
  constructor() {
    this.pool = null;
    this.createdRestaurantIds = new Set();
  }

  /**
   * Initialize test database connection
   */
  async init() {
    this.pool = new Pool({
      user: process.env.DB_USER || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      database: 'alacarte_test',
      password: process.env.DB_PASSWORD || 'admin',
      port: process.env.DB_PORT || 5432,
    });

    // Test connection
    await this.pool.query('SELECT 1');
    return this.pool;
  }

  /**
   * Track created restaurant for cleanup
   * @param {string} restaurantId - Restaurant ID to track
   */
  trackCreatedRestaurant(restaurantId) {
    this.createdRestaurantIds.add(restaurantId);
  }

  /**
   * Clean up all tracked restaurants
   */
  async cleanupCreatedRestaurants() {
    if (this.createdRestaurantIds.size === 0) return;

    try {
      const idsArray = Array.from(this.createdRestaurantIds);
      const placeholders = idsArray.map((_, index) => `$${index + 1}`).join(',');

      await this.pool.query(`DELETE FROM restaurants WHERE id IN (${placeholders})`, idsArray);

      this.createdRestaurantIds.clear();
    } catch (error) {
      console.warn('Failed to clean up test restaurants:', error);
    }
  }

  /**
   * Verify seed data exists
   */
  async verifySeedData() {
    const result = await this.pool.query('SELECT COUNT(*) FROM restaurants');
    const count = parseInt(result.rows[0].count);

    if (count === 0) {
      throw new Error('No seed data found in test database. Please run seed script.');
    }

    return count;
  }

  /**
   * Get restaurant by ID from database
   * @param {string} restaurantId - Restaurant ID
   */
  async getRestaurantById(restaurantId) {
    const result = await this.pool.query('SELECT * FROM restaurants WHERE id = $1', [restaurantId]);
    return result.rows[0] || null;
  }

  /**
   * Close database connection
   */
  async close() {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
    }
  }

  /**
   * Execute raw query
   * @param {string} query - SQL query
   * @param {Array} params - Query parameters
   */
  async query(query, params = []) {
    return this.pool.query(query, params);
  }
}

module.exports = DatabaseTestHelper;
