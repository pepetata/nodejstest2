/**
 * Test Data Factory
 * Generates consistent, unique test data for integration tests
 */

const { v4: uuidv4 } = require('uuid');

class TestDataFactory {
  /**
   * Generate unique test restaurant data
   * @param {Object} overrides - Override specific fields
   * @returns {Object} Test restaurant data
   */
  static createRestaurantData(overrides = {}) {
    const timestamp = Date.now();
    const uniqueId = Math.random().toString(36).substring(7);

    const baseData = {
      owner_name: `Test Owner ${uniqueId}`,
      email: `test.${timestamp}.${uniqueId}@example.com`,
      password: 'testpass123',
      phone: '11999887766',
      whatsapp: '11999887766',
      restaurant_name: `Test Restaurant ${uniqueId}`,
      restaurant_url_name: `test-restaurant-${timestamp}-${uniqueId}`,
      business_type: 'single',
      cuisine_type: 'Test Cuisine',
      website: `https://test-restaurant-${uniqueId}.com`,
      description: `A test restaurant for integration testing - ${uniqueId}`,
      subscription_plan: 'starter',
      marketing_consent: true,
      terms_accepted: true,
    };

    return { ...baseData, ...overrides };
  }

  /**
   * Generate minimal required restaurant data
   * @param {Object} overrides - Override specific fields
   * @returns {Object} Minimal test restaurant data
   */
  static createMinimalRestaurantData(overrides = {}) {
    const timestamp = Date.now();
    const uniqueId = Math.random().toString(36).substring(7);

    const baseData = {
      owner_name: `Test Owner ${uniqueId}`,
      email: `test.${timestamp}.${uniqueId}@example.com`,
      password: 'testpass123',
      restaurant_name: `Test Restaurant ${uniqueId}`,
      restaurant_url_name: `test-restaurant-${timestamp}-${uniqueId}`,
      terms_accepted: true,
    };

    return { ...baseData, ...overrides };
  }

  /**
   * Generate update data for existing restaurant
   * @param {Object} overrides - Override specific fields
   * @returns {Object} Update data
   */
  static createUpdateData(overrides = {}) {
    const uniqueId = Math.random().toString(36).substring(7);

    const baseData = {
      owner_name: `Updated Owner ${uniqueId}`,
      restaurant_name: `Updated Restaurant ${uniqueId}`,
      cuisine_type: 'Updated Cuisine',
      description: `Updated description for restaurant - ${uniqueId}`,
      website: `https://updated-restaurant-${uniqueId}.com`,
    };

    return { ...baseData, ...overrides };
  }

  /**
   * Generate known seed data for tests that need existing data
   * @returns {Object} Known seed data
   */
  static getKnownSeedData() {
    return {
      pizzariaBella: {
        id: '550e8400-e29b-41d4-a716-446655440001',
        email: 'joao@pizzariabella.com.br',
        restaurant_name: 'Pizzaria Bella Vista',
        owner_name: 'João Silva',
        restaurant_url_name: 'pizzaria-bella-vista',
        password: 'pizza123', // Plain text password for auth tests
      },
    };
  }
}

module.exports = TestDataFactory;
