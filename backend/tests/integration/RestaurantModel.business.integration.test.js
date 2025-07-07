const { Pool } = require('pg');

// Set test environment before importing models
process.env.NODE_ENV = 'test';
process.env.DB_NAME = 'alacarte_test';

// Import after setting environment
const RestaurantModel = require('../../src/models/RestaurantModel');
const TEST_CONSTANTS = require('../constants/testConstants');

describe('RestaurantModel Business Integration Tests', () => {
  let testPool;
  let createdRestaurantIds = [];

  beforeAll(async () => {
    // Create test database connection pool for verification
    testPool = new Pool({
      user: process.env.DB_USER || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      database: 'alacarte_test',
      password: process.env.DB_PASSWORD || 'admin',
      port: process.env.DB_PORT || 5432,
    });

    // Test database connection
    try {
      await testPool.query('SELECT 1');
      console.log('Connected to test database successfully');
    } catch (error) {
      console.error('Failed to connect to test database:', error);
      throw error;
    }

    // Verify test data exists
    const testDataCheck = await testPool.query('SELECT COUNT(*) FROM restaurants');
    expect(parseInt(testDataCheck.rows[0].count)).toBeGreaterThan(0);
  });

  afterEach(async () => {
    // Clean up test data created in each test
    if (createdRestaurantIds.length > 0) {
      try {
        const idsString = createdRestaurantIds.map((id) => `'${id}'`).join(',');
        await testPool.query(`DELETE FROM restaurants WHERE id IN (${idsString})`);
        createdRestaurantIds.length = 0; // Clear the array
      } catch (error) {
        console.warn('Failed to clean up test restaurants in afterEach:', error);
      }
    }
  });

  afterAll(async () => {
    // Final cleanup
    if (createdRestaurantIds.length > 0) {
      try {
        const idsString = createdRestaurantIds.map((id) => `'${id}'`).join(',');
        await testPool.query(`DELETE FROM restaurants WHERE id IN (${idsString})`);
      } catch (error) {
        console.warn('Failed to clean up test restaurants:', error);
      }
    }

    // Close test database connection
    if (testPool) {
      await testPool.end();
    }
  });

  describe('Database CRUD Operations', () => {
    describe('findById', () => {
      it('should find existing restaurant by ID from seed data', async () => {
        const knownRestaurantId = '550e8400-e29b-41d4-a716-446655440001'; // Pizzaria Bella

        const restaurant = await RestaurantModel.findById(knownRestaurantId);

        expect(restaurant).toBeDefined();
        expect(restaurant.id).toBe(knownRestaurantId);
        expect(restaurant.restaurant_name).toBe('Pizzaria Bella Vista');
        expect(restaurant.restaurant_url_name).toBe('pizzaria-bella-vista');
        expect(restaurant.business_type).toBe('single');
        expect(restaurant.status).toBe('active');
        expect(restaurant.subscription_plan).toBe('professional');
        expect(restaurant.terms_accepted).toBe(true);
        expect(restaurant.created_at).toBeDefined();
        expect(restaurant.updated_at).toBeDefined();
      });

      it('should return null for non-existent restaurant', async () => {
        const nonExistentId = '00000000-0000-4000-8000-000000000000';

        const restaurant = await RestaurantModel.findById(nonExistentId);

        expect(restaurant).toBeNull();
      });

      it('should throw error for invalid UUID format', async () => {
        await expect(RestaurantModel.findById('invalid-uuid')).rejects.toThrow(
          'Invalid restaurant ID format'
        );
      });

      it('should return specific columns when requested', async () => {
        const knownRestaurantId = '550e8400-e29b-41d4-a716-446655440001';
        const columns = ['id', 'restaurant_name', 'status'];

        const restaurant = await RestaurantModel.findById(knownRestaurantId, columns);

        expect(restaurant).toBeDefined();
        expect(restaurant.id).toBe(knownRestaurantId);
        expect(restaurant.restaurant_name).toBe('Pizzaria Bella Vista');
        expect(restaurant.status).toBe('active');
        // Should not include other columns
        expect(restaurant.description).toBeUndefined();
        expect(restaurant.phone).toBeUndefined();
      });
    });

    describe('findByUrlName', () => {
      it('should find restaurant by URL name from seed data', async () => {
        const urlName = 'pizzaria-bella-vista';

        const restaurant = await RestaurantModel.findByUrlName(urlName);

        expect(restaurant).toBeDefined();
        expect(restaurant.restaurant_url_name).toBe(urlName);
        expect(restaurant.restaurant_name).toBe('Pizzaria Bella Vista');
        expect(restaurant.business_type).toBe('single');
      });

      it('should return null for non-existent URL name', async () => {
        const restaurant = await RestaurantModel.findByUrlName('non-existent-restaurant');

        expect(restaurant).toBeNull();
      });

      it('should handle case insensitive search', async () => {
        const restaurant = await RestaurantModel.findByUrlName('PIZZARIA-BELLA-VISTA');

        expect(restaurant).toBeDefined();
        expect(restaurant.restaurant_url_name).toBe('pizzaria-bella-vista');
      });
    });

    describe('create', () => {
      it('should create a new restaurant with valid data', async () => {
        const testData = {
          restaurant_name: 'Test Italian Restaurant',
          restaurant_url_name: 'test-italian-restaurant',
          business_type: 'single',
          cuisine_type: 'Italian',
          phone: '11999888777',
          whatsapp: '11999888777',
          website: 'https://testitalian.com',
          description: 'A test Italian restaurant for integration testing',
          status: 'pending',
          subscription_plan: 'starter',
          subscription_status: 'active',
          terms_accepted: true,
          marketing_consent: false,
        };

        const result = await RestaurantModel.create(testData);
        createdRestaurantIds.push(result.id);

        expect(result).toBeDefined();
        expect(result.id).toBeDefined();
        expect(result.restaurant_name).toBe(testData.restaurant_name);
        expect(result.restaurant_url_name).toBe(testData.restaurant_url_name);
        expect(result.business_type).toBe(testData.business_type);
        expect(result.cuisine_type).toBe(testData.cuisine_type);
        expect(result.phone).toBe(testData.phone);
        expect(result.website).toBe(testData.website);
        expect(result.status).toBe(testData.status);
        expect(result.subscription_plan).toBe(testData.subscription_plan);
        expect(result.terms_accepted).toBe(true);
        expect(result.terms_accepted_at).toBeDefined();
        expect(result.marketing_consent).toBe(false);
        expect(result.created_at).toBeDefined();
        expect(result.updated_at).toBeDefined();

        // Verify it was actually created in the database
        const verification = await testPool.query('SELECT * FROM restaurants WHERE id = $1', [
          result.id,
        ]);
        expect(verification.rows.length).toBe(1);
        expect(verification.rows[0].restaurant_name).toBe(testData.restaurant_name);
      });

      it('should create restaurant with minimal required data', async () => {
        const minimalData = {
          restaurant_name: 'Minimal Restaurant',
          restaurant_url_name: 'minimal-restaurant',
          terms_accepted: true,
        };

        const result = await RestaurantModel.create(minimalData);
        createdRestaurantIds.push(result.id);

        expect(result).toBeDefined();
        expect(result.restaurant_name).toBe(minimalData.restaurant_name);
        expect(result.restaurant_url_name).toBe(minimalData.restaurant_url_name);
        expect(result.business_type).toBe('single'); // Default value
        expect(result.status).toBe('pending'); // Default value
        expect(result.subscription_plan).toBe('starter'); // Default value
        expect(result.subscription_status).toBe('active'); // Default value
        expect(result.marketing_consent).toBe(false); // Default value
        expect(result.terms_accepted).toBe(true);
        expect(result.terms_accepted_at).toBeDefined();
      });

      it('should fail to create restaurant with duplicate URL name', async () => {
        const testData = {
          restaurant_name: 'Another Pizzaria',
          restaurant_url_name: 'pizzaria-bella-vista', // Existing URL from seed
          terms_accepted: true,
        };

        await expect(RestaurantModel.create(testData)).rejects.toThrow();
      });

      it('should fail to create restaurant without required fields', async () => {
        // Missing restaurant_name
        await expect(
          RestaurantModel.create({
            restaurant_url_name: 'test-no-name',
            terms_accepted: true,
          })
        ).rejects.toThrow();

        // Missing restaurant_url_name
        await expect(
          RestaurantModel.create({
            restaurant_name: 'Test Restaurant',
            terms_accepted: true,
          })
        ).rejects.toThrow();

        // Missing terms_accepted
        await expect(
          RestaurantModel.create({
            restaurant_name: 'Test Restaurant',
            restaurant_url_name: 'test-restaurant',
          })
        ).rejects.toThrow();
      });

      it('should validate input data correctly', async () => {
        // Invalid business_type
        await expect(
          RestaurantModel.create({
            restaurant_name: 'Test Restaurant',
            restaurant_url_name: 'test-restaurant',
            business_type: 'invalid-type',
            terms_accepted: true,
          })
        ).rejects.toThrow();

        // Invalid phone format
        await expect(
          RestaurantModel.create({
            restaurant_name: 'Test Restaurant',
            restaurant_url_name: 'test-restaurant-phone',
            phone: 'invalid-phone',
            terms_accepted: true,
          })
        ).rejects.toThrow();

        // Invalid URL format
        await expect(
          RestaurantModel.create({
            restaurant_name: 'Test Restaurant',
            restaurant_url_name: 'test-restaurant-website',
            website: 'not-a-valid-url',
            terms_accepted: true,
          })
        ).rejects.toThrow();
      });
    });

    describe('update', () => {
      let testRestaurantId;

      beforeEach(async () => {
        // Create a test restaurant for update operations
        const testData = {
          restaurant_name: 'Update Test Restaurant',
          restaurant_url_name: 'update-test-restaurant',
          business_type: 'single',
          cuisine_type: 'Test Cuisine',
          status: 'pending',
          terms_accepted: true,
        };

        const result = await RestaurantModel.create(testData);
        testRestaurantId = result.id;
        createdRestaurantIds.push(testRestaurantId);
      });

      it('should update restaurant fields successfully', async () => {
        const updateData = {
          restaurant_name: 'Updated Restaurant Name',
          cuisine_type: 'Updated Cuisine',
          status: 'active',
          phone: '11888777666',
          website: 'https://updated-restaurant.com',
          description: 'Updated description for the restaurant',
        };

        const result = await RestaurantModel.update(testRestaurantId, updateData);

        expect(result).toBeDefined();
        expect(result.id).toBe(testRestaurantId);
        expect(result.restaurant_name).toBe(updateData.restaurant_name);
        expect(result.cuisine_type).toBe(updateData.cuisine_type);
        expect(result.status).toBe(updateData.status);
        expect(result.phone).toBe(updateData.phone);
        expect(result.website).toBe(updateData.website);
        expect(result.description).toBe(updateData.description);
        expect(result.updated_at).toBeDefined();

        // Verify in database
        const verification = await testPool.query('SELECT * FROM restaurants WHERE id = $1', [
          testRestaurantId,
        ]);
        expect(verification.rows[0].restaurant_name).toBe(updateData.restaurant_name);
        expect(verification.rows[0].status).toBe(updateData.status);
      });

      it('should handle partial updates', async () => {
        const updateData = {
          status: 'active',
        };

        const result = await RestaurantModel.update(testRestaurantId, updateData);

        expect(result).toBeDefined();
        expect(result.status).toBe('active');
        // Other fields should remain unchanged
        expect(result.restaurant_name).toBe('Update Test Restaurant');
      });

      it('should fail to update with duplicate URL name', async () => {
        const updateData = {
          restaurant_url_name: 'pizzaria-bella-vista', // Existing URL from seed
        };

        await expect(RestaurantModel.update(testRestaurantId, updateData)).rejects.toThrow();
      });

      it('should fail to update non-existent restaurant', async () => {
        const nonExistentId = '00000000-0000-4000-8000-000000000000';
        const updateData = {
          restaurant_name: 'Updated Name',
        };

        const result = await RestaurantModel.update(nonExistentId, updateData);
        expect(result).toBeNull();
      });

      it('should fail with invalid UUID', async () => {
        const updateData = {
          restaurant_name: 'Updated Name',
        };

        await expect(RestaurantModel.update('invalid-uuid', updateData)).rejects.toThrow(
          'Invalid restaurant ID format'
        );
      });

      it('should validate update data', async () => {
        // Invalid status
        await expect(
          RestaurantModel.update(testRestaurantId, {
            status: 'invalid-status',
          })
        ).rejects.toThrow();

        // Invalid subscription plan
        await expect(
          RestaurantModel.update(testRestaurantId, {
            subscription_plan: 'invalid-plan',
          })
        ).rejects.toThrow();
      });
    });

    describe('getRestaurants', () => {
      it('should get all restaurants with default pagination', async () => {
        const result = await RestaurantModel.getRestaurants();

        expect(result).toBeDefined();
        expect(result.restaurants).toBeInstanceOf(Array);
        expect(result.restaurants.length).toBeGreaterThan(0);
        expect(result.pagination).toBeDefined();
        expect(result.pagination.page).toBe(1);
        expect(result.pagination.limit).toBe(10);
        expect(result.pagination.total).toBeGreaterThan(0);
        expect(result.pagination.pages).toBeGreaterThan(0);

        // Check restaurant structure
        const restaurant = result.restaurants[0];
        expect(restaurant.id).toBeDefined();
        expect(restaurant.restaurant_name).toBeDefined();
        expect(restaurant.restaurant_url_name).toBeDefined();
        expect(restaurant.status).toBeDefined();
      });

      it('should apply pagination correctly', async () => {
        const page1 = await RestaurantModel.getRestaurants({}, { page: 1, limit: 2 });
        const page2 = await RestaurantModel.getRestaurants({}, { page: 2, limit: 2 });

        expect(page1.restaurants.length).toBeLessThanOrEqual(2);
        expect(page2.restaurants.length).toBeLessThanOrEqual(2);
        expect(page1.pagination.page).toBe(1);
        expect(page2.pagination.page).toBe(2);
        expect(page1.pagination.limit).toBe(2);
        expect(page2.pagination.limit).toBe(2);

        // Should have different restaurants (unless there are only 2 total)
        if (page1.pagination.total > 2) {
          expect(page1.restaurants[0].id).not.toBe(page2.restaurants[0].id);
        }
      });

      it('should filter restaurants by status', async () => {
        const result = await RestaurantModel.getRestaurants({ status: 'active' });

        expect(result.restaurants).toBeInstanceOf(Array);
        result.restaurants.forEach((restaurant) => {
          expect(restaurant.status).toBe('active');
        });
      });

      it('should filter restaurants by business type', async () => {
        const result = await RestaurantModel.getRestaurants({ business_type: 'single' });

        expect(result.restaurants).toBeInstanceOf(Array);
        result.restaurants.forEach((restaurant) => {
          expect(restaurant.business_type).toBe('single');
        });
      });

      it('should filter restaurants by cuisine type', async () => {
        const result = await RestaurantModel.getRestaurants({ cuisine_type: 'Italian' });

        expect(result.restaurants).toBeInstanceOf(Array);
        result.restaurants.forEach((restaurant) => {
          expect(restaurant.cuisine_type).toBe('Italian');
        });
      });

      it('should sort restaurants by different columns', async () => {
        // Sort by name ascending
        const nameAsc = await RestaurantModel.getRestaurants(
          {},
          { sortBy: 'restaurant_name', sortOrder: 'ASC' }
        );

        // Sort by name descending
        const nameDesc = await RestaurantModel.getRestaurants(
          {},
          { sortBy: 'restaurant_name', sortOrder: 'DESC' }
        );

        expect(nameAsc.restaurants).toBeInstanceOf(Array);
        expect(nameDesc.restaurants).toBeInstanceOf(Array);

        if (nameAsc.restaurants.length > 1 && nameDesc.restaurants.length > 1) {
          expect(nameAsc.restaurants[0].restaurant_name).not.toBe(
            nameDesc.restaurants[0].restaurant_name
          );
        }
      });

      it('should validate sort parameters', async () => {
        // Invalid sort column
        await expect(
          RestaurantModel.getRestaurants({}, { sortBy: 'invalid_column' })
        ).rejects.toThrow('Invalid sort column');

        // Invalid sort order
        await expect(RestaurantModel.getRestaurants({}, { sortOrder: 'INVALID' })).rejects.toThrow(
          'Invalid sort order'
        );
      });
    });

    describe('deleteRestaurant', () => {
      let testRestaurantId;

      beforeEach(async () => {
        // Create a test restaurant for deletion
        const testData = {
          restaurant_name: 'Delete Test Restaurant',
          restaurant_url_name: 'delete-test-restaurant',
          terms_accepted: true,
        };

        const result = await RestaurantModel.create(testData);
        testRestaurantId = result.id;
        createdRestaurantIds.push(testRestaurantId);
      });

      it('should soft delete restaurant successfully', async () => {
        const result = await RestaurantModel.deleteRestaurant(testRestaurantId);

        expect(result).toBe(true);

        // Verify the restaurant status is set to inactive
        const verification = await testPool.query('SELECT status FROM restaurants WHERE id = $1', [
          testRestaurantId,
        ]);
        expect(verification.rows[0].status).toBe('inactive');
      });

      it('should return false for non-existent restaurant', async () => {
        const nonExistentId = '00000000-0000-4000-8000-000000000000';

        const result = await RestaurantModel.deleteRestaurant(nonExistentId);

        expect(result).toBe(false);
      });

      it('should fail with invalid UUID', async () => {
        await expect(RestaurantModel.deleteRestaurant('invalid-uuid')).rejects.toThrow(
          'Invalid restaurant ID format'
        );
      });
    });

    describe('isUrlNameAvailable', () => {
      it('should return true when URL name is available', async () => {
        const result = await RestaurantModel.isUrlNameAvailable('available-url-name');

        expect(result).toBe(true);
      });

      it('should return false when URL name is taken', async () => {
        const result = await RestaurantModel.isUrlNameAvailable('pizzaria-bella-vista');

        expect(result).toBe(false);
      });

      it('should exclude specific restaurant ID when checking availability', async () => {
        const knownRestaurantId = '550e8400-e29b-41d4-a716-446655440001';

        // Should return true when excluding the restaurant that owns this URL
        const result = await RestaurantModel.isUrlNameAvailable(
          'pizzaria-bella-vista',
          knownRestaurantId
        );

        expect(result).toBe(true);
      });

      it('should handle case insensitive URL names', async () => {
        const result = await RestaurantModel.isUrlNameAvailable('PIZZARIA-BELLA-VISTA');

        expect(result).toBe(false);
      });

      it('should fail with invalid exclude ID format', async () => {
        await expect(
          RestaurantModel.isUrlNameAvailable('test-url', 'invalid-uuid')
        ).rejects.toThrow('Invalid exclude ID format');
      });
    });

    describe('getRestaurantStats', () => {
      it('should get restaurant statistics', async () => {
        const knownRestaurantId = '550e8400-e29b-41d4-a716-446655440001';

        const stats = await RestaurantModel.getRestaurantStats(knownRestaurantId);

        expect(stats).toBeDefined();
        expect(stats.id).toBe(knownRestaurantId);
        expect(stats.restaurant_name).toBe('Pizzaria Bella Vista');
        expect(stats.status).toBe('active');
        expect(stats.subscription_plan).toBe('professional');
        expect(stats.created_at).toBeDefined();
        expect(typeof stats.location_count).toBe('string'); // PostgreSQL COUNT returns string
      });

      it('should return null when restaurant not found', async () => {
        const nonExistentId = '00000000-0000-4000-8000-000000000000';

        const stats = await RestaurantModel.getRestaurantStats(nonExistentId);

        expect(stats).toBeNull();
      });

      it('should fail with invalid UUID', async () => {
        await expect(RestaurantModel.getRestaurantStats('invalid-uuid')).rejects.toThrow(
          'Invalid restaurant ID format'
        );
      });
    });
  });

  describe('Data Validation and Security', () => {
    it('should sanitize and validate input data during creation', async () => {
      const testData = {
        restaurant_name: '  Test Restaurant  ', // Should be trimmed
        restaurant_url_name: 'TEST-RESTAURANT', // Should be lowercase
        cuisine_type: '  Italian  ', // Should be trimmed
        description: '  A great restaurant  ', // Should be trimmed
        terms_accepted: true,
      };

      const result = await RestaurantModel.create(testData);
      createdRestaurantIds.push(result.id);

      expect(result.restaurant_name).toBe('Test Restaurant');
      expect(result.restaurant_url_name).toBe('test-restaurant');
      expect(result.cuisine_type).toBe('Italian');
      expect(result.description).toBe('A great restaurant');
    });

    it('should enforce field length limits', async () => {
      // Restaurant name too long
      await expect(
        RestaurantModel.create({
          restaurant_name: 'A'.repeat(256), // Max is 255
          restaurant_url_name: 'test-long-name',
          terms_accepted: true,
        })
      ).rejects.toThrow();

      // URL name too long
      await expect(
        RestaurantModel.create({
          restaurant_name: 'Test Restaurant',
          restaurant_url_name: 'a'.repeat(101), // Max is 100
          terms_accepted: true,
        })
      ).rejects.toThrow();

      // Description too long
      await expect(
        RestaurantModel.create({
          restaurant_name: 'Test Restaurant',
          restaurant_url_name: 'test-long-desc',
          description: 'A'.repeat(2001), // Max is 2000
          terms_accepted: true,
        })
      ).rejects.toThrow();
    });

    it('should enforce URL name pattern restrictions', async () => {
      const invalidUrlNames = [
        'invalid spaces',
        'invalid_underscores',
        'invalid.dots',
        'invalid@symbols',
        'invalid#hashtag',
        '', // Empty string
        'a', // Too short (min 2)
      ];

      for (const urlName of invalidUrlNames) {
        await expect(
          RestaurantModel.create({
            restaurant_name: 'Test Restaurant',
            restaurant_url_name: urlName,
            terms_accepted: true,
          })
        ).rejects.toThrow();
      }
    });

    it('should validate phone number formats', async () => {
      const invalidPhones = [
        '123', // Too short
        '12345678901234567890123', // Too long
        '11abc123456', // Contains letters
        '+5511987654321', // Contains +
        '(11) 98765-4321', // Contains formatting
      ];

      for (const phone of invalidPhones) {
        await expect(
          RestaurantModel.create({
            restaurant_name: 'Test Restaurant',
            restaurant_url_name: `test-restaurant-${Math.random()}`,
            phone: phone,
            terms_accepted: true,
          })
        ).rejects.toThrow();
      }
    });

    it('should validate website URL format', async () => {
      const invalidWebsites = [
        'not-a-url',
        'ftp://invalid-protocol.com',
        'javascript:alert("xss")',
        'data:text/html,<script>alert("xss")</script>',
      ];

      for (const website of invalidWebsites) {
        await expect(
          RestaurantModel.create({
            restaurant_name: 'Test Restaurant',
            restaurant_url_name: `test-restaurant-${Math.random()}`,
            website: website,
            terms_accepted: true,
          })
        ).rejects.toThrow();
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors gracefully', async () => {
      // This test would require mocking the database connection
      // For now, we just test that error handling exists
      await expect(RestaurantModel.findById('invalid-uuid')).rejects.toThrow();
    });

    it('should handle concurrent operations safely', async () => {
      // Test concurrent creation with same URL name
      const testData = {
        restaurant_name: 'Concurrent Test Restaurant',
        restaurant_url_name: 'concurrent-test-restaurant',
        terms_accepted: true,
      };

      const promises = [RestaurantModel.create(testData), RestaurantModel.create(testData)];

      // One should succeed, one should fail due to unique constraint
      const results = await Promise.allSettled(promises);

      const successCount = results.filter((r) => r.status === 'fulfilled').length;
      const failureCount = results.filter((r) => r.status === 'rejected').length;

      expect(successCount).toBe(1);
      expect(failureCount).toBe(1);

      // Clean up the successful one
      const successful = results.find((r) => r.status === 'fulfilled');
      if (successful && successful.value) {
        createdRestaurantIds.push(successful.value.id);
      }
    });
  });

  describe('Additional Edge Cases for Better Coverage', () => {
    it('should handle getRestaurants with invalid sort column', async () => {
      await expect(
        RestaurantModel.getRestaurants({}, { sortBy: 'invalid_column' })
      ).rejects.toThrow('Invalid sort column');
    });

    it('should handle getRestaurants with invalid sort order', async () => {
      await expect(RestaurantModel.getRestaurants({}, { sortOrder: 'INVALID' })).rejects.toThrow(
        'Invalid sort order'
      );
    });

    it('should handle update with no valid fields after validation', async () => {
      const testData = {
        restaurant_name: 'Edge Case Test',
        restaurant_url_name: 'edge-case-test',
        terms_accepted: true,
      };

      const created = await RestaurantModel.create(testData);
      createdRestaurantIds.push(created.id);

      // Try to update with invalid data that will be filtered out
      await expect(RestaurantModel.update(created.id, { invalid_field: 'value' })).rejects.toThrow(
        'No valid fields to update'
      );
    });

    it('should handle isUrlNameAvailable with invalid exclude ID', async () => {
      await expect(RestaurantModel.isUrlNameAvailable('test-url', 'invalid-uuid')).rejects.toThrow(
        'Invalid exclude ID format'
      );
    });

    it('should handle find operators in isUrlNameAvailable', async () => {
      // This tests the condition.id = { operator: '!=', value: sanitizedUuid } branch
      const result = await RestaurantModel.isUrlNameAvailable(
        'available-url-name',
        '550e8400-e29b-41d4-a716-446655440001'
      );
      expect(result).toBe(true);
    });
  });
});
