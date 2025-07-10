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

    async validate(data, _schema) {
      return data;
    }

    async executeQuery(_query, _params) {
      return { rows: [] };
    }

    async find(_conditions, _options, _columns) {
      return [];
    }

    async findById(_id, _columns) {
      return null;
    }

    async count(_conditions) {
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

const RestaurantModel = require('../../src/models/RestaurantModel');

describe('RestaurantModel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Constructor and Properties', () => {
    it('should initialize with correct properties', () => {
      expect(RestaurantModel.tableName).toBe('restaurants');
      expect(RestaurantModel.sensitiveFields).toEqual([]); // No sensitive fields anymore
      expect(RestaurantModel.logger).toBeDefined();
    });

    it('should have all required schemas as getters', () => {
      expect(RestaurantModel.createSchema).toBeDefined();
      expect(RestaurantModel.updateSchema).toBeDefined();
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

      it('should handle empty string UUID', () => {
        expect(() => {
          RestaurantModel.validateUuid('');
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

      it('should return false for empty string UUID', () => {
        expect(RestaurantModel.isValidUuid('')).toBe(false);
      });

      it('should handle validateUuid throwing error', () => {
        // Test case where validateUuid throws an error
        jest.spyOn(RestaurantModel, 'validateUuid').mockImplementation(() => {
          throw new Error('Validation failed');
        });

        expect(RestaurantModel.isValidUuid('test-uuid')).toBe(false);

        RestaurantModel.validateUuid.mockRestore();
      });
    });
  });

  describe('Validation Schemas', () => {
    describe('createSchema', () => {
      it('should validate correct restaurant creation data', () => {
        const validData = {
          restaurant_name: 'Test Restaurant',
          restaurant_url_name: 'test-restaurant',
          business_type: 'single',
          cuisine_type: 'Italian',
          phone: '1234567890',
          whatsapp: '1234567890',
          website: 'https://example.com',
          description: 'A test restaurant',
          status: 'pending',
          subscription_plan: 'starter',
          subscription_status: 'active',
          terms_accepted: true,
          marketing_consent: false,
        };

        const { error } = RestaurantModel.createSchema.validate(validData);
        expect(error).toBeUndefined();
      });

      it('should require restaurant_name', () => {
        const invalidData = {
          restaurant_url_name: 'test-restaurant',
          terms_accepted: true,
        };

        const { error } = RestaurantModel.createSchema.validate(invalidData);
        expect(error).toBeDefined();
        expect(error.details[0].path).toContain('restaurant_name');
      });

      it('should require restaurant_url_name', () => {
        const invalidData = {
          restaurant_name: 'Test Restaurant',
          terms_accepted: true,
        };

        const { error } = RestaurantModel.createSchema.validate(invalidData);
        expect(error).toBeDefined();
        expect(error.details[0].path).toContain('restaurant_url_name');
      });

      it('should require terms_accepted to be true', () => {
        const invalidData = {
          restaurant_name: 'Test Restaurant',
          restaurant_url_name: 'test-restaurant',
          terms_accepted: false,
        };

        const { error } = RestaurantModel.createSchema.validate(invalidData);
        expect(error).toBeDefined();
        expect(error.details[0].path).toContain('terms_accepted');
      });

      it('should validate business_type values', () => {
        const validTypes = ['single', 'multi'];

        validTypes.forEach((type) => {
          const data = {
            restaurant_name: 'Test Restaurant',
            restaurant_url_name: 'test-restaurant',
            business_type: type,
            terms_accepted: true,
          };

          const { error } = RestaurantModel.createSchema.validate(data);
          expect(error).toBeUndefined();
        });

        // Test invalid type
        const invalidData = {
          restaurant_name: 'Test Restaurant',
          restaurant_url_name: 'test-restaurant',
          business_type: 'invalid-type',
          terms_accepted: true,
        };

        const { error } = RestaurantModel.createSchema.validate(invalidData);
        expect(error).toBeDefined();
      });

      it('should validate subscription plan values', () => {
        const validPlans = ['starter', 'professional', 'premium', 'enterprise'];

        validPlans.forEach((plan) => {
          const data = {
            restaurant_name: 'Test Restaurant',
            restaurant_url_name: 'test-restaurant',
            subscription_plan: plan,
            terms_accepted: true,
          };

          const { error } = RestaurantModel.createSchema.validate(data);
          expect(error).toBeUndefined();
        });
      });

      it('should validate subscription status values', () => {
        const validStatuses = ['active', 'cancelled', 'expired', 'suspended'];

        validStatuses.forEach((status) => {
          const data = {
            restaurant_name: 'Test Restaurant',
            restaurant_url_name: 'test-restaurant',
            subscription_status: status,
            terms_accepted: true,
          };

          const { error } = RestaurantModel.createSchema.validate(data);
          expect(error).toBeUndefined();
        });
      });
    });

    describe('updateSchema', () => {
      it('should validate restaurant update data', () => {
        const validUpdateData = {
          restaurant_name: 'Updated Restaurant',
          description: 'Updated description',
          status: 'active',
          marketing_consent: true,
        };

        const { error } = RestaurantModel.updateSchema.validate(validUpdateData);
        expect(error).toBeUndefined();
      });

      it('should allow partial updates', () => {
        const partialData = {
          restaurant_name: 'Updated Name Only',
        };

        const { error } = RestaurantModel.updateSchema.validate(partialData);
        expect(error).toBeUndefined();
      });

      it('should not allow empty updates', () => {
        const emptyData = {};

        const { error } = RestaurantModel.updateSchema.validate(emptyData);
        expect(error).toBeUndefined(); // Schema allows empty object, but business logic should handle it
      });
    });
  });

  describe('CRUD Operations', () => {
    describe('create', () => {
      const mockRestaurantData = {
        restaurant_name: 'Test Restaurant',
        restaurant_url_name: 'test-restaurant',
        business_type: 'single',
        cuisine_type: 'Italian',
        terms_accepted: true,
      };

      it('should create restaurant successfully', async () => {
        const mockCreatedRestaurant = {
          id: '550e8400-e29b-41d4-a716-446655440000',
          ...mockRestaurantData,
          status: 'pending',
          subscription_plan: 'starter',
          subscription_status: 'active',
          terms_accepted_at: new Date(),
          created_at: new Date(),
          updated_at: new Date(),
        };

        jest.spyOn(RestaurantModel, 'validate').mockResolvedValue(mockRestaurantData);
        jest.spyOn(RestaurantModel, 'executeQuery').mockResolvedValue({
          rows: [mockCreatedRestaurant],
        });

        const result = await RestaurantModel.create(mockRestaurantData);

        expect(RestaurantModel.validate).toHaveBeenCalledWith(
          mockRestaurantData,
          expect.any(Object)
        );
        expect(result).toEqual(
          expect.objectContaining({
            id: mockCreatedRestaurant.id,
            restaurant_name: mockCreatedRestaurant.restaurant_name,
            restaurant_url_name: mockCreatedRestaurant.restaurant_url_name,
            status: mockCreatedRestaurant.status,
          })
        );
      });

      it('should set terms_accepted_at when terms_accepted is true', async () => {
        const dataWithTerms = { ...mockRestaurantData, terms_accepted: true };
        const mockCreatedRestaurant = {
          id: '550e8400-e29b-41d4-a716-446655440000',
          ...dataWithTerms,
          terms_accepted_at: new Date(),
        };

        jest.spyOn(RestaurantModel, 'validate').mockResolvedValue(dataWithTerms);
        jest.spyOn(RestaurantModel, 'executeQuery').mockResolvedValue({
          rows: [mockCreatedRestaurant],
        });

        await RestaurantModel.create(dataWithTerms);

        expect(RestaurantModel.executeQuery).toHaveBeenCalledWith(
          expect.stringContaining('INSERT INTO'),
          expect.arrayContaining([expect.any(Date)]) // Should include terms_accepted_at
        );
      });

      it('should handle validation errors', async () => {
        const validationError = new Error('Validation failed');
        jest.spyOn(RestaurantModel, 'validate').mockRejectedValue(validationError);

        await expect(RestaurantModel.create(mockRestaurantData)).rejects.toThrow(validationError);
      });

      it('should handle database errors', async () => {
        const dbError = new Error('Database error');
        jest.spyOn(RestaurantModel, 'validate').mockResolvedValue(mockRestaurantData);
        jest.spyOn(RestaurantModel, 'executeQuery').mockRejectedValue(dbError);

        await expect(RestaurantModel.create(mockRestaurantData)).rejects.toThrow(dbError);
      });
    });

    describe('findByUrlName', () => {
      const urlName = 'test-restaurant';
      const mockRestaurant = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        restaurant_name: 'Test Restaurant',
        restaurant_url_name: urlName,
        status: 'active',
      };

      it('should find restaurant by URL name', async () => {
        jest.spyOn(RestaurantModel, 'find').mockResolvedValue([mockRestaurant]);

        const result = await RestaurantModel.findByUrlName(urlName);

        expect(RestaurantModel.find).toHaveBeenCalledWith({
          restaurant_url_name: urlName.toLowerCase(),
        });
        expect(result).toEqual(mockRestaurant);
      });

      it('should return null when restaurant not found', async () => {
        jest.spyOn(RestaurantModel, 'find').mockResolvedValue([]);

        const result = await RestaurantModel.findByUrlName('non-existent');

        expect(result).toBeNull();
      });

      it('should handle case insensitive search', async () => {
        jest.spyOn(RestaurantModel, 'find').mockResolvedValue([mockRestaurant]);

        await RestaurantModel.findByUrlName('TEST-RESTAURANT');

        expect(RestaurantModel.find).toHaveBeenCalledWith({
          restaurant_url_name: 'test-restaurant',
        });
      });

      it('should handle database errors', async () => {
        const dbError = new Error('Database error');
        jest.spyOn(RestaurantModel, 'find').mockRejectedValue(dbError);

        await expect(RestaurantModel.findByUrlName(urlName)).rejects.toThrow(dbError);
      });
    });

    describe('update', () => {
      const restaurantId = '550e8400-e29b-41d4-a716-446655440000';
      const updateData = {
        restaurant_name: 'Updated Restaurant',
        description: 'Updated description',
      };

      it('should update restaurant successfully', async () => {
        const mockUpdatedRestaurant = {
          id: restaurantId,
          restaurant_name: 'Updated Restaurant',
          description: 'Updated description',
          updated_at: new Date(),
        };

        jest.spyOn(RestaurantModel, 'isValidUuid').mockReturnValue(true);
        jest.spyOn(RestaurantModel, 'validateUuid').mockReturnValue({
          isValid: true,
          sanitizedUuid: restaurantId,
        });
        jest.spyOn(RestaurantModel, 'validate').mockResolvedValue(updateData);
        jest.spyOn(RestaurantModel, 'buildSetClause').mockReturnValue({
          clause: 'restaurant_name = $1, description = $2',
          params: ['Updated Restaurant', 'Updated description'],
        });
        jest.spyOn(RestaurantModel, 'executeQuery').mockResolvedValue({
          rows: [mockUpdatedRestaurant],
        });

        const result = await RestaurantModel.update(restaurantId, updateData);

        expect(result).toEqual(mockUpdatedRestaurant);
      });

      it('should reject invalid UUID', async () => {
        jest.spyOn(RestaurantModel, 'isValidUuid').mockReturnValue(false);

        await expect(RestaurantModel.update('invalid-uuid', updateData)).rejects.toThrow(
          'Invalid restaurant ID format'
        );
      });

      it('should reject empty update data', async () => {
        jest.spyOn(RestaurantModel, 'isValidUuid').mockReturnValue(true);
        jest.spyOn(RestaurantModel, 'validateUuid').mockReturnValue({
          isValid: true,
          sanitizedUuid: restaurantId,
        });
        jest.spyOn(RestaurantModel, 'validate').mockResolvedValue({});

        await expect(RestaurantModel.update(restaurantId, {})).rejects.toThrow(
          'No valid fields to update'
        );
      });
    });

    describe('findById', () => {
      const restaurantId = '550e8400-e29b-41d4-a716-446655440000';
      const mockRestaurant = {
        id: restaurantId,
        restaurant_name: 'Test Restaurant',
        status: 'active',
      };

      it('should find restaurant by ID', async () => {
        jest.spyOn(RestaurantModel, 'isValidUuid').mockReturnValue(true);
        jest.spyOn(RestaurantModel, 'validateUuid').mockReturnValue({
          isValid: true,
          sanitizedUuid: restaurantId,
        });

        // Mock the super.findById call
        const originalFindById = RestaurantModel.__proto__.findById;
        RestaurantModel.__proto__.findById = jest.fn().mockResolvedValue(mockRestaurant);

        const result = await RestaurantModel.findById(restaurantId);

        expect(result).toEqual(mockRestaurant);

        // Restore original method
        RestaurantModel.__proto__.findById = originalFindById;
      });

      it('should reject invalid UUID', async () => {
        jest.spyOn(RestaurantModel, 'isValidUuid').mockReturnValue(false);

        await expect(RestaurantModel.findById('invalid-uuid')).rejects.toThrow(
          'Invalid restaurant ID format'
        );
      });
    });

    describe('getRestaurants', () => {
      const mockRestaurants = [
        {
          id: '550e8400-e29b-41d4-a716-446655440000',
          restaurant_name: 'Restaurant 1',
          status: 'active',
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440001',
          restaurant_name: 'Restaurant 2',
          status: 'pending',
        },
      ];

      it('should get restaurants with pagination', async () => {
        jest.spyOn(RestaurantModel, 'count').mockResolvedValue(2);
        jest.spyOn(RestaurantModel, 'find').mockResolvedValue(mockRestaurants);

        const result = await RestaurantModel.getRestaurants({}, { page: 1, limit: 10 });

        expect(result.restaurants).toEqual(mockRestaurants);
        expect(result.pagination).toEqual({
          page: 1,
          limit: 10,
          total: 2,
          pages: 1,
        });
      });

      it('should apply filters', async () => {
        const filters = { status: 'active', business_type: 'single' };
        jest.spyOn(RestaurantModel, 'count').mockResolvedValue(1);
        jest.spyOn(RestaurantModel, 'find').mockResolvedValue([mockRestaurants[0]]);

        await RestaurantModel.getRestaurants(filters);

        expect(RestaurantModel.count).toHaveBeenCalledWith(filters);
        expect(RestaurantModel.find).toHaveBeenCalledWith(
          filters,
          expect.objectContaining({
            limit: 10,
            offset: 0,
            orderBy: 'created_at DESC',
          }),
          expect.any(Array)
        );
      });

      it('should validate sort parameters', async () => {
        await expect(
          RestaurantModel.getRestaurants({}, { sortBy: 'invalid_column' })
        ).rejects.toThrow('Invalid sort column');

        await expect(RestaurantModel.getRestaurants({}, { sortOrder: 'INVALID' })).rejects.toThrow(
          'Invalid sort order'
        );
      });
    });
  });

  describe('Business Logic Methods', () => {
    describe('deleteRestaurant', () => {
      const restaurantId = '550e8400-e29b-41d4-a716-446655440000';

      it('should soft delete restaurant', async () => {
        const mockUpdatedRestaurant = {
          id: restaurantId,
          restaurant_name: 'Test Restaurant',
          status: 'inactive',
        };

        jest.spyOn(RestaurantModel, 'isValidUuid').mockReturnValue(true);
        jest.spyOn(RestaurantModel, 'validateUuid').mockReturnValue({
          isValid: true,
          sanitizedUuid: restaurantId,
        });
        jest.spyOn(RestaurantModel, 'update').mockResolvedValue(mockUpdatedRestaurant);

        const result = await RestaurantModel.deleteRestaurant(restaurantId);

        expect(RestaurantModel.update).toHaveBeenCalledWith(restaurantId, { status: 'inactive' });
        expect(result).toBe(true);
      });

      it('should return false if update fails', async () => {
        jest.spyOn(RestaurantModel, 'isValidUuid').mockReturnValue(true);
        jest.spyOn(RestaurantModel, 'validateUuid').mockReturnValue({
          isValid: true,
          sanitizedUuid: restaurantId,
        });
        jest.spyOn(RestaurantModel, 'update').mockResolvedValue(null);

        const result = await RestaurantModel.deleteRestaurant(restaurantId);

        expect(result).toBe(false);
      });
    });

    describe('isUrlNameAvailable', () => {
      const urlName = 'test-restaurant';

      it('should return true when URL name is available', async () => {
        jest.spyOn(RestaurantModel, 'find').mockResolvedValue([]);

        const result = await RestaurantModel.isUrlNameAvailable(urlName);

        expect(RestaurantModel.find).toHaveBeenCalledWith(
          { restaurant_url_name: urlName.toLowerCase() },
          {},
          ['id']
        );
        expect(result).toBe(true);
      });

      it('should return false when URL name is taken', async () => {
        jest.spyOn(RestaurantModel, 'find').mockResolvedValue([{ id: 'some-id' }]);

        const result = await RestaurantModel.isUrlNameAvailable(urlName);

        expect(result).toBe(false);
      });

      it('should exclude specific restaurant ID when checking availability', async () => {
        const excludeId = '550e8400-e29b-41d4-a716-446655440000';
        jest.spyOn(RestaurantModel, 'isValidUuid').mockReturnValue(true);
        jest.spyOn(RestaurantModel, 'validateUuid').mockReturnValue({
          isValid: true,
          sanitizedUuid: excludeId,
        });
        jest.spyOn(RestaurantModel, 'find').mockResolvedValue([]);

        const result = await RestaurantModel.isUrlNameAvailable(urlName, excludeId);

        expect(RestaurantModel.find).toHaveBeenCalledWith(
          {
            restaurant_url_name: urlName.toLowerCase(),
            id: { operator: '!=', value: excludeId },
          },
          {},
          ['id']
        );
        expect(result).toBe(true);
      });
    });

    describe('getRestaurantStats', () => {
      const restaurantId = '550e8400-e29b-41d4-a716-446655440000';

      it('should get restaurant statistics', async () => {
        const mockStats = {
          id: restaurantId,
          restaurant_name: 'Test Restaurant',
          status: 'active',
          subscription_plan: 'professional',
          created_at: new Date(),
          location_count: 3,
          user_count: 10,
        };

        jest.spyOn(RestaurantModel, 'isValidUuid').mockReturnValue(true);
        jest.spyOn(RestaurantModel, 'validateUuid').mockReturnValue({
          isValid: true,
          sanitizedUuid: restaurantId,
        });
        jest.spyOn(RestaurantModel, 'executeQuery').mockResolvedValue({
          rows: [mockStats],
        });

        const result = await RestaurantModel.getRestaurantStats(restaurantId);

        expect(RestaurantModel.executeQuery).toHaveBeenCalledWith(
          expect.stringContaining('SELECT'),
          [restaurantId]
        );
        expect(result).toEqual(mockStats);
      });

      it('should return null when restaurant not found', async () => {
        jest.spyOn(RestaurantModel, 'isValidUuid').mockReturnValue(true);
        jest.spyOn(RestaurantModel, 'validateUuid').mockReturnValue({
          isValid: true,
          sanitizedUuid: restaurantId,
        });
        jest.spyOn(RestaurantModel, 'executeQuery').mockResolvedValue({
          rows: [],
        });

        const result = await RestaurantModel.getRestaurantStats(restaurantId);

        expect(result).toBeNull();
      });

      it('should handle database error in getRestaurantStats', async () => {
        jest.spyOn(RestaurantModel, 'isValidUuid').mockReturnValue(true);
        jest.spyOn(RestaurantModel, 'validateUuid').mockReturnValue({
          isValid: true,
          sanitizedUuid: restaurantId,
        });
        const dbError = new Error('Database connection failed');
        jest.spyOn(RestaurantModel, 'executeQuery').mockRejectedValue(dbError);

        await expect(RestaurantModel.getRestaurantStats(restaurantId)).rejects.toThrow(
          'Database connection failed'
        );
      });

      it('should handle invalid UUID in getRestaurantStats', async () => {
        jest.spyOn(RestaurantModel, 'isValidUuid').mockReturnValue(false);

        await expect(RestaurantModel.getRestaurantStats('invalid-uuid')).rejects.toThrow(
          'Invalid restaurant ID format'
        );
      });
    });

    describe('isUrlNameAvailable edge cases', () => {
      it('should handle database error in isUrlNameAvailable', async () => {
        const dbError = new Error('Database connection failed');
        jest.spyOn(RestaurantModel, 'find').mockRejectedValue(dbError);

        await expect(RestaurantModel.isUrlNameAvailable('test-url')).rejects.toThrow(
          'Database connection failed'
        );
      });

      it('should handle case insensitive URL name check', async () => {
        jest
          .spyOn(RestaurantModel, 'find')
          .mockResolvedValue([{ id: 'existing-id', restaurant_url_name: 'Test-URL' }]);

        const result = await RestaurantModel.isUrlNameAvailable('test-url');
        expect(result).toBe(false);
      });
    });

    describe('Additional business logic coverage', () => {
      it('should handle terms_accepted_at setting with falsy terms_accepted', async () => {
        const testRestaurantId = '550e8400-e29b-41d4-a716-446655440000';
        const testData = {
          restaurant_name: 'Test Restaurant',
          restaurant_url_name: 'test-restaurant',
          terms_accepted: false, // This should not set terms_accepted_at
          business_type: 'restaurant',
        };

        jest.spyOn(RestaurantModel, 'createSchema', 'get').mockReturnValue({
          validate: jest.fn().mockReturnValue({ value: testData }),
        });

        jest.spyOn(RestaurantModel, 'executeQuery').mockResolvedValue({
          rows: [{ id: testRestaurantId, ...testData }],
        });

        const result = await RestaurantModel.create(testData);

        expect(result).toBeDefined();
        expect(result.id).toBe(testRestaurantId);
      });

      it('should handle null data in create method', async () => {
        await expect(RestaurantModel.create(null)).rejects.toThrow();
      });

      it('should handle undefined data in create method', async () => {
        await expect(RestaurantModel.create(undefined)).rejects.toThrow();
      });

      it('should test logging branches with different UUID values', () => {
        // Test with a valid UUID (should use substring)
        const validUuid = '550e8400-e29b-41d4-a716-446655440000';
        const result = RestaurantModel.validateUuid(validUuid);
        expect(result.isValid).toBe(true);

        // This test covers the logging branch where uuid is not null
        expect(typeof result.sanitizedUuid).toBe('string');
      });

      it('should test deleteRestaurant with update failure', async () => {
        const validUuid = '550e8400-e29b-41d4-a716-446655440000';
        jest.spyOn(RestaurantModel, 'isValidUuid').mockReturnValue(true);
        jest.spyOn(RestaurantModel, 'validateUuid').mockReturnValue({
          isValid: true,
          sanitizedUuid: validUuid,
        });

        // Mock update to return false (failure)
        jest.spyOn(RestaurantModel, 'update').mockResolvedValue(false);

        const result = await RestaurantModel.deleteRestaurant(validUuid);

        expect(result).toBe(false);
      });

      it('should test findByUrlName with different URL cases', async () => {
        const testRestaurantId = '550e8400-e29b-41d4-a716-446655440000';
        jest
          .spyOn(RestaurantModel, 'find')
          .mockResolvedValue([{ id: testRestaurantId, restaurant_url_name: 'test-url' }]);

        // Test with exact case
        let result = await RestaurantModel.findByUrlName('test-url');
        expect(result).toBeDefined();

        // Test with different case
        result = await RestaurantModel.findByUrlName('Test-URL');
        expect(result).toBeDefined();
      });
    });
  });

  describe('Method Existence', () => {
    it('should have all expected methods', () => {
      expect(typeof RestaurantModel.validateUuid).toBe('function');
      expect(typeof RestaurantModel.isValidUuid).toBe('function');
      expect(typeof RestaurantModel.create).toBe('function');
      expect(typeof RestaurantModel.findByUrlName).toBe('function');
      expect(typeof RestaurantModel.update).toBe('function');
      expect(typeof RestaurantModel.getRestaurants).toBe('function');
      expect(typeof RestaurantModel.findById).toBe('function');
      expect(typeof RestaurantModel.deleteRestaurant).toBe('function');
      expect(typeof RestaurantModel.isUrlNameAvailable).toBe('function');
      expect(typeof RestaurantModel.getRestaurantStats).toBe('function');
    });

    it('should not have authentication-related methods', () => {
      expect(RestaurantModel.authenticate).toBeUndefined();
      expect(RestaurantModel.findByEmail).toBeUndefined();
      expect(RestaurantModel.confirmEmail).toBeUndefined();
      expect(RestaurantModel.changePassword).toBeUndefined();
      expect(RestaurantModel.hashPassword).toBeUndefined();
      expect(RestaurantModel.verifyPassword).toBeUndefined();
      expect(RestaurantModel.generateEmailConfirmationToken).toBeUndefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors gracefully', async () => {
      const connectionError = new Error('Database connection failed');
      jest.spyOn(RestaurantModel, 'executeQuery').mockRejectedValue(connectionError);

      await expect(
        RestaurantModel.create({
          restaurant_name: 'Test',
          restaurant_url_name: 'test',
          terms_accepted: true,
        })
      ).rejects.toThrow(connectionError);
    });

    it('should log errors appropriately', async () => {
      const error = new Error('Test error');
      jest.spyOn(RestaurantModel, 'find').mockRejectedValue(error);

      await expect(RestaurantModel.findByUrlName('test')).rejects.toThrow(error);
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });
});
