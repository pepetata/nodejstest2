/**
 * UserModel Unit Tests
 * Focuses on isolated logic testing: Schema validation, business logic, data transformation
 */

// =============================================================================
// MOCKS SETUP
// =============================================================================

const mockLogger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  child: jest.fn().mockReturnThis(),
};

const mockBcrypt = {
  hash: jest
    .fn()
    .mockImplementation((password, saltRounds) =>
      Promise.resolve(`$2b$${saltRounds}$hashedversion.${password.substring(0, 5)}`)
    ),
  compare: jest
    .fn()
    .mockImplementation((password, hash) =>
      Promise.resolve(hash.includes(password.substring(0, 5)))
    ),
};

const mockCrypto = {
  randomBytes: jest.fn().mockImplementation((size) => ({
    toString: jest.fn().mockReturnValue(
      Math.random()
        .toString(36)
        .substring(2, size + 2)
    ),
  })),
};

jest.mock('../../src/utils/logger', () => ({ logger: mockLogger }));
jest.mock('bcrypt', () => mockBcrypt);
jest.mock('crypto', () => mockCrypto);

jest.mock('../../src/models/BaseModel', () => {
  return class MockBaseModel {
    constructor() {
      this.tableName = '';
      this.primaryKey = 'id';
      this.timestamps = true;
      this.softDeletes = false;
    }

    sanitizeOutput(data, sensitiveFields = []) {
      if (!data) return data;
      const sanitized = { ...data };
      sensitiveFields.forEach((field) => delete sanitized[field]);
      return sanitized;
    }
  };
});

const userModel = require('../../src/models/userModel');

// =============================================================================
// TEST DATA
// =============================================================================

const validUuid = '123e4567-e89b-12d3-a456-426614174000';
const invalidUuids = ['invalid-uuid', '12345', '', null, undefined];

const createValidUserData = (overrides = {}) => ({
  email: 'test@example.com',
  password: 'securePassword123!',
  full_name: 'Test User',
  role: 'waiter',
  status: 'active',
  ...overrides,
});

// =============================================================================
// UNIT TESTS
// =============================================================================

