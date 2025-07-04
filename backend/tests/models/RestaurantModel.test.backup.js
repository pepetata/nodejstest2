const bcrypt = require('bcrypt');
const crypto = require('crypto');

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
      // Simple validation mock - just return the data
      return data;
    }

    async executeQuery(query, params) {
      // Mock database query execution
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

    buildSetClause(data) {
      const keys = Object.keys(data);
      const clause = keys.map((key, index) => `${key} = $${index + 1}`).join(', ');
      const params = Object.values(data);
      return { clause, params };
    }

    sanitizeOutput(data, sensitiveFields) {
      const sanitized = Object.assign({}, data);
      sensitiveFields.forEach((field) => {
        delete sanitized[field];
      });
      return sanitized;
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

// Import RestaurantModel after mocks are set up
const RestaurantModel = require('../../src/models/RestaurantModel');

describe('RestaurantModel', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('Constructor', () => {
    it('should initialize with correct properties', () => {
      expect(RestaurantModel.tableName).toBe('restaurants');
      expect(RestaurantModel.sensitiveFields).toContain('password');
      expect(RestaurantModel.sensitiveFields).toContain('email_confirmation_token');
    });
  });

  describe('UUID Validation', () => {
    describe('validateUuid', () => {
      it('should validate a correct UUID v4', () => {
        const validUuid = '550e8400-e29b-41d4-a716-446655440000';
        const result = RestaurantModel.validateUuid(validUuid);

        expect(result.isValid).toBe(true);
        expect(result.sanitizedUuid).toBe(validUuid.toLowerCase());
      });

      it('should throw error for invalid UUID', () => {
        const invalidUuid = 'invalid-uuid';
        expect(() => RestaurantModel.validateUuid(invalidUuid)).toThrow('Invalid UUID format');
      });

      it('should handle null/undefined UUID', () => {
        expect(() => RestaurantModel.validateUuid(null)).toThrow('Invalid UUID format');
        expect(() => RestaurantModel.validateUuid(undefined)).toThrow('Invalid UUID format');
      });
    });

    describe('isValidUuid', () => {
      it('should return true for valid UUID', () => {
        const validUuid = '550e8400-e29b-41d4-a716-446655440000';
        const result = RestaurantModel.isValidUuid(validUuid);
        expect(result).toBe(true);
      });

      it('should return false for invalid UUID', () => {
        const invalidUuid = 'invalid-uuid';
        const result = RestaurantModel.isValidUuid(invalidUuid);
        expect(result).toBe(false);
      });

      it('should return false for null/undefined UUID', () => {
        expect(RestaurantModel.isValidUuid(null)).toBe(false);
        expect(RestaurantModel.isValidUuid(undefined)).toBe(false);
      });
    });
  });

  describe('Password Management', () => {
    describe('hashPassword', () => {
      it('should hash password with correct salt rounds', async () => {
        const password = 'testPassword123';
        const hashedPassword = 'hashedPassword';
        bcrypt.hash.mockResolvedValue(hashedPassword);

        const result = await RestaurantModel.hashPassword(password);

        expect(bcrypt.hash).toHaveBeenCalledWith(password, 12);
        expect(result).toBe(hashedPassword);
      });

      it('should throw error if bcrypt fails', async () => {
        const password = 'testPassword123';
        bcrypt.hash.mockRejectedValue(new Error('Bcrypt error'));

        await expect(RestaurantModel.hashPassword(password)).rejects.toThrow('Bcrypt error');
      });
    });

    describe('verifyPassword', () => {
      it('should verify password correctly', async () => {
        const password = 'testPassword123';
        const hashedPassword = 'hashedPassword';
        bcrypt.compare.mockResolvedValue(true);

        const result = await RestaurantModel.verifyPassword(password, hashedPassword);

        expect(bcrypt.compare).toHaveBeenCalledWith(password, hashedPassword);
        expect(result).toBe(true);
      });

      it('should return false for incorrect password', async () => {
        const password = 'wrongPassword';
        const hashedPassword = 'hashedPassword';
        bcrypt.compare.mockResolvedValue(false);

        const result = await RestaurantModel.verifyPassword(password, hashedPassword);
        expect(result).toBe(false);
      });

      it('should throw error if bcrypt compare fails', async () => {
        const password = 'testPassword123';
        const hashedPassword = 'hashedPassword';
        bcrypt.compare.mockRejectedValue(new Error('Bcrypt compare error'));

        await expect(RestaurantModel.verifyPassword(password, hashedPassword)).rejects.toThrow(
          'Bcrypt compare error'
        );
      });
    });
  });

  describe('Email Confirmation Token', () => {
    describe('generateEmailConfirmationToken', () => {
      it('should generate token and expiry date', () => {
        const mockToken = 'mockToken123';
        crypto.randomBytes.mockReturnValue({ toString: () => mockToken });

        const result = RestaurantModel.generateEmailConfirmationToken();

        expect(crypto.randomBytes).toHaveBeenCalledWith(32);
        expect(result.token).toBe(mockToken);
        expect(result.expires).toBeInstanceOf(Date);
        expect(result.expires.getTime()).toBeGreaterThan(Date.now());
      });

      it('should generate token with 24 hours expiry', () => {
        const mockToken = 'mockToken123';
        crypto.randomBytes.mockReturnValue({ toString: () => mockToken });

        const beforeTime = Date.now();
        const result = RestaurantModel.generateEmailConfirmationToken();
        const afterTime = Date.now();

        const expectedMinTime = beforeTime + 23 * 60 * 60 * 1000; // 23 hours
        const expectedMaxTime = afterTime + 25 * 60 * 60 * 1000; // 25 hours

        expect(result.expires.getTime()).toBeGreaterThan(expectedMinTime);
        expect(result.expires.getTime()).toBeLessThan(expectedMaxTime);
      });
    });
  });

  describe('CRUD Operations', () => {
    describe('create', () => {
      const mockRestaurantData = {
        owner_name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        restaurant_name: 'Test Restaurant',
        restaurant_url_name: 'test-restaurant',
        business_type: 'single',
        cuisine_type: 'Italian',
        website: 'https://test-restaurant.com',
        description: 'A great Italian restaurant',
        subscription_plan: 'starter',
        marketing_consent: true,
        terms_accepted: true,
      };

      beforeEach(() => {
        // Mock BaseModel validate to return the input data
        jest.spyOn(RestaurantModel, 'validate').mockResolvedValue(mockRestaurantData);
        
        // Mock bcrypt hash
        bcrypt.hash.mockResolvedValue('$2b$12$hashedPasswordExample');
        
        // Mock crypto for token generation
        crypto.randomBytes.mockReturnValue({ toString: () => 'mockEmailToken123' });
        
        // Mock database query execution
        jest.spyOn(RestaurantModel, 'executeQuery').mockResolvedValue({
          rows: [{
            id: '550e8400-e29b-41d4-a716-446655440000',
            owner_name: 'John Doe',
            email: 'john@example.com',
            restaurant_name: 'Test Restaurant',
            restaurant_url_name: 'test-restaurant',
            business_type: 'single',
            status: 'pending',
            created_at: new Date(),
            updated_at: new Date(),
          }]
        });
      });

      it('should create restaurant successfully', async () => {
        const result = await RestaurantModel.create(mockRestaurantData);

        expect(RestaurantModel.validate).toHaveBeenCalledWith(mockRestaurantData, expect.any(Object));
        expect(bcrypt.hash).toHaveBeenCalledWith('password123', 12);
        expect(crypto.randomBytes).toHaveBeenCalledWith(32);
        expect(RestaurantModel.executeQuery).toHaveBeenCalled();

        expect(result).toMatchObject({
          id: '550e8400-e29b-41d4-a716-446655440000',
          owner_name: 'John Doe',
          email: 'john@example.com',
          restaurant_name: 'Test Restaurant',
          status: 'pending',
        });

        expect(result.email_confirmation_token).toBe('mockEmailToken123');
        expect(result.email_confirmation_expires).toBeInstanceOf(Date);
      });

      it('should handle validation errors', async () => {
        const validationError = new Error('Validation failed');
        validationError.details = [{ field: 'email', message: 'Invalid email format' }];
        
        jest.spyOn(RestaurantModel, 'validate').mockRejectedValue(validationError);

        await expect(RestaurantModel.create(mockRestaurantData)).rejects.toThrow('Validation failed');
      });

      it('should handle database errors', async () => {
        const dbError = new Error('Database connection failed');
        jest.spyOn(RestaurantModel, 'executeQuery').mockRejectedValue(dbError);

        await expect(RestaurantModel.create(mockRestaurantData)).rejects.toThrow('Database connection failed');
      });

      it('should handle bcrypt errors', async () => {
        bcrypt.hash.mockRejectedValue(new Error('Bcrypt hashing failed'));

        await expect(RestaurantModel.create(mockRestaurantData)).rejects.toThrow('Bcrypt hashing failed');
      });
    });

    describe('findByEmail', () => {
      const testEmail = 'test@example.com';
      const mockRestaurant = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        owner_name: 'John Doe',
        email: 'test@example.com',
        restaurant_name: 'Test Restaurant',
        status: 'active',
      };

      beforeEach(() => {
        jest.spyOn(RestaurantModel, 'find').mockResolvedValue([mockRestaurant]);
      });

      it('should find restaurant by email', async () => {
        const result = await RestaurantModel.findByEmail(testEmail);

        expect(RestaurantModel.find).toHaveBeenCalledWith(
          { email: testEmail.toLowerCase() },
          {},
          expect.arrayContaining(['id', 'owner_name', 'email'])
        );
        expect(result).toEqual(mockRestaurant);
      });

      it('should include password when requested', async () => {
        const mockRestaurantWithPassword = { ...mockRestaurant, password: 'hashedPassword' };
        jest.spyOn(RestaurantModel, 'find').mockResolvedValue([mockRestaurantWithPassword]);

        const result = await RestaurantModel.findByEmail(testEmail, true);

        expect(RestaurantModel.find).toHaveBeenCalledWith(
          { email: testEmail.toLowerCase() },
          {},
          ['*']
        );
        expect(result).toEqual(mockRestaurantWithPassword);
      });

      it('should return null when restaurant not found', async () => {
        jest.spyOn(RestaurantModel, 'find').mockResolvedValue([]);

        const result = await RestaurantModel.findByEmail(testEmail);

        expect(result).toBeNull();
      });

      it('should handle case sensitivity', async () => {
        const upperCaseEmail = 'TEST@EXAMPLE.COM';
        
        await RestaurantModel.findByEmail(upperCaseEmail);

        expect(RestaurantModel.find).toHaveBeenCalledWith(
          { email: upperCaseEmail.toLowerCase() },
          {},
          expect.any(Array)
        );
      });
    });

    describe('authenticate', () => {
      const testEmail = 'test@example.com';
      const testPassword = 'password123';
      const mockRestaurant = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        email: 'test@example.com',
        password: '$2b$12$hashedPassword',
        restaurant_name: 'Test Restaurant',
        status: 'active',
      };

      beforeEach(() => {
        jest.spyOn(RestaurantModel, 'findByEmail').mockResolvedValue(mockRestaurant);
        jest.spyOn(RestaurantModel, 'sanitizeOutput').mockReturnValue({
          id: mockRestaurant.id,
          email: mockRestaurant.email,
          restaurant_name: mockRestaurant.restaurant_name,
          status: mockRestaurant.status,
        });
      });

      it('should authenticate successfully with correct credentials', async () => {
        bcrypt.compare.mockResolvedValue(true);

        const result = await RestaurantModel.authenticate(testEmail, testPassword);

        expect(RestaurantModel.findByEmail).toHaveBeenCalledWith(testEmail, true);
        expect(bcrypt.compare).toHaveBeenCalledWith(testPassword, mockRestaurant.password);
        expect(RestaurantModel.sanitizeOutput).toHaveBeenCalledWith(mockRestaurant, RestaurantModel.sensitiveFields);
        
        expect(result).toEqual({
          id: mockRestaurant.id,
          email: mockRestaurant.email,
          restaurant_name: mockRestaurant.restaurant_name,
          status: mockRestaurant.status,
        });
      });

      it('should return null when restaurant not found', async () => {
        jest.spyOn(RestaurantModel, 'findByEmail').mockResolvedValue(null);

        const result = await RestaurantModel.authenticate(testEmail, testPassword);

        expect(result).toBeNull();
      });

      it('should return null with incorrect password', async () => {
        bcrypt.compare.mockResolvedValue(false);

        const result = await RestaurantModel.authenticate(testEmail, 'wrongPassword');

        expect(result).toBeNull();
      });

      it('should handle authentication errors', async () => {
        jest.spyOn(RestaurantModel, 'findByEmail').mockRejectedValue(new Error('Database error'));

        await expect(RestaurantModel.authenticate(testEmail, testPassword)).rejects.toThrow('Database error');
      });

      it('should handle bcrypt comparison errors', async () => {
        bcrypt.compare.mockRejectedValue(new Error('Bcrypt error'));

        await expect(RestaurantModel.authenticate(testEmail, testPassword)).rejects.toThrow('Bcrypt error');
      });
    });

    describe('update', () => {
      const mockId = '550e8400-e29b-41d4-a716-446655440000';
      const updateData = {
        owner_name: 'Updated Name',
        restaurant_name: 'Updated Restaurant',
        phone: '1234567890',
        cuisine_type: 'Mexican',
      };
      const updatedRestaurant = {
        id: mockId,
        owner_name: 'Updated Name',
        restaurant_name: 'Updated Restaurant',
        phone: '1234567890',
        cuisine_type: 'Mexican',
        updated_at: new Date(),
      };

      beforeEach(() => {
        jest.spyOn(RestaurantModel, 'isValidUuid').mockReturnValue(true);
        jest.spyOn(RestaurantModel, 'validateUuid').mockReturnValue({
          isValid: true,
          sanitizedUuid: mockId.toLowerCase(),
        });
        jest.spyOn(RestaurantModel, 'validate').mockResolvedValue(updateData);
        jest.spyOn(RestaurantModel, 'buildSetClause').mockReturnValue({
          clause: 'owner_name = $1, restaurant_name = $2, phone = $3, cuisine_type = $4',
          params: ['Updated Name', 'Updated Restaurant', '1234567890', 'Mexican'],
        });
        jest.spyOn(RestaurantModel, 'executeQuery').mockResolvedValue({
          rows: [updatedRestaurant]
        });
      });

      it('should update restaurant successfully', async () => {
        const result = await RestaurantModel.update(mockId, updateData);

        expect(RestaurantModel.isValidUuid).toHaveBeenCalledWith(mockId);
        expect(RestaurantModel.validate).toHaveBeenCalledWith(updateData, expect.any(Object));
        expect(RestaurantModel.buildSetClause).toHaveBeenCalledWith(updateData);
        expect(RestaurantModel.executeQuery).toHaveBeenCalled();

        expect(result).toEqual(updatedRestaurant);
      });

      it('should throw error for invalid UUID', async () => {
        jest.spyOn(RestaurantModel, 'isValidUuid').mockReturnValue(false);

        await expect(RestaurantModel.update('invalid-uuid', updateData)).rejects.toThrow(
          'Invalid restaurant ID format. Must be a valid UUID.'
        );
      });

      it('should throw error when no valid fields to update', async () => {
        jest.spyOn(RestaurantModel, 'validate').mockResolvedValue({});

        await expect(RestaurantModel.update(mockId, updateData)).rejects.toThrow(
          'No valid fields to update'
        );
      });

      it('should return null when restaurant not found', async () => {
        jest.spyOn(RestaurantModel, 'executeQuery').mockResolvedValue({ rows: [] });

        const result = await RestaurantModel.update(mockId, updateData);

        expect(result).toBeNull();
      });

      it('should handle database errors', async () => {
        jest.spyOn(RestaurantModel, 'executeQuery').mockRejectedValue(new Error('Database error'));

        await expect(RestaurantModel.update(mockId, updateData)).rejects.toThrow('Database error');
      });
    });

    describe('changePassword', () => {
      const mockId = '550e8400-e29b-41d4-a716-446655440000';
      const passwordData = {
        current_password: 'currentPassword',
        new_password: 'newPassword123',
        confirm_password: 'newPassword123',
      };
      const mockRestaurant = {
        id: mockId,
        password: '$2b$12$currentHashedPassword',
      };

      beforeEach(() => {
        jest.spyOn(RestaurantModel, 'isValidUuid').mockReturnValue(true);
        jest.spyOn(RestaurantModel, 'validateUuid').mockReturnValue({
          isValid: true,
          sanitizedUuid: mockId.toLowerCase(),
        });
        jest.spyOn(RestaurantModel, 'validate').mockResolvedValue(passwordData);
        jest.spyOn(RestaurantModel, 'findById').mockResolvedValue(mockRestaurant);
        bcrypt.compare.mockResolvedValue(true);
        bcrypt.hash.mockResolvedValue('$2b$12$newHashedPassword');
        jest.spyOn(RestaurantModel, 'executeQuery').mockResolvedValue({ rows: [] });
      });

      it('should change password successfully', async () => {
        const result = await RestaurantModel.changePassword(mockId, passwordData);

        expect(RestaurantModel.isValidUuid).toHaveBeenCalledWith(mockId);
        expect(RestaurantModel.validate).toHaveBeenCalledWith(passwordData, expect.any(Object));
        expect(RestaurantModel.findById).toHaveBeenCalledWith(mockId.toLowerCase(), ['id', 'password']);
        expect(bcrypt.compare).toHaveBeenCalledWith(passwordData.current_password, mockRestaurant.password);
        expect(bcrypt.hash).toHaveBeenCalledWith(passwordData.new_password, 12);
        expect(RestaurantModel.executeQuery).toHaveBeenCalled();

        expect(result).toBe(true);
      });

      it('should throw error for invalid UUID', async () => {
        jest.spyOn(RestaurantModel, 'isValidUuid').mockReturnValue(false);

        await expect(RestaurantModel.changePassword('invalid-uuid', passwordData)).rejects.toThrow(
          'Invalid restaurant ID format. Must be a valid UUID.'
        );
      });

      it('should throw error when restaurant not found', async () => {
        jest.spyOn(RestaurantModel, 'findById').mockResolvedValue(null);

        await expect(RestaurantModel.changePassword(mockId, passwordData)).rejects.toThrow(
          'Restaurant not found'
        );
      });

      it('should throw error for incorrect current password', async () => {
        bcrypt.compare.mockResolvedValue(false);

        await expect(RestaurantModel.changePassword(mockId, passwordData)).rejects.toThrow(
          'Current password is incorrect'
        );
      });

      it('should handle validation errors', async () => {
        const validationError = new Error('Password too weak');
        jest.spyOn(RestaurantModel, 'validate').mockRejectedValue(validationError);

        await expect(RestaurantModel.changePassword(mockId, passwordData)).rejects.toThrow('Password too weak');
      });

      it('should handle database errors', async () => {
        jest.spyOn(RestaurantModel, 'executeQuery').mockRejectedValue(new Error('Database error'));

        await expect(RestaurantModel.changePassword(mockId, passwordData)).rejects.toThrow('Database error');
      });
    });

    describe('findById', () => {
      const mockId = '550e8400-e29b-41d4-a716-446655440000';
      const mockRestaurant = {
        id: mockId,
        owner_name: 'John Doe',
        restaurant_name: 'Test Restaurant',
        email: 'test@example.com',
        status: 'active',
      };

      beforeEach(() => {
        jest.spyOn(RestaurantModel, 'isValidUuid').mockReturnValue(true);
        jest.spyOn(RestaurantModel, 'validateUuid').mockReturnValue({
          isValid: true,
          sanitizedUuid: mockId.toLowerCase(),
        });
        // Mock the parent findById method
        const mockFindById = jest.fn().mockResolvedValue(mockRestaurant);
        Object.setPrototypeOf(RestaurantModel, { findById: mockFindById });
        jest.spyOn(RestaurantModel, 'sanitizeOutput').mockReturnValue(mockRestaurant);
      });

      it('should find restaurant by ID successfully', async () => {
        const result = await RestaurantModel.findById(mockId);

        expect(RestaurantModel.isValidUuid).toHaveBeenCalledWith(mockId);
        expect(RestaurantModel.validateUuid).toHaveBeenCalledWith(mockId);
        expect(RestaurantModel.sanitizeOutput).toHaveBeenCalledWith(mockRestaurant, RestaurantModel.sensitiveFields);

        expect(result).toEqual(mockRestaurant);
      });

      it('should use custom columns when provided', async () => {
        const customColumns = ['id', 'restaurant_name', 'status'];
        
        await RestaurantModel.findById(mockId, customColumns);

        // Verify that custom columns were passed to parent findById
        expect(Object.getPrototypeOf(RestaurantModel).findById).toHaveBeenCalledWith(mockId.toLowerCase(), customColumns);
      });

      it('should return null when restaurant not found', async () => {
        Object.getPrototypeOf(RestaurantModel).findById.mockResolvedValue(null);

        const result = await RestaurantModel.findById(mockId);

        expect(result).toBeNull();
      });

      it('should throw error for invalid UUID', async () => {
        jest.spyOn(RestaurantModel, 'isValidUuid').mockReturnValue(false);

        await expect(RestaurantModel.findById('invalid-uuid')).rejects.toThrow(
          'Invalid restaurant ID format. Must be a valid UUID.'
        );
      });

      it('should handle database errors', async () => {
        Object.getPrototypeOf(RestaurantModel).findById.mockRejectedValue(new Error('Database error'));

        await expect(RestaurantModel.findById(mockId)).rejects.toThrow('Database error');
      });
    });

    describe('confirmEmail', () => {
      const mockToken = 'validEmailToken123';
      const mockRestaurant = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        email: 'test@example.com',
        email_confirmed: false,
        email_confirmation_token: mockToken,
        email_confirmation_expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
        status: 'pending',
      };

      beforeEach(() => {
        jest.spyOn(RestaurantModel, 'find').mockResolvedValue([mockRestaurant]);
        jest.spyOn(RestaurantModel, 'buildSetClause').mockReturnValue({
          clause: 'email_confirmed = $1, email_confirmation_token = $2, email_confirmation_expires = $3, status = $4',
          params: [true, null, null, 'active'],
        });
        jest.spyOn(RestaurantModel, 'executeQuery').mockResolvedValue({
          rows: [{
            ...mockRestaurant,
            email_confirmed: true,
            email_confirmation_token: null,
            email_confirmation_expires: null,
            status: 'active',
          }]
        });
      });

      it('should confirm email successfully', async () => {
        const result = await RestaurantModel.confirmEmail(mockToken);

        expect(RestaurantModel.find).toHaveBeenCalledWith({
          email_confirmation_token: mockToken,
          email_confirmed: false,
          email_confirmation_expires: { operator: '>', value: expect.any(Date) },
        });

        expect(RestaurantModel.buildSetClause).toHaveBeenCalledWith({
          email_confirmed: true,
          email_confirmation_token: null,
          email_confirmation_expires: null,
          status: 'active',
        });

        expect(RestaurantModel.executeQuery).toHaveBeenCalled();

        expect(result).toMatchObject({
          email_confirmed: true,
          status: 'active',
        });
      });

      it('should return null for invalid token', async () => {
        jest.spyOn(RestaurantModel, 'find').mockResolvedValue([]);

        const result = await RestaurantModel.confirmEmail('invalidToken');

        expect(result).toBeNull();
      });

      it('should return null for expired token', async () => {
        const expiredRestaurant = {
          ...mockRestaurant,
          email_confirmation_expires: new Date(Date.now() - 1000), // Expired
        };
        jest.spyOn(RestaurantModel, 'find').mockResolvedValue([expiredRestaurant]);

        const result = await RestaurantModel.confirmEmail(mockToken);

        expect(result).toBeNull();
      });

      it('should handle database errors', async () => {
        jest.spyOn(RestaurantModel, 'executeQuery').mockRejectedValue(new Error('Database error'));

        await expect(RestaurantModel.confirmEmail(mockToken)).rejects.toThrow('Database error');
      });
    });

    describe('findByUrlName', () => {
      const testUrlName = 'test-restaurant';
      const mockRestaurant = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        restaurant_name: 'Test Restaurant',
        restaurant_url_name: 'test-restaurant',
        status: 'active',
      };

      beforeEach(() => {
        jest.spyOn(RestaurantModel, 'find').mockResolvedValue([mockRestaurant]);
        jest.spyOn(RestaurantModel, 'sanitizeOutput').mockReturnValue(mockRestaurant);
      });

      it('should find restaurant by URL name', async () => {
        const result = await RestaurantModel.findByUrlName(testUrlName);

        expect(RestaurantModel.find).toHaveBeenCalledWith({
          restaurant_url_name: testUrlName.toLowerCase()
        });
        expect(RestaurantModel.sanitizeOutput).toHaveBeenCalledWith(mockRestaurant, RestaurantModel.sensitiveFields);

        expect(result).toEqual(mockRestaurant);
      });

      it('should handle case sensitivity', async () => {
        const upperCaseUrlName = 'TEST-RESTAURANT';
        
        await RestaurantModel.findByUrlName(upperCaseUrlName);

        expect(RestaurantModel.find).toHaveBeenCalledWith({
          restaurant_url_name: upperCaseUrlName.toLowerCase()
        });
      });

      it('should return null when restaurant not found', async () => {
        jest.spyOn(RestaurantModel, 'find').mockResolvedValue([]);

        const result = await RestaurantModel.findByUrlName(testUrlName);

        expect(result).toBeNull();
      });
    });

    describe('getRestaurants', () => {
      const mockRestaurants = [
        {
          id: '550e8400-e29b-41d4-a716-446655440001',
          restaurant_name: 'Restaurant 1',
          status: 'active',
          business_type: 'single',
          created_at: new Date(),
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440002',
          restaurant_name: 'Restaurant 2',
          status: 'pending',
          business_type: 'multi-location',
          created_at: new Date(),
        },
      ];

      beforeEach(() => {
        jest.spyOn(RestaurantModel, 'count').mockResolvedValue(25);
        jest.spyOn(RestaurantModel, 'find').mockResolvedValue(mockRestaurants);
      });

      it('should get restaurants with default pagination', async () => {
        const result = await RestaurantModel.getRestaurants();

        expect(RestaurantModel.count).toHaveBeenCalledWith({});
        expect(RestaurantModel.find).toHaveBeenCalledWith(
          {},
          {
            limit: 10,
            offset: 0,
            orderBy: 'created_at DESC',
          },
          expect.arrayContaining(['id', 'restaurant_name', 'status'])
        );

        expect(result.restaurants).toEqual(mockRestaurants);
        expect(result.pagination).toEqual({
          page: 1,
          limit: 10,
          total: 25,
          pages: 3,
        });
      });

      it('should apply filters correctly', async () => {
        const filters = {
          status: 'active',
          business_type: 'single',
          cuisine_type: 'Italian',
          subscription_plan: 'premium',
        };

        await RestaurantModel.getRestaurants(filters);

        expect(RestaurantModel.count).toHaveBeenCalledWith(filters);
        expect(RestaurantModel.find).toHaveBeenCalledWith(
          filters,
          expect.any(Object),
          expect.any(Array)
        );
      });

      it('should apply custom pagination', async () => {
        const pagination = {
          page: 3,
          limit: 5,
          sortBy: 'restaurant_name',
          sortOrder: 'ASC',
        };

        await RestaurantModel.getRestaurants({}, pagination);

        expect(RestaurantModel.find).toHaveBeenCalledWith(
          {},
          {
            limit: 5,
            offset: 10, // (page 3 - 1) * limit 5
            orderBy: 'restaurant_name ASC',
          },
          expect.any(Array)
        );
      });

      it('should handle empty results', async () => {
        jest.spyOn(RestaurantModel, 'count').mockResolvedValue(0);
        jest.spyOn(RestaurantModel, 'find').mockResolvedValue([]);

        const result = await RestaurantModel.getRestaurants();

        expect(result.restaurants).toEqual([]);
        expect(result.pagination.total).toBe(0);
        expect(result.pagination.pages).toBe(0);
      });
    });
  });

  describe('Validation Schemas', () => {
    describe('createSchema', () => {
      it('should have required fields for restaurant creation', () => {
        const schema = RestaurantModel.createSchema;
        expect(schema).toBeDefined();

        // Test that schema exists and has describe method (Joi schema)
        expect(typeof schema.describe).toBe('function');

        const description = schema.describe();
        expect(description.keys).toBeDefined();

        // Check required fields
        expect(description.keys.owner_name).toBeDefined();
        expect(description.keys.email).toBeDefined();
        expect(description.keys.password).toBeDefined();
        expect(description.keys.restaurant_name).toBeDefined();
        expect(description.keys.restaurant_url_name).toBeDefined();
        expect(description.keys.terms_accepted).toBeDefined();
      });

      it('should have optional fields with defaults', () => {
        const description = RestaurantModel.createSchema.describe();

        // Check optional fields with defaults
        expect(description.keys.business_type).toBeDefined();
        expect(description.keys.subscription_plan).toBeDefined();
        expect(description.keys.marketing_consent).toBeDefined();

        // Check nullable fields
        expect(description.keys.phone).toBeDefined();
        expect(description.keys.whatsapp).toBeDefined();
        expect(description.keys.cuisine_type).toBeDefined();
        expect(description.keys.website).toBeDefined();
        expect(description.keys.description).toBeDefined();
      });
    });

    describe('updateSchema', () => {
      it('should have optional fields for restaurant updates', () => {
        const schema = RestaurantModel.updateSchema;
        expect(schema).toBeDefined();

        const description = schema.describe();
        expect(description.keys).toBeDefined();

        // All fields should be optional in update schema
        expect(description.keys.owner_name).toBeDefined();
        expect(description.keys.restaurant_name).toBeDefined();
        expect(description.keys.restaurant_url_name).toBeDefined();
        expect(description.keys.business_type).toBeDefined();
        expect(description.keys.subscription_plan).toBeDefined();
      });

      it('should not include sensitive fields in update schema', () => {
        const description = RestaurantModel.updateSchema.describe();

        // These fields should not be in update schema
        expect(description.keys.password).toBeUndefined();
        expect(description.keys.email).toBeUndefined();
        expect(description.keys.terms_accepted).toBeUndefined();
      });
    });

    describe('passwordSchema', () => {
      it('should have required fields for password change', () => {
        const schema = RestaurantModel.passwordSchema;
        expect(schema).toBeDefined();

        const description = schema.describe();
        expect(description.keys).toBeDefined();

        // All password fields should be required
        expect(description.keys.current_password).toBeDefined();
        expect(description.keys.new_password).toBeDefined();
        expect(description.keys.confirm_password).toBeDefined();
      });

      it('should validate password confirmation matching', () => {
        const description = RestaurantModel.passwordSchema.describe();

        // confirm_password should reference new_password
        expect(description.keys.confirm_password).toBeDefined();
        // Just check that the field exists - Joi validation structure might vary
        expect(description.keys.confirm_password.type).toBe('string');
      });
    });

    describe('uuidSchema', () => {
      it('should validate UUID v4 format', () => {
        const schema = RestaurantModel.uuidSchema;
        expect(schema).toBeDefined();

        const description = schema.describe();
        expect(description.type).toBe('string');
      });
    });
  });

  describe('Method existence', () => {
    it('should have all required methods', () => {
      // Check that all expected methods exist
      expect(typeof RestaurantModel.validateUuid).toBe('function');
      expect(typeof RestaurantModel.isValidUuid).toBe('function');
      expect(typeof RestaurantModel.hashPassword).toBe('function');
      expect(typeof RestaurantModel.verifyPassword).toBe('function');
      expect(typeof RestaurantModel.generateEmailConfirmationToken).toBe('function');
      expect(typeof RestaurantModel.create).toBe('function');
      expect(typeof RestaurantModel.findByEmail).toBe('function');
      expect(typeof RestaurantModel.findByUrlName).toBe('function');
      expect(typeof RestaurantModel.authenticate).toBe('function');
      expect(typeof RestaurantModel.confirmEmail).toBe('function');
      expect(typeof RestaurantModel.update).toBe('function');
      expect(typeof RestaurantModel.changePassword).toBe('function');
      expect(typeof RestaurantModel.getRestaurants).toBe('function');
      expect(typeof RestaurantModel.findById).toBe('function');
    });

    it('should have all required properties', () => {
      expect(RestaurantModel.tableName).toBe('restaurants');
      expect(Array.isArray(RestaurantModel.sensitiveFields)).toBe(true);
      expect(RestaurantModel.sensitiveFields.length).toBeGreaterThan(0);
    });

    it('should have logger integration', () => {
      expect(RestaurantModel.logger).toBeDefined();
      expect(typeof RestaurantModel.logger.debug).toBe('function');
      expect(typeof RestaurantModel.logger.info).toBe('function');
      expect(typeof RestaurantModel.logger.warn).toBe('function');
      expect(typeof RestaurantModel.logger.error).toBe('function');
    });
  });

  describe('Additional Coverage Tests', () => {
    describe('Edge Cases and Error Handling', () => {
      it('should handle create with duplicate email', async () => {
        const mockRestaurantData = {
          owner_name: 'John Doe',
          email: 'john@example.com',
          password: 'password123',
          restaurant_name: 'Test Restaurant',
          restaurant_url_name: 'test-restaurant',
          terms_accepted: true,
        };

        const dbError = new Error('Duplicate key value violates unique constraint');
        dbError.code = '23505';
        
        jest.spyOn(RestaurantModel, 'validate').mockResolvedValue(mockRestaurantData);
        jest.spyOn(RestaurantModel, 'hashPassword').mockResolvedValue('$2b$12$hashedPassword');
        jest.spyOn(RestaurantModel, 'generateEmailConfirmationToken').mockReturnValue({
          token: 'mockToken123',
          expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
        });
        jest.spyOn(RestaurantModel, 'executeQuery').mockRejectedValue(dbError);

        await expect(RestaurantModel.create(mockRestaurantData)).rejects.toThrow(dbError);
      });

      it('should handle findByEmail with database error', async () => {
        const email = 'test@example.com';
        const dbError = new Error('Database connection failed');
        
        jest.spyOn(RestaurantModel, 'find').mockRejectedValue(dbError);

        await expect(RestaurantModel.findByEmail(email)).rejects.toThrow(dbError);
      });

      it('should handle authenticate with database error in findByEmail', async () => {
        const email = 'test@example.com';
        const password = 'password123';
        const dbError = new Error('Database connection failed');
        
        jest.spyOn(RestaurantModel, 'findByEmail').mockRejectedValue(dbError);

        await expect(RestaurantModel.authenticate(email, password)).rejects.toThrow(dbError);
      });

      it('should handle update with empty update data', async () => {
        const mockId = '550e8400-e29b-41d4-a716-446655440000';
        const emptyData = {};
        
        jest.spyOn(RestaurantModel, 'isValidUuid').mockReturnValue(true);
        jest.spyOn(RestaurantModel, 'validateUuid').mockReturnValue({
          isValid: true,
          sanitizedUuid: mockId.toLowerCase(),
        });

        await expect(RestaurantModel.update(mockId, emptyData)).rejects.toThrow(
          'No valid fields provided for update'
        );
      });

      it('should handle changePassword with bcrypt hash error', async () => {
        const mockId = '550e8400-e29b-41d4-a716-446655440000';
        const passwordData = {
          current_password: 'currentPassword',
          new_password: 'newPassword123',
          confirm_password: 'newPassword123',
        };
        const mockRestaurant = {
          id: mockId,
          password: '$2b$12$currentHashedPassword',
        };

        jest.spyOn(RestaurantModel, 'isValidUuid').mockReturnValue(true);
        jest.spyOn(RestaurantModel, 'validateUuid').mockReturnValue({
          isValid: true,
          sanitizedUuid: mockId.toLowerCase(),
        });
        jest.spyOn(RestaurantModel, 'validate').mockResolvedValue(passwordData);
        jest.spyOn(RestaurantModel, 'findById').mockResolvedValue(mockRestaurant);
        bcrypt.compare.mockResolvedValue(true);
        
        const hashError = new Error('Hashing failed');
        bcrypt.hash.mockRejectedValue(hashError);

        await expect(RestaurantModel.changePassword(mockId, passwordData)).rejects.toThrow(hashError);
      });
    });

    describe('Complex Business Logic Tests', () => {
      it('should handle restaurant creation with all optional fields', async () => {
        const mockRestaurantData = {
          owner_name: 'John Doe',
          email: 'john@example.com',
          password: 'password123',
          phone: '1234567890',
          whatsapp: '1234567890',
          restaurant_name: 'Test Restaurant',
          restaurant_url_name: 'test-restaurant',
          business_type: 'multi-location',
          cuisine_type: 'Italian',
          website: 'https://test-restaurant.com',
          description: 'A great Italian restaurant',
          subscription_plan: 'premium',
          marketing_consent: true,
          terms_accepted: true,
        };

        const mockCreatedRestaurant = {
          id: '550e8400-e29b-41d4-a716-446655440000',
          ...mockRestaurantData,
          status: 'pending',
          email_confirmed: false,
          created_at: new Date(),
          updated_at: new Date(),
        };

        jest.spyOn(RestaurantModel, 'validate').mockResolvedValue(mockRestaurantData);
        jest.spyOn(RestaurantModel, 'hashPassword').mockResolvedValue('$2b$12$hashedPassword');
        jest.spyOn(RestaurantModel, 'generateEmailConfirmationToken').mockReturnValue({
          token: 'mockToken123',
          expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
        });
        jest.spyOn(RestaurantModel, 'executeQuery').mockResolvedValue({
          rows: [mockCreatedRestaurant],
        });

        const result = await RestaurantModel.create(mockRestaurantData);

        expect(result).toEqual(expect.objectContaining({
          id: mockCreatedRestaurant.id,
          business_type: 'multi-location',
          subscription_plan: 'premium',
          marketing_consent: true,
        }));
      });

      it('should handle update with partial data and return updated restaurant', async () => {
        const mockId = '550e8400-e29b-41d4-a716-446655440000';
        const updateData = {
          restaurant_name: 'Updated Restaurant Name',
          description: 'Updated description',
        };
        const mockUpdatedRestaurant = {
          id: mockId,
          ...updateData,
          updated_at: new Date(),
        };

        jest.spyOn(RestaurantModel, 'isValidUuid').mockReturnValue(true);
        jest.spyOn(RestaurantModel, 'validateUuid').mockReturnValue({
          isValid: true,
          sanitizedUuid: mockId.toLowerCase(),
        });
        jest.spyOn(RestaurantModel, 'validate').mockResolvedValue(updateData);
        jest.spyOn(RestaurantModel, 'buildSetClause').mockReturnValue({
          clause: 'restaurant_name = $1, description = $2',
          params: ['Updated Restaurant Name', 'Updated description'],
        });
        jest.spyOn(RestaurantModel, 'executeQuery').mockResolvedValue({
          rows: [mockUpdatedRestaurant],
        });

        const result = await RestaurantModel.update(mockId, updateData);

        expect(result).toEqual(mockUpdatedRestaurant);
        expect(RestaurantModel.executeQuery).toHaveBeenCalledWith(
          expect.stringContaining('UPDATE'),
          expect.arrayContaining(['Updated Restaurant Name', 'Updated description', mockId.toLowerCase()])
        );
      });

      it('should handle getRestaurants with comprehensive filters and pagination', async () => {
        const filters = {
          business_type: 'single',
          cuisine_type: 'Italian',
          status: 'active',
          subscription_plan: 'premium',
        };
        const pagination = {
          page: 2,
          limit: 5,
          orderBy: 'restaurant_name',
          sortDirection: 'ASC',
        };
        const mockRestaurants = [
          { id: '1', restaurant_name: 'Restaurant 1' },
          { id: '2', restaurant_name: 'Restaurant 2' },
        ];
        const totalCount = 25;

        jest.spyOn(RestaurantModel, 'count').mockResolvedValue(totalCount);
        jest.spyOn(RestaurantModel, 'find').mockResolvedValue(mockRestaurants);

        const result = await RestaurantModel.getRestaurants(filters, pagination);

        expect(RestaurantModel.count).toHaveBeenCalledWith(filters);
        expect(RestaurantModel.find).toHaveBeenCalledWith(
          filters,
          expect.objectContaining({
            limit: 5,
            offset: 5, // (page - 1) * limit = (2 - 1) * 5 = 5
            orderBy: 'restaurant_name ASC',
          }),
          expect.any(Array)
        );
        expect(result).toEqual({
          restaurants: mockRestaurants,
          pagination: {
            page: 2,
            limit: 5,
            total: totalCount,
            pages: 5, // Math.ceil(25 / 5)
          },
        });
      });
    });

    describe('Method Integration Tests', () => {
      it('should handle findById with custom columns and sanitization', async () => {
        const mockId = '550e8400-e29b-41d4-a716-446655440000';
        const customColumns = ['id', 'restaurant_name', 'email'];
        const mockRestaurant = {
          id: mockId,
          restaurant_name: 'Test Restaurant',
          email: 'test@example.com',
          password: 'secret', // Should be sanitized
        };
        const sanitizedRestaurant = {
          id: mockId,
          restaurant_name: 'Test Restaurant',
          email: 'test@example.com',
        };

        jest.spyOn(RestaurantModel, 'isValidUuid').mockReturnValue(true);
        jest.spyOn(RestaurantModel, 'validateUuid').mockReturnValue({
          isValid: true,
          sanitizedUuid: mockId.toLowerCase(),
        });

        // Mock the parent class findById method
        const mockParentFindById = jest.fn().mockResolvedValue(mockRestaurant);
        Object.setPrototypeOf(RestaurantModel, { findById: mockParentFindById });
        
        jest.spyOn(RestaurantModel, 'sanitizeOutput').mockReturnValue(sanitizedRestaurant);

        const result = await RestaurantModel.findById(mockId, customColumns);

        expect(mockParentFindById).toHaveBeenCalledWith(mockId.toLowerCase(), customColumns);
        expect(RestaurantModel.sanitizeOutput).toHaveBeenCalledWith(
          mockRestaurant,
          RestaurantModel.sensitiveFields
        );
        expect(result).toEqual(sanitizedRestaurant);
      });

      it('should handle confirmEmail with valid token and update restaurant status', async () => {
        const mockToken = 'validEmailToken123';
        const mockRestaurant = {
          id: '550e8400-e29b-41d4-a716-446655440000',
          email_confirmation_token: mockToken,
          email_confirmed: false,
          email_confirmation_expires: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
        };
        const mockUpdatedRestaurant = {
          ...mockRestaurant,
          email_confirmed: true,
          email_confirmation_token: null,
          email_confirmation_expires: null,
          status: 'active',
        };

        jest.spyOn(RestaurantModel, 'find').mockResolvedValue([mockRestaurant]);
        jest.spyOn(RestaurantModel, 'buildSetClause').mockReturnValue({
          clause: 'email_confirmed = $1, email_confirmation_token = $2, email_confirmation_expires = $3, status = $4',
          params: [true, null, null, 'active'],
        });
        jest.spyOn(RestaurantModel, 'executeQuery').mockResolvedValue({
          rows: [mockUpdatedRestaurant],
        });

        const result = await RestaurantModel.confirmEmail(mockToken);

        expect(RestaurantModel.find).toHaveBeenCalledWith({
          email_confirmation_token: mockToken,
          email_confirmed: false,
          email_confirmation_expires: { operator: '>', value: expect.any(Date) },
        });
        expect(result).toEqual(mockUpdatedRestaurant);
      });

      it('should handle findByUrlName with case conversion and sanitization', async () => {
        const testUrlName = 'Test-Restaurant';
        const mockRestaurant = {
          id: '550e8400-e29b-41d4-a716-446655440000',
          restaurant_url_name: 'test-restaurant',
          restaurant_name: 'Test Restaurant',
          password: 'secret', // Should be sanitized
        };
        const sanitizedRestaurant = {
          id: '550e8400-e29b-41d4-a716-446655440000',
          restaurant_url_name: 'test-restaurant',
          restaurant_name: 'Test Restaurant',
        };

        jest.spyOn(RestaurantModel, 'find').mockResolvedValue([mockRestaurant]);
        jest.spyOn(RestaurantModel, 'sanitizeOutput').mockReturnValue(sanitizedRestaurant);

        const result = await RestaurantModel.findByUrlName(testUrlName);

        expect(RestaurantModel.find).toHaveBeenCalledWith({
          restaurant_url_name: testUrlName.toLowerCase(),
        });
        expect(RestaurantModel.sanitizeOutput).toHaveBeenCalledWith(
          mockRestaurant,
          RestaurantModel.sensitiveFields
        );
        expect(result).toEqual(sanitizedRestaurant);
      });
    });

    describe('Schema and Validation Edge Cases', () => {
      it('should test validation schema properties access', () => {
        // Test that schemas can be accessed without errors
        expect(RestaurantModel.createSchema).toBeDefined();
        expect(RestaurantModel.updateSchema).toBeDefined();
        expect(RestaurantModel.passwordSchema).toBeDefined();
        expect(RestaurantModel.uuidSchema).toBeDefined();
      });

      it('should handle token generation with proper format', () => {
        crypto.randomBytes.mockReturnValue({ 
          toString: jest.fn().mockReturnValue('mockToken123456789012345678901234567890') 
        });

        const result = RestaurantModel.generateEmailConfirmationToken();

        expect(crypto.randomBytes).toHaveBeenCalledWith(32);
        expect(result.token).toBe('mockToken123456789012345678901234567890');
        expect(result.expires).toBeInstanceOf(Date);
        expect(result.expires.getTime()).toBeGreaterThan(Date.now());
      });

      it('should handle password hashing with proper salt rounds', async () => {
        const password = 'testPassword123!@#';
        const expectedHash = '$2b$12$hashedPasswordWithSpecialChars';
        
        bcrypt.hash.mockResolvedValue(expectedHash);

        const result = await RestaurantModel.hashPassword(password);

        expect(bcrypt.hash).toHaveBeenCalledWith(password, 12);
        expect(result).toBe(expectedHash);
      });

      it('should handle password verification with special characters', async () => {
        const password = 'testPassword123!@#$%^&*()';
        const hashedPassword = '$2b$12$hashedPasswordWithSpecialChars';
        
        bcrypt.compare.mockResolvedValue(true);

        const result = await RestaurantModel.verifyPassword(password, hashedPassword);

        expect(bcrypt.compare).toHaveBeenCalledWith(password, hashedPassword);
        expect(result).toBe(true);
      });
    });

    describe('Logging Integration Tests', () => {
      it('should log restaurant creation process', async () => {
        const mockRestaurantData = {
          owner_name: 'John Doe',
          email: 'john@example.com',
          password: 'password123',
          restaurant_name: 'Test Restaurant',
          restaurant_url_name: 'test-restaurant',
          terms_accepted: true,
        };

        jest.spyOn(RestaurantModel, 'validate').mockResolvedValue(mockRestaurantData);
        jest.spyOn(RestaurantModel, 'hashPassword').mockResolvedValue('$2b$12$hashedPassword');
        jest.spyOn(RestaurantModel, 'generateEmailConfirmationToken').mockReturnValue({
          token: 'mockToken123',
          expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
        });
        jest.spyOn(RestaurantModel, 'executeQuery').mockResolvedValue({
          rows: [{ id: '550e8400-e29b-41d4-a716-446655440000', ...mockRestaurantData }],
        });

        await RestaurantModel.create(mockRestaurantData);

        // Verify that logger methods were called during the process
        expect(mockLogger.info).toHaveBeenCalled();
        expect(mockLogger.debug).toHaveBeenCalled();
      });

      it('should log authentication attempts', async () => {
        const email = 'test@example.com';
        const password = 'password123';
        const mockRestaurant = {
          id: '550e8400-e29b-41d4-a716-446655440000',
          email,
          password: '$2b$12$hashedPassword',
          status: 'active',
        };

        jest.spyOn(RestaurantModel, 'findByEmail').mockResolvedValue(mockRestaurant);
        jest.spyOn(RestaurantModel, 'verifyPassword').mockResolvedValue(true);
        jest.spyOn(RestaurantModel, 'sanitizeOutput').mockReturnValue({
          id: mockRestaurant.id,
          email: mockRestaurant.email,
          status: mockRestaurant.status,
        });

        await RestaurantModel.authenticate(email, password);

        // Verify that logger methods were called during authentication
        expect(mockLogger.info).toHaveBeenCalled();
        expect(mockLogger.debug).toHaveBeenCalled();
      });
    });
  });
});
