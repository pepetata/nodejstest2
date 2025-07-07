// Mock the logger to prevent actual logging during tests
const mockLogger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock logger module
jest.mock('../../src/utils/logger', () => ({
  logger: {
    child: jest.fn(() => mockLogger),
  },
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
  hash: jest.fn().mockResolvedValue('hashed_password'),
  compare: jest.fn().mockResolvedValue(true),
}));

// Mock crypto
jest.mock('crypto', () => ({
  randomBytes: jest.fn().mockReturnValue({
    toString: jest.fn().mockReturnValue('mock_token'),
  }),
}));

const userModel = require('../../src/models/userModel');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

describe('UserModel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Constructor and Properties', () => {
    it('should initialize with correct properties', () => {
      expect(userModel.tableName).toBe('users');
      expect(userModel.sensitiveFields).toEqual([
        'password',
        'email_confirmation_token',
        'password_reset_token',
      ]);
      expect(userModel.logger).toBeDefined();
    });

    it('should have all required schemas as getters', () => {
      expect(userModel.createSchema).toBeDefined();
      expect(userModel.updateSchema).toBeDefined();
      expect(userModel.uuidSchema).toBeDefined();
    });
  });

  describe('UUID Validation', () => {
    describe('validateUuid', () => {
      it('should validate a correct UUID v4', () => {
        const validUuid = '550e8400-e29b-41d4-a716-446655440000';
        const result = userModel.validateUuid(validUuid);

        expect(result.isValid).toBe(true);
        expect(result.sanitizedUuid).toBe(validUuid.toLowerCase());
      });

      it('should throw error for invalid UUID', () => {
        expect(() => {
          userModel.validateUuid('invalid-uuid');
        }).toThrow('Invalid UUID format');
      });

      it('should handle null/undefined UUID', () => {
        expect(() => {
          userModel.validateUuid(null);
        }).toThrow('Invalid UUID format');

        expect(() => {
          userModel.validateUuid(undefined);
        }).toThrow('Invalid UUID format');
      });
    });

    describe('isValidUuid', () => {
      it('should return true for valid UUID', () => {
        const validUuid = '550e8400-e29b-41d4-a716-446655440000';
        expect(userModel.isValidUuid(validUuid)).toBe(true);
      });

      it('should return false for invalid UUID', () => {
        expect(userModel.isValidUuid('invalid-uuid')).toBe(false);
      });

      it('should return false for null/undefined UUID', () => {
        expect(userModel.isValidUuid(null)).toBe(false);
        expect(userModel.isValidUuid(undefined)).toBe(false);
      });
    });
  });

  describe('Password Management', () => {
    describe('hashPassword', () => {
      it('should hash password with bcrypt', async () => {
        const password = 'testpassword123';
        const result = await userModel.hashPassword(password);

        expect(bcrypt.hash).toHaveBeenCalledWith(password, 12);
        expect(result).toBe('hashed_password');
      });
    });

    describe('verifyPassword', () => {
      it('should verify password with bcrypt', async () => {
        const password = 'testpassword123';
        const hash = 'hashed_password';
        const result = await userModel.verifyPassword(password, hash);

        expect(bcrypt.compare).toHaveBeenCalledWith(password, hash);
        expect(result).toBe(true);
      });
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
  });

  describe('Validation Schemas', () => {
    describe('createSchema', () => {
      it('should validate complete user data for restaurant administrator', () => {
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

      it('should validate user data for waiter with username', () => {
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

      it('should require email for restaurant administrator', () => {
        const invalidData = {
          username: 'admin01',
          password: 'password123',
          full_name: 'Admin User',
          role: 'restaurant_administrator',
          restaurant_id: '550e8400-e29b-41d4-a716-446655440000',
        };

        const { error } = userModel.createSchema.validate(invalidData);
        expect(error).toBeDefined();
        expect(error.details[0].path).toContain('email');
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

      it('should require either email or username', () => {
        const invalidData = {
          password: 'password123',
          full_name: 'Test User',
          role: 'waiter',
        };

        const { error } = userModel.createSchema.validate(invalidData);
        expect(error).toBeDefined();
      });

      it('should validate role values', () => {
        const validRoles = [
          { role: 'restaurant_administrator', needsRestaurantId: true, needsEmail: true },
          { role: 'location_administrator', needsRestaurantId: false, needsEmail: true },
          { role: 'waiter', needsRestaurantId: false, needsEmail: false },
          { role: 'food_runner', needsRestaurantId: false, needsEmail: false },
          { role: 'kds_operator', needsRestaurantId: false, needsEmail: false },
          { role: 'pos_operator', needsRestaurantId: false, needsEmail: false },
        ];

        validRoles.forEach(({ role, needsRestaurantId, needsEmail }) => {
          const data = {
            password: 'password123',
            full_name: 'Test User',
            role: role,
          };

          if (needsEmail) {
            data.email = 'test@example.com';
          } else {
            data.username = 'testuser';
          }

          if (needsRestaurantId) {
            data.restaurant_id = '550e8400-e29b-41d4-a716-446655440000';
          }

          const { error } = userModel.createSchema.validate(data);
          expect(error).toBeUndefined();
        });

        // Test invalid role
        const invalidData = {
          email: 'test@example.com',
          password: 'password123',
          full_name: 'Test User',
          role: 'invalid_role',
        };

        const { error } = userModel.createSchema.validate(invalidData);
        expect(error).toBeDefined();
      });
    });

    describe('updateSchema', () => {
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
    });
  });

  describe('CRUD Operations', () => {
    const mockUserData = {
      email: 'test@example.com',
      password: 'password123',
      full_name: 'Test User',
      role: 'waiter',
      status: 'active',
    };

    describe('create', () => {
      it('should create user successfully', async () => {
        const mockCreatedUser = {
          id: '550e8400-e29b-41d4-a716-446655440000',
          email: mockUserData.email,
          full_name: mockUserData.full_name,
          role: mockUserData.role,
          status: mockUserData.status,
          password: 'hashed_password',
          email_confirmation_token: 'mock_token',
          created_at: new Date(),
          updated_at: new Date(),
        };

        jest.spyOn(userModel, 'validate').mockResolvedValue(mockUserData);
        jest.spyOn(userModel, 'findByEmail').mockResolvedValue(null);
        jest.spyOn(userModel, 'hashPassword').mockResolvedValue('hashed_password');
        jest.spyOn(userModel, 'executeQuery').mockResolvedValue({
          rows: [mockCreatedUser],
        });

        const result = await userModel.create(mockUserData);

        expect(userModel.validate).toHaveBeenCalledWith(mockUserData, expect.any(Object));
        expect(userModel.hashPassword).toHaveBeenCalledWith(mockUserData.password);
        expect(result).toEqual(
          expect.objectContaining({
            id: mockCreatedUser.id,
            email: mockCreatedUser.email,
            full_name: mockCreatedUser.full_name,
          })
        );
        expect(result.password).toBeUndefined(); // Should be sanitized
      });

      it('should throw error when email already exists', async () => {
        const existingUser = { id: 'existing-id', email: mockUserData.email };

        jest.spyOn(userModel, 'validate').mockResolvedValue(mockUserData);
        jest.spyOn(userModel, 'findByEmail').mockResolvedValue(existingUser);

        await expect(userModel.create(mockUserData)).rejects.toThrow('Email already exists');
      });

      it('should handle validation errors', async () => {
        jest.spyOn(userModel, 'validate').mockRejectedValue(new Error('Validation failed'));

        await expect(userModel.create({})).rejects.toThrow('Validation failed');
      });
    });

    describe('findById', () => {
      it('should find user by valid ID', async () => {
        const userId = '550e8400-e29b-41d4-a716-446655440000';
        const mockUser = {
          id: userId,
          email: 'test@example.com',
          full_name: 'Test User',
          password: 'hashed_password',
        };

        const originalFindById = userModel.__proto__.findById;
        userModel.__proto__.findById = jest.fn().mockResolvedValue(mockUser);

        const result = await userModel.findById(userId);

        expect(result).toEqual(
          expect.objectContaining({
            id: userId,
            email: 'test@example.com',
            full_name: 'Test User',
          })
        );
        expect(result.password).toBeUndefined(); // Should be sanitized

        // Restore original method
        userModel.__proto__.findById = originalFindById;
      });

      it('should throw error for invalid UUID', async () => {
        const originalIsValidUuid = userModel.isValidUuid;
        userModel.isValidUuid = jest.fn().mockReturnValue(false);

        await expect(userModel.findById('invalid-uuid')).rejects.toThrow(
          'Invalid user ID format. Must be a valid UUID.'
        );

        // Restore original method
        userModel.isValidUuid = originalIsValidUuid;
      });
    });

    describe('findByEmail', () => {
      it('should find user by email', async () => {
        const mockUser = {
          id: '550e8400-e29b-41d4-a716-446655440000',
          email: 'test@example.com',
          full_name: 'Test User',
          password: 'hashed_password',
        };

        const originalFind = userModel.find;
        userModel.find = jest.fn().mockResolvedValue([mockUser]);

        const result = await userModel.findByEmail('test@example.com');

        expect(userModel.find).toHaveBeenCalledWith({ email: 'test@example.com' });
        expect(result).toEqual(
          expect.objectContaining({
            id: mockUser.id,
            email: mockUser.email,
          })
        );
        expect(result.password).toBeUndefined(); // Should be sanitized

        // Restore original method
        userModel.find = originalFind;
      });

      it('should return null when user not found', async () => {
        const originalFind = userModel.find;
        userModel.find = jest.fn().mockResolvedValue([]);

        const result = await userModel.findByEmail('nonexistent@example.com');

        expect(result).toBeNull();

        // Restore original method
        userModel.find = originalFind;
      });
    });

    describe('authenticate', () => {
      it('should authenticate user with valid credentials', async () => {
        const mockUser = {
          id: '550e8400-e29b-41d4-a716-446655440000',
          email: 'test@example.com',
          password: 'hashed_password',
          status: 'active',
          full_name: 'Test User',
        };

        jest.spyOn(userModel, 'find').mockResolvedValue([mockUser]);
        jest.spyOn(userModel, 'verifyPassword').mockResolvedValue(true);
        jest.spyOn(userModel, 'update').mockResolvedValue(mockUser);

        const result = await userModel.authenticate('test@example.com', 'password123');

        expect(userModel.verifyPassword).toHaveBeenCalledWith('password123', 'hashed_password');
        expect(userModel.update).toHaveBeenCalledWith(mockUser.id, {
          last_login_at: expect.any(Date),
        });
        expect(result).toEqual(
          expect.objectContaining({
            id: mockUser.id,
            email: mockUser.email,
          })
        );
        expect(result.password).toBeUndefined(); // Should be sanitized
      });

      it('should return null for invalid password', async () => {
        const mockUser = {
          id: '550e8400-e29b-41d4-a716-446655440000',
          email: 'test@example.com',
          password: 'hashed_password',
          status: 'active',
        };

        jest.spyOn(userModel, 'find').mockResolvedValue([mockUser]);
        jest.spyOn(userModel, 'verifyPassword').mockResolvedValue(false);

        const result = await userModel.authenticate('test@example.com', 'wrongpassword');

        expect(result).toBeNull();
      });

      it('should return null for inactive user', async () => {
        const mockUser = {
          id: '550e8400-e29b-41d4-a716-446655440000',
          email: 'test@example.com',
          password: 'hashed_password',
          status: 'inactive',
        };

        jest.spyOn(userModel, 'find').mockResolvedValue([mockUser]);

        const result = await userModel.authenticate('test@example.com', 'password123');

        expect(result).toBeNull();
      });
    });

    describe('update', () => {
      const userId = '550e8400-e29b-41d4-a716-446655440000';
      const updateData = {
        full_name: 'Updated Name',
        status: 'active',
      };

      it('should update user successfully', async () => {
        const mockCurrentUser = {
          id: userId,
          email: 'test@example.com',
          full_name: 'Test User',
        };
        const mockUpdatedUser = {
          ...mockCurrentUser,
          ...updateData,
        };

        const originalIsValidUuid = userModel.isValidUuid;
        const originalFindById = userModel.__proto__.findById;
        const originalBuildSetClause = userModel.buildSetClause;
        const originalExecuteQuery = userModel.executeQuery;

        userModel.isValidUuid = jest.fn().mockReturnValue(true);
        userModel.__proto__.findById = jest.fn().mockResolvedValue(mockCurrentUser);
        userModel.buildSetClause = jest.fn().mockReturnValue({
          clause: 'full_name = $1, status = $2',
          params: [updateData.full_name, updateData.status],
        });
        userModel.executeQuery = jest.fn().mockResolvedValue({
          rows: [mockUpdatedUser],
        });

        jest.spyOn(userModel, 'validate').mockResolvedValue(updateData);

        const result = await userModel.update(userId, updateData);

        expect(result).toEqual(
          expect.objectContaining({
            id: userId,
            full_name: updateData.full_name,
            status: updateData.status,
          })
        );

        // Restore original methods
        userModel.isValidUuid = originalIsValidUuid;
        userModel.__proto__.findById = originalFindById;
        userModel.buildSetClause = originalBuildSetClause;
        userModel.executeQuery = originalExecuteQuery;
      });

      it('should throw error for invalid UUID', async () => {
        const originalIsValidUuid = userModel.isValidUuid;
        userModel.isValidUuid = jest.fn().mockReturnValue(false);

        await expect(userModel.update('invalid-uuid', updateData)).rejects.toThrow(
          'Invalid user ID format. Must be a valid UUID.'
        );

        // Restore original method
        userModel.isValidUuid = originalIsValidUuid;
      });

      it('should throw error when user not found', async () => {
        const originalIsValidUuid = userModel.isValidUuid;
        const originalFindById = userModel.__proto__.findById;

        userModel.isValidUuid = jest.fn().mockReturnValue(true);
        userModel.__proto__.findById = jest.fn().mockResolvedValue(null);

        jest.spyOn(userModel, 'validate').mockResolvedValue(updateData);

        await expect(userModel.update(userId, updateData)).rejects.toThrow('User not found');

        // Restore original methods
        userModel.isValidUuid = originalIsValidUuid;
        userModel.__proto__.findById = originalFindById;
      });
    });

    describe('deleteUser', () => {
      it('should soft delete user successfully', async () => {
        const userId = '550e8400-e29b-41d4-a716-446655440000';
        const mockUpdatedUser = {
          id: userId,
          status: 'inactive',
        };

        jest.spyOn(userModel, 'isValidUuid').mockReturnValue(true);
        jest.spyOn(userModel, 'validateUuid').mockReturnValue({
          isValid: true,
          sanitizedUuid: userId,
        });
        jest.spyOn(userModel, 'update').mockResolvedValue(mockUpdatedUser);

        const result = await userModel.deleteUser(userId);

        expect(userModel.update).toHaveBeenCalledWith(userId, { status: 'inactive' });
        expect(result).toBe(true);
      });

      it('should return false if update fails', async () => {
        const userId = '550e8400-e29b-41d4-a716-446655440000';

        jest.spyOn(userModel, 'isValidUuid').mockReturnValue(true);
        jest.spyOn(userModel, 'validateUuid').mockReturnValue({
          isValid: true,
          sanitizedUuid: userId,
        });
        jest.spyOn(userModel, 'update').mockResolvedValue(null);

        const result = await userModel.deleteUser(userId);

        expect(result).toBe(false);
      });
    });
  });

  describe('Business Logic Methods', () => {
    describe('confirmEmail', () => {
      it('should confirm email with valid token', async () => {
        const token = 'valid_token';
        const mockUser = {
          id: '550e8400-e29b-41d4-a716-446655440000',
          email: 'test@example.com',
          email_confirmed: true,
        };

        jest.spyOn(userModel, 'executeQuery').mockResolvedValue({
          rows: [mockUser],
        });

        const result = await userModel.confirmEmail(token);

        expect(result).toEqual(
          expect.objectContaining({
            id: mockUser.id,
            email: mockUser.email,
            email_confirmed: true,
          })
        );
      });

      it('should throw error for invalid token', async () => {
        jest.spyOn(userModel, 'executeQuery').mockResolvedValue({
          rows: [],
        });

        await expect(userModel.confirmEmail('invalid_token')).rejects.toThrow(
          'Invalid or expired confirmation token'
        );
      });
    });

    describe('changePassword', () => {
      it('should change password successfully', async () => {
        const userId = '550e8400-e29b-41d4-a716-446655440000';
        const newPassword = 'newpassword123';
        const mockUpdatedUser = {
          id: userId,
          password_changed_at: new Date(),
          first_login_password_change: false,
        };

        jest.spyOn(userModel, 'isValidUuid').mockReturnValue(true);
        jest.spyOn(userModel, 'validateUuid').mockReturnValue({
          isValid: true,
          sanitizedUuid: userId,
        });
        jest.spyOn(userModel, 'hashPassword').mockResolvedValue('new_hashed_password');
        jest.spyOn(userModel, 'update').mockResolvedValue(mockUpdatedUser);

        const result = await userModel.changePassword(userId, newPassword);

        expect(userModel.hashPassword).toHaveBeenCalledWith(newPassword);
        expect(userModel.update).toHaveBeenCalledWith(userId, {
          password: 'new_hashed_password',
          password_changed_at: expect.any(Date),
          first_login_password_change: false,
        });
        expect(result).toEqual(mockUpdatedUser);
      });
    });

    describe('getUsersByRestaurant', () => {
      it('should get users by restaurant ID', async () => {
        const restaurantId = '550e8400-e29b-41d4-a716-446655440000';
        const mockUsers = [
          {
            id: 'user1',
            email: 'user1@example.com',
            role: 'waiter',
            password: 'hashed_password',
          },
          {
            id: 'user2',
            email: 'user2@example.com',
            role: 'food_runner',
            password: 'hashed_password',
          },
        ];

        jest.spyOn(userModel, 'isValidUuid').mockReturnValue(true);
        jest.spyOn(userModel, 'validateUuid').mockReturnValue({
          isValid: true,
          sanitizedUuid: restaurantId,
        });
        jest.spyOn(userModel, 'find').mockResolvedValue(mockUsers);

        const result = await userModel.getUsersByRestaurant(restaurantId);

        expect(userModel.find).toHaveBeenCalledWith(
          { restaurant_id: restaurantId },
          { orderBy: 'created_at DESC' }
        );
        expect(result).toHaveLength(2);
        expect(result[0].password).toBeUndefined(); // Should be sanitized
        expect(result[1].password).toBeUndefined(); // Should be sanitized
      });

      it('should filter by status and role', async () => {
        const restaurantId = '550e8400-e29b-41d4-a716-446655440000';
        const options = { status: 'active', role: 'waiter' };

        jest.spyOn(userModel, 'isValidUuid').mockReturnValue(true);
        jest.spyOn(userModel, 'validateUuid').mockReturnValue({
          isValid: true,
          sanitizedUuid: restaurantId,
        });
        jest.spyOn(userModel, 'find').mockResolvedValue([]);

        await userModel.getUsersByRestaurant(restaurantId, options);

        expect(userModel.find).toHaveBeenCalledWith(
          {
            restaurant_id: restaurantId,
            status: 'active',
            role: 'waiter',
          },
          { orderBy: 'created_at DESC' }
        );
      });
    });

    describe('checkRestaurantExists', () => {
      it('should return true when restaurant exists', async () => {
        jest.spyOn(userModel, 'executeQuery').mockResolvedValue({
          rows: [{ exists: true }],
        });

        const result = await userModel.checkRestaurantExists(
          '550e8400-e29b-41d4-a716-446655440000'
        );

        expect(result).toBe(true);
      });

      it('should return false when restaurant does not exist', async () => {
        jest.spyOn(userModel, 'executeQuery').mockResolvedValue({
          rows: [],
        });

        const result = await userModel.checkRestaurantExists(
          '550e8400-e29b-41d4-a716-446655440000'
        );

        expect(result).toBe(false);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      const error = new Error('Database connection failed');
      jest.spyOn(userModel, 'executeQuery').mockRejectedValue(error);

      await expect(
        userModel.create({
          email: 'test@example.com',
          password: 'password123',
          full_name: 'Test User',
          role: 'waiter',
        })
      ).rejects.toThrow('Database connection failed');
    });

    it('should log errors appropriately', async () => {
      const error = new Error('Test error');
      const originalFind = userModel.find;
      userModel.find = jest.fn().mockRejectedValue(error);

      await expect(userModel.findByEmail('test@example.com')).rejects.toThrow('Test error');
      expect(mockLogger.error).toHaveBeenCalled();

      // Restore original method
      userModel.find = originalFind;
    });
  });

  describe('Method Existence', () => {
    it('should have all required methods', () => {
      const requiredMethods = [
        'create',
        'findById',
        'findByEmail',
        'findByUsername',
        'authenticate',
        'update',
        'deleteUser',
        'confirmEmail',
        'changePassword',
        'getUsersByRestaurant',
        'checkRestaurantExists',
        'hashPassword',
        'verifyPassword',
        'generateEmailConfirmationToken',
        'generatePasswordResetToken',
        'validateUuid',
        'isValidUuid',
      ];

      requiredMethods.forEach((method) => {
        expect(typeof userModel[method]).toBe('function');
      });
    });

    it('should have all required properties', () => {
      expect(userModel.tableName).toBeDefined();
      expect(userModel.sensitiveFields).toBeDefined();
      expect(userModel.createSchema).toBeDefined();
      expect(userModel.updateSchema).toBeDefined();
      expect(userModel.uuidSchema).toBeDefined();
    });
  });
});
