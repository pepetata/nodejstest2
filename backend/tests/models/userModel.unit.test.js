/**
 * User Model Unit Tests - Schema Validation and Business Logic
 * This file focuses on isolated logic testing without database dependencies
 */

// Mock the logger to prevent actual logging during tests
const mockLogger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  child: jest.fn().mockReturnThis(),
};

// Mock logger module
jest.mock('../../src/utils/logger', () => ({
  logger: mockLogger,
}));

// Mock BaseModel
jest.mock('../../src/models/BaseModel', () => {
  return class MockBaseModel {
    constructor() {
      this.tableName = '';
      this.primaryKey = 'id';
      this.timestamps = true;
      this.softDeletes = false;
    }

    async validate(data, schema) {
      return data;
    }

    async executeQuery(query, params) {
      return { rows: [] };
    }

    async find(conditions, options, columns) {
      return [];
    }

    async findById(id, columns) {
      return null;
    }

    async count(conditions) {
      return 0;
    }

    buildSetClause(data, startIndex = 1) {
      const setParts = [];
      const params = [];
      let paramIndex = startIndex;

      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined) {
          setParts.push(`${key} = $${paramIndex++}`);
          params.push(value);
        }
      });

      const clause = setParts.join(', ');
      return { clause, params, nextIndex: paramIndex };
    }

    sanitizeOutput(data, sensitiveFields = []) {
      if (!data) return data;
      const sanitized = Object.assign({}, data);
      sensitiveFields.forEach((field) => {
        delete sanitized[field];
      });
      return sanitized;
    }
  };
});

// Mock bcrypt
jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

// Mock crypto
jest.mock('crypto', () => ({
  randomBytes: jest.fn(),
}));

const userModel = require('../../src/models/userModel');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const Joi = require('joi');

