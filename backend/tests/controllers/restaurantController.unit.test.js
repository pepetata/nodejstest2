// Mock the RestaurantModel BEFORE requiring the controller
jest.mock('../../src/models/RestaurantModel', () => ({
  create: jest.fn(),
  getRestaurants: jest.fn(),
  findById: jest.fn(),
  findByUrlName: jest.fn(),
  update: jest.fn(),
  deleteRestaurant: jest.fn(),
  getRestaurantStats: jest.fn(),
  isUrlNameAvailable: jest.fn(),
}));

// Mock ResponseFormatter
jest.mock('../../src/utils/responseFormatter', () => ({
  success: jest.fn((data, message, meta) => ({ success: true, data, message, meta })),
  error: jest.fn((message, statusCode, details) => ({
    success: false,
    error: { message, statusCode, details },
  })),
}));

// Now require the dependencies
const RestaurantController = require('../../src/controllers/restaurantController');
const restaurantModel = require('../../src/models/RestaurantModel');
const ResponseFormatter = require('../../src/utils/responseFormatter');

describe('RestaurantController Unit Tests', () => {
  let controller;
  let mockRequest;
  let mockResponse;
  let mockNext;
  let mockLogger;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();

    // Create mock logger
    mockLogger = {
      child: jest.fn(() => ({
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        debug: jest.fn(),
      })),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    };

    // Create controller instance with injected logger
    controller = new RestaurantController(mockLogger);

    // Mock request object
    mockRequest = {
      body: {},
      params: {},
      query: {},
      headers: {},
      user: { id: 'test-user-id', role: 'restaurant_administrator' },
    };

    // Mock response object
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    // Mock next function
    mockNext = jest.fn();
  });

  describe('createRestaurant', () => {
    it('should create a new restaurant successfully', async () => {
      const restaurantData = {
        restaurant_name: 'Test Restaurant',
        restaurant_url_name: 'test-restaurant',
        cuisine_type: 'Italian',
        description: 'A test restaurant',
      };

      const createdRestaurant = {
        id: 'restaurant-id-123',
        ...restaurantData,
        created_at: '2024-01-01T00:00:00.000Z',
      };

      mockRequest.body = restaurantData;
      restaurantModel.isUrlNameAvailable.mockResolvedValue(true);
      restaurantModel.create.mockResolvedValue(createdRestaurant);
      ResponseFormatter.success.mockReturnValue({
        success: true,
        data: createdRestaurant,
        message: 'Restaurant created successfully',
      });

      await controller.createRestaurant(mockRequest, mockResponse, mockNext);

      expect(restaurantModel.isUrlNameAvailable).toHaveBeenCalledWith('test-restaurant');
      expect(restaurantModel.create).toHaveBeenCalledWith(restaurantData);
      expect(ResponseFormatter.success).toHaveBeenCalledWith(
        createdRestaurant,
        'Restaurant created successfully'
      );
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 409 when URL name is already taken', async () => {
      const restaurantData = {
        restaurant_name: 'Test Restaurant',
        restaurant_url_name: 'existing-url',
      };

      mockRequest.body = restaurantData;
      restaurantModel.isUrlNameAvailable.mockResolvedValue(false);
      ResponseFormatter.error.mockReturnValue({
        success: false,
        error: { message: 'URL name is already taken', statusCode: 409 },
      });

      await controller.createRestaurant(mockRequest, mockResponse, mockNext);

      expect(restaurantModel.isUrlNameAvailable).toHaveBeenCalledWith('existing-url');
      expect(restaurantModel.create).not.toHaveBeenCalled();
      expect(ResponseFormatter.error).toHaveBeenCalledWith('URL name is already taken', 409, {
        field: 'restaurant_url_name',
      });
      expect(mockResponse.status).toHaveBeenCalledWith(409);
      expect(mockResponse.json).toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle database errors gracefully', async () => {
      const restaurantData = {
        restaurant_name: 'Test Restaurant',
        restaurant_url_name: 'test-restaurant',
      };

      mockRequest.body = restaurantData;
      restaurantModel.isUrlNameAvailable.mockResolvedValue(true);
      restaurantModel.create.mockRejectedValue(new Error('Database connection failed'));

      await controller.createRestaurant(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      expect(mockNext.mock.calls[0][0].message).toBe('Database connection failed');
    });
  });

  describe('getRestaurants', () => {
    it('should retrieve restaurants with default pagination', async () => {
      const mockRestaurants = [
        { id: '1', restaurant_name: 'Restaurant 1', cuisine_type: 'Italian' },
        { id: '2', restaurant_name: 'Restaurant 2', cuisine_type: 'Mexican' },
      ];
      const mockResult = {
        restaurants: mockRestaurants,
        pagination: { page: 1, limit: 10, total: 2, totalPages: 1 },
      };

      mockRequest.query = {};
      restaurantModel.getRestaurants.mockResolvedValue(mockResult);
      ResponseFormatter.success.mockReturnValue({
        success: true,
        data: mockRestaurants,
        meta: mockResult.pagination,
      });

      await controller.getRestaurants(mockRequest, mockResponse, mockNext);

      expect(restaurantModel.getRestaurants).toHaveBeenCalledWith(
        {},
        { page: 1, limit: 10, sortBy: 'created_at', sortOrder: 'DESC' }
      );
      expect(ResponseFormatter.success).toHaveBeenCalledWith(
        mockRestaurants,
        'Restaurants retrieved successfully',
        { pagination: mockResult.pagination, filters: {} }
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle filters and pagination parameters', async () => {
      const mockRestaurants = [
        { id: '1', restaurant_name: 'Italian Restaurant', cuisine_type: 'Italian' },
      ];
      const mockResult = {
        restaurants: mockRestaurants,
        pagination: { page: 2, limit: 5, total: 1, totalPages: 1 },
      };

      mockRequest.query = {
        page: '2',
        limit: '5',
        search: 'Italian',
        cuisine_type: 'Italian',
        sortBy: 'restaurant_name',
        sortOrder: 'asc',
      };
      restaurantModel.getRestaurants.mockResolvedValue(mockResult);

      await controller.getRestaurants(mockRequest, mockResponse, mockNext);

      expect(restaurantModel.getRestaurants).toHaveBeenCalledWith(
        { search: 'Italian', cuisine_type: 'Italian' },
        { page: 2, limit: 5, sortBy: 'restaurant_name', sortOrder: 'asc' }
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle database errors', async () => {
      mockRequest.query = {};
      restaurantModel.getRestaurants.mockRejectedValue(new Error('Database error'));

      await controller.getRestaurants(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('getRestaurantById', () => {
    it('should retrieve a restaurant by valid ID', async () => {
      const mockRestaurant = {
        id: 'restaurant-id-123',
        restaurant_name: 'Test Restaurant',
        cuisine_type: 'Italian',
      };

      mockRequest.params = { id: 'restaurant-id-123' };
      restaurantModel.findById.mockResolvedValue(mockRestaurant);
      ResponseFormatter.success.mockReturnValue({
        success: true,
        data: mockRestaurant,
      });

      await controller.getRestaurantById(mockRequest, mockResponse, mockNext);

      expect(restaurantModel.findById).toHaveBeenCalledWith('restaurant-id-123');
      expect(ResponseFormatter.success).toHaveBeenCalledWith(
        mockRestaurant,
        'Restaurant retrieved successfully'
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 404 for non-existent restaurant', async () => {
      mockRequest.params = { id: 'non-existent-id' };
      restaurantModel.findById.mockResolvedValue(null);
      ResponseFormatter.error.mockReturnValue({
        success: false,
        error: { message: 'Restaurant not found', statusCode: 404 },
      });

      await controller.getRestaurantById(mockRequest, mockResponse, mockNext);

      expect(ResponseFormatter.error).toHaveBeenCalledWith('Restaurant not found', 404);
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle database errors', async () => {
      mockRequest.params = { id: 'restaurant-id-123' };
      restaurantModel.findById.mockRejectedValue(new Error('Database error'));

      await controller.getRestaurantById(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('getRestaurantByUrlName', () => {
    it('should retrieve a restaurant by valid URL name', async () => {
      const mockRestaurant = {
        id: 'restaurant-id-123',
        restaurant_name: 'Test Restaurant',
        restaurant_url_name: 'test-restaurant',
      };

      mockRequest.params = { urlName: 'test-restaurant' };
      restaurantModel.findByUrlName.mockResolvedValue(mockRestaurant);

      await controller.getRestaurantByUrlName(mockRequest, mockResponse, mockNext);

      expect(restaurantModel.findByUrlName).toHaveBeenCalledWith('test-restaurant');
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 404 for non-existent URL name', async () => {
      mockRequest.params = { urlName: 'non-existent-url' };
      restaurantModel.findByUrlName.mockResolvedValue(null);

      await controller.getRestaurantByUrlName(mockRequest, mockResponse, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('updateRestaurant', () => {
    it('should update a restaurant successfully', async () => {
      const existingRestaurant = {
        id: 'restaurant-id-123',
        restaurant_name: 'Old Name',
        restaurant_url_name: 'old-url',
      };

      const updateData = {
        restaurant_name: 'New Name',
        description: 'Updated description',
      };

      const updatedRestaurant = {
        ...existingRestaurant,
        ...updateData,
      };

      mockRequest.params = { id: 'restaurant-id-123' };
      mockRequest.body = updateData;
      restaurantModel.findById.mockResolvedValue(existingRestaurant);
      restaurantModel.update.mockResolvedValue(updatedRestaurant);

      await controller.updateRestaurant(mockRequest, mockResponse, mockNext);

      expect(restaurantModel.findById).toHaveBeenCalledWith('restaurant-id-123');
      expect(restaurantModel.update).toHaveBeenCalledWith('restaurant-id-123', updateData);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 404 for non-existent restaurant', async () => {
      const updateData = { restaurant_name: 'New Name' };

      mockRequest.params = { id: 'non-existent-id' };
      mockRequest.body = updateData;
      restaurantModel.findById.mockResolvedValue(null);

      await controller.updateRestaurant(mockRequest, mockResponse, mockNext);

      expect(restaurantModel.update).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should check URL name availability when updating URL', async () => {
      const existingRestaurant = {
        id: 'restaurant-id-123',
        restaurant_name: 'Test Restaurant',
        restaurant_url_name: 'old-url',
      };

      const updateData = {
        restaurant_url_name: 'new-url',
      };

      mockRequest.params = { id: 'restaurant-id-123' };
      mockRequest.body = updateData;
      restaurantModel.findById.mockResolvedValue(existingRestaurant);
      restaurantModel.isUrlNameAvailable.mockResolvedValue(false);

      await controller.updateRestaurant(mockRequest, mockResponse, mockNext);

      expect(restaurantModel.isUrlNameAvailable).toHaveBeenCalledWith(
        'new-url',
        'restaurant-id-123'
      );
      expect(restaurantModel.update).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(409);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('deleteRestaurant', () => {
    it('should delete a restaurant successfully', async () => {
      const existingRestaurant = {
        id: 'restaurant-id-123',
        restaurant_name: 'Test Restaurant',
      };

      mockRequest.params = { id: 'restaurant-id-123' };
      restaurantModel.findById.mockResolvedValue(existingRestaurant);
      restaurantModel.deleteRestaurant.mockResolvedValue({ success: true });

      await controller.deleteRestaurant(mockRequest, mockResponse, mockNext);

      expect(restaurantModel.findById).toHaveBeenCalledWith('restaurant-id-123');
      expect(restaurantModel.deleteRestaurant).toHaveBeenCalledWith('restaurant-id-123');
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 404 for non-existent restaurant', async () => {
      mockRequest.params = { id: 'non-existent-id' };
      restaurantModel.findById.mockResolvedValue(null);

      await controller.deleteRestaurant(mockRequest, mockResponse, mockNext);

      expect(restaurantModel.deleteRestaurant).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle deletion failures', async () => {
      const existingRestaurant = {
        id: 'restaurant-id-123',
        restaurant_name: 'Test Restaurant',
      };

      mockRequest.params = { id: 'restaurant-id-123' };
      restaurantModel.findById.mockResolvedValue(existingRestaurant);
      restaurantModel.deleteRestaurant.mockResolvedValue({
        success: false,
        message: 'Delete failed',
      });

      await controller.deleteRestaurant(mockRequest, mockResponse, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('getRestaurantStats', () => {
    it('should retrieve restaurant statistics', async () => {
      const existingRestaurant = {
        id: 'restaurant-id-123',
        restaurant_name: 'Test Restaurant',
      };

      const mockStats = {
        total_orders: 100,
        average_rating: 4.5,
        revenue: 5000,
      };

      mockRequest.params = { id: 'restaurant-id-123' };
      restaurantModel.findById.mockResolvedValue(existingRestaurant);
      restaurantModel.getRestaurantStats.mockResolvedValue(mockStats);

      await controller.getRestaurantStats(mockRequest, mockResponse, mockNext);

      expect(restaurantModel.findById).toHaveBeenCalledWith('restaurant-id-123');
      expect(restaurantModel.getRestaurantStats).toHaveBeenCalledWith('restaurant-id-123');
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 404 for non-existent restaurant', async () => {
      mockRequest.params = { id: 'non-existent-id' };
      restaurantModel.findById.mockResolvedValue(null);

      await controller.getRestaurantStats(mockRequest, mockResponse, mockNext);

      expect(restaurantModel.getRestaurantStats).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('checkUrlAvailability', () => {
    it('should return available for non-existent URL name', async () => {
      mockRequest.params = { urlName: 'available-url' };
      restaurantModel.isUrlNameAvailable.mockResolvedValue(true);

      await controller.checkUrlAvailability(mockRequest, mockResponse, mockNext);

      expect(restaurantModel.isUrlNameAvailable).toHaveBeenCalledWith('available-url');
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return not available for existing URL name', async () => {
      mockRequest.params = { urlName: 'existing-url' };
      restaurantModel.isUrlNameAvailable.mockResolvedValue(false);

      await controller.checkUrlAvailability(mockRequest, mockResponse, mockNext);

      expect(restaurantModel.isUrlNameAvailable).toHaveBeenCalledWith('existing-url');
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('Error handling', () => {
    it('should handle unexpected errors in createRestaurant', async () => {
      const restaurantData = {
        restaurant_name: 'Test Restaurant',
        restaurant_url_name: 'test-restaurant',
      };

      mockRequest.body = restaurantData;
      restaurantModel.isUrlNameAvailable.mockRejectedValue(new Error('Unexpected error'));

      await controller.createRestaurant(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      expect(mockNext.mock.calls[0][0].message).toBe('Unexpected error');
    });

    it('should handle unexpected errors in getRestaurants', async () => {
      mockRequest.query = {};
      restaurantModel.getRestaurants.mockRejectedValue(new Error('Database error'));

      await controller.getRestaurants(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should handle unexpected errors in getRestaurantById', async () => {
      mockRequest.params = { id: 'restaurant-id-123' };
      restaurantModel.findById.mockRejectedValue(new Error('Database error'));

      await controller.getRestaurantById(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should handle validation errors', async () => {
      const restaurantData = {
        restaurant_name: '', // Invalid empty name
        restaurant_url_name: 'test-restaurant',
      };

      mockRequest.body = restaurantData;
      const validationError = new Error('Validation failed');
      validationError.details = ['Restaurant name is required'];
      restaurantModel.isUrlNameAvailable.mockRejectedValue(validationError);

      await controller.createRestaurant(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should handle network errors gracefully', async () => {
      mockRequest.query = {};
      const networkError = new Error('Network timeout');
      networkError.code = 'ECONNRESET';
      restaurantModel.getRestaurants.mockRejectedValue(networkError);

      await controller.getRestaurants(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      expect(mockNext.mock.calls[0][0].code).toBe('ECONNRESET');
    });
  });

  describe('Input validation and sanitization', () => {
    it('should handle malformed request data', async () => {
      mockRequest.body = {
        restaurant_name: 'Test Restaurant',
        restaurant_url_name: 'test-restaurant',
        malicious_field: '<script>alert("xss")</script>',
      };

      restaurantModel.isUrlNameAvailable.mockResolvedValue(true);
      restaurantModel.create.mockResolvedValue({ id: '123', ...mockRequest.body });

      await controller.createRestaurant(mockRequest, mockResponse, mockNext);

      expect(restaurantModel.create).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(201);
    });

    it('should handle edge cases in query parameters', async () => {
      mockRequest.query = {
        page: 'invalid',
        limit: '-1',
        sort_by: 'nonexistent_field',
        sort_order: 'invalid_order',
      };

      const mockResult = {
        data: [],
        pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
      };

      restaurantModel.getRestaurants.mockResolvedValue(mockResult);

      await controller.getRestaurants(mockRequest, mockResponse, mockNext);

      expect(restaurantModel.getRestaurants).toHaveBeenCalledWith(
        { sort_by: 'nonexistent_field', sort_order: 'invalid_order' },
        { page: 1, limit: -1, sortBy: 'created_at', sortOrder: 'DESC' }
      );
    });
  });

  describe('Logging functionality', () => {
    it('should log controller method calls', async () => {
      const restaurantData = {
        restaurant_name: 'Test Restaurant',
        restaurant_url_name: 'test-restaurant',
      };

      mockRequest.body = restaurantData;
      mockRequest.headers['x-request-id'] = 'test-request-123';
      restaurantModel.isUrlNameAvailable.mockResolvedValue(true);
      restaurantModel.create.mockResolvedValue({ id: '123', ...restaurantData });

      await controller.createRestaurant(mockRequest, mockResponse, mockNext);

      expect(mockLogger.child).toHaveBeenCalledWith({
        method: 'createRestaurant',
        requestId: 'test-request-123',
        userId: 'test-user-id',
      });
    });

    it('should generate request ID when not provided', async () => {
      mockRequest.query = {};
      restaurantModel.getRestaurants.mockResolvedValue({
        data: [],
        pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
      });

      await controller.getRestaurants(mockRequest, mockResponse, mockNext);

      expect(mockLogger.child).toHaveBeenCalledWith({
        method: 'getRestaurants',
        requestId: expect.stringMatching(/^req_\d+$/),
      });
    });
  });
});
