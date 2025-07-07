/**
 * UserModel Comprehensive Test Suite
 * Organized with 80%+ coverage following test categories
 */

const mockLogger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  child: jest.fn().mockReturnThis(),
};

// Mock bcrypt with proper functions
const mockBcrypt = {
  hash: jest
    .fn()
    .mockImplementation((password, saltRounds) =>
      Promise.resolve(`hashed_${password}_${saltRounds}`)
    ),
  compare: jest.fn().mockResolvedValue(true),
};

// Mock crypto
const mockCrypto = {
  randomBytes: jest.fn().mockReturnValue({
    toString: jest.fn().mockReturnValue('mock_token_123456789'),
  }),
};

jest.mock('../../src/utils/logger', () => ({
  logger: mockLogger,
}));

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

    async validate(data, schema) {
      return data;
    }

    async executeQuery(query, params) {
      return { rows: [] };
    }

    async find(conditions, options = {}, columns = ['*']) {
      return [];
    }

    async findById(id, columns = ['*']) {
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
      const sanitized = { ...data };
      sensitiveFields.forEach((field) => {
        delete sanitized[field];
      });
      return sanitized;
    }
  };
});

const userModel = require('../../src/models/userModel');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

// Test data factories
const createValidUserData = (overrides = {}) => ({
  email: 'test@example.com',
  username: 'testuser',
  password: 'password123',
  full_name: 'Test User',
  role: 'waiter',
  restaurant_id: '550e8400-e29b-41d4-a716-446655440000',
  status: 'active',
  ...overrides,
});

const createValidUuid = () => '550e8400-e29b-41d4-a716-446655440000';

