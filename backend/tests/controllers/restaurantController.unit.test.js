/**
 * Enhanced Unit Tests for RestaurantController
 *
 * These tests focus on testing the controller logic in isolation with mocked dependencies.
 * They verify business logic, error handling, request/response processing, and logging.
 */

// Mock the RestaurantModel BEFORE requiring the controller
const mockRestaurantModel = {
  create: jest.fn(),
  getRestaurants: jest.fn(),
  findById: jest.fn(),
  findByUrlName: jest.fn(),
  update: jest.fn(),
  deleteRestaurant: jest.fn(),
  getRestaurantStats: jest.fn(),
  isUrlNameAvailable: jest.fn(),
};

jest.mock('../../src/models/RestaurantModel', () => mockRestaurantModel);

// Mock ResponseFormatter with more comprehensive implementation
const mockResponseFormatter = {
  success: jest.fn((data, message, meta) => ({ success: true, data, message, meta })),
  error: jest.fn((message, statusCode, details) => ({
    success: false,
    error: { message, statusCode, details },
  })),
};

jest.mock('../../src/utils/responseFormatter', () => mockResponseFormatter);

// Now require the dependencies
const RestaurantController = require('../../src/controllers/restaurantController');

describe('RestaurantController Unit Tests', () => {
  let controller;
  let mockRequest;
  let mockResponse;
  let mockNext;
  let mockLogger;

  // Test data factory for consistent test data
  const createMockRestaurantData = (overrides = {}) => ({
    restaurant_name: 'Test Restaurant',
    restaurant_url_name: 'test-restaurant',
    cuisine_type: 'Italian',
    description: 'A wonderful test restaurant',
    business_type: 'single',
    phone: '+1234567890',
    email: 'test@restaurant.com',
    website: 'https://test-restaurant.com',
    terms_accepted: true,
    marketing_consent: false,
    subscription_plan: 'basic',
    ...overrides,
  });

  const createMockPaginatedResponse = (data = [], overrides = {}) => ({
    restaurants: data,
    pagination: {
      page: 1,
      limit: 10,
      total: data.length,
      totalPages: Math.ceil(data.length / 10),
      ...overrides,
    },
  });

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();

    // Create comprehensive mock logger
    mockLogger = {
      child: jest.fn().mockReturnValue({
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        debug: jest.fn(),
      }),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    };

    // Create controller instance with injected logger
    controller = new RestaurantController(mockLogger);

    // Enhanced mock request object with more realistic structure
    mockRequest = {
      body: {},
      params: {},
      query: {},
      headers: {
        'x-request-id': undefined,
        'user-agent': 'test-agent/1.0',
        'content-type': 'application/json',
      },
      user: {
        id: 'test-user-id',
        role: 'restaurant_administrator',
        email: 'admin@test.com',
      },
      ip: '127.0.0.1',
      method: 'POST',
      path: '/api/v1/restaurants',
    };

    // Enhanced mock response object with spy functions
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      locals: {},
    };

    // Mock next function with error tracking
    mockNext = jest.fn();
  });

  describe('createRestaurant', () => {
    beforeEach(() => {
      mockRequest.method = 'POST';
      mockRequest.path = '/api/v1/restaurants';
    });

    describe('Successful Creation', () => {
      it('should create a new restaurant successfully with complete data', async () => {
        const restaurantData = createMockRestaurantData();
        const createdRestaurant = {
          id: 'restaurant-id-123',
          ...restaurantData,
          status: 'pending',
          subscription_status: 'active',
          created_at: '2024-01-01T00:00:00.000Z',
          updated_at: '2024-01-01T00:00:00.000Z',
        };

        mockRequest.body = restaurantData;
        mockRestaurantModel.isUrlNameAvailable.mockResolvedValue(true);
        mockRestaurantModel.create.mockResolvedValue(createdRestaurant);
        mockResponseFormatter.success.mockReturnValue({
          success: true,
          data: createdRestaurant,
          message: 'Restaurant created successfully',
        });

        await controller.createRestaurant(mockRequest, mockResponse, mockNext);

        // Verify business logic flow
        expect(mockRestaurantModel.isUrlNameAvailable).toHaveBeenCalledWith(
          restaurantData.restaurant_url_name
        );
        expect(mockRestaurantModel.isUrlNameAvailable).toHaveBeenCalledTimes(1);

        expect(mockRestaurantModel.create).toHaveBeenCalledWith(restaurantData);
        expect(mockRestaurantModel.create).toHaveBeenCalledTimes(1);

        // Verify response formatting
        expect(mockResponseFormatter.success).toHaveBeenCalledWith(
          createdRestaurant,
          'Restaurant created successfully'
        );

        // Verify HTTP response
        expect(mockResponse.status).toHaveBeenCalledWith(201);
        expect(mockResponse.json).toHaveBeenCalledWith({
          success: true,
          data: createdRestaurant,
          message: 'Restaurant created successfully',
        });

        // Verify no errors were passed to next middleware
        expect(mockNext).not.toHaveBeenCalled();

        // Verify logging
        expect(mockLogger.child).toHaveBeenCalledWith({
          method: 'createRestaurant',
          requestId: expect.any(String),
          userId: 'test-user-id',
        });
      });

      it('should create restaurant with minimal required data', async () => {
        const minimalData = {
          restaurant_name: 'Minimal Restaurant',
          restaurant_url_name: 'minimal-restaurant',
          terms_accepted: true,
        };

        const createdRestaurant = {
          id: 'restaurant-id-456',
          ...minimalData,
          status: 'pending',
          subscription_status: 'active',
          created_at: '2024-01-01T00:00:00.000Z',
        };

        mockRequest.body = minimalData;
        mockRestaurantModel.isUrlNameAvailable.mockResolvedValue(true);
        mockRestaurantModel.create.mockResolvedValue(createdRestaurant);

        await controller.createRestaurant(mockRequest, mockResponse, mockNext);

        expect(mockRestaurantModel.create).toHaveBeenCalledWith(minimalData);
        expect(mockResponse.status).toHaveBeenCalledWith(201);
        expect(mockNext).not.toHaveBeenCalled();
      });
    });

    describe('Validation and Business Logic Errors', () => {
      it('should return 409 when URL name is already taken', async () => {
        const restaurantData = createMockRestaurantData();

        mockRequest.body = restaurantData;
        mockRestaurantModel.isUrlNameAvailable.mockResolvedValue(false);
        mockResponseFormatter.error.mockReturnValue({
          success: false,
          error: { message: 'URL name is already taken', statusCode: 409 },
        });

        await controller.createRestaurant(mockRequest, mockResponse, mockNext);

        expect(mockRestaurantModel.isUrlNameAvailable).toHaveBeenCalledWith(
          restaurantData.restaurant_url_name
        );
        expect(mockRestaurantModel.create).not.toHaveBeenCalled();

        expect(mockResponseFormatter.error).toHaveBeenCalledWith('URL name is already taken', 409, {
          field: 'restaurant_url_name',
        });
        expect(mockResponse.status).toHaveBeenCalledWith(409);
        expect(mockNext).not.toHaveBeenCalled();
      });

      it('should handle missing URL name gracefully', async () => {
        const restaurantData = { ...createMockRestaurantData(), restaurant_url_name: undefined };

        mockRequest.body = restaurantData;

        await controller.createRestaurant(mockRequest, mockResponse, mockNext);

        expect(mockRestaurantModel.isUrlNameAvailable).toHaveBeenCalledWith(undefined);
        expect(mockNext).not.toHaveBeenCalled();
      });
    });

    describe('Database and System Errors', () => {
      it('should handle database errors gracefully during URL availability check', async () => {
        const restaurantData = createMockRestaurantData();
        const dbError = new Error('Database connection failed');

        mockRequest.body = restaurantData;
        mockRestaurantModel.isUrlNameAvailable.mockRejectedValue(dbError);

        await controller.createRestaurant(mockRequest, mockResponse, mockNext);

        expect(mockNext).toHaveBeenCalledWith(dbError);
        expect(mockRestaurantModel.create).not.toHaveBeenCalled();
        expect(mockResponse.status).not.toHaveBeenCalled();
      });

      it('should handle database errors gracefully during creation', async () => {
        const restaurantData = createMockRestaurantData();
        const dbError = new Error('Failed to insert restaurant');

        mockRequest.body = restaurantData;
        mockRestaurantModel.isUrlNameAvailable.mockResolvedValue(true);
        mockRestaurantModel.create.mockRejectedValue(dbError);

        await controller.createRestaurant(mockRequest, mockResponse, mockNext);

        expect(mockNext).toHaveBeenCalledWith(dbError);
        expect(mockResponse.status).not.toHaveBeenCalled();
      });

      it('should handle unexpected errors gracefully', async () => {
        const restaurantData = createMockRestaurantData();
        const unexpectedError = new TypeError('Unexpected error occurred');

        mockRequest.body = restaurantData;
        mockRestaurantModel.isUrlNameAvailable.mockImplementation(() => {
          throw unexpectedError;
        });

        await controller.createRestaurant(mockRequest, mockResponse, mockNext);

        expect(mockNext).toHaveBeenCalledWith(unexpectedError);
      });
    });

    describe('Logging and Request Tracking', () => {
      it('should use provided request ID for logging', async () => {
        const restaurantData = createMockRestaurantData();
        const requestId = 'custom-request-123';

        mockRequest.body = restaurantData;
        mockRequest.headers['x-request-id'] = requestId;
        mockRestaurantModel.isUrlNameAvailable.mockResolvedValue(true);
        mockRestaurantModel.create.mockResolvedValue({ id: '123', ...restaurantData });

        await controller.createRestaurant(mockRequest, mockResponse, mockNext);

        expect(mockLogger.child).toHaveBeenCalledWith({
          method: 'createRestaurant',
          requestId: requestId,
          userId: 'test-user-id',
        });
      });

      it('should generate request ID when not provided', async () => {
        const restaurantData = createMockRestaurantData();

        mockRequest.body = restaurantData;
        delete mockRequest.headers['x-request-id'];
        mockRestaurantModel.isUrlNameAvailable.mockResolvedValue(true);
        mockRestaurantModel.create.mockResolvedValue({ id: '123', ...restaurantData });

        await controller.createRestaurant(mockRequest, mockResponse, mockNext);

        expect(mockLogger.child).toHaveBeenCalledWith({
          method: 'createRestaurant',
          requestId: expect.stringMatching(/^req_\d+$/),
          userId: 'test-user-id',
        });
      });
    });
  });

  describe('getRestaurants', () => {
    beforeEach(() => {
      mockRequest.method = 'GET';
      mockRequest.path = '/api/v1/restaurants';
    });

    describe('Successful Retrieval', () => {
      it('should retrieve restaurants with default pagination', async () => {
        const mockRestaurants = [
          { id: '1', restaurant_name: 'Restaurant 1', cuisine_type: 'Italian' },
          { id: '2', restaurant_name: 'Restaurant 2', cuisine_type: 'Mexican' },
        ];
        const mockResult = createMockPaginatedResponse(mockRestaurants);

        mockRequest.query = {};
        mockRestaurantModel.getRestaurants.mockResolvedValue(mockResult);
        mockResponseFormatter.success.mockReturnValue({
          success: true,
          data: mockRestaurants,
          meta: { pagination: mockResult.pagination, filters: {} },
        });

        await controller.getRestaurants(mockRequest, mockResponse, mockNext);

        expect(mockRestaurantModel.getRestaurants).toHaveBeenCalledWith(
          {},
          { page: 1, limit: 10, sortBy: 'created_at', sortOrder: 'DESC' }
        );
        expect(mockResponseFormatter.success).toHaveBeenCalledWith(
          mockRestaurants,
          'Restaurants retrieved successfully',
          { pagination: mockResult.pagination, filters: {} }
        );
        expect(mockResponse.status).toHaveBeenCalledWith(200);
        expect(mockNext).not.toHaveBeenCalled();
      });

      it('should handle filters and pagination parameters correctly', async () => {
        const mockRestaurants = [
          { id: '1', restaurant_name: 'Italian Restaurant', cuisine_type: 'Italian' },
        ];
        const mockResult = createMockPaginatedResponse(mockRestaurants, {
          page: 2,
          limit: 5,
          total: 1,
          totalPages: 1,
        });

        mockRequest.query = {
          page: '2',
          limit: '5',
          search: 'Italian',
          cuisine_type: 'Italian',
          status: 'active',
          sortBy: 'restaurant_name',
          sortOrder: 'ASC',
        };

        mockRestaurantModel.getRestaurants.mockResolvedValue(mockResult);

        await controller.getRestaurants(mockRequest, mockResponse, mockNext);

        expect(mockRestaurantModel.getRestaurants).toHaveBeenCalledWith(
          {
            search: 'Italian',
            cuisine_type: 'Italian',
            status: 'active',
          },
          {
            page: 2,
            limit: 5,
            sortBy: 'restaurant_name',
            sortOrder: 'ASC',
          }
        );
        expect(mockResponse.status).toHaveBeenCalledWith(200);
        expect(mockNext).not.toHaveBeenCalled();
      });

      it('should handle empty results gracefully', async () => {
        const mockResult = createMockPaginatedResponse([]);

        mockRequest.query = {};
        mockRestaurantModel.getRestaurants.mockResolvedValue(mockResult);

        await controller.getRestaurants(mockRequest, mockResponse, mockNext);

        expect(mockRestaurantModel.getRestaurants).toHaveBeenCalled();
        expect(mockResponse.status).toHaveBeenCalledWith(200);
        expect(mockNext).not.toHaveBeenCalled();
      });
    });

    describe('Error Handling', () => {
      it('should handle database errors gracefully', async () => {
        const dbError = new Error('Database connection failed');

        mockRequest.query = {};
        mockRestaurantModel.getRestaurants.mockRejectedValue(dbError);

        await controller.getRestaurants(mockRequest, mockResponse, mockNext);

        expect(mockNext).toHaveBeenCalledWith(dbError);
        expect(mockResponse.status).not.toHaveBeenCalled();
      });

      it('should handle invalid pagination parameters gracefully', async () => {
        const mockResult = createMockPaginatedResponse([]);

        mockRequest.query = {
          page: 'invalid',
          limit: 'invalid',
        };
        mockRestaurantModel.getRestaurants.mockResolvedValue(mockResult);

        await controller.getRestaurants(mockRequest, mockResponse, mockNext);

        // Should fall back to default values
        expect(mockRestaurantModel.getRestaurants).toHaveBeenCalledWith(
          {},
          { page: 1, limit: 10, sortBy: 'created_at', sortOrder: 'DESC' }
        );
        expect(mockNext).not.toHaveBeenCalled();
      });
    });
  });

  describe('getRestaurantById', () => {
    const validRestaurantId = '550e8400-e29b-41d4-a716-446655440000';

    beforeEach(() => {
      mockRequest.method = 'GET';
      mockRequest.path = `/api/v1/restaurants/${validRestaurantId}`;
    });

    describe('Successful Retrieval', () => {
      it('should retrieve a restaurant by valid ID', async () => {
        const mockRestaurant = {
          id: validRestaurantId,
          restaurant_name: 'Test Restaurant',
          cuisine_type: 'Italian',
          status: 'active',
        };

        mockRequest.params = { id: validRestaurantId };
        mockRestaurantModel.findById.mockResolvedValue(mockRestaurant);
        mockResponseFormatter.success.mockReturnValue({
          success: true,
          data: mockRestaurant,
          message: 'Restaurant retrieved successfully',
        });

        await controller.getRestaurantById(mockRequest, mockResponse, mockNext);

        expect(mockRestaurantModel.findById).toHaveBeenCalledWith(validRestaurantId);
        expect(mockRestaurantModel.findById).toHaveBeenCalledTimes(1);

        expect(mockResponseFormatter.success).toHaveBeenCalledWith(
          mockRestaurant,
          'Restaurant retrieved successfully'
        );
        expect(mockResponse.status).toHaveBeenCalledWith(200);
        expect(mockNext).not.toHaveBeenCalled();
      });
    });

    describe('Error Handling', () => {
      it('should return 404 for non-existent restaurant', async () => {
        const nonExistentId = '550e8400-e29b-41d4-a716-446655440001';

        mockRequest.params = { id: nonExistentId };
        mockRestaurantModel.findById.mockResolvedValue(null);
        mockResponseFormatter.error.mockReturnValue({
          success: false,
          error: { message: 'Restaurant not found', statusCode: 404 },
        });

        await controller.getRestaurantById(mockRequest, mockResponse, mockNext);

        expect(mockRestaurantModel.findById).toHaveBeenCalledWith(nonExistentId);
        expect(mockResponseFormatter.error).toHaveBeenCalledWith('Restaurant not found', 404);
        expect(mockResponse.status).toHaveBeenCalledWith(404);
        expect(mockNext).not.toHaveBeenCalled();
      });

      it('should handle database errors gracefully', async () => {
        const dbError = new Error('Database connection failed');

        mockRequest.params = { id: validRestaurantId };
        mockRestaurantModel.findById.mockRejectedValue(dbError);

        await controller.getRestaurantById(mockRequest, mockResponse, mockNext);

        expect(mockNext).toHaveBeenCalledWith(dbError);
        expect(mockResponse.status).not.toHaveBeenCalled();
      });
    });
  });

  describe('getRestaurantByUrlName', () => {
    const testUrlName = 'test-restaurant';

    beforeEach(() => {
      mockRequest.method = 'GET';
      mockRequest.path = `/api/v1/restaurants/by-url/${testUrlName}`;
    });

    describe('Successful Retrieval', () => {
      it('should retrieve a restaurant by valid URL name', async () => {
        const mockRestaurant = {
          id: 'restaurant-123',
          restaurant_name: 'Test Restaurant',
          restaurant_url_name: testUrlName,
          cuisine_type: 'Italian',
        };

        mockRequest.params = { urlName: testUrlName };
        mockRestaurantModel.findByUrlName.mockResolvedValue(mockRestaurant);

        await controller.getRestaurantByUrlName(mockRequest, mockResponse, mockNext);

        expect(mockRestaurantModel.findByUrlName).toHaveBeenCalledWith(testUrlName);
        expect(mockResponse.status).toHaveBeenCalledWith(200);
        expect(mockNext).not.toHaveBeenCalled();
      });
    });

    describe('Error Handling', () => {
      it('should return 404 for non-existent URL name', async () => {
        const nonExistentUrl = 'non-existent-restaurant';

        mockRequest.params = { urlName: nonExistentUrl };
        mockRestaurantModel.findByUrlName.mockResolvedValue(null);

        await controller.getRestaurantByUrlName(mockRequest, mockResponse, mockNext);

        expect(mockRestaurantModel.findByUrlName).toHaveBeenCalledWith(nonExistentUrl);
        expect(mockResponse.status).toHaveBeenCalledWith(404);
        expect(mockNext).not.toHaveBeenCalled();
      });
    });
  });

  describe('updateRestaurant', () => {
    const validRestaurantId = '550e8400-e29b-41d4-a716-446655440000';

    beforeEach(() => {
      mockRequest.method = 'PUT';
      mockRequest.path = `/api/v1/restaurants/${validRestaurantId}`;
    });

    describe('Successful Updates', () => {
      it('should update a restaurant successfully', async () => {
        const existingRestaurant = {
          id: validRestaurantId,
          restaurant_name: 'Old Name',
          restaurant_url_name: 'old-url',
          cuisine_type: 'Italian',
        };

        const updateData = {
          restaurant_name: 'New Name',
          description: 'Updated description',
        };

        const updatedRestaurant = {
          ...existingRestaurant,
          ...updateData,
          updated_at: '2024-01-01T12:00:00.000Z',
        };

        mockRequest.params = { id: validRestaurantId };
        mockRequest.body = updateData;
        mockRestaurantModel.findById.mockResolvedValue(existingRestaurant);
        mockRestaurantModel.update.mockResolvedValue(updatedRestaurant);

        await controller.updateRestaurant(mockRequest, mockResponse, mockNext);

        expect(mockRestaurantModel.findById).toHaveBeenCalledWith(validRestaurantId);
        expect(mockRestaurantModel.update).toHaveBeenCalledWith(validRestaurantId, updateData);
        expect(mockResponse.status).toHaveBeenCalledWith(200);
        expect(mockNext).not.toHaveBeenCalled();
      });

      it('should check URL name availability when updating URL', async () => {
        const existingRestaurant = {
          id: validRestaurantId,
          restaurant_name: 'Test Restaurant',
          restaurant_url_name: 'old-url',
        };

        const updateData = {
          restaurant_url_name: 'new-unique-url',
        };

        mockRequest.params = { id: validRestaurantId };
        mockRequest.body = updateData;
        mockRestaurantModel.findById.mockResolvedValue(existingRestaurant);
        mockRestaurantModel.isUrlNameAvailable.mockResolvedValue(true);
        mockRestaurantModel.update.mockResolvedValue({ ...existingRestaurant, ...updateData });

        await controller.updateRestaurant(mockRequest, mockResponse, mockNext);

        expect(mockRestaurantModel.isUrlNameAvailable).toHaveBeenCalledWith(
          'new-unique-url',
          validRestaurantId
        );
        expect(mockRestaurantModel.update).toHaveBeenCalledWith(validRestaurantId, updateData);
        expect(mockResponse.status).toHaveBeenCalledWith(200);
        expect(mockNext).not.toHaveBeenCalled();
      });
    });

    describe('Error Handling', () => {
      it('should return 404 for non-existent restaurant', async () => {
        const nonExistentId = '550e8400-e29b-41d4-a716-446655440001';
        const updateData = { restaurant_name: 'New Name' };

        mockRequest.params = { id: nonExistentId };
        mockRequest.body = updateData;
        mockRestaurantModel.findById.mockResolvedValue(null);

        await controller.updateRestaurant(mockRequest, mockResponse, mockNext);

        expect(mockRestaurantModel.findById).toHaveBeenCalledWith(nonExistentId);
        expect(mockRestaurantModel.update).not.toHaveBeenCalled();
        expect(mockResponse.status).toHaveBeenCalledWith(404);
        expect(mockNext).not.toHaveBeenCalled();
      });

      it('should return 409 for duplicate URL name', async () => {
        const existingRestaurant = {
          id: validRestaurantId,
          restaurant_name: 'Test Restaurant',
          restaurant_url_name: 'old-url',
        };

        const updateData = {
          restaurant_url_name: 'conflicting-url',
        };

        mockRequest.params = { id: validRestaurantId };
        mockRequest.body = updateData;
        mockRestaurantModel.findById.mockResolvedValue(existingRestaurant);
        mockRestaurantModel.isUrlNameAvailable.mockResolvedValue(false);

        await controller.updateRestaurant(mockRequest, mockResponse, mockNext);

        expect(mockRestaurantModel.isUrlNameAvailable).toHaveBeenCalledWith(
          'conflicting-url',
          validRestaurantId
        );
        expect(mockRestaurantModel.update).not.toHaveBeenCalled();
        expect(mockResponse.status).toHaveBeenCalledWith(409);
        expect(mockNext).not.toHaveBeenCalled();
      });
    });
  });

  describe('deleteRestaurant', () => {
    const validRestaurantId = '550e8400-e29b-41d4-a716-446655440000';

    beforeEach(() => {
      mockRequest.method = 'DELETE';
      mockRequest.path = `/api/v1/restaurants/${validRestaurantId}`;
    });

    describe('Successful Deletion', () => {
      it('should delete a restaurant successfully', async () => {
        const existingRestaurant = {
          id: validRestaurantId,
          restaurant_name: 'Test Restaurant',
          status: 'active',
        };

        mockRequest.params = { id: validRestaurantId };
        mockRestaurantModel.findById.mockResolvedValue(existingRestaurant);
        mockRestaurantModel.deleteRestaurant.mockResolvedValue({ success: true });

        await controller.deleteRestaurant(mockRequest, mockResponse, mockNext);

        expect(mockRestaurantModel.findById).toHaveBeenCalledWith(validRestaurantId);
        expect(mockRestaurantModel.deleteRestaurant).toHaveBeenCalledWith(validRestaurantId);
        expect(mockResponse.status).toHaveBeenCalledWith(200);
        expect(mockNext).not.toHaveBeenCalled();
      });
    });

    describe('Error Handling', () => {
      it('should return 404 for non-existent restaurant', async () => {
        const nonExistentId = '550e8400-e29b-41d4-a716-446655440001';

        mockRequest.params = { id: nonExistentId };
        mockRestaurantModel.findById.mockResolvedValue(null);

        await controller.deleteRestaurant(mockRequest, mockResponse, mockNext);

        expect(mockRestaurantModel.findById).toHaveBeenCalledWith(nonExistentId);
        expect(mockRestaurantModel.deleteRestaurant).not.toHaveBeenCalled();
        expect(mockResponse.status).toHaveBeenCalledWith(404);
        expect(mockNext).not.toHaveBeenCalled();
      });

      it('should handle deletion failures', async () => {
        const existingRestaurant = {
          id: validRestaurantId,
          restaurant_name: 'Test Restaurant',
          status: 'active',
        };

        mockRequest.params = { id: validRestaurantId };
        mockRestaurantModel.findById.mockResolvedValue(existingRestaurant);
        mockRestaurantModel.deleteRestaurant.mockResolvedValue({
          success: false,
          message: 'Cannot delete restaurant with active orders',
        });

        await controller.deleteRestaurant(mockRequest, mockResponse, mockNext);

        expect(mockRestaurantModel.deleteRestaurant).toHaveBeenCalledWith(validRestaurantId);
        expect(mockResponse.status).toHaveBeenCalledWith(400);
        expect(mockNext).not.toHaveBeenCalled();
      });
    });
  });

  describe('getRestaurantStats', () => {
    const validRestaurantId = '550e8400-e29b-41d4-a716-446655440000';

    beforeEach(() => {
      mockRequest.method = 'GET';
      mockRequest.path = `/api/v1/restaurants/${validRestaurantId}/stats`;
    });

    describe('Successful Retrieval', () => {
      it('should retrieve restaurant statistics', async () => {
        const existingRestaurant = {
          id: validRestaurantId,
          restaurant_name: 'Test Restaurant',
          status: 'active',
        };

        const mockStats = {
          id: validRestaurantId,
          restaurant_name: 'Test Restaurant',
          location_count: 2,
          menu_item_count: 15,
          total_orders: 50,
          average_rating: 4.5,
          total_revenue: 12500.0,
        };

        mockRequest.params = { id: validRestaurantId };
        mockRestaurantModel.findById.mockResolvedValue(existingRestaurant);
        mockRestaurantModel.getRestaurantStats.mockResolvedValue(mockStats);

        await controller.getRestaurantStats(mockRequest, mockResponse, mockNext);

        expect(mockRestaurantModel.findById).toHaveBeenCalledWith(validRestaurantId);
        expect(mockRestaurantModel.getRestaurantStats).toHaveBeenCalledWith(validRestaurantId);
        expect(mockResponse.status).toHaveBeenCalledWith(200);
        expect(mockNext).not.toHaveBeenCalled();
      });
    });

    describe('Error Handling', () => {
      it('should return 404 for non-existent restaurant', async () => {
        const nonExistentId = '550e8400-e29b-41d4-a716-446655440001';

        mockRequest.params = { id: nonExistentId };
        mockRestaurantModel.findById.mockResolvedValue(null);

        await controller.getRestaurantStats(mockRequest, mockResponse, mockNext);

        expect(mockRestaurantModel.findById).toHaveBeenCalledWith(nonExistentId);
        expect(mockRestaurantModel.getRestaurantStats).not.toHaveBeenCalled();
        expect(mockResponse.status).toHaveBeenCalledWith(404);
        expect(mockNext).not.toHaveBeenCalled();
      });
    });
  });

  describe('checkUrlAvailability', () => {
    const testUrlName = 'test-restaurant-url';

    beforeEach(() => {
      mockRequest.method = 'GET';
      mockRequest.path = `/api/v1/restaurants/check-url/${testUrlName}`;
    });

    describe('Successful Checks', () => {
      it('should return available for non-existent URL name', async () => {
        mockRequest.params = { urlName: testUrlName };
        mockRestaurantModel.isUrlNameAvailable.mockResolvedValue(true);

        await controller.checkUrlAvailability(mockRequest, mockResponse, mockNext);

        expect(mockRestaurantModel.isUrlNameAvailable).toHaveBeenCalledWith(testUrlName);
        expect(mockResponse.status).toHaveBeenCalledWith(200);
        expect(mockNext).not.toHaveBeenCalled();
      });

      it('should return not available for existing URL name', async () => {
        mockRequest.params = { urlName: testUrlName };
        mockRestaurantModel.isUrlNameAvailable.mockResolvedValue(false);

        await controller.checkUrlAvailability(mockRequest, mockResponse, mockNext);

        expect(mockRestaurantModel.isUrlNameAvailable).toHaveBeenCalledWith(testUrlName);
        expect(mockResponse.status).toHaveBeenCalledWith(200);
        expect(mockNext).not.toHaveBeenCalled();
      });
    });

    describe('Error Handling', () => {
      it('should handle database errors gracefully', async () => {
        const dbError = new Error('Database connection failed');

        mockRequest.params = { urlName: testUrlName };
        mockRestaurantModel.isUrlNameAvailable.mockRejectedValue(dbError);

        await controller.checkUrlAvailability(mockRequest, mockResponse, mockNext);

        expect(mockNext).toHaveBeenCalledWith(dbError);
        expect(mockResponse.status).not.toHaveBeenCalled();
      });
    });
  });

  describe('Input Validation and Edge Cases', () => {
    describe('Request Data Sanitization', () => {
      it('should handle malformed request data gracefully', async () => {
        const malformedData = {
          restaurant_name: null,
          restaurant_url_name: '',
          invalid_field: 'should be ignored',
        };

        mockRequest.body = malformedData;
        mockRestaurantModel.isUrlNameAvailable.mockResolvedValue(true);
        mockRestaurantModel.create.mockResolvedValue({ id: '123' });

        await controller.createRestaurant(mockRequest, mockResponse, mockNext);

        expect(mockRestaurantModel.create).toHaveBeenCalledWith(malformedData);
        expect(mockNext).not.toHaveBeenCalled();
      });

      it('should handle edge cases in query parameters', async () => {
        mockRequest.query = {
          page: '0', // Invalid page number
          limit: '1000', // Very large limit
          sortBy: 'invalid_column',
          sortOrder: 'INVALID',
          search: '', // Empty search should be filtered out
          status: 'active', // Valid filter
        };

        const mockResult = createMockPaginatedResponse([]);
        mockRestaurantModel.getRestaurants.mockResolvedValue(mockResult);

        await controller.getRestaurants(mockRequest, mockResponse, mockNext);

        // The controller filters out empty values but passes other parameters as-is
        expect(mockRestaurantModel.getRestaurants).toHaveBeenCalledWith(
          { status: 'active' }, // Empty search filtered out, valid status included
          { page: 1, limit: 1000, sortBy: 'invalid_column', sortOrder: 'INVALID' }
        );
        expect(mockNext).not.toHaveBeenCalled();
      });
    });
  });

  describe('Performance and Logging', () => {
    describe('Request Performance Tracking', () => {
      it('should log controller method calls with timing', async () => {
        const restaurantData = createMockRestaurantData();

        mockRequest.body = restaurantData;
        mockRequest.headers['x-request-id'] = 'perf-test-123';
        mockRestaurantModel.isUrlNameAvailable.mockResolvedValue(true);
        mockRestaurantModel.create.mockResolvedValue({ id: '123', ...restaurantData });

        await controller.createRestaurant(mockRequest, mockResponse, mockNext);

        expect(mockLogger.child).toHaveBeenCalledWith({
          method: 'createRestaurant',
          requestId: 'perf-test-123',
          userId: 'test-user-id',
        });

        // Verify that the child logger methods were called for timing/performance
        const childLogger = mockLogger.child.mock.results[0].value;
        expect(childLogger.info).toHaveBeenCalled();
      });

      it('should generate request ID when not provided in headers', async () => {
        mockRequest.query = {};
        delete mockRequest.headers['x-request-id'];
        mockRestaurantModel.getRestaurants.mockResolvedValue(createMockPaginatedResponse([]));

        await controller.getRestaurants(mockRequest, mockResponse, mockNext);

        expect(mockLogger.child).toHaveBeenCalledWith({
          method: 'getRestaurants',
          requestId: expect.stringMatching(/^req_\d+$/),
        });
      });
    });
  });
});
