const request = require('supertest');
const express = require('express');
const DatabaseTestHelper = require('../helpers/databaseTestHelper');
const testDataFactory = require('../helpers/testDataFactory');

// Mock database connection
const mockPool = {
  query: jest.fn(),
  connect: jest.fn(),
  end: jest.fn(),
};

jest.mock('../../src/config/db', () => ({
  query: mockPool.query,
  pool: mockPool,
  testConnection: jest.fn().mockResolvedValue(true),
}));

// Mock logger to prevent undefined errors
const mockLogger = {
  child: jest.fn(() => mockLogger),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
};

jest.mock('../../src/utils/logger', () => ({
  logger: mockLogger,
}));

// Mock RestaurantModel to avoid database dependency
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

// Mock auth middleware for testing
jest.mock('../../src/middleware/authMiddleware', () => (req, res, next) => {
  req.user = { id: 'test-user-id', role: 'restaurant_administrator' };
  next();
});

jest.mock('../../src/middleware/restaurantAuth', () => ({
  requireRestaurantAdmin: (req, res, next) => next(),
  requireRestaurantModifyAccess: (req, res, next) => next(),
}));

// Mock validation middleware - we'll override this in specific tests
const mockValidateBody = jest.fn(() => (req, res, next) => next());
const mockValidateParams = jest.fn(() => (req, res, next) => next());
const mockValidateQuery = jest.fn(() => (req, res, next) => next());
const mockSanitize = jest.fn(() => (req, res, next) => next());

const mockValidationMiddleware = {
  validateParams: mockValidateParams,
  validateBody: mockValidateBody,
  validateQuery: mockValidateQuery,
  sanitize: mockSanitize,
};

jest.mock('../../src/middleware/validationMiddleware', () => mockValidationMiddleware);

// Import routes after mocking
const restaurantRoutes = require('../../src/routes/restaurantRoutes');

// Create test app
const app = express();
app.use(express.json());
app.use('/api/restaurants', restaurantRoutes);

