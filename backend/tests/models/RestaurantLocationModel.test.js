const Joi = require('joi');

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

    async delete(conditions) {
      return 1;
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

    async beginTransaction() {
      return { mock: 'client' };
    }

    async commitTransaction(client) {
      return true;
    }

    async rollbackTransaction(client) {
      return true;
    }

    async executeInTransaction(client, query, params) {
      return { rows: [] };
    }
  };
});

const RestaurantLocationModel = require('../../src/models/RestaurantLocationModel');

describe('RestaurantLocationModel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Constructor and Properties', () => {
    it('should initialize with correct properties', () => {
      expect(RestaurantLocationModel.tableName).toBe('restaurant_locations');
    });

    it('should have all required schemas as getters', () => {
      expect(RestaurantLocationModel.uuidSchema).toBeDefined();
      expect(RestaurantLocationModel.operatingHoursSchema).toBeDefined();
      expect(RestaurantLocationModel.createSchema).toBeDefined();
      expect(RestaurantLocationModel.updateSchema).toBeDefined();
    });
  });

  describe('UUID Validation', () => {
    describe('validateUuid', () => {
      it('should validate a correct UUID v4', () => {
        const validUuid = '550e8400-e29b-41d4-a716-446655440000';
        const result = RestaurantLocationModel.validateUuid(validUuid);
        expect(result.isValid).toBe(true);
        expect(result.sanitizedUuid).toBe(validUuid.toLowerCase());
      });

      it('should throw error for invalid UUID', () => {
        const invalidUuid = 'invalid-uuid';
        expect(() => {
          RestaurantLocationModel.validateUuid(invalidUuid);
        }).toThrow('Invalid UUID format');
      });

      it('should handle null/undefined UUID', () => {
        expect(() => {
          RestaurantLocationModel.validateUuid(null);
        }).toThrow();

        expect(() => {
          RestaurantLocationModel.validateUuid(undefined);
        }).toThrow();
      });
    });

    describe('isValidUuid', () => {
      it('should return true for valid UUID', () => {
        const validUuid = '550e8400-e29b-41d4-a716-446655440000';
        expect(RestaurantLocationModel.isValidUuid(validUuid)).toBe(true);
      });

      it('should return false for invalid UUID', () => {
        const invalidUuid = 'invalid-uuid';
        expect(RestaurantLocationModel.isValidUuid(invalidUuid)).toBe(false);
      });

      it('should return false for null/undefined UUID', () => {
        expect(RestaurantLocationModel.isValidUuid(null)).toBe(false);
        expect(RestaurantLocationModel.isValidUuid(undefined)).toBe(false);
      });
    });
  });

  describe('Schema Validation', () => {
    describe('operatingHoursSchema', () => {
      it('should validate proper operating hours structure', () => {
        const validHours = {
          monday: { open: '09:00', close: '22:00', closed: false },
          tuesday: { open: '09:00', close: '22:00', closed: false },
        };
        const { error } = RestaurantLocationModel.operatingHoursSchema.validate(validHours);
        expect(error).toBeUndefined();
      });

      it('should reject invalid time format', () => {
        const invalidHours = {
          monday: { open: '25:00', close: '22:00', closed: false },
        };
        const { error } = RestaurantLocationModel.operatingHoursSchema.validate(invalidHours);
        expect(error).toBeDefined();
      });
    });

    describe('createSchema', () => {
      it('should validate complete location data', () => {
        const validData = {
          restaurant_id: '550e8400-e29b-41d4-a716-446655440000',
          name: 'Test Location',
          url_name: 'test-location',
          phone: '1234567890',
          address_street: 'Test Street',
          operating_hours: {
            monday: { open: '09:00', close: '22:00', closed: false },
          },
          is_primary: false,
          status: 'active',
        };
        const { error } = RestaurantLocationModel.createSchema.validate(validData);
        expect(error).toBeUndefined();
      });

      it('should require mandatory fields', () => {
        const invalidData = {
          name: 'Test Location',
          // Missing restaurant_id and url_name
        };
        const { error } = RestaurantLocationModel.createSchema.validate(invalidData);
        expect(error).toBeDefined();
      });
    });

    describe('updateSchema', () => {
      it('should validate partial update data', () => {
        const validData = {
          name: 'Updated Location',
          phone: '9876543210',
        };
        const { error } = RestaurantLocationModel.updateSchema.validate(validData);
        expect(error).toBeUndefined();
      });

      it('should reject invalid status values', () => {
        const invalidData = {
          status: 'invalid_status',
        };
        const { error } = RestaurantLocationModel.updateSchema.validate(invalidData);
        expect(error).toBeDefined();
      });
    });
  });

  describe('CRUD Operations', () => {
    const mockLocationData = {
      restaurant_id: '550e8400-e29b-41d4-a716-446655440000',
      name: 'Test Location',
      url_name: 'test-location',
      status: 'active',
      is_primary: false,
      operating_hours: {
        monday: { open: '09:00', close: '22:00', closed: false },
      },
    };

    describe('create', () => {
      it('should create location successfully', async () => {
        const mockCreatedLocation = Object.assign(
          {},
          {
            id: 1,
            created_at: new Date(),
            updated_at: new Date(),
          },
          mockLocationData
        );

        jest.spyOn(RestaurantLocationModel, 'validate').mockResolvedValue(mockLocationData);
        jest.spyOn(RestaurantLocationModel, 'checkRestaurantExists').mockResolvedValue(true);
        jest.spyOn(RestaurantLocationModel, 'findByRestaurantAndUrlName').mockResolvedValue(null);
        jest.spyOn(RestaurantLocationModel, 'executeQuery').mockResolvedValue({
          rows: [mockCreatedLocation],
        });

        const result = await RestaurantLocationModel.create(mockLocationData);

        expect(RestaurantLocationModel.validate).toHaveBeenCalledWith(
          mockLocationData,
          expect.any(Object)
        );
        expect(RestaurantLocationModel.checkRestaurantExists).toHaveBeenCalledWith(
          mockLocationData.restaurant_id
        );
        expect(result).toEqual(mockCreatedLocation);
      });

      it('should throw error when restaurant does not exist', async () => {
        jest.spyOn(RestaurantLocationModel, 'validate').mockResolvedValue(mockLocationData);
        jest.spyOn(RestaurantLocationModel, 'checkRestaurantExists').mockResolvedValue(false);

        await expect(RestaurantLocationModel.create(mockLocationData)).rejects.toThrow(
          'Restaurant not found'
        );
      });

      it('should throw error when URL name already exists', async () => {
        const existingLocation = { id: 1, url_name: 'test-location' };

        jest.spyOn(RestaurantLocationModel, 'validate').mockResolvedValue(mockLocationData);
        jest.spyOn(RestaurantLocationModel, 'checkRestaurantExists').mockResolvedValue(true);
        jest
          .spyOn(RestaurantLocationModel, 'findByRestaurantAndUrlName')
          .mockResolvedValue(existingLocation);

        await expect(RestaurantLocationModel.create(mockLocationData)).rejects.toThrow(
          'Location URL name already exists for this restaurant'
        );
      });

      it('should unset other primary locations when creating primary location', async () => {
        const primaryLocationData = Object.assign({}, mockLocationData, { is_primary: true });
        const mockCreatedLocation = Object.assign({ id: 1 }, primaryLocationData);

        jest.spyOn(RestaurantLocationModel, 'validate').mockResolvedValue(primaryLocationData);
        jest.spyOn(RestaurantLocationModel, 'checkRestaurantExists').mockResolvedValue(true);
        jest.spyOn(RestaurantLocationModel, 'findByRestaurantAndUrlName').mockResolvedValue(null);
        jest.spyOn(RestaurantLocationModel, 'unsetPrimaryLocations').mockResolvedValue();
        jest.spyOn(RestaurantLocationModel, 'executeQuery').mockResolvedValue({
          rows: [mockCreatedLocation],
        });

        const result = await RestaurantLocationModel.create(primaryLocationData);

        expect(RestaurantLocationModel.unsetPrimaryLocations).toHaveBeenCalledWith(
          primaryLocationData.restaurant_id
        );
        expect(result).toEqual(mockCreatedLocation);
      });

      it('should handle validation errors', async () => {
        jest
          .spyOn(RestaurantLocationModel, 'validate')
          .mockRejectedValue(new Error('Validation failed'));

        await expect(RestaurantLocationModel.create({})).rejects.toThrow('Validation failed');
      });
    });

    describe('update', () => {
      const mockId = 1;
      const mockUpdateData = {
        name: 'Updated Location',
        phone: '9876543210',
      };
      const mockCurrentLocation = Object.assign({}, mockLocationData, { id: mockId });

      it('should update location successfully', async () => {
        const mockUpdatedLocation = Object.assign({}, mockCurrentLocation, mockUpdateData);

        jest.spyOn(RestaurantLocationModel, 'validate').mockResolvedValue(mockUpdateData);
        jest.spyOn(RestaurantLocationModel, 'findById').mockResolvedValue(mockCurrentLocation);
        jest.spyOn(RestaurantLocationModel, 'buildSetClause').mockReturnValue({
          clause: 'name = $1, phone = $2',
          params: [mockUpdateData.name, mockUpdateData.phone],
        });
        jest.spyOn(RestaurantLocationModel, 'executeQuery').mockResolvedValue({
          rows: [mockUpdatedLocation],
        });

        const result = await RestaurantLocationModel.update(mockId, mockUpdateData);

        expect(RestaurantLocationModel.validate).toHaveBeenCalledWith(
          mockUpdateData,
          expect.any(Object)
        );
        expect(RestaurantLocationModel.findById).toHaveBeenCalledWith(mockId);
        expect(result).toEqual(mockUpdatedLocation);
      });

      it('should throw error when no valid fields to update', async () => {
        jest.spyOn(RestaurantLocationModel, 'validate').mockResolvedValue({});

        await expect(RestaurantLocationModel.update(mockId, {})).rejects.toThrow(
          'No valid fields to update'
        );
      });

      it('should throw error when location not found', async () => {
        jest.spyOn(RestaurantLocationModel, 'validate').mockResolvedValue(mockUpdateData);
        jest.spyOn(RestaurantLocationModel, 'findById').mockResolvedValue(null);

        await expect(RestaurantLocationModel.update(mockId, mockUpdateData)).rejects.toThrow(
          'Location not found'
        );
      });

      it('should handle URL name conflicts', async () => {
        const updateDataWithUrl = Object.assign({}, mockUpdateData, { url_name: 'existing-url' });
        const conflictingLocation = { id: 2, url_name: 'existing-url' };

        jest.spyOn(RestaurantLocationModel, 'validate').mockResolvedValue(updateDataWithUrl);
        jest.spyOn(RestaurantLocationModel, 'findById').mockResolvedValue(mockCurrentLocation);
        jest
          .spyOn(RestaurantLocationModel, 'findByRestaurantAndUrlName')
          .mockResolvedValue(conflictingLocation);

        await expect(RestaurantLocationModel.update(mockId, updateDataWithUrl)).rejects.toThrow(
          'Location URL name already exists for this restaurant'
        );
      });

      it('should handle setting location as primary', async () => {
        const primaryUpdateData = Object.assign({}, mockUpdateData, { is_primary: true });
        const mockUpdatedLocation = Object.assign({}, mockCurrentLocation, primaryUpdateData);

        jest.spyOn(RestaurantLocationModel, 'validate').mockResolvedValue(primaryUpdateData);
        jest.spyOn(RestaurantLocationModel, 'findById').mockResolvedValue(mockCurrentLocation);
        jest.spyOn(RestaurantLocationModel, 'unsetPrimaryLocations').mockResolvedValue();
        jest.spyOn(RestaurantLocationModel, 'buildSetClause').mockReturnValue({
          clause: 'is_primary = $1',
          params: [true],
        });
        jest.spyOn(RestaurantLocationModel, 'executeQuery').mockResolvedValue({
          rows: [mockUpdatedLocation],
        });

        const result = await RestaurantLocationModel.update(mockId, primaryUpdateData);

        expect(RestaurantLocationModel.unsetPrimaryLocations).toHaveBeenCalledWith(
          mockCurrentLocation.restaurant_id,
          mockId
        );
        expect(result).toEqual(mockUpdatedLocation);
      });

      it('should handle operating hours JSON conversion', async () => {
        const updateDataWithHours = {
          operating_hours: {
            monday: { open: '10:00', close: '23:00' },
          },
        };

        jest.spyOn(RestaurantLocationModel, 'validate').mockResolvedValue(updateDataWithHours);
        jest.spyOn(RestaurantLocationModel, 'findById').mockResolvedValue(mockCurrentLocation);
        jest.spyOn(RestaurantLocationModel, 'buildSetClause').mockImplementation((data) => {
          expect(typeof data.operating_hours).toBe('string');
          expect(data.operating_hours).toBe(JSON.stringify(updateDataWithHours.operating_hours));
          return {
            clause: 'operating_hours = $1',
            params: [data.operating_hours],
          };
        });
        jest.spyOn(RestaurantLocationModel, 'executeQuery').mockResolvedValue({
          rows: [mockCurrentLocation],
        });

        await RestaurantLocationModel.update(mockId, updateDataWithHours);
      });
    });
  });

  describe('Query Methods', () => {
    const mockRestaurantId = '550e8400-e29b-41d4-a716-446655440000';
    const mockUrlName = 'test-location';
    const mockLocations = [
      { id: 1, restaurant_id: mockRestaurantId, url_name: mockUrlName },
      { id: 2, restaurant_id: mockRestaurantId, url_name: 'other-location' },
    ];

    describe('getByRestaurantId', () => {
      it('should get locations by restaurant ID', async () => {
        jest.spyOn(RestaurantLocationModel, 'isValidUuid').mockReturnValue(true);
        jest.spyOn(RestaurantLocationModel, 'find').mockResolvedValue(mockLocations);

        const result = await RestaurantLocationModel.getByRestaurantId(mockRestaurantId);

        expect(RestaurantLocationModel.find).toHaveBeenCalledWith(
          { restaurant_id: mockRestaurantId.toLowerCase() },
          { orderBy: 'is_primary DESC, created_at ASC' }
        );
        expect(result).toEqual(mockLocations);
      });

      it('should filter by status when provided', async () => {
        const status = 'active';
        jest.spyOn(RestaurantLocationModel, 'isValidUuid').mockReturnValue(true);
        jest.spyOn(RestaurantLocationModel, 'find').mockResolvedValue(mockLocations);

        await RestaurantLocationModel.getByRestaurantId(mockRestaurantId, { status });

        expect(RestaurantLocationModel.find).toHaveBeenCalledWith(
          { restaurant_id: mockRestaurantId.toLowerCase(), status },
          { orderBy: 'is_primary DESC, created_at ASC' }
        );
      });

      it('should throw error for invalid restaurant ID', async () => {
        jest.spyOn(RestaurantLocationModel, 'isValidUuid').mockReturnValue(false);

        await expect(RestaurantLocationModel.getByRestaurantId('invalid-id')).rejects.toThrow(
          'Invalid restaurant ID format. Must be a valid UUID.'
        );
      });
    });

    describe('findByRestaurantAndUrlName', () => {
      it('should find location by restaurant ID and URL name', async () => {
        const expectedLocation = mockLocations[0];
        jest.spyOn(RestaurantLocationModel, 'isValidUuid').mockReturnValue(true);
        jest.spyOn(RestaurantLocationModel, 'find').mockResolvedValue([expectedLocation]);

        const result = await RestaurantLocationModel.findByRestaurantAndUrlName(
          mockRestaurantId,
          mockUrlName
        );

        expect(RestaurantLocationModel.find).toHaveBeenCalledWith({
          restaurant_id: mockRestaurantId.toLowerCase(),
          url_name: mockUrlName.toLowerCase(),
        });
        expect(result).toEqual(expectedLocation);
      });

      it('should return null when location not found', async () => {
        jest.spyOn(RestaurantLocationModel, 'isValidUuid').mockReturnValue(true);
        jest.spyOn(RestaurantLocationModel, 'find').mockResolvedValue([]);

        const result = await RestaurantLocationModel.findByRestaurantAndUrlName(
          mockRestaurantId,
          mockUrlName
        );

        expect(result).toBeNull();
      });

      it('should throw error for invalid restaurant ID', async () => {
        jest.spyOn(RestaurantLocationModel, 'isValidUuid').mockReturnValue(false);

        await expect(
          RestaurantLocationModel.findByRestaurantAndUrlName('invalid-id', mockUrlName)
        ).rejects.toThrow('Invalid restaurant ID format. Must be a valid UUID.');
      });
    });

    describe('getPrimaryLocation', () => {
      it('should get primary location for restaurant', async () => {
        const primaryLocation = Object.assign({}, mockLocations[0], { is_primary: true });
        jest.spyOn(RestaurantLocationModel, 'find').mockResolvedValue([primaryLocation]);

        const result = await RestaurantLocationModel.getPrimaryLocation(mockRestaurantId);

        expect(RestaurantLocationModel.find).toHaveBeenCalledWith({
          restaurant_id: mockRestaurantId,
          is_primary: true,
          status: 'active',
        });
        expect(result).toEqual(primaryLocation);
      });

      it('should return null when no primary location found', async () => {
        jest.spyOn(RestaurantLocationModel, 'find').mockResolvedValue([]);

        const result = await RestaurantLocationModel.getPrimaryLocation(mockRestaurantId);

        expect(result).toBeNull();
      });
    });
  });

  describe('Primary Location Management', () => {
    const mockRestaurantId = '550e8400-e29b-41d4-a716-446655440000';
    const mockLocationId = 1;

    describe('setPrimary', () => {
      it('should set location as primary successfully', async () => {
        const mockLocation = { id: mockLocationId, restaurant_id: mockRestaurantId };
        const mockUpdatedLocation = Object.assign({}, mockLocation, { is_primary: true });

        jest.spyOn(RestaurantLocationModel, 'findById').mockResolvedValue(mockLocation);
        jest
          .spyOn(RestaurantLocationModel, 'beginTransaction')
          .mockResolvedValue({ mock: 'client' });
        jest.spyOn(RestaurantLocationModel, 'unsetPrimaryLocations').mockResolvedValue();
        jest.spyOn(RestaurantLocationModel, 'executeInTransaction').mockResolvedValue({
          rows: [mockUpdatedLocation],
        });
        jest.spyOn(RestaurantLocationModel, 'commitTransaction').mockResolvedValue();

        const result = await RestaurantLocationModel.setPrimary(mockLocationId);

        expect(RestaurantLocationModel.unsetPrimaryLocations).toHaveBeenCalledWith(
          mockLocation.restaurant_id,
          mockLocationId
        );
        expect(result).toEqual(mockUpdatedLocation);
      });

      it('should throw error when location not found', async () => {
        jest.spyOn(RestaurantLocationModel, 'findById').mockResolvedValue(null);

        await expect(RestaurantLocationModel.setPrimary(mockLocationId)).rejects.toThrow(
          'Location not found'
        );
      });

      it('should rollback transaction on error', async () => {
        const mockLocation = { id: mockLocationId, restaurant_id: mockRestaurantId };
        const mockClient = { mock: 'client' };

        jest.spyOn(RestaurantLocationModel, 'findById').mockResolvedValue(mockLocation);
        jest.spyOn(RestaurantLocationModel, 'beginTransaction').mockResolvedValue(mockClient);
        jest
          .spyOn(RestaurantLocationModel, 'unsetPrimaryLocations')
          .mockRejectedValue(new Error('DB Error'));
        jest.spyOn(RestaurantLocationModel, 'rollbackTransaction').mockResolvedValue();

        await expect(RestaurantLocationModel.setPrimary(mockLocationId)).rejects.toThrow(
          'DB Error'
        );
        expect(RestaurantLocationModel.rollbackTransaction).toHaveBeenCalledWith(mockClient);
      });
    });
  });

  describe('Deletion', () => {
    const mockLocationId = 1;
    const mockRestaurantId = '550e8400-e29b-41d4-a716-446655440000';

    describe('deleteLocation', () => {
      it('should delete location successfully', async () => {
        const mockLocation = {
          id: mockLocationId,
          restaurant_id: mockRestaurantId,
          is_primary: false,
        };

        jest.spyOn(RestaurantLocationModel, 'findById').mockResolvedValue(mockLocation);
        jest.spyOn(RestaurantLocationModel, 'count').mockResolvedValue(2); // More than 1 location
        jest.spyOn(RestaurantLocationModel, 'delete').mockResolvedValue(1);

        const result = await RestaurantLocationModel.deleteLocation(mockLocationId);

        expect(RestaurantLocationModel.delete).toHaveBeenCalledWith({ id: mockLocationId });
        expect(result).toBe(true);
      });

      it('should throw error when location not found', async () => {
        jest.spyOn(RestaurantLocationModel, 'findById').mockResolvedValue(null);

        await expect(RestaurantLocationModel.deleteLocation(mockLocationId)).rejects.toThrow(
          'Location not found'
        );
      });

      it('should throw error when trying to delete only location', async () => {
        const mockLocation = { id: mockLocationId, restaurant_id: mockRestaurantId };

        jest.spyOn(RestaurantLocationModel, 'findById').mockResolvedValue(mockLocation);
        jest.spyOn(RestaurantLocationModel, 'count').mockResolvedValue(1); // Only 1 location

        await expect(RestaurantLocationModel.deleteLocation(mockLocationId)).rejects.toThrow(
          'Cannot delete the only location of a restaurant'
        );
      });

      it('should set another location as primary when deleting primary location', async () => {
        const mockPrimaryLocation = {
          id: mockLocationId,
          restaurant_id: mockRestaurantId,
          is_primary: true,
        };
        const mockOtherLocation = { id: 2, restaurant_id: mockRestaurantId, is_primary: false };

        jest.spyOn(RestaurantLocationModel, 'findById').mockResolvedValue(mockPrimaryLocation);
        jest.spyOn(RestaurantLocationModel, 'count').mockResolvedValue(2);
        jest.spyOn(RestaurantLocationModel, 'find').mockResolvedValue([mockOtherLocation]);
        jest
          .spyOn(RestaurantLocationModel, 'executeQuery')
          .mockResolvedValue({ rows: [mockOtherLocation] });
        jest.spyOn(RestaurantLocationModel, 'delete').mockResolvedValue(1);

        const result = await RestaurantLocationModel.deleteLocation(mockLocationId);

        expect(RestaurantLocationModel.executeQuery).toHaveBeenCalledWith(
          'UPDATE restaurant_locations SET is_primary = true WHERE id = $1 RETURNING *',
          [mockOtherLocation.id]
        );
        expect(result).toBe(true);
      });
    });
  });

  describe('Utility Methods', () => {
    const mockRestaurantId = '550e8400-e29b-41d4-a716-446655440000';

    describe('checkRestaurantExists', () => {
      it('should return true when restaurant exists', async () => {
        jest.spyOn(RestaurantLocationModel, 'executeQuery').mockResolvedValue({
          rows: [{ exists: true }],
        });

        const result = await RestaurantLocationModel.checkRestaurantExists(mockRestaurantId);

        expect(RestaurantLocationModel.executeQuery).toHaveBeenCalledWith(
          'SELECT 1 FROM restaurants WHERE id = $1',
          [mockRestaurantId]
        );
        expect(result).toBe(true);
      });

      it('should return false when restaurant does not exist', async () => {
        jest.spyOn(RestaurantLocationModel, 'executeQuery').mockResolvedValue({
          rows: [],
        });

        const result = await RestaurantLocationModel.checkRestaurantExists(mockRestaurantId);

        expect(result).toBe(false);
      });
    });

    describe('unsetPrimaryLocations', () => {
      it('should unset primary locations without exclude ID', async () => {
        jest.spyOn(RestaurantLocationModel, 'executeQuery').mockResolvedValue({ rows: [] });

        await RestaurantLocationModel.unsetPrimaryLocations(mockRestaurantId);

        expect(RestaurantLocationModel.executeQuery).toHaveBeenCalledWith(
          expect.stringContaining(
            'UPDATE restaurant_locations SET is_primary = false WHERE restaurant_id = $1'
          ),
          [mockRestaurantId]
        );
      });

      it('should unset primary locations with exclude ID', async () => {
        const excludeId = 1;
        jest.spyOn(RestaurantLocationModel, 'executeQuery').mockResolvedValue({ rows: [] });

        await RestaurantLocationModel.unsetPrimaryLocations(mockRestaurantId, excludeId);

        expect(RestaurantLocationModel.executeQuery).toHaveBeenCalledWith(
          expect.stringContaining('AND id != $2'),
          [mockRestaurantId, excludeId]
        );
      });
    });

    describe('getLocationStats', () => {
      it('should return location statistics', async () => {
        const mockStats = {
          total: 5,
          active: 4,
          inactive: 1,
        };

        jest.spyOn(RestaurantLocationModel, 'executeQuery').mockResolvedValue({
          rows: [mockStats],
        });

        const result = await RestaurantLocationModel.getLocationStats(mockRestaurantId);

        expect(result).toEqual(mockStats);
      });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle database errors in create', async () => {
      const mockLocationData = {
        restaurant_id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Test Location',
        url_name: 'test-location',
      };

      jest.spyOn(RestaurantLocationModel, 'validate').mockResolvedValue(mockLocationData);
      jest.spyOn(RestaurantLocationModel, 'checkRestaurantExists').mockResolvedValue(true);
      jest.spyOn(RestaurantLocationModel, 'findByRestaurantAndUrlName').mockResolvedValue(null);
      jest
        .spyOn(RestaurantLocationModel, 'executeQuery')
        .mockRejectedValue(new Error('Database error'));

      await expect(RestaurantLocationModel.create(mockLocationData)).rejects.toThrow(
        'Database error'
      );
    });

    it('should handle validation errors in update', async () => {
      jest
        .spyOn(RestaurantLocationModel, 'validate')
        .mockRejectedValue(new Error('Validation error'));

      await expect(RestaurantLocationModel.update(1, {})).rejects.toThrow('Validation error');
    });

    it('should handle case sensitivity in URL names', async () => {
      const mockRestaurantId = '550e8400-e29b-41d4-a716-446655440000';
      const upperCaseUrlName = 'TEST-LOCATION';

      jest.spyOn(RestaurantLocationModel, 'isValidUuid').mockReturnValue(true);
      jest.spyOn(RestaurantLocationModel, 'find').mockResolvedValue([]);

      await RestaurantLocationModel.findByRestaurantAndUrlName(mockRestaurantId, upperCaseUrlName);

      expect(RestaurantLocationModel.find).toHaveBeenCalledWith({
        restaurant_id: mockRestaurantId.toLowerCase(),
        url_name: upperCaseUrlName.toLowerCase(),
      });
    });
  });

  describe('Method Existence', () => {
    it('should have all required methods', () => {
      const requiredMethods = [
        'create',
        'update',
        'deleteLocation',
        'getByRestaurantId',
        'findByRestaurantAndUrlName',
        'getPrimaryLocation',
        'setPrimary',
        'checkRestaurantExists',
        'unsetPrimaryLocations',
        'getLocationStats',
        'validateUuid',
        'isValidUuid',
      ];

      requiredMethods.forEach((method) => {
        expect(typeof RestaurantLocationModel[method]).toBe('function');
      });
    });

    it('should have all required properties', () => {
      expect(RestaurantLocationModel.tableName).toBeDefined();
      expect(RestaurantLocationModel.uuidSchema).toBeDefined();
      expect(RestaurantLocationModel.operatingHoursSchema).toBeDefined();
      expect(RestaurantLocationModel.createSchema).toBeDefined();
      expect(RestaurantLocationModel.updateSchema).toBeDefined();
    });
  });
});
