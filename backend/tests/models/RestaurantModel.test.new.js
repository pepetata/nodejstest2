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

const RestaurantModel = require('../../src/models/RestaurantModel');

describe('RestaurantModel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Constructor and Properties', () => {
    it('should initialize with correct properties', () => {
      expect(RestaurantModel.tableName).toBe('restaurants');
      expect(RestaurantModel.sensitiveFields).toContain('password');
      expect(RestaurantModel.sensitiveFields).toContain('email_confirmation_token');
      expect(RestaurantModel.logger).toBeDefined();
    });

    it('should have all required schemas as getters', () => {
      expect(RestaurantModel.createSchema).toBeDefined();
      expect(RestaurantModel.updateSchema).toBeDefined();
      expect(RestaurantModel.passwordSchema).toBeDefined();
      expect(RestaurantModel.uuidSchema).toBeDefined();
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
        expect(() => {
          RestaurantModel.validateUuid('invalid-uuid');
        }).toThrow('Invalid UUID format');
      });

      it('should handle null/undefined UUID', () => {
        expect(() => {
          RestaurantModel.validateUuid(null);
        }).toThrow('Invalid UUID format');
        
        expect(() => {
          RestaurantModel.validateUuid(undefined);
        }).toThrow('Invalid UUID format');
      });
    });

    describe('isValidUuid', () => {
      it('should return true for valid UUID', () => {
        const validUuid = '550e8400-e29b-41d4-a716-446655440000';
        expect(RestaurantModel.isValidUuid(validUuid)).toBe(true);
      });

      it('should return false for invalid UUID', () => {
        expect(RestaurantModel.isValidUuid('invalid-uuid')).toBe(false);
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
        const hashedPassword = '$2b$12$hashedPassword';
        
        bcrypt.hash.mockResolvedValue(hashedPassword);
        
        const result = await RestaurantModel.hashPassword(password);
        
        expect(bcrypt.hash).toHaveBeenCalledWith(password, 12);
        expect(result).toBe(hashedPassword);
      });

      it('should throw error if bcrypt fails', async () => {
        const password = 'testPassword123';
        const error = new Error('Bcrypt error');
        
        bcrypt.hash.mockRejectedValue(error);
        
        await expect(RestaurantModel.hashPassword(password)).rejects.toThrow(error);
      });
    });

    describe('verifyPassword', () => {
      it('should verify password correctly', async () => {
        const password = 'testPassword123';
        const hashedPassword = '$2b$12$hashedPassword';
        
        bcrypt.compare.mockResolvedValue(true);
        
        const result = await RestaurantModel.verifyPassword(password, hashedPassword);
        
        expect(bcrypt.compare).toHaveBeenCalledWith(password, hashedPassword);
        expect(result).toBe(true);
      });

      it('should return false for incorrect password', async () => {
        const password = 'wrongPassword';
        const hashedPassword = '$2b$12$hashedPassword';
        
        bcrypt.compare.mockResolvedValue(false);
        
        const result = await RestaurantModel.verifyPassword(password, hashedPassword);
        
        expect(result).toBe(false);
      });

      it('should throw error if bcrypt compare fails', async () => {
        const password = 'testPassword123';
        const hashedPassword = '$2b$12$hashedPassword';
        const error = new Error('Bcrypt compare error');
        
        bcrypt.compare.mockRejectedValue(error);
        
        await expect(RestaurantModel.verifyPassword(password, hashedPassword)).rejects.toThrow(error);
      });
    });
  });

  describe('Email Confirmation Token', () => {
    describe('generateEmailConfirmationToken', () => {
      it('should generate token and expiry date', () => {
        const mockToken = 'mockToken1234567890123456789012345678901234567890123456789012345678';
        crypto.randomBytes.mockReturnValue({ toString: () => mockToken });
        
        const result = RestaurantModel.generateEmailConfirmationToken();
        
        expect(crypto.randomBytes).toHaveBeenCalledWith(32);
        expect(result.token).toBe(mockToken);
        expect(result.expires).toBeInstanceOf(Date);
      });

      it('should generate token with 24 hours expiry', () => {
        const mockToken = 'mockToken';
        crypto.randomBytes.mockReturnValue({ toString: () => mockToken });
        
        const beforeTime = new Date();
        beforeTime.setHours(beforeTime.getHours() + 24);
        
        const result = RestaurantModel.generateEmailConfirmationToken();
        
        const afterTime = new Date();
        afterTime.setHours(afterTime.getHours() + 24);
        
        expect(result.expires.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime() - 1000);
        expect(result.expires.getTime()).toBeLessThanOrEqual(afterTime.getTime() + 1000);
      });
    });
  });

  describe('CRUD Operations', () => {
    describe('create', () => {
      const mockRestaurantData = {
        owner_name: 'John Doe',
        email: 'test@example.com',
        password: 'password123',
        restaurant_name: 'Test Restaurant',
        restaurant_url_name: 'test-restaurant',
        terms_accepted: true,
      };

      it('should create restaurant successfully', async () => {
        const mockCreatedRestaurant = {
          id: '550e8400-e29b-41d4-a716-446655440000',
          ...mockRestaurantData,
          status: 'pending',
          created_at: new Date(),
          updated_at: new Date(),
        };
        delete mockCreatedRestaurant.password;

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

        expect(RestaurantModel.validate).toHaveBeenCalledWith(mockRestaurantData, RestaurantModel.createSchema);
        expect(RestaurantModel.hashPassword).toHaveBeenCalledWith(mockRestaurantData.password);
        expect(RestaurantModel.generateEmailConfirmationToken).toHaveBeenCalled();
        expect(result).toEqual(expect.objectContaining({
          id: mockCreatedRestaurant.id,
          email: mockCreatedRestaurant.email,
          restaurant_name: mockCreatedRestaurant.restaurant_name,
          email_confirmation_token: 'mockToken123',
        }));
      });

      it('should handle validation errors', async () => {
        const validationError = new Error('Validation failed');
        jest.spyOn(RestaurantModel, 'validate').mockRejectedValue(validationError);

        await expect(RestaurantModel.create(mockRestaurantData)).rejects.toThrow(validationError);
      });

      it('should handle database errors', async () => {
        const dbError = new Error('Database error');
        jest.spyOn(RestaurantModel, 'validate').mockResolvedValue(mockRestaurantData);
        jest.spyOn(RestaurantModel, 'hashPassword').mockResolvedValue('$2b$12$hashedPassword');
        jest.spyOn(RestaurantModel, 'generateEmailConfirmationToken').mockReturnValue({
          token: 'mockToken123',
          expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
        });
        jest.spyOn(RestaurantModel, 'executeQuery').mockRejectedValue(dbError);

        await expect(RestaurantModel.create(mockRestaurantData)).rejects.toThrow(dbError);
      });

      it('should handle bcrypt errors', async () => {
        const bcryptError = new Error('Bcrypt error');
        jest.spyOn(RestaurantModel, 'validate').mockResolvedValue(mockRestaurantData);
        jest.spyOn(RestaurantModel, 'hashPassword').mockRejectedValue(bcryptError);

        await expect(RestaurantModel.create(mockRestaurantData)).rejects.toThrow(bcryptError);
      });
    });

    describe('findByEmail', () => {
      const email = 'test@example.com';
      const mockRestaurant = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        email: email,
        restaurant_name: 'Test Restaurant',
        password: '$2b$12$hashedPassword',
        status: 'active',
      };

      it('should find restaurant by email', async () => {
        jest.spyOn(RestaurantModel, 'find').mockResolvedValue([mockRestaurant]);
        jest.spyOn(RestaurantModel, 'sanitizeOutput').mockReturnValue({
          id: mockRestaurant.id,
          email: mockRestaurant.email,
          restaurant_name: mockRestaurant.restaurant_name,
          status: mockRestaurant.status,
        });

        const result = await RestaurantModel.findByEmail(email);

        expect(RestaurantModel.find).toHaveBeenCalledWith(
          { email: email.toLowerCase() },
          {},
          ['id', 'owner_name', 'email', 'email_confirmed', 'restaurant_name', 'restaurant_url_name', 'status', 'created_at', 'updated_at']
        );
        expect(result).toBeDefined();
        expect(result.email).toBe(email);
      });

      it('should include password when requested', async () => {
        jest.spyOn(RestaurantModel, 'find').mockResolvedValue([mockRestaurant]);

        await RestaurantModel.findByEmail(email, true);

        expect(RestaurantModel.find).toHaveBeenCalledWith(
          { email: email.toLowerCase() },
          {},
          ['id', 'owner_name', 'email', 'email_confirmed', 'restaurant_name', 'restaurant_url_name', 'status', 'password', 'created_at', 'updated_at']
        );
      });

      it('should return null when restaurant not found', async () => {
        jest.spyOn(RestaurantModel, 'find').mockResolvedValue([]);

        const result = await RestaurantModel.findByEmail(email);

        expect(result).toBeNull();
      });

      it('should handle case sensitivity', async () => {
        const upperCaseEmail = 'TEST@EXAMPLE.COM';
        jest.spyOn(RestaurantModel, 'find').mockResolvedValue([mockRestaurant]);

        await RestaurantModel.findByEmail(upperCaseEmail);

        expect(RestaurantModel.find).toHaveBeenCalledWith(
          { email: upperCaseEmail.toLowerCase() },
          expect.any(Object),
          expect.any(Array)
        );
      });
    });

    describe('authenticate', () => {
      const email = 'test@example.com';
      const password = 'password123';
      const mockRestaurant = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        email: email,
        restaurant_name: 'Test Restaurant',
        password: '$2b$12$hashedPassword',
        status: 'active',
      };

      it('should authenticate successfully with correct credentials', async () => {
        jest.spyOn(RestaurantModel, 'findByEmail').mockResolvedValue(mockRestaurant);
        jest.spyOn(RestaurantModel, 'verifyPassword').mockResolvedValue(true);
        jest.spyOn(RestaurantModel, 'sanitizeOutput').mockReturnValue({
          id: mockRestaurant.id,
          email: mockRestaurant.email,
          restaurant_name: mockRestaurant.restaurant_name,
          status: mockRestaurant.status,
        });

        const result = await RestaurantModel.authenticate(email, password);

        expect(RestaurantModel.findByEmail).toHaveBeenCalledWith(email, true);
        expect(RestaurantModel.verifyPassword).toHaveBeenCalledWith(password, mockRestaurant.password);
        expect(result).toBeDefined();
        expect(result.email).toBe(email);
      });

      it('should return null when restaurant not found', async () => {
        jest.spyOn(RestaurantModel, 'findByEmail').mockResolvedValue(null);

        const result = await RestaurantModel.authenticate(email, password);

        expect(result).toBeNull();
      });

      it('should return null with incorrect password', async () => {
        jest.spyOn(RestaurantModel, 'findByEmail').mockResolvedValue(mockRestaurant);
        jest.spyOn(RestaurantModel, 'verifyPassword').mockResolvedValue(false);

        const result = await RestaurantModel.authenticate(email, password);

        expect(result).toBeNull();
      });

      it('should handle authentication errors', async () => {
        const authError = new Error('Authentication error');
        jest.spyOn(RestaurantModel, 'findByEmail').mockRejectedValue(authError);

        await expect(RestaurantModel.authenticate(email, password)).rejects.toThrow(authError);
      });

      it('should handle bcrypt comparison errors', async () => {
        const bcryptError = new Error('Bcrypt comparison error');
        jest.spyOn(RestaurantModel, 'findByEmail').mockResolvedValue(mockRestaurant);
        jest.spyOn(RestaurantModel, 'verifyPassword').mockRejectedValue(bcryptError);

        await expect(RestaurantModel.authenticate(email, password)).rejects.toThrow(bcryptError);
      });
    });
  });

  describe('Schema Properties', () => {
    it('should have createSchema with required fields', () => {
      const schema = RestaurantModel.createSchema;
      expect(schema).toBeDefined();
      expect(typeof schema.describe).toBe('function');
    });

    it('should have updateSchema with optional fields', () => {
      const schema = RestaurantModel.updateSchema;
      expect(schema).toBeDefined();
      expect(typeof schema.describe).toBe('function');
    });

    it('should have passwordSchema with required fields', () => {
      const schema = RestaurantModel.passwordSchema;
      expect(schema).toBeDefined();
      expect(typeof schema.describe).toBe('function');
    });

    it('should have uuidSchema for UUID validation', () => {
      const schema = RestaurantModel.uuidSchema;
      expect(schema).toBeDefined();
      expect(typeof schema.describe).toBe('function');
    });
  });

  describe('Method Existence', () => {
    it('should have all required methods', () => {
      expect(typeof RestaurantModel.validateUuid).toBe('function');
      expect(typeof RestaurantModel.isValidUuid).toBe('function');
      expect(typeof RestaurantModel.hashPassword).toBe('function');
      expect(typeof RestaurantModel.verifyPassword).toBe('function');
      expect(typeof RestaurantModel.generateEmailConfirmationToken).toBe('function');
      expect(typeof RestaurantModel.create).toBe('function');
      expect(typeof RestaurantModel.findByEmail).toBe('function');
      expect(typeof RestaurantModel.authenticate).toBe('function');
      expect(typeof RestaurantModel.findByUrlName).toBe('function');
      expect(typeof RestaurantModel.confirmEmail).toBe('function');
      expect(typeof RestaurantModel.update).toBe('function');
      expect(typeof RestaurantModel.changePassword).toBe('function');
      expect(typeof RestaurantModel.getRestaurants).toBe('function');
      expect(typeof RestaurantModel.findById).toBe('function');
    });

    it('should have all required properties', () => {
      expect(RestaurantModel.tableName).toBeDefined();
      expect(RestaurantModel.sensitiveFields).toBeDefined();
      expect(RestaurantModel.logger).toBeDefined();
    });

    it('should have logger integration', () => {
      expect(RestaurantModel.logger).toBeDefined();
      expect(typeof RestaurantModel.logger.debug).toBe('function');
      expect(typeof RestaurantModel.logger.info).toBe('function');
      expect(typeof RestaurantModel.logger.warn).toBe('function');
      expect(typeof RestaurantModel.logger.error).toBe('function');
    });
  });
});
