const request = require('supertest');
const express = require('express');
const restaurantRoutes = require('../../src/routes/restaurantRoutes');
const DatabaseTestHelper = require('../helpers/databaseTestHelper');
const testDataFactory = require('../helpers/testDataFactory');

// Create test app
const app = express();
app.use(express.json());
app.use('/api/restaurants', restaurantRoutes);

// Mock auth middleware for testing
jest.mock('../../src/middleware/authMiddleware', () => (req, res, next) => {
  req.user = { id: 'test-user-id', role: 'restaurant_administrator' };
  next();
});

jest.mock('../../src/middleware/restaurantAuth', () => ({
  requireRestaurantAdmin: (req, res, next) => next(),
  requireRestaurantModifyAccess: (req, res, next) => next(),
}));

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

  beforeEach(async () => {
    // Clean up any restaurants created in previous tests
    await dbHelper.cleanupCreatedRestaurants();
  });

  describe('POST /api/restaurants', () => {
    it('should create a new restaurant with valid data', async () => {
      const restaurantData = testDataFactory.createRestaurantData();

      const response = await request(app).post('/api/restaurants').send(restaurantData).expect(201);

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

      // Track created restaurant for cleanup
      dbHelper.trackCreatedRestaurant(response.body.data.id);
    });

    it('should return 400 for invalid restaurant data', async () => {
      const invalidData = {
        restaurant_name: 'A', // Too short
        restaurant_url_name: 'invalid url', // Contains spaces
        business_type: 'invalid', // Invalid value
        phone: 'abc123', // Invalid format
        website: 'not-a-url', // Invalid URL format
        terms_accepted: false, // Must be true
      };

      const response = await request(app).post('/api/restaurants').send(invalidData).expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Validation failed');
      expect(response.body.error.details.validationErrors.length).toBeGreaterThan(0);
    });

    it('should return 409 for duplicate URL name', async () => {
      const restaurantData = testDataFactory.createRestaurantData();

      // Create first restaurant
      const firstResponse = await request(app)
        .post('/api/restaurants')
        .send(restaurantData)
        .expect(201);

      dbHelper.trackCreatedRestaurant(firstResponse.body.data.id);

      // Try to create second restaurant with same URL name
      const duplicateData = {
        ...testDataFactory.createRestaurantData(),
        restaurant_url_name: restaurantData.restaurant_url_name,
      };

      const response = await request(app).post('/api/restaurants').send(duplicateData).expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('URL name is already taken');
    });
  });

  describe('GET /api/restaurants', () => {
    beforeEach(async () => {
      // Create test restaurants
      const restaurants = [
        { ...testDataFactory.createRestaurantData(), cuisine_type: 'Italian' },
        { ...testDataFactory.createRestaurantData(), cuisine_type: 'Mexican' },
        { ...testDataFactory.createRestaurantData(), cuisine_type: 'Chinese' },
      ];

      for (const restaurant of restaurants) {
        const response = await request(app).post('/api/restaurants').send(restaurant);
        dbHelper.trackCreatedRestaurant(response.body.data.id);
      }
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
    let restaurantId;

    beforeEach(async () => {
      const restaurantData = testDataFactory.createRestaurantData();
      const response = await request(app).post('/api/restaurants').send(restaurantData);
      restaurantId = response.body.data.id;
      dbHelper.trackCreatedRestaurant(restaurantId);
    });

    it('should get restaurant by valid ID', async () => {
      const response = await request(app).get(`/api/restaurants/${restaurantId}`).expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Restaurant retrieved successfully');
      expect(response.body.data.id).toBe(restaurantId);
    });

    it('should return 404 for non-existent restaurant', async () => {
      const nonExistentId = '550e8400-e29b-41d4-a716-446655440000';
      const response = await request(app).get(`/api/restaurants/${nonExistentId}`).expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Restaurant not found');
    });

    it('should return 400 for invalid UUID format', async () => {
      const response = await request(app).get('/api/restaurants/invalid-uuid').expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Validation failed');
    });
  });

  describe('GET /api/restaurants/by-url/:urlName', () => {
    let restaurantData;

    beforeEach(async () => {
      restaurantData = testDataFactory.createRestaurantData();
      const response = await request(app).post('/api/restaurants').send(restaurantData);
      dbHelper.trackCreatedRestaurant(response.body.data.id);
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
    let restaurantId;

    beforeEach(async () => {
      const restaurantData = testDataFactory.createRestaurantData();
      const response = await request(app).post('/api/restaurants').send(restaurantData);
      restaurantId = response.body.data.id;
      dbHelper.trackCreatedRestaurant(restaurantId);
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
      const nonExistentId = '550e8400-e29b-41d4-a716-446655440000';
      const updateData = { name: 'Updated Name' };

      const response = await request(app)
        .put(`/api/restaurants/${nonExistentId}`)
        .send(updateData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Restaurant not found');
    });

    it('should return 409 for duplicate URL name', async () => {
      // Create another restaurant
      const anotherRestaurant = testDataFactory.createRestaurantData();
      const anotherResponse = await request(app).post('/api/restaurants').send(anotherRestaurant);
      dbHelper.trackCreatedRestaurant(anotherResponse.body.data.id);

      // Try to update first restaurant with second restaurant's URL name
      const updateData = { restaurant_url_name: anotherRestaurant.restaurant_url_name };

      const response = await request(app)
        .put(`/api/restaurants/${restaurantId}`)
        .send(updateData)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('URL name is already taken');
    });
  });

  describe('DELETE /api/restaurants/:id', () => {
    let restaurantId;

    beforeEach(async () => {
      const restaurantData = testDataFactory.createRestaurantData();
      const response = await request(app).post('/api/restaurants').send(restaurantData);
      restaurantId = response.body.data.id;
      dbHelper.trackCreatedRestaurant(restaurantId);
    });

    it('should delete restaurant successfully', async () => {
      const response = await request(app).delete(`/api/restaurants/${restaurantId}`).expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Restaurant deleted successfully');

      // Verify restaurant is deleted
      await request(app).get(`/api/restaurants/${restaurantId}`).expect(404);
    });

    it('should return 404 for non-existent restaurant', async () => {
      const nonExistentId = '550e8400-e29b-41d4-a716-446655440000';

      const response = await request(app).delete(`/api/restaurants/${nonExistentId}`).expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Restaurant not found');
    });
  });

  describe('GET /api/restaurants/:id/stats', () => {
    let restaurantId;

    beforeEach(async () => {
      const restaurantData = testDataFactory.createRestaurantData();
      const response = await request(app).post('/api/restaurants').send(restaurantData);
      restaurantId = response.body.data.id;
      dbHelper.trackCreatedRestaurant(restaurantId);
    });

    it('should get restaurant statistics', async () => {
      const response = await request(app).get(`/api/restaurants/${restaurantId}/stats`).expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Restaurant statistics retrieved successfully');
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('restaurant_name');
      expect(response.body.data).toHaveProperty('location_count');
    });

    it('should return 404 for non-existent restaurant', async () => {
      const nonExistentId = '550e8400-e29b-41d4-a716-446655440000';

      const response = await request(app)
        .get(`/api/restaurants/${nonExistentId}/stats`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Restaurant not found');
    });
  });

  describe('GET /api/restaurants/check-url/:urlName', () => {
    beforeEach(async () => {
      const restaurantData = testDataFactory.createRestaurantData({
        restaurant_url_name: 'existing-restaurant',
      });
      const response = await request(app).post('/api/restaurants').send(restaurantData);
      dbHelper.trackCreatedRestaurant(response.body.data.id);
    });

    it('should return available for non-existent URL name', async () => {
      const response = await request(app)
        .get('/api/restaurants/check-url/available-url')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.available).toBe(true);
      expect(response.body.message).toBe('URL name is available');
    });

    it('should return not available for existing URL name', async () => {
      const response = await request(app)
        .get('/api/restaurants/check-url/existing-restaurant')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.available).toBe(false);
      expect(response.body.message).toBe('URL name is already taken');
    });
  });
});
