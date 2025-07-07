/**
 * Test Constants
 * Centralized constants for integration tests
 */

const TEST_CONSTANTS = {
  // Known seed data IDs and values
  SEED_DATA: {
    PIZZARIA_BELLA_ID: '550e8400-e29b-41d4-a716-446655440001',
    PIZZARIA_BELLA_EMAIL: 'joao@pizzariabella.com.br',
    PIZZARIA_BELLA_PASSWORD: 'pizza123',
    PIZZARIA_BELLA_NAME: 'Pizzaria Bella Vista',
    PIZZARIA_BELLA_OWNER: 'João Silva',
    PIZZARIA_BELLA_URL: 'pizzaria-bella-vista',
  },

  // Test values
  TEST_VALUES: {
    NON_EXISTENT_UUID: '00000000-0000-4000-8000-000000000000',
    NON_EXISTENT_EMAIL: 'nonexistent@example.com',
    NON_EXISTENT_URL_NAME: 'non-existent-restaurant',
    INVALID_TOKEN: 'invalid-token-123',
    BCRYPT_HASH_PATTERN: /^\$2b\$\d+\$/,
  },

  // Default pagination
  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 10,
    TEST_LIMIT: 2,
  },

  // Status values
  STATUS: {
    PENDING: 'pending',
    ACTIVE: 'active',
    INACTIVE: 'inactive',
  },

  // Business types
  BUSINESS_TYPES: {
    SINGLE: 'single',
    MULTI_LOCATION: 'multi-location',
  },

  // Subscription plans
  SUBSCRIPTION_PLANS: {
    STARTER: 'starter',
    PREMIUM: 'premium',
    ENTERPRISE: 'enterprise',
  },

  // Test timeouts (in milliseconds)
  TIMEOUTS: {
    DATABASE_OPERATION: 5000,
    AUTHENTICATION: 3000,
  },

  // Error messages to expect
  ERROR_MESSAGES: {
    CURRENT_PASSWORD_INCORRECT: /Current password is incorrect/,
    VALIDATION_FAILED: /Validation failed/,
    DUPLICATE_EMAIL: /Duplicate entry found/,
    DUPLICATE_URL_NAME: /Duplicate entry found/,
    NO_VALID_FIELDS_TO_UPDATE: /No valid fields to update/,
  },
};

module.exports = TEST_CONSTANTS;