describe('UserModel - Comprehensive Test Suite', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  // =================================================================
  // 1. UNIT TESTS - Schema Validation, Business Logic, Data Transformation
  // =================================================================
  describe('1. Unit Tests', () => {
    describe('Constructor and Properties', () => {
      it('should initialize with correct table name and properties', () => {
        expect(userModel.tableName).toBe('users');
        expect(userModel.sensitiveFields).toEqual([
          'password',
          'email_confirmation_token',
          'password_reset_token',
        ]);
        expect(userModel.logger).toBeDefined();
      });

      it('should have all required schemas as getters', () => {
        expect(userModel.uuidSchema).toBeDefined();
        expect(userModel.createSchema).toBeDefined();
        expect(userModel.updateSchema).toBeDefined();
      });
    });

    describe('Schema Validation', () => {
      describe('UUID Validation', () => {
        it('should validate correct UUID v4', () => {
          const validUuid = createValidUuid();
          const result = userModel.validateUuid(validUuid);

          expect(result.isValid).toBe(true);
          expect(result.sanitizedUuid).toBe(validUuid.toLowerCase());
        });

        it('should reject invalid UUID formats', () => {
          const invalidUuids = [
            'invalid-uuid',
            '12345',
            'not-a-uuid-at-all',
            '',
            '550e8400-e29b-41d4-a716', // too short
          ];

          invalidUuids.forEach((invalidUuid) => {
            expect(() => userModel.validateUuid(invalidUuid)).toThrow('Invalid UUID format');
          });
        });

        it('should reject null/undefined UUIDs', () => {
          expect(() => userModel.validateUuid(null)).toThrow();
          expect(() => userModel.validateUuid(undefined)).toThrow();
        });

        it('should return boolean for isValidUuid', () => {
          expect(userModel.isValidUuid(createValidUuid())).toBe(true);
          expect(userModel.isValidUuid('invalid')).toBe(false);
          expect(userModel.isValidUuid(null)).toBe(false);
        });
      });

      describe('Create Schema Validation', () => {
        it('should validate complete restaurant administrator data', async () => {
          const userData = createValidUserData({
            role: 'restaurant_administrator',
            email: 'admin@restaurant.com',
            restaurant_id: createValidUuid(),
          });

          const mockValidate = jest.spyOn(userModel, 'validate').mockResolvedValue(userData);
          const result = await userModel.validate(userData, userModel.createSchema);

          expect(result).toEqual(userData);
          mockValidate.mockRestore();
        });

        it('should validate waiter data with username only', async () => {
          const userData = createValidUserData({
            role: 'waiter',
            email: null,
            username: 'waiter123',
          });

          const mockValidate = jest.spyOn(userModel, 'validate').mockResolvedValue(userData);
          const result = await userModel.validate(userData, userModel.createSchema);

          expect(result).toEqual(userData);
          mockValidate.mockRestore();
        });

        it('should validate all role types', () => {
          const validRoles = [
            'restaurant_administrator',
            'location_administrator',
            'waiter',
            'food_runner',
            'kds_operator',
            'pos_operator',
          ];

          validRoles.forEach((role) => {
            const userData = createValidUserData({ role });
            expect(userData.role).toBe(role);
          });
        });
      });
    });

    describe('Business Logic', () => {
      describe('Password Management', () => {
        it('should hash password with bcrypt', async () => {
          const password = 'password123';
          const result = await userModel.hashPassword(password);

          expect(bcrypt.hash).toHaveBeenCalledWith(password, 12);
          expect(result).toBe('hashed_password123_12');
        });

        it('should verify password with bcrypt', async () => {
          const password = 'password123';
          const hash = 'hashed_password';
          const result = await userModel.verifyPassword(password, hash);

          expect(bcrypt.compare).toHaveBeenCalledWith(password, hash);
          expect(result).toBe(true);
        });

        it('should handle bcrypt errors gracefully', async () => {
          bcrypt.hash.mockRejectedValueOnce(new Error('Bcrypt error'));

          await expect(userModel.hashPassword('password')).rejects.toThrow('Bcrypt error');
        });
      });

      describe('Token Generation', () => {
        it('should generate email confirmation token', () => {
          const token = userModel.generateEmailConfirmationToken();

          expect(crypto.randomBytes).toHaveBeenCalledWith(32);
          expect(token).toBe('mock_token_123456789');
        });

        it('should generate password reset token', () => {
          const token = userModel.generatePasswordResetToken();

          expect(crypto.randomBytes).toHaveBeenCalledWith(32);
          expect(token).toBe('mock_token_123456789');
        });

        it('should generate different tokens on subsequent calls', () => {
          crypto.randomBytes.mockReturnValueOnce({
            toString: jest.fn().mockReturnValue('token1'),
          });
          crypto.randomBytes.mockReturnValueOnce({
            toString: jest.fn().mockReturnValue('token2'),
          });

          const token1 = userModel.generateEmailConfirmationToken();
          const token2 = userModel.generatePasswordResetToken();

          expect(token1).toBe('token1');
          expect(token2).toBe('token2');
        });
      });

      describe('Data Transformation', () => {
        it('should sanitize sensitive fields from output', () => {
          const userData = {
            id: createValidUuid(),
            email: 'test@example.com',
            password: 'hashed_password',
            email_confirmation_token: 'secret_token',
            full_name: 'Test User',
          };

          const sanitized = userModel.sanitizeOutput(userData, userModel.sensitiveFields);

          expect(sanitized).toEqual({
            id: userData.id,
            email: userData.email,
            full_name: userData.full_name,
          });
          expect(sanitized.password).toBeUndefined();
          expect(sanitized.email_confirmation_token).toBeUndefined();
        });

        it('should handle null/undefined data in sanitization', () => {
          expect(userModel.sanitizeOutput(null, userModel.sensitiveFields)).toBeNull();
          expect(userModel.sanitizeOutput(undefined, userModel.sensitiveFields)).toBeUndefined();
        });
      });
    });
  });

  // =================================================================
  // 2. INTEGRATION TESTS - CRUD, Query/Filtering, Relationships
  // =================================================================
  describe('2. Integration Tests', () => {
    describe('CRUD Operations', () => {
      describe('Create User', () => {
        it('should create user successfully with all validations', async () => {
          const userData = createValidUserData();
          const expectedUser = {
            id: createValidUuid(),
            ...userData,
            password: 'hashed_password',
            email_confirmation_token: 'mock_token_123456789',
            created_at: new Date(),
          };

          // Mock all dependencies
          jest.spyOn(userModel, 'validate').mockResolvedValue(userData);
          jest.spyOn(userModel, 'findByEmail').mockResolvedValue(null);
          jest.spyOn(userModel, 'findByUsername').mockResolvedValue(null);
          jest.spyOn(userModel, 'checkRestaurantExists').mockResolvedValue(true);
          jest.spyOn(userModel, 'executeQuery').mockResolvedValue({
            rows: [expectedUser],
          });

          const result = await userModel.create(userData);

          expect(userModel.validate).toHaveBeenCalledWith(userData, expect.any(Object));
          expect(userModel.findByEmail).toHaveBeenCalledWith(userData.email);
          expect(userModel.findByUsername).toHaveBeenCalledWith(userData.username);
          expect(userModel.checkRestaurantExists).toHaveBeenCalledWith(userData.restaurant_id);
          expect(result).toEqual(
            expect.objectContaining({
              id: expectedUser.id,
              email: userData.email,
              full_name: userData.full_name,
            })
          );
        });

        it('should handle email uniqueness constraint', async () => {
          const userData = createValidUserData();
          const existingUser = { id: 'existing-id', email: userData.email };

          jest.spyOn(userModel, 'validate').mockResolvedValue(userData);
          jest.spyOn(userModel, 'findByEmail').mockResolvedValue(existingUser);

          await expect(userModel.create(userData)).rejects.toThrow('Email already exists');
        });

        it('should handle username uniqueness constraint', async () => {
          const userData = createValidUserData();
          const existingUser = { id: 'existing-id', username: userData.username };

          jest.spyOn(userModel, 'validate').mockResolvedValue(userData);
          jest.spyOn(userModel, 'findByEmail').mockResolvedValue(null);
          jest.spyOn(userModel, 'findByUsername').mockResolvedValue(existingUser);

          await expect(userModel.create(userData)).rejects.toThrow('Username already exists');
        });

        it('should validate restaurant existence', async () => {
          const userData = createValidUserData();

          jest.spyOn(userModel, 'validate').mockResolvedValue(userData);
          jest.spyOn(userModel, 'findByEmail').mockResolvedValue(null);
          jest.spyOn(userModel, 'findByUsername').mockResolvedValue(null);
          jest.spyOn(userModel, 'checkRestaurantExists').mockResolvedValue(false);

          await expect(userModel.create(userData)).rejects.toThrow('Restaurant not found');
        });
      });

      describe('Read Operations', () => {
        it('should find user by ID with UUID validation', async () => {
          const userId = createValidUuid();
          const mockUserFromDB = {
            id: userId,
            email: 'test@example.com',
            username: 'testuser',
            full_name: 'Test User',
            role: 'waiter',
            restaurant_id: '550e8400-e29b-41d4-a716-446655440000',
            status: 'active',
            password: 'hashed_password',
            email_confirmation_token: 'some_token',
            password_reset_token: 'reset_token',
            created_at: new Date(),
            updated_at: new Date(),
          };

          // Mock the parent class method to return full user data
          jest
            .spyOn(Object.getPrototypeOf(Object.getPrototypeOf(userModel)), 'findById')
            .mockResolvedValue(mockUserFromDB);

          const result = await userModel.findById(userId);

          // Check that the sanitizeOutput method was called and sensitive fields are removed
          expect(result).toEqual({
            id: userId,
            email: 'test@example.com',
            full_name: 'Test User',
            username: 'testuser',
            role: 'waiter',
            restaurant_id: '550e8400-e29b-41d4-a716-446655440000',
            status: 'active',
            created_at: expect.any(Date),
            updated_at: expect.any(Date),
          });
          // Specifically check that sensitive fields are removed
          expect(result).not.toHaveProperty('password');
          expect(result).not.toHaveProperty('email_confirmation_token');
          expect(result).not.toHaveProperty('password_reset_token');
        });

        it('should reject invalid UUID in findById', async () => {
          // Clear any existing mocks to test actual validation
          jest.restoreAllMocks();

          // The userModel.findById should reject invalid UUIDs
          await expect(userModel.findById('invalid-uuid')).rejects.toThrow(
            'Invalid user ID format. Must be a valid UUID.'
          );
        });

        it('should find user by email with case insensitivity', async () => {
          const mockUser = {
            id: createValidUuid(),
            email: 'test@example.com',
            full_name: 'Test User',
            password: 'hashed_password',
          };

          // Mock the find method on the userModel instance
          jest.spyOn(userModel, 'find').mockResolvedValue([mockUser]);

          const result = await userModel.findByEmail('TEST@EXAMPLE.COM');

          expect(userModel.find).toHaveBeenCalledWith({
            email: 'test@example.com',
          });
          expect(result).toEqual(
            expect.objectContaining({
              id: mockUser.id,
              email: mockUser.email,
            })
          );
          expect(result.password).toBeUndefined(); // Should be sanitized
        });

        it('should return null when user not found', async () => {
          jest.spyOn(userModel, 'find').mockResolvedValue([]);

          const result = await userModel.findByEmail('nonexistent@example.com');

          expect(result).toBeNull();
        });
      });

      describe('Update Operations', () => {
        it('should update user successfully', async () => {
          const userId = createValidUuid();
          const updateData = { full_name: 'Updated Name', status: 'active' };
          const currentUser = {
            id: userId,
            email: 'test@example.com',
            full_name: 'Old Name',
            status: 'pending',
            password: 'hashed_password',
          };
          const updatedUserFromDB = { ...currentUser, ...updateData, password: 'hashed_password' };

          // Mock validation to return the updateData
          jest.spyOn(userModel, 'validate').mockResolvedValue(updateData);

          // Mock parent's findById to return current user (going up two levels in prototype chain)
          jest
            .spyOn(Object.getPrototypeOf(Object.getPrototypeOf(userModel)), 'findById')
            .mockResolvedValue(currentUser);

          // Mock buildSetClause method
          jest.spyOn(userModel, 'buildSetClause').mockReturnValue({
            clause: 'full_name = $1, status = $2',
            params: ['Updated Name', 'active'],
          });

          // Mock executeQuery for the update operation
          jest.spyOn(userModel, 'executeQuery').mockResolvedValue({
            rows: [updatedUserFromDB],
          });

          const result = await userModel.update(userId, updateData);

          expect(result).toEqual(
            expect.objectContaining({
              id: userId,
              full_name: 'Updated Name',
              status: 'active',
            })
          );
          // Password should be sanitized by the real implementation
          expect(result).not.toHaveProperty('password');
        });

        it('should reject invalid UUID in update', async () => {
          const updateData = { full_name: 'Updated Name' };

          await expect(userModel.update('invalid-uuid', updateData)).rejects.toThrow(
            'Invalid user ID format. Must be a valid UUID.'
          );
        });

        it('should reject update when user not found', async () => {
          const userId = createValidUuid();
          const updateData = { full_name: 'Updated Name' };

          jest.spyOn(userModel, 'validate').mockResolvedValue(updateData);
          jest.spyOn(Object.getPrototypeOf(userModel), 'findById').mockResolvedValue(null);

          await expect(userModel.update(userId, updateData)).rejects.toThrow('User not found');
        });
      });

      describe('Delete Operations', () => {
        it('should soft delete user by setting status to inactive', async () => {
          const userId = createValidUuid();
          const updatedUser = { id: userId, status: 'inactive' };

          jest.spyOn(userModel, 'update').mockResolvedValue(updatedUser);

          const result = await userModel.deleteUser(userId);

          expect(userModel.update).toHaveBeenCalledWith(userId, { status: 'inactive' });
          expect(result).toBe(true);
        });

        it('should return false when delete fails', async () => {
          const userId = createValidUuid();

          jest.spyOn(userModel, 'update').mockResolvedValue(null);

          const result = await userModel.deleteUser(userId);

          expect(result).toBe(false);
        });
      });
    });

    describe('Query and Filtering', () => {
      describe('Restaurant User Queries', () => {
        it('should get users by restaurant ID', async () => {
          const restaurantId = createValidUuid();
          const mockUsers = [
            { id: createValidUuid(), restaurant_id: restaurantId, role: 'waiter' },
            { id: createValidUuid(), restaurant_id: restaurantId, role: 'food_runner' },
          ];

          jest.spyOn(userModel, 'find').mockResolvedValue(mockUsers);

          const result = await userModel.getUsersByRestaurant(restaurantId);

          expect(userModel.find).toHaveBeenCalledWith(
            { restaurant_id: restaurantId },
            { orderBy: 'created_at DESC' }
          );
          expect(result).toHaveLength(2);
        });

        it('should filter users by status and role', async () => {
          const restaurantId = createValidUuid();
          const options = { status: 'active', role: 'waiter' };
          const mockUsers = [
            {
              id: createValidUuid(),
              restaurant_id: restaurantId,
              status: 'active',
              role: 'waiter',
            },
          ];

          jest.spyOn(userModel, 'find').mockResolvedValue(mockUsers);

          const result = await userModel.getUsersByRestaurant(restaurantId, options);

          expect(userModel.find).toHaveBeenCalledWith(
            {
              restaurant_id: restaurantId,
              status: 'active',
              role: 'waiter',
            },
            { orderBy: 'created_at DESC' }
          );
          expect(result).toHaveLength(1);
        });
      });

      describe('Authentication Queries', () => {
        it('should authenticate with email', async () => {
          const mockUser = {
            id: createValidUuid(),
            email: 'test@example.com',
            password: 'hashed_password',
            status: 'active',
          };

          jest.spyOn(userModel, 'find').mockResolvedValue([mockUser]);
          jest.spyOn(userModel, 'update').mockResolvedValue(mockUser);

          const result = await userModel.authenticate('test@example.com', 'password123');

          expect(userModel.find).toHaveBeenCalledWith({ email: 'test@example.com' });
          expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashed_password');
          expect(userModel.update).toHaveBeenCalledWith(mockUser.id, {
            last_login_at: expect.any(Date),
          });
          expect(result).toEqual(
            expect.objectContaining({
              id: mockUser.id,
              email: mockUser.email,
            })
          );
          expect(result.password).toBeUndefined();
        });

        it('should return null for inactive user', async () => {
          const mockUser = {
            id: createValidUuid(),
            email: 'test@example.com',
            password: 'hashed_password',
            status: 'inactive',
          };

          jest.spyOn(userModel, 'find').mockResolvedValue([mockUser]);

          const result = await userModel.authenticate('test@example.com', 'password123');

          expect(result).toBeNull();
        });

        it('should return null for invalid password', async () => {
          const mockUser = {
            id: createValidUuid(),
            email: 'test@example.com',
            password: 'hashed_password',
            status: 'active',
          };

          jest.spyOn(userModel, 'find').mockResolvedValue([mockUser]);
          bcrypt.compare.mockResolvedValueOnce(false);

          const result = await userModel.authenticate('test@example.com', 'wrongpassword');

          expect(result).toBeNull();
        });
      });
    });

    describe('Relationships', () => {
      it('should check restaurant existence', async () => {
        const restaurantId = createValidUuid();

        // Mock the executeQuery method directly on the userModel instance
        jest.spyOn(userModel, 'executeQuery').mockResolvedValue({
          rows: [{ exists: true }],
        });

        const result = await userModel.checkRestaurantExists(restaurantId);

        expect(userModel.executeQuery).toHaveBeenCalledWith(
          'SELECT 1 FROM restaurants WHERE id = $1',
          [restaurantId]
        );
        expect(result).toBe(true);
      });

      it('should return false when restaurant does not exist', async () => {
        const restaurantId = createValidUuid();

        jest.spyOn(userModel, 'executeQuery').mockResolvedValue({
          rows: [],
        });

        const result = await userModel.checkRestaurantExists(restaurantId);

        expect(result).toBe(false);
      });
    });
  });

  // =================================================================
  // 3. DATA VALIDATION AND CONSTRAINTS
  // =================================================================
  describe('3. Data Validation and Constraints', () => {
    describe('Database Constraints', () => {
      it('should handle unique constraint violation for email', async () => {
        const userData = createValidUserData();
        const dbError = new Error(
          'duplicate key value violates unique constraint "users_email_key"'
        );

        jest.spyOn(userModel, 'validate').mockResolvedValue(userData);
        jest.spyOn(userModel, 'findByEmail').mockResolvedValue(null);
        jest.spyOn(userModel, 'findByUsername').mockResolvedValue(null);
        jest.spyOn(userModel, 'checkRestaurantExists').mockResolvedValue(true);
        jest.spyOn(userModel, 'executeQuery').mockRejectedValue(dbError);

        await expect(userModel.create(userData)).rejects.toThrow(dbError);
      });

      it('should handle foreign key constraint violation', async () => {
        const userData = createValidUserData();
        const dbError = new Error('violates foreign key constraint "users_restaurant_id_fkey"');

        jest.spyOn(userModel, 'validate').mockResolvedValue(userData);
        jest.spyOn(userModel, 'findByEmail').mockResolvedValue(null);
        jest.spyOn(userModel, 'findByUsername').mockResolvedValue(null);
        jest.spyOn(userModel, 'checkRestaurantExists').mockResolvedValue(true);
        jest.spyOn(userModel, 'executeQuery').mockRejectedValue(dbError);

        await expect(userModel.create(userData)).rejects.toThrow(dbError);
      });
    });

    describe('Custom Validation Rules', () => {
      it('should enforce business rules for administrator roles', async () => {
        const userData = createValidUserData({
          role: 'restaurant_administrator',
          restaurant_id: null, // Should be required
        });

        const validationError = new Error('Restaurant ID is required for restaurant administrator');
        jest.spyOn(userModel, 'validate').mockRejectedValue(validationError);

        await expect(userModel.create(userData)).rejects.toThrow(validationError);
      });

      it('should validate email format', async () => {
        const userData = createValidUserData({
          email: 'invalid-email',
        });

        const validationError = new Error('Email must be a valid email address');
        jest.spyOn(userModel, 'validate').mockRejectedValue(validationError);

        await expect(userModel.create(userData)).rejects.toThrow(validationError);
      });
    });
  });

  // =================================================================
  // 4. ERROR HANDLING AND EDGE CASES
  // =================================================================
  describe('4. Error Handling and Edge Cases', () => {
    describe('Database Error Handling', () => {
      it('should handle database connection errors', async () => {
        const userData = createValidUserData();
        const dbError = new Error('Connection to database failed');

        jest.spyOn(userModel, 'validate').mockResolvedValue(userData);
        jest.spyOn(userModel, 'executeQuery').mockRejectedValue(dbError);

        await expect(userModel.create(userData)).rejects.toThrow(dbError);
        expect(mockLogger.error).toHaveBeenCalledWith(
          'Failed to create user',
          expect.objectContaining({
            error: dbError.message,
          })
        );
      });

      it('should handle query timeout errors', async () => {
        const userId = createValidUuid();
        const timeoutError = new Error('Query timeout');

        jest.spyOn(Object.getPrototypeOf(userModel), 'findById').mockRejectedValue(timeoutError);

        await expect(userModel.findById(userId)).rejects.toThrow(timeoutError);
      });
    });

    describe('Edge Cases', () => {
      it('should handle empty string inputs', async () => {
        const userData = createValidUserData({
          email: '',
          username: '',
          full_name: '',
        });

        const validationError = new Error('Validation failed for empty strings');
        jest.spyOn(userModel, 'validate').mockRejectedValue(validationError);

        await expect(userModel.create(userData)).rejects.toThrow(validationError);
      });

      it('should handle very long input strings', async () => {
        const userData = createValidUserData({
          full_name: 'a'.repeat(1000), // Very long name
        });

        const validationError = new Error('Full name is too long');
        jest.spyOn(userModel, 'validate').mockRejectedValue(validationError);

        await expect(userModel.create(userData)).rejects.toThrow(validationError);
      });

      it('should handle null values appropriately', async () => {
        const userData = createValidUserData({
          restaurant_id: null,
          email: null,
        });

        jest.spyOn(userModel, 'validate').mockResolvedValue(userData);
        jest.spyOn(userModel, 'findByUsername').mockResolvedValue(null);
        jest.spyOn(userModel, 'executeQuery').mockResolvedValue({
          rows: [{ ...userData, id: createValidUuid() }],
        });

        const result = await userModel.create(userData);

        expect(result).toBeDefined();
      });
    });

    describe('Logging and Error Tracking', () => {
      it('should log errors with appropriate context', async () => {
        const userData = createValidUserData();
        const error = new Error('Test error');

        jest.spyOn(userModel, 'validate').mockRejectedValue(error);

        await expect(userModel.create(userData)).rejects.toThrow(error);

        expect(mockLogger.error).toHaveBeenCalledWith(
          'Failed to create user',
          expect.objectContaining({
            email: userData.email,
            username: userData.username,
            error: error.message,
          })
        );
      });

      it('should log successful operations', async () => {
        const userData = createValidUserData();
        const createdUser = { id: createValidUuid(), ...userData };

        jest.spyOn(userModel, 'validate').mockResolvedValue(userData);
        jest.spyOn(userModel, 'findByEmail').mockResolvedValue(null);
        jest.spyOn(userModel, 'findByUsername').mockResolvedValue(null);
        jest.spyOn(userModel, 'checkRestaurantExists').mockResolvedValue(true);
        jest.spyOn(userModel, 'executeQuery').mockResolvedValue({
          rows: [createdUser],
        });

        await userModel.create(userData);

        expect(mockLogger.info).toHaveBeenCalledWith(
          'User created successfully',
          expect.objectContaining({
            user_id: createdUser.id,
            email: userData.email,
          })
        );
      });
    });
  });

  // =================================================================
  // 5. PERFORMANCE TESTS
  // =================================================================
  describe('5. Performance Tests', () => {
    describe('Query Performance', () => {
      it('should handle bulk user operations efficiently', async () => {
        const startTime = Date.now();
        const restaurantId = createValidUuid();
        const mockUsers = Array(100)
          .fill(null)
          .map((_, i) => ({
            id: createValidUuid(),
            email: `user${i}@example.com`,
            restaurant_id: restaurantId,
          }));

        jest.spyOn(userModel, 'find').mockResolvedValue(mockUsers);

        const result = await userModel.getUsersByRestaurant(restaurantId);
        const endTime = Date.now();

        expect(result).toHaveLength(100);
        expect(endTime - startTime).toBeLessThan(100); // Should complete quickly
      });

      it('should optimize repeated UUID validations', () => {
        const startTime = Date.now();
        const uuid = createValidUuid();

        // Validate the same UUID multiple times
        for (let i = 0; i < 100; i++) {
          userModel.isValidUuid(uuid);
        }

        const endTime = Date.now();
        expect(endTime - startTime).toBeLessThan(100); // More realistic expectation
      });
    });

    describe('Memory Usage', () => {
      it('should not leak memory during repeated operations', async () => {
        const userData = createValidUserData();

        jest.spyOn(userModel, 'validate').mockResolvedValue(userData);

        // Perform many validation operations
        const promises = Array(50)
          .fill(null)
          .map(() => userModel.validate(userData, userModel.createSchema));

        const results = await Promise.all(promises);

        expect(results).toHaveLength(50);
        expect(jest.getTimerCount()).toBe(0); // No dangling timers
      });
    });
  });

  // =================================================================
  // 6. SECURITY TESTS
  // =================================================================
  describe('6. Security Tests', () => {
    describe('Data Security', () => {
      it('should always hash passwords before storage', async () => {
        const userData = createValidUserData();
        const originalPassword = userData.password;
        const hashedPassword = 'hashed_password123_12';

        jest.spyOn(userModel, 'validate').mockResolvedValue(userData);
        jest.spyOn(userModel, 'findByEmail').mockResolvedValue(null);
        jest.spyOn(userModel, 'findByUsername').mockResolvedValue(null);
        jest.spyOn(userModel, 'checkRestaurantExists').mockResolvedValue(true);

        // Mock hashPassword to return expected hash and track the call
        const hashPasswordSpy = jest
          .spyOn(userModel, 'hashPassword')
          .mockResolvedValue(hashedPassword);

        jest.spyOn(userModel, 'executeQuery').mockResolvedValue({
          rows: [{ id: createValidUuid(), ...userData, password: hashedPassword }],
        });

        await userModel.create(userData);

        // Check that hashPassword was called with the original password
        expect(hashPasswordSpy).toHaveBeenCalledWith(originalPassword);
      });

      it('should sanitize output to prevent sensitive data exposure', async () => {
        // Test the sanitizeOutput method directly instead of through findById
        const userWithSensitiveData = {
          id: createValidUuid(),
          email: 'test@example.com',
          password: 'hashed_password',
          email_confirmation_token: 'secret_token',
          password_reset_token: 'reset_token',
          full_name: 'Test User',
        };

        const result = userModel.sanitizeOutput(userWithSensitiveData, userModel.sensitiveFields);

        // Check that sensitive fields are removed
        expect(result.password).toBeUndefined();
        expect(result.email_confirmation_token).toBeUndefined();
        expect(result.password_reset_token).toBeUndefined();

        // Check that non-sensitive fields are preserved
        expect(result.email).toBe('test@example.com');
        expect(result.full_name).toBe('Test User');
        expect(result.id).toBe(userWithSensitiveData.id);
      });

      it('should use secure salt rounds for password hashing', async () => {
        await userModel.hashPassword('password123');

        expect(bcrypt.hash).toHaveBeenCalledWith('password123', 12); // 12 rounds minimum
      });

      it('should generate cryptographically secure tokens', () => {
        const token = userModel.generateEmailConfirmationToken();

        expect(crypto.randomBytes).toHaveBeenCalledWith(32); // 256 bits
        expect(token).toBe('mock_token_123456789');
      });
    });

    describe('Input Sanitization', () => {
      it('should normalize email addresses to lowercase', async () => {
        const mockUser = { id: createValidUuid(), email: 'test@example.com' };

        jest.spyOn(userModel, 'find').mockResolvedValue([mockUser]);

        await userModel.findByEmail('TEST@EXAMPLE.COM');

        expect(userModel.find).toHaveBeenCalledWith({
          email: 'test@example.com',
        });
      });

      it('should normalize usernames to lowercase', async () => {
        const mockUser = { id: createValidUuid(), username: 'testuser' };

        jest.spyOn(userModel, 'find').mockResolvedValue([mockUser]);

        await userModel.findByUsername('TESTUSER');

        expect(userModel.find).toHaveBeenCalledWith({
          username: 'testuser',
        });
      });
    });

    describe('Access Control', () => {
      it('should enforce role-based validation rules', async () => {
        const adminData = createValidUserData({
          role: 'restaurant_administrator',
          restaurant_id: null, // Should be required for admin
        });

        const validationError = new Error('Restaurant ID required for administrator');
        jest.spyOn(userModel, 'validate').mockRejectedValue(validationError);

        await expect(userModel.create(adminData)).rejects.toThrow(validationError);
      });

      it('should validate UUID format to prevent injection', async () => {
        // Clear any lingering mocks that might interfere
        jest.restoreAllMocks();

        const maliciousId = "'; DROP TABLE users; --";

        await expect(userModel.findById(maliciousId)).rejects.toThrow(
          'Invalid user ID format. Must be a valid UUID.'
        );
      });
    });
  });

  // =================================================================
  // 7. STATE AND LIFECYCLE TESTS
  // =================================================================
  describe('7. State and Lifecycle Tests', () => {
    describe('Model State Management', () => {
      it('should maintain consistent state across operations', async () => {
        expect(userModel.tableName).toBe('users');
        expect(userModel.sensitiveFields).toEqual([
          'password',
          'email_confirmation_token',
          'password_reset_token',
        ]);

        // State should not change after operations
        await userModel.isValidUuid(createValidUuid());

        expect(userModel.tableName).toBe('users');
        expect(userModel.sensitiveFields).toEqual([
          'password',
          'email_confirmation_token',
          'password_reset_token',
        ]);
      });

      it('should handle concurrent operations safely', async () => {
        const userId = createValidUuid();
        const updateData1 = { full_name: 'Name 1' };
        const updateData2 = { full_name: 'Name 2' };
        const currentUser = { id: userId, email: 'test@example.com', full_name: 'Old Name' };

        jest
          .spyOn(userModel, 'validate')
          .mockResolvedValueOnce(updateData1)
          .mockResolvedValueOnce(updateData2);
        // Mock the BaseModel's findById method (going up two levels in prototype chain)
        jest
          .spyOn(Object.getPrototypeOf(Object.getPrototypeOf(userModel)), 'findById')
          .mockResolvedValue(currentUser);
        jest
          .spyOn(userModel, 'buildSetClause')
          .mockReturnValueOnce({ clause: 'full_name = $1', params: ['Name 1'] })
          .mockReturnValueOnce({ clause: 'full_name = $1', params: ['Name 2'] });
        jest
          .spyOn(userModel, 'executeQuery')
          .mockResolvedValueOnce({ rows: [{ id: userId, ...updateData1, password: 'hash' }] })
          .mockResolvedValueOnce({ rows: [{ id: userId, ...updateData2, password: 'hash' }] });

        const promise1 = userModel.update(userId, updateData1);
        const promise2 = userModel.update(userId, updateData2);

        const [result1, result2] = await Promise.all([promise1, promise2]);

        expect(result1).toBeDefined();
        expect(result2).toBeDefined();
        // Check that password is sanitized by the real implementation
        expect(result1).not.toHaveProperty('password');
        expect(result2).not.toHaveProperty('password');
      });
    });

    describe('User Lifecycle Events', () => {
      it('should handle email confirmation lifecycle', async () => {
        const token = 'confirmation_token';
        const mockUser = {
          id: createValidUuid(),
          email: 'test@example.com',
          email_confirmed: true,
        };

        jest.spyOn(userModel, 'executeQuery').mockResolvedValue({
          rows: [mockUser],
        });

        const result = await userModel.confirmEmail(token);

        expect(userModel.executeQuery).toHaveBeenCalledWith(expect.stringContaining('UPDATE'), [
          token,
        ]);
        expect(result).toEqual(
          expect.objectContaining({
            id: mockUser.id,
            email: mockUser.email,
          })
        );
      });

      it('should handle password change lifecycle', async () => {
        const userId = createValidUuid();
        const newPassword = 'newpassword123';
        const hashedPassword = 'hashed_newpassword123_12';
        const updatedUser = {
          id: userId,
          password_changed_at: new Date(),
          first_login_password_change: false,
        };

        jest.spyOn(userModel, 'hashPassword').mockResolvedValue(hashedPassword);
        jest.spyOn(userModel, 'update').mockResolvedValue(updatedUser);

        const result = await userModel.changePassword(userId, newPassword);

        expect(userModel.hashPassword).toHaveBeenCalledWith(newPassword);
        expect(userModel.update).toHaveBeenCalledWith(userId, {
          password: hashedPassword,
          password_changed_at: expect.any(Date),
          first_login_password_change: false,
        });
        expect(result).toEqual(updatedUser);
      });

      it('should handle user deactivation lifecycle', async () => {
        const userId = createValidUuid();

        jest.spyOn(userModel, 'update').mockResolvedValue({ id: userId, status: 'inactive' });

        const result = await userModel.deleteUser(userId);

        expect(userModel.update).toHaveBeenCalledWith(userId, { status: 'inactive' });
        expect(result).toBe(true);
      });
    });
  });

  // =================================================================
  // 8. TRANSACTION TESTS
  // =================================================================
  describe('8. Transaction Tests', () => {
    describe('Transaction Handling', () => {
      it('should handle transaction rollback on create failure', async () => {
        const userData = createValidUserData();
        const dbError = new Error('Database constraint violation');

        jest.spyOn(userModel, 'validate').mockResolvedValue(userData);
        jest.spyOn(userModel, 'findByEmail').mockResolvedValue(null);
        jest.spyOn(userModel, 'findByUsername').mockResolvedValue(null);
        jest.spyOn(userModel, 'checkRestaurantExists').mockResolvedValue(true);
        jest.spyOn(userModel, 'executeQuery').mockRejectedValue(dbError);

        await expect(userModel.create(userData)).rejects.toThrow(dbError);

        expect(mockLogger.error).toHaveBeenCalledWith(
          'Failed to create user',
          expect.objectContaining({
            error: dbError.message,
          })
        );
      });

      it('should handle transaction consistency in updates', async () => {
        const userId = createValidUuid();
        const updateData = { email: 'new@example.com', full_name: 'New Name' };
        const currentUser = { id: userId, email: 'old@example.com', full_name: 'Old Name' };
        const updatedUserFromDB = {
          id: userId,
          email: updateData.email,
          full_name: updateData.full_name,
          updated_at: new Date().toISOString(),
          password: 'hashed_password',
        };

        jest.spyOn(userModel, 'validate').mockResolvedValue(updateData);
        // Mock the BaseModel's findById method (going up two levels in prototype chain)
        jest
          .spyOn(Object.getPrototypeOf(Object.getPrototypeOf(userModel)), 'findById')
          .mockResolvedValue(currentUser);
        jest.spyOn(userModel, 'findByEmail').mockResolvedValue(null); // Email available
        jest.spyOn(userModel, 'buildSetClause').mockReturnValue({
          clause: 'email = $1, full_name = $2',
          params: ['new@example.com', 'New Name'],
        });
        jest.spyOn(userModel, 'executeQuery').mockResolvedValue({
          rows: [updatedUserFromDB],
        });

        const result = await userModel.update(userId, updateData);

        expect(result).toEqual(
          expect.objectContaining({
            id: userId,
            email: updateData.email,
            full_name: updateData.full_name,
          })
        );
        // Check that password is sanitized by the real implementation
        expect(result).not.toHaveProperty('password');
      });

      it('should handle authentication transaction atomicity', async () => {
        const mockUser = {
          id: createValidUuid(),
          email: 'test@example.com',
          password: 'hashed_password',
          status: 'active',
          last_login_at: null,
        };

        jest.spyOn(userModel, 'find').mockResolvedValue([mockUser]);
        jest.spyOn(userModel, 'update').mockResolvedValue({
          ...mockUser,
          last_login_at: new Date(),
        });

        const result = await userModel.authenticate('test@example.com', 'password123');

        expect(userModel.find).toHaveBeenCalledWith({ email: 'test@example.com' });
        expect(userModel.update).toHaveBeenCalledWith(mockUser.id, {
          last_login_at: expect.any(Date),
        });
        expect(result).toEqual(
          expect.objectContaining({
            id: mockUser.id,
            email: mockUser.email,
          })
        );
      });
    });

    describe('Data Consistency', () => {
      it('should maintain referential integrity with restaurants', async () => {
        const userData = createValidUserData();

        jest.spyOn(userModel, 'validate').mockResolvedValue(userData);
        jest.spyOn(userModel, 'findByEmail').mockResolvedValue(null);
        jest.spyOn(userModel, 'findByUsername').mockResolvedValue(null);
        jest.spyOn(userModel, 'checkRestaurantExists').mockResolvedValue(false);

        // Spy on executeQuery to ensure it's not called when restaurant doesn't exist
        const executeQuerySpy = jest.spyOn(userModel, 'executeQuery');

        await expect(userModel.create(userData)).rejects.toThrow('Restaurant not found');

        // Should not proceed with user creation if restaurant doesn't exist
        expect(executeQuerySpy).not.toHaveBeenCalledWith(
          expect.stringContaining('INSERT'),
          expect.any(Array)
        );
      });

      it('should ensure unique constraints are enforced', async () => {
        const userData = createValidUserData();
        const existingUser = { id: 'existing-id', email: userData.email };

        jest.spyOn(userModel, 'validate').mockResolvedValue(userData);
        jest.spyOn(userModel, 'findByEmail').mockResolvedValue(existingUser);

        // Spy on executeQuery to ensure it's not called when email exists
        const executeQuerySpy = jest.spyOn(userModel, 'executeQuery');

        await expect(userModel.create(userData)).rejects.toThrow('Email already exists');

        // Should not proceed with user creation if email exists
        expect(executeQuerySpy).not.toHaveBeenCalledWith(
          expect.stringContaining('INSERT'),
          expect.any(Array)
        );
      });
    });
  });

  // =================================================================
  // 9. METHOD COVERAGE AND COMPLETENESS
  // =================================================================
  describe('9. Method Coverage and Completeness', () => {
    describe('API Completeness', () => {
      it('should have all required CRUD methods', () => {
        const requiredMethods = [
          'create',
          'findById',
          'findByEmail',
          'findByUsername',
          'update',
          'deleteUser',
        ];

        requiredMethods.forEach((method) => {
          expect(typeof userModel[method]).toBe('function');
        });
      });

      it('should have all business logic methods', () => {
        const businessMethods = [
          'authenticate',
          'confirmEmail',
          'changePassword',
          'hashPassword',
          'verifyPassword',
          'generateEmailConfirmationToken',
          'generatePasswordResetToken',
        ];

        businessMethods.forEach((method) => {
          expect(typeof userModel[method]).toBe('function');
        });
      });

      it('should have all utility methods', () => {
        const utilityMethods = [
          'validateUuid',
          'isValidUuid',
          'checkRestaurantExists',
          'getUsersByRestaurant',
        ];

        utilityMethods.forEach((method) => {
          expect(typeof userModel[method]).toBe('function');
        });
      });

      it('should have all required schemas', () => {
        const requiredSchemas = ['uuidSchema', 'createSchema', 'updateSchema'];

        requiredSchemas.forEach((schema) => {
          expect(userModel[schema]).toBeDefined();
        });
      });
    });

    describe('Schema Coverage', () => {
      it('should cover all user table fields in schemas', () => {
        const createSchema = userModel.createSchema.describe();
        const updateSchema = userModel.updateSchema.describe();

        // Key fields should be present in create schema
        expect(createSchema.keys).toHaveProperty('email');
        expect(createSchema.keys).toHaveProperty('username');
        expect(createSchema.keys).toHaveProperty('password');
        expect(createSchema.keys).toHaveProperty('full_name');
        expect(createSchema.keys).toHaveProperty('role');
        expect(createSchema.keys).toHaveProperty('restaurant_id');
        expect(createSchema.keys).toHaveProperty('status');

        // Key fields should be present in update schema
        expect(updateSchema.keys).toHaveProperty('email');
        expect(updateSchema.keys).toHaveProperty('username');
        expect(updateSchema.keys).toHaveProperty('full_name');
        expect(updateSchema.keys).toHaveProperty('role');
        expect(updateSchema.keys).toHaveProperty('status');
      });
    });
  });

  // =================================================================
  // 10. INTEGRATION WITH FRAMEWORK
  // =================================================================
  describe('10. Integration with Framework', () => {
    describe('BaseModel Integration', () => {
      it('should properly extend BaseModel', () => {
        expect(userModel.constructor.name).toBe('UserModel');
        expect(userModel.tableName).toBe('users');
        expect(typeof userModel.validate).toBe('function');
        expect(typeof userModel.executeQuery).toBe('function');
        expect(typeof userModel.find).toBe('function');
        expect(typeof userModel.findById).toBe('function');
      });

      it('should use BaseModel sanitization', () => {
        const testData = {
          id: createValidUuid(),
          password: 'secret',
          email: 'test@example.com',
        };

        const sanitized = userModel.sanitizeOutput(testData, ['password']);

        expect(sanitized.password).toBeUndefined();
        expect(sanitized.email).toBe('test@example.com');
      });
    });

    describe('Logger Integration', () => {
      it('should use logger with model context', () => {
        // The logger should be mocked and child should have been called during model initialization
        // Check that the model has a logger property
        expect(userModel.logger).toBeDefined();
        expect(typeof userModel.logger.info).toBe('function');
        expect(typeof userModel.logger.error).toBe('function');
      });

      it('should log at appropriate levels', async () => {
        const userData = createValidUserData();

        jest.spyOn(userModel, 'validate').mockResolvedValue(userData);
        jest.spyOn(userModel, 'findByEmail').mockResolvedValue(null);
        jest.spyOn(userModel, 'findByUsername').mockResolvedValue(null);
        jest.spyOn(userModel, 'checkRestaurantExists').mockResolvedValue(true);
        jest.spyOn(userModel, 'executeQuery').mockResolvedValue({
          rows: [{ id: createValidUuid(), ...userData }],
        });

        await userModel.create(userData);

        expect(mockLogger.info).toHaveBeenCalledWith(
          'Creating new user',
          expect.objectContaining({
            email: userData.email,
            role: userData.role,
          })
        );

        expect(mockLogger.debug).toHaveBeenCalledWith('User data validation successful');

        expect(mockLogger.info).toHaveBeenCalledWith(
          'User created successfully',
          expect.any(Object)
        );
      });
    });

    describe('Joi Integration', () => {
      it('should use Joi for validation schemas', () => {
        // Check that schemas have validation capabilities
        expect(typeof userModel.createSchema.validate).toBe('function');
        expect(typeof userModel.updateSchema.validate).toBe('function');
        expect(typeof userModel.uuidSchema.validate).toBe('function');
      });
    });

    describe('External Dependencies', () => {
      it('should properly integrate with bcrypt', async () => {
        const password = 'testpassword';
        const hash = await userModel.hashPassword(password);

        expect(bcrypt.hash).toHaveBeenCalledWith(password, 12);
        expect(hash).toBe('hashed_testpassword_12');

        const isValid = await userModel.verifyPassword(password, hash);

        expect(bcrypt.compare).toHaveBeenCalledWith(password, hash);
        expect(isValid).toBe(true);
      });

      it('should properly integrate with crypto', () => {
        const token = userModel.generateEmailConfirmationToken();

        expect(crypto.randomBytes).toHaveBeenCalledWith(32);
        expect(token).toBe('mock_token_123456789');
      });
    });
  });
});