describe('RestaurantController Integration Tests', () => {
  let dbHelper;

  beforeAll(async () => {
    dbHelper = new DatabaseTestHelper();
    await dbHelper.init();
  });

  afterAll(async () => {
    if (dbHelper) {
      await dbHelper.cleanupCreatedRestaurants();
      await dbHelper.close();
    }
  });
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    // Set up default mock implementations - will be overridden per test as needed
    mockRestaurantModel.isUrlNameAvailable.mockResolvedValue(true);
    mockRestaurantModel.create.mockImplementation((data) =>
      Promise.resolve({
        id: 'test-restaurant-id',
        ...data,
        status: 'pending', // Default status for new restaurants
        subscription_status: 'active', // Default subscription status
        created_at: new Date(),
        updated_at: new Date(),
      })
    );
    mockRestaurantModel.getRestaurants.mockResolvedValue({
      restaurants: [],
      pagination: { total: 0, page: 1, limit: 10, totalPages: 0 },
    });
    mockRestaurantModel.findById.mockResolvedValue(null);
    mockRestaurantModel.findByUrlName.mockResolvedValue(null);
    mockRestaurantModel.update.mockImplementation((id, data) =>
      Promise.resolve({
        id,
        ...data,
        updated_at: new Date(),
      })
    );
    mockRestaurantModel.deleteRestaurant.mockResolvedValue(true);
    mockRestaurantModel.getRestaurantStats.mockResolvedValue({
      id: 'test-restaurant-id',
      restaurant_name: 'Test Restaurant',
      location_count: 0,
      menu_item_count: 0,
      total_orders: 0,
    });
  });

  beforeEach(async () => {
    // Clean up any restaurants created in previous tests
    await dbHelper.cleanupCreatedRestaurants();
  });

  describe('POST /api/restaurants', () => {
    it('should create a new restaurant with valid data', async () => {
      const restaurantData = testDataFactory.createRestaurantData();

      const response = await request(app).post('/api/restaurants').send(restaurantData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Restaurant created successfully');
      expect(response.body.data).toMatchObject({
        restaurant_name: restaurantData.restaurant_name,
        restaurant_url_name: restaurantData.restaurant_url_name,
        business_type: restaurantData.business_type,
        cuisine_type: restaurantData.cuisine_type,
        description: restaurantData.description,
      });
      expect(response.body.data.id).toBeDefined();

      // Verify the model was called correctly
      expect(mockRestaurantModel.isUrlNameAvailable).toHaveBeenCalledWith(
        restaurantData.restaurant_url_name
      );
      // The controller passes req.body directly, but it gets processed with default values
      expect(mockRestaurantModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          restaurant_name: restaurantData.restaurant_name,
          restaurant_url_name: restaurantData.restaurant_url_name,
          business_type: restaurantData.business_type,
          cuisine_type: restaurantData.cuisine_type,
          description: restaurantData.description,
          phone: restaurantData.phone,
          marketing_consent: restaurantData.marketing_consent,
          terms_accepted: restaurantData.terms_accepted,
          subscription_plan: restaurantData.subscription_plan,
          website: restaurantData.website,
          whatsapp: restaurantData.whatsapp,
        })
      );
    });

    it('should handle controller validation and return appropriate response', async () => {
      const invalidData = {
        restaurant_name: 'A', // Too short
        restaurant_url_name: 'invalid url', // Contains spaces
        business_type: 'invalid', // Invalid value
        phone: 'abc123', // Invalid format
        website: 'not-a-url', // Invalid URL format
        terms_accepted: false, // Must be true
      };

      // Mock that URL name is available (to isolate controller logic)
      mockRestaurantModel.isUrlNameAvailable.mockResolvedValue(true);

      // Even with invalid data, this tests the controller flow when validation is bypassed
      // In a real scenario, validation middleware would catch this before reaching the controller
      const response = await request(app).post('/api/restaurants').send(invalidData);

      // Since validation is mocked to pass, the controller should process the request
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(mockRestaurantModel.create).toHaveBeenCalled();
    });

    it('should return 409 for duplicate URL name', async () => {
      const restaurantData = testDataFactory.createRestaurantData();

      // Mock that URL name is not available (already taken)
      mockRestaurantModel.isUrlNameAvailable.mockResolvedValue(false);

      const response = await request(app).post('/api/restaurants').send(restaurantData);

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('URL name is already taken');
    });
  });

  describe('GET /api/restaurants', () => {
    beforeEach(async () => {
      // Mock restaurant data for these tests
      const mockRestaurants = [
        { id: '1', restaurant_name: 'Italian Place', cuisine_type: 'Italian' },
        { id: '2', restaurant_name: 'Mexican Place', cuisine_type: 'Mexican' },
        { id: '3', restaurant_name: 'Chinese Place', cuisine_type: 'Chinese' },
      ];

      // Set up different mocks for different scenarios
      mockRestaurantModel.getRestaurants.mockImplementation((filters, pagination) => {
        let filteredRestaurants = [...mockRestaurants];

        // Apply cuisine_type filter if present
        if (filters.cuisine_type) {
          filteredRestaurants = filteredRestaurants.filter(
            (r) => r.cuisine_type === filters.cuisine_type
          );
        }

        // Apply pagination
        const start = (pagination.page - 1) * pagination.limit;
        const end = start + pagination.limit;
        const paginatedRestaurants = filteredRestaurants.slice(start, end);

        return Promise.resolve({
          restaurants: paginatedRestaurants,
          pagination: {
            total: filteredRestaurants.length,
            page: pagination.page,
            limit: pagination.limit,
            totalPages: Math.ceil(filteredRestaurants.length / pagination.limit),
          },
        });
      });
    });

    it('should get all restaurants with default pagination', async () => {
      const response = await request(app).get('/api/restaurants').expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Restaurants retrieved successfully');
      expect(response.body.data).toHaveLength(3);
      expect(response.body.meta.pagination.page).toBe(1);
      expect(response.body.meta.pagination.limit).toBe(10);
      expect(response.body.meta.pagination.total).toBe(3);
    });

    it('should filter restaurants by cuisine type', async () => {
      const response = await request(app).get('/api/restaurants?cuisine_type=Italian').expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].cuisine_type).toBe('Italian');
    });

    it('should paginate results correctly', async () => {
      const response = await request(app).get('/api/restaurants?page=1&limit=2').expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.meta.pagination.page).toBe(1);
      expect(response.body.meta.pagination.limit).toBe(2);
      expect(response.body.meta.pagination.total).toBe(3);
    });
  });

  describe('GET /api/restaurants/:id', () => {
    const validRestaurantId = '550e8400-e29b-41d4-a716-446655440000';
    let restaurantId;

    beforeEach(async () => {
      restaurantId = validRestaurantId;

      // Mock findById to return a restaurant for valid ID
      mockRestaurantModel.findById.mockImplementation((id) => {
        if (id === validRestaurantId) {
          return Promise.resolve({
            id: validRestaurantId,
            restaurant_name: 'Test Restaurant',
            restaurant_url_name: 'test-restaurant',
            business_type: 'single',
            cuisine_type: 'Test Cuisine',
          });
        }
        return Promise.resolve(null);
      });
    });

    it('should get restaurant by valid ID', async () => {
      const response = await request(app).get(`/api/restaurants/${restaurantId}`).expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Restaurant retrieved successfully');
      expect(response.body.data.id).toBe(restaurantId);
    });

    it('should return 404 for non-existent restaurant', async () => {
      const nonExistentId = '550e8400-e29b-41d4-a716-446655440001';
      const response = await request(app).get(`/api/restaurants/${nonExistentId}`).expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Restaurant not found');
    });

    it('should handle request when validation is bypassed (tests controller logic)', async () => {
      // Mock that the restaurant does not exist (would normally trigger validation first)
      mockRestaurantModel.findById.mockResolvedValue(null);

      const response = await request(app).get('/api/restaurants/invalid-uuid');

      // Since validation is bypassed in tests, controller logic executes and returns 404
      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Restaurant not found');
    });
  });

  describe('GET /api/restaurants/by-url/:urlName', () => {
    const testUrlName = 'test-restaurant-url';
    let restaurantData;

    beforeEach(async () => {
      restaurantData = { restaurant_url_name: testUrlName };

      // Mock findByUrlName
      mockRestaurantModel.findByUrlName.mockImplementation((urlName) => {
        if (urlName === testUrlName) {
          return Promise.resolve({
            id: 'test-id',
            restaurant_name: 'Test Restaurant',
            restaurant_url_name: testUrlName,
          });
        }
        return Promise.resolve(null);
      });
    });

    it('should get restaurant by valid URL name', async () => {
      const response = await request(app)
        .get(`/api/restaurants/by-url/${restaurantData.restaurant_url_name}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Restaurant retrieved successfully');
      expect(response.body.data.restaurant_url_name).toBe(restaurantData.restaurant_url_name);
    });

    it('should return 404 for non-existent URL name', async () => {
      const response = await request(app)
        .get('/api/restaurants/by-url/non-existent-url')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Restaurant not found');
    });
  });

  describe('PUT /api/restaurants/:id', () => {
    const validRestaurantId = '550e8400-e29b-41d4-a716-446655440000';
    let restaurantId;

    beforeEach(async () => {
      restaurantId = validRestaurantId;

      // Mock findById to return a restaurant for valid ID
      mockRestaurantModel.findById.mockImplementation((id) => {
        if (id === validRestaurantId) {
          return Promise.resolve({
            id: validRestaurantId,
            restaurant_name: 'Original Restaurant',
            restaurant_url_name: 'original-restaurant',
          });
        }
        return Promise.resolve(null);
      });

      // Mock update to return updated data
      mockRestaurantModel.update.mockImplementation((id, data) => {
        if (id === validRestaurantId) {
          return Promise.resolve({
            id: validRestaurantId,
            restaurant_name: data.restaurant_name || 'Original Restaurant',
            description: data.description || 'Original description',
            ...data,
          });
        }
        throw new Error('Restaurant not found');
      });
    });

    it('should update restaurant with valid data', async () => {
      const updateData = {
        restaurant_name: 'Updated Restaurant Name',
        description: 'Updated description',
      };

      const response = await request(app)
        .put(`/api/restaurants/${restaurantId}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Restaurant updated successfully');
      expect(response.body.data.restaurant_name).toBe(updateData.restaurant_name);
      expect(response.body.data.description).toBe(updateData.description);
    });

    it('should return 404 for non-existent restaurant', async () => {
      const nonExistentId = '550e8400-e29b-41d4-a716-446655440001';
      const updateData = { restaurant_name: 'Updated Name' };

      const response = await request(app)
        .put(`/api/restaurants/${nonExistentId}`)
        .send(updateData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Restaurant not found');
    });

    it('should return 409 for duplicate URL name', async () => {
      // Mock URL name as not available (conflict)
      mockRestaurantModel.isUrlNameAvailable.mockResolvedValue(false);

      const updateData = { restaurant_url_name: 'conflicting-url-name' };

      const response = await request(app)
        .put(`/api/restaurants/${restaurantId}`)
        .send(updateData)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('URL name is already taken');
    });
  });

  describe('DELETE /api/restaurants/:id', () => {
    it('should delete restaurant successfully', async () => {
      const restaurantId = '123e4567-e89b-12d3-a456-426614174000'; // Valid UUID v4 format

      // Mock that restaurant exists (required for deletion check)
      mockRestaurantModel.findById.mockResolvedValue({
        id: restaurantId,
        restaurant_name: 'Test Restaurant',
        status: 'active',
      });

      // Mock successful deletion
      mockRestaurantModel.deleteRestaurant.mockResolvedValue({ success: true });

      const response = await request(app).delete(`/api/restaurants/${restaurantId}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Restaurant deleted successfully');

      // Verify the model was called correctly
      expect(mockRestaurantModel.findById).toHaveBeenCalledWith(restaurantId);
      expect(mockRestaurantModel.deleteRestaurant).toHaveBeenCalledWith(restaurantId);
    });

    it('should return 404 for non-existent restaurant', async () => {
      const nonExistentId = '550e8400-e29b-41d4-a716-446655440000';

      // Mock that the restaurant doesn't exist
      mockRestaurantModel.deleteRestaurant.mockResolvedValue(false);

      const response = await request(app).delete(`/api/restaurants/${nonExistentId}`).expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Restaurant not found');
    });
  });

  describe('GET /api/restaurants/:id/stats', () => {
    it('should get restaurant statistics', async () => {
      const restaurantId = '550e8400-e29b-41d4-a716-446655440001'; // Valid UUID format
      const mockStats = {
        id: restaurantId,
        restaurant_name: 'Test Restaurant',
        location_count: 2,
        menu_item_count: 15,
        total_orders: 50,
      };

      // Mock that restaurant exists (required for stats check)
      mockRestaurantModel.findById.mockResolvedValue({
        id: restaurantId,
        restaurant_name: 'Test Restaurant',
        status: 'active',
      });

      // Mock successful stats retrieval
      mockRestaurantModel.getRestaurantStats.mockResolvedValue(mockStats);

      const response = await request(app).get(`/api/restaurants/${restaurantId}/stats`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Restaurant statistics retrieved successfully');
      expect(response.body.data).toMatchObject(mockStats);

      // Verify the model was called correctly
      expect(mockRestaurantModel.findById).toHaveBeenCalledWith(restaurantId);
      expect(mockRestaurantModel.getRestaurantStats).toHaveBeenCalledWith(restaurantId);
    });

    it('should return 404 for non-existent restaurant', async () => {
      const nonExistentId = '550e8400-e29b-41d4-a716-446655440000';

      // Mock that the restaurant doesn't exist
      mockRestaurantModel.getRestaurantStats.mockResolvedValue(null);

      const response = await request(app)
        .get(`/api/restaurants/${nonExistentId}/stats`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Restaurant not found');
    });
  });

  describe('GET /api/restaurants/check-url/:urlName', () => {
    it('should return available for non-existent URL name', async () => {
      // Mock that URL name is available
      mockRestaurantModel.isUrlNameAvailable.mockResolvedValue(true);

      const response = await request(app)
        .get('/api/restaurants/check-url/available-url')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.available).toBe(true);
      expect(response.body.message).toBe('URL name is available');

      // Verify the model was called correctly
      expect(mockRestaurantModel.isUrlNameAvailable).toHaveBeenCalledWith('available-url');
    });

    it('should return not available for existing URL name', async () => {
      // Mock that URL name is already taken
      mockRestaurantModel.isUrlNameAvailable.mockResolvedValue(false);

      const response = await request(app)
        .get('/api/restaurants/check-url/existing-restaurant')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.available).toBe(false);
      expect(response.body.message).toBe('URL name is already taken');

      // Verify the model was called correctly
      expect(mockRestaurantModel.isUrlNameAvailable).toHaveBeenCalledWith('existing-restaurant');
    });
  });
});
