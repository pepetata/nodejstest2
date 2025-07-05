const TestDataFactory = require('../helpers/testDataFactory');
const DatabaseTestHelper = require('../helpers/databaseTestHelper');
const TEST_CONSTANTS = require('../constants/testConstants');

// Set test environment before importing models
process.env.NODE_ENV = 'test';
process.env.DB_NAME = 'alacarte_test';

// Import after setting environment
const RestaurantModel = require('../../src/models/RestaurantModel');

describe('RestaurantModel Integration Tests', () => {
  let dbHelper;
  let restaurantModel;

  beforeAll(async () => {
    // Initialize database helper
    dbHelper = new DatabaseTestHelper();
    await dbHelper.init();

    // Verify seed data exists
    await dbHelper.verifySeedData();

    restaurantModel = RestaurantModel;
    console.log('Connected to test database successfully');
  }, TEST_CONSTANTS.TIMEOUTS.DATABASE_OPERATION);

  afterEach(async () => {
    // Clean up any created test data
    await dbHelper.cleanupCreatedRestaurants();
  });

  afterAll(async () => {
    // Final cleanup and close connections
    await dbHelper.cleanupCreatedRestaurants();
    await dbHelper.close();
  });

  describe('Database CRUD Operations', () => {
    describe('findById', () => {
      it('should find existing restaurant by ID from seed data', async () => {
        const {
          PIZZARIA_BELLA_ID,
          PIZZARIA_BELLA_NAME,
          PIZZARIA_BELLA_OWNER,
          PIZZARIA_BELLA_EMAIL,
        } = TEST_CONSTANTS.SEED_DATA;

        const restaurant = await restaurantModel.findById(PIZZARIA_BELLA_ID);

        expect(restaurant).toBeDefined();
        expect(restaurant.id).toBe(PIZZARIA_BELLA_ID);
        expect(restaurant.restaurant_name).toBe(PIZZARIA_BELLA_NAME);
        expect(restaurant.owner_name).toBe(PIZZARIA_BELLA_OWNER);
        expect(restaurant.email).toBe(PIZZARIA_BELLA_EMAIL);
        expect(restaurant.status).toBe(TEST_CONSTANTS.STATUS.ACTIVE);
        expect(restaurant.password).toBeUndefined(); // Should not include password by default
      });

      it('should return null for non-existent restaurant', async () => {
        const restaurant = await restaurantModel.findById(
          TEST_CONSTANTS.TEST_VALUES.NON_EXISTENT_UUID
        );
        expect(restaurant).toBeNull();
      });

      it('should include password when requested with specific columns', async () => {
        const restaurant = await restaurantModel.findById(
          TEST_CONSTANTS.SEED_DATA.PIZZARIA_BELLA_ID,
          ['id', 'email', 'password']
        );

        expect(restaurant).toBeDefined();
        expect(restaurant.id).toBeDefined();
        expect(restaurant.email).toBeDefined();
        expect(restaurant.password).toBeDefined();
        expect(restaurant.password).toMatch(TEST_CONSTANTS.TEST_VALUES.BCRYPT_HASH_PATTERN);
      });
    });

    describe('findByEmail', () => {
      it('should find restaurant by email from seed data', async () => {
        const { PIZZARIA_BELLA_EMAIL, PIZZARIA_BELLA_NAME } = TEST_CONSTANTS.SEED_DATA;

        const restaurant = await restaurantModel.findByEmail(PIZZARIA_BELLA_EMAIL);

        expect(restaurant).toBeDefined();
        expect(restaurant.email).toBe(PIZZARIA_BELLA_EMAIL);
        expect(restaurant.restaurant_name).toBe(PIZZARIA_BELLA_NAME);
        expect(restaurant.password).toBeUndefined();
      });

      it('should find restaurant by email with password when requested', async () => {
        const restaurant = await restaurantModel.findByEmail(
          TEST_CONSTANTS.SEED_DATA.PIZZARIA_BELLA_EMAIL,
          true
        );

        expect(restaurant).toBeDefined();
        expect(restaurant.email).toBe(TEST_CONSTANTS.SEED_DATA.PIZZARIA_BELLA_EMAIL);
        expect(restaurant.password).toBeDefined();
        expect(restaurant.password).toMatch(TEST_CONSTANTS.TEST_VALUES.BCRYPT_HASH_PATTERN);
      });

      it('should return null for non-existent email', async () => {
        const restaurant = await restaurantModel.findByEmail(
          TEST_CONSTANTS.TEST_VALUES.NON_EXISTENT_EMAIL
        );
        expect(restaurant).toBeNull();
      });

      it('should handle email case insensitivity', async () => {
        const uppercaseEmail = TEST_CONSTANTS.SEED_DATA.PIZZARIA_BELLA_EMAIL.toUpperCase();

        const restaurant = await restaurantModel.findByEmail(uppercaseEmail);

        expect(restaurant).toBeDefined();
        expect(restaurant.email).toBe(TEST_CONSTANTS.SEED_DATA.PIZZARIA_BELLA_EMAIL);
      });
    });

    describe('findByUrlName', () => {
      it('should find restaurant by URL name from seed data', async () => {
        const { PIZZARIA_BELLA_URL, PIZZARIA_BELLA_NAME } = TEST_CONSTANTS.SEED_DATA;

        const restaurant = await restaurantModel.findByUrlName(PIZZARIA_BELLA_URL);

        expect(restaurant).toBeDefined();
        expect(restaurant.restaurant_url_name).toBe(PIZZARIA_BELLA_URL);
        expect(restaurant.restaurant_name).toBe(PIZZARIA_BELLA_NAME);
      });

      it('should return null for non-existent URL name', async () => {
        const restaurant = await restaurantModel.findByUrlName(
          TEST_CONSTANTS.TEST_VALUES.NON_EXISTENT_URL_NAME
        );
        expect(restaurant).toBeNull();
      });
    });

    describe('authenticate', () => {
      it('should authenticate with correct credentials from seed data', async () => {
        const { PIZZARIA_BELLA_EMAIL, PIZZARIA_BELLA_PASSWORD } = TEST_CONSTANTS.SEED_DATA;

        const result = await restaurantModel.authenticate(
          PIZZARIA_BELLA_EMAIL,
          PIZZARIA_BELLA_PASSWORD
        );

        expect(result).toBeDefined();
        expect(result).not.toBeNull();
        expect(result.email).toBe(PIZZARIA_BELLA_EMAIL);
        expect(result.password).toBeUndefined();
      });

      it('should fail authentication with incorrect password', async () => {
        const result = await restaurantModel.authenticate(
          TEST_CONSTANTS.SEED_DATA.PIZZARIA_BELLA_EMAIL,
          'wrongpassword'
        );

        expect(result).toBeNull();
      });

      it('should fail authentication with non-existent email', async () => {
        const result = await restaurantModel.authenticate(
          TEST_CONSTANTS.TEST_VALUES.NON_EXISTENT_EMAIL,
          'anypassword'
        );

        expect(result).toBeNull();
      });
    });

    describe('create', () => {
      it('should create a new restaurant with valid data', async () => {
        const testData = TestDataFactory.createRestaurantData();

        const result = await restaurantModel.create(testData);
        dbHelper.trackCreatedRestaurant(result.id);

        // Verify returned data
        expect(result).toBeDefined();
        expect(result.id).toBeDefined();
        expect(result.owner_name).toBe(testData.owner_name);
        expect(result.email).toBe(testData.email.toLowerCase());
        expect(result.restaurant_name).toBe(testData.restaurant_name);
        expect(result.restaurant_url_name).toBe(testData.restaurant_url_name);
        expect(result.email_confirmed).toBe(false);
        expect(result.email_confirmation_token).toBeDefined();
        expect(result.status).toBe(TEST_CONSTANTS.STATUS.PENDING);
        expect(result.password).toBeUndefined();

        // Verify in database
        const dbResult = await dbHelper.getRestaurantById(result.id);
        expect(dbResult).toBeDefined();
        expect(dbResult.password).toMatch(TEST_CONSTANTS.TEST_VALUES.BCRYPT_HASH_PATTERN);
      });

      it('should create restaurant with minimal required data', async () => {
        const testData = TestDataFactory.createMinimalRestaurantData();

        const result = await restaurantModel.create(testData);
        dbHelper.trackCreatedRestaurant(result.id);

        expect(result).toBeDefined();
        expect(result.id).toBeDefined();
        expect(result.business_type).toBe(TEST_CONSTANTS.BUSINESS_TYPES.SINGLE); // Default value
        expect(result.subscription_plan).toBe(TEST_CONSTANTS.SUBSCRIPTION_PLANS.STARTER); // Default value
      });

      it('should fail to create restaurant with duplicate email', async () => {
        const testData = TestDataFactory.createRestaurantData({
          email: TEST_CONSTANTS.SEED_DATA.PIZZARIA_BELLA_EMAIL,
        });

        await expect(restaurantModel.create(testData)).rejects.toThrow(
          TEST_CONSTANTS.ERROR_MESSAGES.DUPLICATE_EMAIL
        );
      });

      it('should fail to create restaurant with duplicate URL name', async () => {
        const testData = TestDataFactory.createRestaurantData({
          restaurant_url_name: TEST_CONSTANTS.SEED_DATA.PIZZARIA_BELLA_URL,
        });

        await expect(restaurantModel.create(testData)).rejects.toThrow(
          TEST_CONSTANTS.ERROR_MESSAGES.DUPLICATE_URL_NAME
        );
      });
    });

    describe('update', () => {
      let testRestaurant;

      beforeEach(async () => {
        const testData = TestDataFactory.createRestaurantData();
        testRestaurant = await restaurantModel.create(testData);
        dbHelper.trackCreatedRestaurant(testRestaurant.id);
      });

      it('should update restaurant fields successfully', async () => {
        const updateData = TestDataFactory.createUpdateData();

        const result = await restaurantModel.update(testRestaurant.id, updateData);

        expect(result).toBeDefined();
        expect(result.owner_name).toBe(updateData.owner_name);
        expect(result.restaurant_name).toBe(updateData.restaurant_name);
        expect(result.cuisine_type).toBe(updateData.cuisine_type);
        expect(result.description).toBe(updateData.description);
        expect(result.website).toBe(updateData.website);

        // Verify in database
        const dbResult = await dbHelper.getRestaurantById(testRestaurant.id);
        expect(dbResult.owner_name).toBe(updateData.owner_name);
        expect(dbResult.restaurant_name).toBe(updateData.restaurant_name);
      });

      it('should fail to update with duplicate email', async () => {
        const updateData = { email: TEST_CONSTANTS.SEED_DATA.PIZZARIA_BELLA_EMAIL };

        await expect(restaurantModel.update(testRestaurant.id, updateData)).rejects.toThrow(
          TEST_CONSTANTS.ERROR_MESSAGES.NO_VALID_FIELDS_TO_UPDATE
        );
      });

      it('should fail to update with duplicate URL name', async () => {
        const updateData = { restaurant_url_name: TEST_CONSTANTS.SEED_DATA.PIZZARIA_BELLA_URL };

        await expect(restaurantModel.update(testRestaurant.id, updateData)).rejects.toThrow(
          TEST_CONSTANTS.ERROR_MESSAGES.DUPLICATE_URL_NAME
        );
      });

      it('should fail to update non-existent restaurant', async () => {
        const updateData = TestDataFactory.createUpdateData();

        const result = await restaurantModel.update(
          TEST_CONSTANTS.TEST_VALUES.NON_EXISTENT_UUID,
          updateData
        );
        expect(result).toBeNull();
      });
    });

    describe('getRestaurants', () => {
      it('should get all restaurants with default pagination', async () => {
        const result = await restaurantModel.getRestaurants();

        expect(result).toBeDefined();
        expect(result.restaurants).toBeInstanceOf(Array);
        expect(result.restaurants.length).toBeGreaterThan(0);
        expect(result.pagination).toBeDefined();
        expect(result.pagination.total).toBeGreaterThan(0);
        expect(result.pagination.page).toBe(TEST_CONSTANTS.PAGINATION.DEFAULT_PAGE);
        expect(result.pagination.limit).toBe(TEST_CONSTANTS.PAGINATION.DEFAULT_LIMIT);

        // Verify restaurant structure
        const restaurant = result.restaurants[0];
        expect(restaurant.id).toBeDefined();
        expect(restaurant.restaurant_name).toBeDefined();
        expect(restaurant.owner_name).toBeDefined();
        expect(restaurant.password).toBeUndefined();
      });

      it('should filter restaurants by status', async () => {
        const filters = { status: TEST_CONSTANTS.STATUS.ACTIVE };
        const result = await restaurantModel.getRestaurants(filters);

        expect(result.restaurants).toBeInstanceOf(Array);
        result.restaurants.forEach((restaurant) => {
          expect(restaurant.status).toBe(TEST_CONSTANTS.STATUS.ACTIVE);
        });
      });

      it('should filter restaurants by business type', async () => {
        const filters = { business_type: TEST_CONSTANTS.BUSINESS_TYPES.SINGLE };
        const result = await restaurantModel.getRestaurants(filters);

        expect(result.restaurants).toBeInstanceOf(Array);
        result.restaurants.forEach((restaurant) => {
          expect(restaurant.business_type).toBe(TEST_CONSTANTS.BUSINESS_TYPES.SINGLE);
        });
      });

      it('should apply pagination correctly', async () => {
        const pagination = { page: 1, limit: TEST_CONSTANTS.PAGINATION.TEST_LIMIT };
        const result = await restaurantModel.getRestaurants({}, pagination);

        expect(result.restaurants).toHaveLength(TEST_CONSTANTS.PAGINATION.TEST_LIMIT);
        expect(result.pagination.page).toBe(1);
        expect(result.pagination.limit).toBe(TEST_CONSTANTS.PAGINATION.TEST_LIMIT);
        expect(result.pagination.total).toBeGreaterThan(0);
      });
    });
  });

  describe('Email Confirmation', () => {
    let testRestaurant;
    let confirmationToken;

    beforeEach(async () => {
      const testData = TestDataFactory.createRestaurantData();
      testRestaurant = await restaurantModel.create(testData);
      dbHelper.trackCreatedRestaurant(testRestaurant.id);

      // Get confirmation token from database
      const dbResult = await dbHelper.query(
        'SELECT email_confirmation_token FROM restaurants WHERE id = $1',
        [testRestaurant.id]
      );
      confirmationToken = dbResult.rows[0].email_confirmation_token;
    });

    it('should confirm email with valid token', async () => {
      const result = await restaurantModel.confirmEmail(confirmationToken);

      expect(result).toBeDefined();
      expect(result).not.toBeNull();
      expect(result.email_confirmed).toBe(true);
      expect(result.status).toBe(TEST_CONSTANTS.STATUS.ACTIVE);

      // Verify in database
      const dbResult = await dbHelper.getRestaurantById(testRestaurant.id);
      expect(dbResult.email_confirmed).toBe(true);
      expect(dbResult.status).toBe(TEST_CONSTANTS.STATUS.ACTIVE);
      expect(dbResult.email_confirmation_token).toBeNull();
    });

    it('should fail to confirm email with invalid token', async () => {
      const result = await restaurantModel.confirmEmail(TEST_CONSTANTS.TEST_VALUES.INVALID_TOKEN);
      expect(result).toBeNull();
    });

    it('should fail to confirm email with expired token', async () => {
      // Set token expiration to past date
      await dbHelper.query(
        'UPDATE restaurants SET email_confirmation_expires = $1 WHERE id = $2',
        [new Date(Date.now() - 1000 * 60 * 60), testRestaurant.id] // 1 hour ago
      );

      const result = await restaurantModel.confirmEmail(confirmationToken);
      expect(result).toBeNull();
    });
  });

  describe('Password Management', () => {
    let testRestaurant;
    const originalPassword = 'originalpass123';

    beforeEach(async () => {
      const testData = TestDataFactory.createRestaurantData({ password: originalPassword });
      testRestaurant = await restaurantModel.create(testData);
      dbHelper.trackCreatedRestaurant(testRestaurant.id);

      // Confirm email to allow password changes
      const tokenResult = await dbHelper.query(
        'SELECT email_confirmation_token FROM restaurants WHERE id = $1',
        [testRestaurant.id]
      );
      await restaurantModel.confirmEmail(tokenResult.rows[0].email_confirmation_token);
    });

    it('should change password with correct current password', async () => {
      const newPassword = 'newpassword456';
      const passwordData = {
        current_password: originalPassword,
        new_password: newPassword,
        confirm_password: newPassword,
      };

      const result = await restaurantModel.changePassword(testRestaurant.id, passwordData);
      expect(result).toBe(true);

      // Verify new password works
      const authResult = await restaurantModel.authenticate(testRestaurant.email, newPassword);
      expect(authResult).toBeDefined();
      expect(authResult).not.toBeNull();

      // Verify old password no longer works
      const oldAuthResult = await restaurantModel.authenticate(
        testRestaurant.email,
        originalPassword
      );
      expect(oldAuthResult).toBeNull();
    });

    it('should fail to change password with incorrect current password', async () => {
      const passwordData = {
        current_password: 'wrongpassword',
        new_password: 'newpassword456',
        confirm_password: 'newpassword456',
      };

      await expect(restaurantModel.changePassword(testRestaurant.id, passwordData)).rejects.toThrow(
        TEST_CONSTANTS.ERROR_MESSAGES.CURRENT_PASSWORD_INCORRECT
      );
    });

    it('should fail to change password when new passwords do not match', async () => {
      const passwordData = {
        current_password: originalPassword,
        new_password: 'newpassword456',
        confirm_password: 'differentpassword789',
      };

      await expect(restaurantModel.changePassword(testRestaurant.id, passwordData)).rejects.toThrow(
        TEST_CONSTANTS.ERROR_MESSAGES.VALIDATION_FAILED
      );
    });
  });

  describe('Data Validation and Security', () => {
    it('should sanitize and validate input data during creation', async () => {
      const testData = TestDataFactory.createRestaurantData({
        owner_name: '  Test Owner  ', // Extra whitespace
        email: 'TEST.VALIDATION@EXAMPLE.COM', // Uppercase
        restaurant_name: '  Test Restaurant  ', // Extra whitespace
        restaurant_url_name: 'TEST-RESTAURANT-URL', // Uppercase
      });

      const result = await restaurantModel.create(testData);
      dbHelper.trackCreatedRestaurant(result.id);

      expect(result.owner_name).toBe('Test Owner'); // Trimmed
      expect(result.email).toBe('test.validation@example.com'); // Lowercase
      expect(result.restaurant_name).toBe('Test Restaurant'); // Trimmed
      expect(result.restaurant_url_name).toBe('test-restaurant-url'); // Lowercase
    });

    it('should prevent SQL injection in search queries', async () => {
      const maliciousSearch = "'; DROP TABLE restaurants; --";
      const filters = { search: maliciousSearch };

      // Should not throw an error and should not affect the database
      const result = await restaurantModel.getRestaurants(filters);
      expect(result.restaurants).toBeInstanceOf(Array);

      // Verify restaurants table still exists and has data
      const tableCheck = await dbHelper.query('SELECT COUNT(*) FROM restaurants');
      expect(parseInt(tableCheck.rows[0].count)).toBeGreaterThan(0);
    });

    it('should handle special characters in search safely', async () => {
      const specialCharSearch = 'Test & Restaurant\'s "Special" <script>';
      const filters = { search: specialCharSearch };

      // Should handle special characters without errors
      const result = await restaurantModel.getRestaurants(filters);
      expect(result.restaurants).toBeInstanceOf(Array);
    });
  });
});