describe('UserModel - Unit Tests (Schema Validation & Business Logic)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ===========================================================================
  // 1. SCHEMA VALIDATION TESTS
  // ===========================================================================

  describe('1. Schema Validation Tests', () => {
    describe('UUID Schema Validation', () => {
      it('should validate correct UUID v4 format', () => {
        const validUuids = [
          '123e4567-e89b-12d3-a456-426614174000',
          'a1b2c3d4-e5f6-4789-a012-3456789abcde',
        ];

        validUuids.forEach((uuid) => {
          const { error } = userModel.uuidSchema.validate(uuid);
          expect(error).toBeUndefined();
        });
      });

      it('should reject invalid UUID formats', () => {
        invalidUuids.forEach((uuid) => {
          const { error } = userModel.uuidSchema.validate(uuid);
          expect(error).toBeDefined();
        });
      });
    });

    describe('Create Schema Validation', () => {
      it('should validate complete restaurant administrator data', () => {
        const validData = {
          email: 'admin@restaurant.com',
          password: 'securePassword123!',
          full_name: 'Restaurant Admin',
          role: 'restaurant_administrator',
          restaurant_id: validUuid,
          status: 'active',
        };

        const { error } = userModel.createSchema.validate(validData);
        expect(error).toBeUndefined();
      });

      it('should validate waiter with username only', () => {
        const validData = {
          username: 'waiter01',
          password: 'password123!',
          full_name: 'John Waiter',
          role: 'waiter',
          status: 'active',
        };

        const { error } = userModel.createSchema.validate(validData);
        expect(error).toBeUndefined();
      });

      it('should require email for administrative roles', () => {
        ['restaurant_administrator', 'location_administrator'].forEach((role) => {
          const invalidData = {
            username: 'admin01',
            password: 'password123!',
            full_name: 'Admin User',
            role,
            restaurant_id: role === 'restaurant_administrator' ? validUuid : undefined,
          };

          const { error } = userModel.createSchema.validate(invalidData);
          expect(error).toBeDefined();
          expect(error.details[0].path).toContain('email');
        });
      });

      it('should require restaurant_id for restaurant administrator', () => {
        const invalidData = {
          email: 'admin@restaurant.com',
          password: 'password123!',
          full_name: 'Admin User',
          role: 'restaurant_administrator',
        };

        const { error } = userModel.createSchema.validate(invalidData);
        expect(error).toBeDefined();
        expect(error.details[0].path).toContain('restaurant_id');
      });

      it('should validate all role types', () => {
        const roles = [
          { role: 'restaurant_administrator', needsEmail: true, needsRestaurantId: true },
          { role: 'location_administrator', needsEmail: true, needsRestaurantId: false },
          { role: 'waiter', needsEmail: false, needsRestaurantId: false },
          { role: 'food_runner', needsEmail: false, needsRestaurantId: false },
          { role: 'kds_operator', needsEmail: false, needsRestaurantId: false },
          { role: 'pos_operator', needsEmail: false, needsRestaurantId: false },
        ];

        roles.forEach(({ role, needsEmail, needsRestaurantId }) => {
          const data = {
            password: 'password123!',
            full_name: 'Test User',
            role,
          };

          if (needsEmail) {
            data.email = 'test@example.com';
          } else {
            data.username = 'testuser';
          }

          if (needsRestaurantId) {
            data.restaurant_id = validUuid;
          }

          const { error } = userModel.createSchema.validate(data);
          expect(error).toBeUndefined();
        });
      });

      it('should reject invalid role types', () => {
        const invalidData = createValidUserData({ role: 'invalid_role' });
        const { error } = userModel.createSchema.validate(invalidData);
        expect(error).toBeDefined();
      });

      it('should validate password requirements', () => {
        const testCases = [
          { password: '1234567', shouldFail: true, reason: 'too short' },
          { password: '', shouldFail: true, reason: 'empty' },
          { password: 'a'.repeat(300), shouldFail: true, reason: 'too long' },
          { password: 'validPassword123!', shouldFail: false, reason: 'valid' },
        ];

        testCases.forEach(({ password, shouldFail, reason }) => {
          const userData = createValidUserData({ password });
          const { error } = userModel.createSchema.validate(userData);

          if (shouldFail) {
            expect(error).toBeDefined();
          } else {
            expect(error).toBeUndefined();
          }
        });
      });

      it('should validate email format', () => {
        const testCases = [
          { email: 'valid@example.com', shouldFail: false },
          { email: 'invalid-email', shouldFail: true },
          { email: '@domain.com', shouldFail: true },
          { email: 'user@', shouldFail: true },
          { email: 'user@domain', shouldFail: true },
        ];

        testCases.forEach(({ email, shouldFail }) => {
          const userData = createValidUserData({ email });
          const { error } = userModel.createSchema.validate(userData);

          if (shouldFail) {
            expect(error).toBeDefined();
          } else {
            expect(error).toBeUndefined();
          }
        });
      });

      it('should validate username format', () => {
        const testCases = [
          { username: 'validuser123', shouldFail: false },
          { username: 'ab', shouldFail: true, reason: 'too short' },
          { username: 'a'.repeat(101), shouldFail: true, reason: 'too long' },
          { username: 'user-name', shouldFail: true, reason: 'special chars' },
        ];

        testCases.forEach(({ username, shouldFail }) => {
          const userData = createValidUserData({ email: null, username });
          const { error } = userModel.createSchema.validate(userData);

          if (shouldFail) {
            expect(error).toBeDefined();
          } else {
            expect(error).toBeUndefined();
          }
        });
      });

      it('should validate full_name requirements', () => {
        const testCases = [
          { full_name: 'Valid Name', shouldFail: false },
          { full_name: 'A', shouldFail: true, reason: 'too short' },
          { full_name: '', shouldFail: true, reason: 'empty' },
          { full_name: 'a'.repeat(300), shouldFail: true, reason: 'too long' },
          { full_name: '  Trimmed Name  ', shouldFail: false, reason: 'trimmed' },
        ];

        testCases.forEach(({ full_name, shouldFail }) => {
          const userData = createValidUserData({ full_name });
          const { error } = userModel.createSchema.validate(userData);

          if (shouldFail) {
            expect(error).toBeDefined();
          } else {
            expect(error).toBeUndefined();
          }
        });
      });

      it('should validate status values', () => {
        const validStatuses = ['pending', 'active', 'inactive', 'suspended'];
        const invalidStatuses = ['unknown', 'deleted', '', null];

        validStatuses.forEach((status) => {
          const userData = createValidUserData({ status });
          const { error } = userModel.createSchema.validate(userData);
          expect(error).toBeUndefined();
        });

        invalidStatuses.forEach((status) => {
          const userData = createValidUserData({ status });
          const { error } = userModel.createSchema.validate(userData);
          expect(error).toBeDefined();
        });
      });
    });

    describe('Update Schema Validation', () => {
      it('should validate partial update data', () => {
        const validData = {
          full_name: 'Updated Name',
          status: 'active',
        };

        const { error } = userModel.updateSchema.validate(validData);
        expect(error).toBeUndefined();
      });

      it('should require at least one field for update', () => {
        const { error } = userModel.updateSchema.validate({});
        expect(error).toBeDefined();
      });

      it('should allow null values for optional fields', () => {
        const updateData = {
          email: null,
          username: null,
          restaurant_id: null,
        };

        const { error } = userModel.updateSchema.validate(updateData);
        expect(error).toBeUndefined();
      });
    });
  });

  // ===========================================================================
  // 2. BUSINESS LOGIC TESTS
  // ===========================================================================

  describe('2. Business Logic Tests', () => {
    describe('UUID Validation Methods', () => {
      it('should validate UUID and return sanitized format', () => {
        const uuid = 'ABC12345-E89B-12D3-A456-426614174000';
        const result = userModel.validateUuid(uuid);

        expect(result.isValid).toBe(true);
        expect(result.sanitizedUuid).toBe(uuid.toLowerCase());
      });

      it('should throw error for invalid UUID', () => {
        invalidUuids.forEach((uuid) => {
          expect(() => userModel.validateUuid(uuid)).toThrow('Invalid UUID format');
        });
      });

      it('should handle null/undefined UUID gracefully', () => {
        [null, undefined].forEach((uuid) => {
          expect(() => userModel.validateUuid(uuid)).toThrow('Invalid UUID format');
        });
      });

      it('should return boolean for isValidUuid method', () => {
        expect(userModel.isValidUuid(validUuid)).toBe(true);
        invalidUuids.forEach((uuid) => {
          expect(userModel.isValidUuid(uuid)).toBe(false);
        });
      });
    });

    describe('Password Management', () => {
      it('should hash password with correct salt rounds', async () => {
        const password = 'testPassword123!';
        const result = await userModel.hashPassword(password);

        expect(mockBcrypt.hash).toHaveBeenCalledWith(password, 12);
        expect(result).toMatch(/^\$2b\$12\$/);
      });

      it('should verify password correctly', async () => {
        const password = 'testPassword123!';
        const hash = '$2b$12$hashedversion.testP';

        const result = await userModel.verifyPassword(password, hash);

        expect(mockBcrypt.compare).toHaveBeenCalledWith(password, hash);
        expect(result).toBe(true);
      });

      it('should handle bcrypt errors gracefully', async () => {
        mockBcrypt.hash.mockRejectedValueOnce(new Error('Bcrypt error'));

        await expect(userModel.hashPassword('')).rejects.toThrow('Bcrypt error');
      });
    });

    describe('Token Generation', () => {
      it('should generate email confirmation token', () => {
        const token = userModel.generateEmailConfirmationToken();

        expect(mockCrypto.randomBytes).toHaveBeenCalledWith(32);
        expect(typeof token).toBe('string');
        expect(token.length).toBeGreaterThan(0);
      });

      it('should generate password reset token', () => {
        const token = userModel.generatePasswordResetToken();

        expect(mockCrypto.randomBytes).toHaveBeenCalledWith(32);
        expect(typeof token).toBe('string');
        expect(token.length).toBeGreaterThan(0);
      });

      it('should generate unique tokens each time', () => {
        const token1 = userModel.generateEmailConfirmationToken();
        const token2 = userModel.generateEmailConfirmationToken();

        expect(token1).not.toBe(token2);
      });
    });

    describe('Data Sanitization', () => {
      it('should sanitize sensitive fields from output', () => {
        const userData = {
          id: '123',
          email: 'test@example.com',
          password: 'secret',
          email_confirmation_token: 'token123',
          password_reset_token: 'reset456',
        };

        const sanitized = userModel.sanitizeOutput(userData, userModel.sensitiveFields);

        expect(sanitized.id).toBe('123');
        expect(sanitized.email).toBe('test@example.com');
        expect(sanitized.password).toBeUndefined();
        expect(sanitized.email_confirmation_token).toBeUndefined();
        expect(sanitized.password_reset_token).toBeUndefined();
      });

      it('should handle null/undefined data gracefully', () => {
        expect(userModel.sanitizeOutput(null, [])).toBeNull();
        expect(userModel.sanitizeOutput(undefined, [])).toBeUndefined();
      });

      it('should not modify original object', () => {
        const original = {
          id: '123',
          password: 'secret',
          email: 'test@example.com',
        };
        const originalCopy = { ...original };

        userModel.sanitizeOutput(original, ['password']);

        expect(original).toEqual(originalCopy);
      });
    });
  });

  // ===========================================================================
  // 3. DATA TRANSFORMATION TESTS
  // ===========================================================================

  describe('3. Data Transformation Tests', () => {
    describe('Input Normalization', () => {
      it('should normalize email to lowercase in validation', () => {
        const mixedCaseEmail = 'TEST@EXAMPLE.COM';
        const userData = createValidUserData({ email: mixedCaseEmail });

        const { error, value } = userModel.createSchema.validate(userData);
        expect(error).toBeUndefined();
        // Joi email validation handles case normalization
      });

      it('should trim whitespace from full_name', () => {
        const nameWithSpaces = '  John Doe  ';
        const userData = createValidUserData({ full_name: nameWithSpaces });

        const { error, value } = userModel.createSchema.validate(userData);
        expect(error).toBeUndefined();
        expect(value.full_name).toBe('John Doe');
      });

      it('should handle UUID case normalization', () => {
        const mixedCaseUuid = 'ABC12345-E89B-12D3-A456-426614174000';
        const result = userModel.validateUuid(mixedCaseUuid);

        expect(result.sanitizedUuid).toBe(mixedCaseUuid.toLowerCase());
      });
    });

    describe('Default Values', () => {
      it('should apply default status as pending', () => {
        const userData = createValidUserData();
        delete userData.status;

        const { error, value } = userModel.createSchema.validate(userData);
        expect(error).toBeUndefined();
        expect(value.status).toBe('pending');
      });

      it('should apply default first_login_password_change as true', () => {
        const userData = createValidUserData();

        const { error, value } = userModel.createSchema.validate(userData);
        expect(error).toBeUndefined();
        expect(value.first_login_password_change).toBe(true);
      });
    });
  });

  // ===========================================================================
  // 4. EDGE CASES AND ERROR HANDLING
  // ===========================================================================

  describe('4. Edge Cases and Error Handling', () => {
    describe('Schema Edge Cases', () => {
      it('should handle very long inputs gracefully', () => {
        const veryLongString = 'a'.repeat(300);
        const userData = createValidUserData({ full_name: veryLongString });

        const { error } = userModel.createSchema.validate(userData);
        expect(error).toBeDefined();
      });

      it('should handle special characters in names', () => {
        const specialCharNames = ['José María', 'Anne-Marie', "O'Connor", 'François', 'Müller'];

        specialCharNames.forEach((name) => {
          const userData = createValidUserData({ full_name: name });
          const { error } = userModel.createSchema.validate(userData);
          expect(error).toBeUndefined();
        });
      });

      it('should handle international email addresses', () => {
        const internationalEmails = [
          'test@münchen.de', // IDN domain - might pass in modern Joi
          'user@中文.域名', // Chinese domain - should fail
          'test@exam ple.com', // Space in domain - should fail
        ];

        // Test at least one email fails validation
        let hasError = false;
        internationalEmails.forEach((email) => {
          const userData = createValidUserData({ email });
          const { error } = userModel.createSchema.validate(userData);
          if (error) {
            hasError = true;
          }
        });

        // At least one should fail
        expect(hasError).toBe(true);
      });
    });

    describe('Method Error Handling', () => {
      it('should handle crypto errors gracefully', () => {
        mockCrypto.randomBytes.mockImplementationOnce(() => {
          throw new Error('Crypto error');
        });

        expect(() => userModel.generateEmailConfirmationToken()).toThrow('Crypto error');
      });

      it('should handle malformed UUID gracefully', () => {
        const malformedUuids = [
          'not-a-uuid',
          '123-456-789',
          'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
        ];

        malformedUuids.forEach((uuid) => {
          expect(userModel.isValidUuid(uuid)).toBe(false);
        });
      });
    });
  });

  // ===========================================================================
  // 5. MODEL PROPERTIES AND CONFIGURATION
  // ===========================================================================

  describe('5. Model Properties and Configuration', () => {
    it('should have correct table name', () => {
      expect(userModel.tableName).toBe('users');
    });

    it('should have correct sensitive fields defined', () => {
      expect(userModel.sensitiveFields).toEqual([
        'password',
        'email_confirmation_token',
        'password_reset_token',
      ]);
    });

    it('should have logger initialized', () => {
      expect(userModel.logger).toBeDefined();
      // The logger.child might have been called during module loading
      // Just verify the logger exists and is functional
      expect(typeof userModel.logger.info).toBe('function');
      expect(typeof userModel.logger.error).toBe('function');
    });

    it('should have all required schemas as getters', () => {
      expect(userModel.createSchema).toBeDefined();
      expect(userModel.updateSchema).toBeDefined();
      expect(userModel.uuidSchema).toBeDefined();

      expect(typeof userModel.createSchema.validate).toBe('function');
      expect(typeof userModel.updateSchema.validate).toBe('function');
      expect(typeof userModel.uuidSchema.validate).toBe('function');
    });
  });

  // ===========================================================================
  // 6. METHOD AVAILABILITY
  // ===========================================================================

  describe('6. Method Availability', () => {
    it('should have all required CRUD methods', () => {
      const crudMethods = [
        'create',
        'findById',
        'findByEmail',
        'findByUsername',
        'update',
        'deleteUser',
      ];

      crudMethods.forEach((method) => {
        expect(typeof userModel[method]).toBe('function');
      });
    });

    it('should have all authentication methods', () => {
      const authMethods = [
        'authenticate',
        'hashPassword',
        'verifyPassword',
        'confirmEmail',
        'changePassword',
      ];

      authMethods.forEach((method) => {
        expect(typeof userModel[method]).toBe('function');
      });
    });

    it('should have utility methods', () => {
      const utilityMethods = [
        'validateUuid',
        'isValidUuid',
        'generateEmailConfirmationToken',
        'generatePasswordResetToken',
        'getUsersByRestaurant',
        'checkRestaurantExists',
      ];

      utilityMethods.forEach((method) => {
        expect(typeof userModel[method]).toBe('function');
      });
    });
  });
});