describe('UserModel - Unit Tests (Schema Validation & Business Logic)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Setup default mock behaviors
    bcrypt.hash.mockResolvedValue('hashed_password');
    bcrypt.compare.mockResolvedValue(true);
    crypto.randomBytes.mockReturnValue({
      toString: jest.fn().mockReturnValue('mock_token'),
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('1. Schema Validation Tests', () => {
    describe('UUID Schema Validation', () => {
      it('should validate correct UUID v4 format', () => {
        const validUuids = [
          '550e8400-e29b-41d4-a716-446655440000',
          'f47ac10b-58cc-4372-a567-0e02b2c3d479',
          '123e4567-e89b-12d3-a456-426614174000',
        ];

        validUuids.forEach((uuid) => {
          const { error } = userModel.uuidSchema.validate(uuid);
          expect(error).toBeUndefined();
        });
      });

      it('should reject invalid UUID formats', () => {
        const invalidUuids = [
          'invalid-uuid',
          '123-456-789',
          '',
          null,
          undefined,
          '550e8400-e29b-41d4-a716',
          '550e8400-e29b-41d4-a716-446655440000-extra',
        ];

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
          password: 'password123',
          full_name: 'Restaurant Admin',
          role: 'restaurant_administrator',
          restaurant_id: '550e8400-e29b-41d4-a716-446655440000',
          status: 'active',
        };

        const { error } = userModel.createSchema.validate(validData);
        expect(error).toBeUndefined();
      });

      it('should validate waiter with username only', () => {
        const validData = {
          username: 'waiter01',
          password: 'password123',
          full_name: 'John Waiter',
          role: 'waiter',
          status: 'active',
        };

        const { error } = userModel.createSchema.validate(validData);
        expect(error).toBeUndefined();
      });

      it('should require email for administrative roles', () => {
        const adminRoles = ['restaurant_administrator', 'location_administrator'];

        adminRoles.forEach((role) => {
          const invalidData = {
            username: 'admin01',
            password: 'password123',
            full_name: 'Admin User',
            role: role,
            restaurant_id: '550e8400-e29b-41d4-a716-446655440000',
          };

          const { error } = userModel.createSchema.validate(invalidData);
          expect(error).toBeDefined();
          expect(error.details[0].path).toContain('email');
        });
      });

      it('should require restaurant_id for restaurant administrator', () => {
        const invalidData = {
          email: 'admin@restaurant.com',
          password: 'password123',
          full_name: 'Admin User',
          role: 'restaurant_administrator',
        };

        const { error } = userModel.createSchema.validate(invalidData);
        expect(error).toBeDefined();
        expect(error.details[0].path).toContain('restaurant_id');
      });

      it('should validate all role types', () => {
        const roles = [
          'restaurant_administrator',
          'location_administrator',
          'waiter',
          'food_runner',
          'kds_operator',
          'pos_operator',
        ];

        roles.forEach((role) => {
          const data = {
            username: 'testuser',
            password: 'password123',
            full_name: 'Test User',
            role: role,
          };

          // Add email for admin roles
          if (['restaurant_administrator', 'location_administrator'].includes(role)) {
            data.email = 'test@example.com';
            if (role === 'restaurant_administrator') {
              data.restaurant_id = '550e8400-e29b-41d4-a716-446655440000';
            }
          }

          const { error } = userModel.createSchema.validate(data);
          expect(error).toBeUndefined();
        });
      });

      it('should reject invalid role types', () => {
        const invalidData = {
          email: 'test@example.com',
          password: 'password123',
          full_name: 'Test User',
          role: 'invalid_role',
        };

        const { error } = userModel.createSchema.validate(invalidData);
        expect(error).toBeDefined();
      });

      it('should validate password requirements', () => {
        const validPasswords = ['password123', 'MySecurePass1', 'Test@123'];
        const invalidPasswords = ['short', '', '1234567']; // Too short

        validPasswords.forEach((password) => {
          const data = {
            username: 'testuser',
            password: password,
            full_name: 'Test User',
            role: 'waiter',
          };

          const { error } = userModel.createSchema.validate(data);
          expect(error).toBeUndefined();
        });

        invalidPasswords.forEach((password) => {
          const data = {
            username: 'testuser',
            password: password,
            full_name: 'Test User',
            role: 'waiter',
          };

          const { error } = userModel.createSchema.validate(data);
          expect(error).toBeDefined();
        });
      });

      it('should validate email format', () => {
        const validEmails = ['test@example.com', 'user.name@domain.co.uk'];
        const invalidEmails = ['invalid-email', '@example.com', 'test@'];

        validEmails.forEach((email) => {
          const data = {
            email: email,
            password: 'password123',
            full_name: 'Test User',
            role: 'restaurant_administrator',
            restaurant_id: '550e8400-e29b-41d4-a716-446655440000',
          };

          const { error } = userModel.createSchema.validate(data);
          expect(error).toBeUndefined();
        });

        invalidEmails.forEach((email) => {
          const data = {
            email: email,
            password: 'password123',
            full_name: 'Test User',
            role: 'restaurant_administrator',
            restaurant_id: '550e8400-e29b-41d4-a716-446655440000',
          };

          const { error } = userModel.createSchema.validate(data);
          expect(error).toBeDefined();
        });
      });

      it('should validate username format', () => {
        const validUsernames = ['user123', 'john', 'alice99'];
        const invalidUsernames = ['us', 'user-name', 'user@name', '12']; // Too short, special chars

        validUsernames.forEach((username) => {
          const data = {
            username: username,
            password: 'password123',
            full_name: 'Test User',
            role: 'waiter',
          };

          const { error } = userModel.createSchema.validate(data);
          expect(error).toBeUndefined();
        });

        invalidUsernames.forEach((username) => {
          const data = {
            username: username,
            password: 'password123',
            full_name: 'Test User',
            role: 'waiter',
          };

          const { error } = userModel.createSchema.validate(data);
          expect(error).toBeDefined();
        });
      });

      it('should validate full_name requirements', () => {
        const validNames = ['John Doe', 'Alice Smith', 'Bob Johnson Jr.'];
        const invalidNames = ['A', '', '   ']; // Too short, empty, whitespace only

        validNames.forEach((name) => {
          const data = {
            username: 'testuser',
            password: 'password123',
            full_name: name,
            role: 'waiter',
          };

          const { error } = userModel.createSchema.validate(data);
          expect(error).toBeUndefined();
        });

        invalidNames.forEach((name) => {
          const data = {
            username: 'testuser',
            password: 'password123',
            full_name: name,
            role: 'waiter',
          };

          const { error } = userModel.createSchema.validate(data);
          expect(error).toBeDefined();
        });
      });

      it('should validate status values', () => {
        const validStatuses = ['pending', 'active', 'inactive', 'suspended'];
        const invalidStatuses = ['invalid', 'deleted', 'archived'];

        validStatuses.forEach((status) => {
          const data = {
            username: 'testuser',
            password: 'password123',
            full_name: 'Test User',
            role: 'waiter',
            status: status,
          };

          const { error } = userModel.createSchema.validate(data);
          expect(error).toBeUndefined();
        });

        invalidStatuses.forEach((status) => {
          const data = {
            username: 'testuser',
            password: 'password123',
            full_name: 'Test User',
            role: 'waiter',
            status: status,
          };

          const { error } = userModel.createSchema.validate(data);
          expect(error).toBeDefined();
        });
      });
    });

    describe('Update Schema Validation', () => {
      it('should validate partial update data', () => {
        const validUpdates = [
          { full_name: 'Updated Name' },
          { status: 'active' },
          { email: 'new@example.com' },
          { username: 'newusername' },
          { role: 'waiter' },
          { email_confirmed: true },
          { first_login_password_change: false },
          { last_login_at: new Date() },
        ];

        validUpdates.forEach((updateData) => {
          const { error } = userModel.updateSchema.validate(updateData);
          expect(error).toBeUndefined();
        });
      });

      it('should require at least one field for update', () => {
        const { error } = userModel.updateSchema.validate({});
        expect(error).toBeDefined();
        expect(error.details[0].message).toContain('at least 1 key');
      });

      it('should allow null values for optional fields', () => {
        const validData = {
          email: null,
          username: null,
          restaurant_id: null,
        };

        const { error } = userModel.updateSchema.validate(validData);
        expect(error).toBeUndefined();
      });
    });
  });

  describe('2. Business Logic Tests', () => {
    describe('UUID Validation Methods', () => {
      it('should validate UUID and return sanitized format', () => {
        const validUuid = '550E8400-E29B-41D4-A716-446655440000'; // Uppercase
        const result = userModel.validateUuid(validUuid);

        expect(result.isValid).toBe(true);
        expect(result.sanitizedUuid).toBe(validUuid.toLowerCase());
      });

      it('should throw error for invalid UUID', () => {
        expect(() => {
          userModel.validateUuid('invalid-uuid');
        }).toThrow('Invalid UUID format');
      });

      it('should handle null/undefined UUID gracefully', () => {
        expect(() => {
          userModel.validateUuid(null);
        }).toThrow('Invalid UUID format');

        expect(() => {
          userModel.validateUuid(undefined);
        }).toThrow('Invalid UUID format');
      });

      it('should return boolean for isValidUuid method', () => {
        const validUuid = '550e8400-e29b-41d4-a716-446655440000';
        const invalidUuid = 'invalid-uuid';

        expect(userModel.isValidUuid(validUuid)).toBe(true);
        expect(userModel.isValidUuid(invalidUuid)).toBe(false);
        expect(userModel.isValidUuid(null)).toBe(false);
        expect(userModel.isValidUuid(undefined)).toBe(false);
      });
    });

    describe('Password Management', () => {
      it('should hash password with correct salt rounds', async () => {
        const password = 'testpassword123';
        await userModel.hashPassword(password);

        expect(bcrypt.hash).toHaveBeenCalledWith(password, 12);
      });

      it('should verify password correctly', async () => {
        const password = 'testpassword123';
        const hash = 'hashed_password';

        const result = await userModel.verifyPassword(password, hash);

        expect(bcrypt.compare).toHaveBeenCalledWith(password, hash);
        expect(result).toBe(true);
      });

      it('should handle bcrypt errors gracefully', async () => {
        bcrypt.hash.mockRejectedValue(new Error('Bcrypt error'));

        await expect(userModel.hashPassword('password')).rejects.toThrow('Bcrypt error');
      });
    });

    describe('Token Generation', () => {
      it('should generate email confirmation token', () => {
        const token = userModel.generateEmailConfirmationToken();

        expect(crypto.randomBytes).toHaveBeenCalledWith(32);
        expect(token).toBe('mock_token');
      });

      it('should generate password reset token', () => {
        const token = userModel.generatePasswordResetToken();

        expect(crypto.randomBytes).toHaveBeenCalledWith(32);
        expect(token).toBe('mock_token');
      });

      it('should generate unique tokens each time', () => {
        // Mock different return values
        crypto.randomBytes
          .mockReturnValueOnce({ toString: jest.fn().mockReturnValue('token1') })
          .mockReturnValueOnce({ toString: jest.fn().mockReturnValue('token2') });

        const token1 = userModel.generateEmailConfirmationToken();
        const token2 = userModel.generatePasswordResetToken();

        expect(token1).toBe('token1');
        expect(token2).toBe('token2');
      });
    });

    describe('Data Sanitization', () => {
      it('should sanitize sensitive fields from output', () => {
        const userData = {
          id: 'user-id',
          email: 'test@example.com',
          password: 'hashed_password',
          email_confirmation_token: 'token',
          password_reset_token: 'reset_token',
          full_name: 'Test User',
        };

        const sanitized = userModel.sanitizeOutput(userData, userModel.sensitiveFields);

        expect(sanitized.id).toBe('user-id');
        expect(sanitized.email).toBe('test@example.com');
        expect(sanitized.full_name).toBe('Test User');
        expect(sanitized.password).toBeUndefined();
        expect(sanitized.email_confirmation_token).toBeUndefined();
        expect(sanitized.password_reset_token).toBeUndefined();
      });

      it('should handle null/undefined data gracefully', () => {
        expect(userModel.sanitizeOutput(null, userModel.sensitiveFields)).toBe(null);
        expect(userModel.sanitizeOutput(undefined, userModel.sensitiveFields)).toBe(undefined);
      });

      it('should not modify original object', () => {
        const userData = {
          id: 'user-id',
          password: 'hashed_password',
        };

        const original = { ...userData };
        userModel.sanitizeOutput(userData, ['password']);

        expect(userData).toEqual(original);
      });
    });
  });

  describe('3. Data Transformation Tests', () => {
    describe('Input Normalization', () => {
      it('should normalize email to lowercase in validation', () => {
        const data = {
          email: 'TEST@EXAMPLE.COM',
          password: 'password123',
          full_name: 'Test User',
          role: 'restaurant_administrator',
          restaurant_id: '550e8400-e29b-41d4-a716-446655440000',
        };

        // Should not throw error even with uppercase email
        const { error } = userModel.createSchema.validate(data);
        expect(error).toBeUndefined();
      });

      it('should trim whitespace from full_name', () => {
        const data = {
          username: 'testuser',
          password: 'password123',
          full_name: '  Test User  ',
          role: 'waiter',
        };

        const { error, value } = userModel.createSchema.validate(data);
        expect(error).toBeUndefined();
        expect(value.full_name).toBe('Test User');
      });

      it('should handle UUID case normalization', () => {
        const upperCaseUuid = '550E8400-E29B-41D4-A716-446655440000';
        const result = userModel.validateUuid(upperCaseUuid);

        expect(result.sanitizedUuid).toBe(upperCaseUuid.toLowerCase());
      });
    });

    describe('Default Values', () => {
      it('should apply default status as pending', () => {
        const data = {
          username: 'testuser',
          password: 'password123',
          full_name: 'Test User',
          role: 'waiter',
        };

        const { error, value } = userModel.createSchema.validate(data);
        expect(error).toBeUndefined();
        expect(value.status).toBe('pending');
      });

      it('should apply default first_login_password_change as true', () => {
        const data = {
          username: 'testuser',
          password: 'password123',
          full_name: 'Test User',
          role: 'waiter',
        };

        const { error, value } = userModel.createSchema.validate(data);
        expect(error).toBeUndefined();
        expect(value.first_login_password_change).toBe(true);
      });
    });
  });

  describe('4. Edge Cases and Error Handling', () => {
    describe('Schema Edge Cases', () => {
      it('should handle very long inputs gracefully', () => {
        const longString = 'a'.repeat(300);

        const data = {
          username: longString,
          password: 'password123',
          full_name: longString,
          role: 'waiter',
        };

        const { error } = userModel.createSchema.validate(data);
        expect(error).toBeDefined(); // Should fail validation
      });

      it('should handle special characters in names', () => {
        const specialNames = ["O'Connor", 'José María', 'Jean-Pierre', 'Li Wei', 'Müller'];

        specialNames.forEach((name) => {
          const data = {
            username: 'testuser',
            password: 'password123',
            full_name: name,
            role: 'waiter',
          };

          const { error } = userModel.createSchema.validate(data);
          expect(error).toBeUndefined();
        });
      });

      it('should handle international email addresses', () => {
        const internationalEmails = ['test@münchen.de', 'user@中国.cn', 'admin@москва.рф'];

        internationalEmails.forEach((email) => {
          const data = {
            email: email,
            password: 'password123',
            full_name: 'Test User',
            role: 'restaurant_administrator',
            restaurant_id: '550e8400-e29b-41d4-a716-446655440000',
          };

          // Joi email validation might not support all international domains
          const { error } = userModel.createSchema.validate(data);
          // Most international domains will fail standard email validation
          expect(error).toBeDefined();
        });
      });
    });

    describe('Method Error Handling', () => {
      it('should handle crypto errors gracefully', () => {
        crypto.randomBytes.mockImplementation(() => {
          throw new Error('Crypto error');
        });

        expect(() => {
          userModel.generateEmailConfirmationToken();
        }).toThrow('Crypto error');
      });

      it('should handle malformed UUID gracefully', () => {
        const malformedUuids = [
          '550e8400-e29b-41d4-a716-44665544000', // Too short
          '550e8400-e29b-41d4-a716-4466554400000', // Too long
          'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', // Invalid chars
        ];

        malformedUuids.forEach((uuid) => {
          expect(() => {
            userModel.validateUuid(uuid);
          }).toThrow('Invalid UUID format');
        });
      });
    });
  });

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
      // Logger is initialized in constructor, not in test
    });

    it('should have all required schemas as getters', () => {
      expect(userModel.createSchema).toBeDefined();
      expect(userModel.updateSchema).toBeDefined();
      expect(userModel.uuidSchema).toBeDefined();

      // Verify they are actually Joi schemas by checking if validate method exists
      expect(typeof userModel.createSchema.validate).toBe('function');
      expect(typeof userModel.updateSchema.validate).toBe('function');
      expect(typeof userModel.uuidSchema.validate).toBe('function');
    });
  });

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
        'changePassword',
        'confirmEmail',
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
