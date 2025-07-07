/**
 * User Model Integration Tests - Database Interaction
 * This file focuses on testing database operations and relationships
 */

// Mock the logger to prevent actual logging during tests
const mockLogger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  child: jest.fn().mockReturnThis(),
};

// Mock logger module
jest.mock('../../src/utils/logger', () => ({
  logger: mockLogger,
}));

const userModel = require('../../src/models/userModel');
const db = require('../../src/config/db');

describe('UserModel - Integration Tests (Database Interaction)', () => {
  let testUsers = [];
  let testRestaurantId;

  beforeAll(async () => {
    // Ensure test database connection
    await db.testConnection();

    // Create a test restaurant first
    const restaurantQuery = `
      INSERT INTO restaurants (name, email, phone, description, cuisine_type, status)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id
    `;
    const restaurantResult = await db.executeQuery(restaurantQuery, [
      'Test Restaurant Integration',
      'test-integration@restaurant.com',
      '+1234567890',
      'Test restaurant for integration tests',
      'italian',
      'active',
    ]);
    testRestaurantId = restaurantResult.rows[0].id;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    testUsers = [];
  });

  afterEach(async () => {
    // Clean up test users after each test
    for (const user of testUsers) {
      try {
        await db.executeQuery('DELETE FROM users WHERE id = $1', [user.id]);
      } catch (error) {
        // Ignore errors during cleanup
      }
    }
    testUsers = [];
  });

  afterAll(async () => {
    // Clean up test restaurant
    if (testRestaurantId) {
      try {
        await db.executeQuery('DELETE FROM restaurants WHERE id = $1', [testRestaurantId]);
      } catch (error) {
        // Ignore errors during cleanup
      }
    }
  });

  describe('1. CRUD Operations', () => {
    describe('Create Operations', () => {
      it('should create a new user with email successfully', async () => {
        const userData = {
          email: 'test-integration@example.com',
          password: 'password123',
          full_name: 'Integration Test User',
          role: 'restaurant_administrator',
          restaurant_id: testRestaurantId,
          status: 'active',
        };

        const result = await userModel.create(userData);
        testUsers.push(result);

        expect(result).toBeDefined();
        expect(result.id).toBeDefined();
        expect(result.email).toBe(userData.email);
        expect(result.full_name).toBe(userData.full_name);
        expect(result.role).toBe(userData.role);
        expect(result.status).toBe(userData.status);
        expect(result.password).toBeUndefined(); // Should be sanitized
        expect(result.created_at).toBeDefined();
        expect(result.updated_at).toBeDefined();
      });

      it('should create a new user with username successfully', async () => {
        const userData = {
          username: 'integrationtestuser',
          password: 'password123',
          full_name: 'Integration Test User',
          role: 'waiter',
          status: 'active',
        };

        const result = await userModel.create(userData);
        testUsers.push(result);

        expect(result).toBeDefined();
        expect(result.id).toBeDefined();
        expect(result.username).toBe(userData.username);
        expect(result.full_name).toBe(userData.full_name);
        expect(result.role).toBe(userData.role);
        expect(result.password).toBeUndefined(); // Should be sanitized
      });

      it('should generate email confirmation token when email provided', async () => {
        const userData = {
          email: 'test-token@example.com',
          password: 'password123',
          full_name: 'Token Test User',
          role: 'location_administrator',
          status: 'pending',
        };

        const result = await userModel.create(userData);
        testUsers.push(result);

        // Query the actual database to check the token was created
        const dbUser = await db.executeQuery(
          'SELECT email_confirmation_token, email_confirmation_expires FROM users WHERE id = $1',
          [result.id]
        );

        expect(dbUser.rows[0].email_confirmation_token).toBeDefined();
        expect(dbUser.rows[0].email_confirmation_expires).toBeDefined();
      });

      it('should throw error for duplicate email', async () => {
        const userData = {
          email: 'duplicate@example.com',
          password: 'password123',
          full_name: 'First User',
          role: 'restaurant_administrator',
          restaurant_id: testRestaurantId,
        };

        const firstUser = await userModel.create(userData);
        testUsers.push(firstUser);

        // Try to create another user with the same email
        const duplicateUserData = {
          ...userData,
          full_name: 'Second User',
        };

        await expect(userModel.create(duplicateUserData)).rejects.toThrow('Email already exists');
      });

      it('should throw error for duplicate username', async () => {
        const userData = {
          username: 'duplicateuser',
          password: 'password123',
          full_name: 'First User',
          role: 'waiter',
        };

        const firstUser = await userModel.create(userData);
        testUsers.push(firstUser);

        // Try to create another user with the same username
        const duplicateUserData = {
          ...userData,
          full_name: 'Second User',
        };

        await expect(userModel.create(duplicateUserData)).rejects.toThrow(
          'Username already exists'
        );
      });

      it('should throw error for non-existent restaurant', async () => {
        const userData = {
          email: 'test-invalid-restaurant@example.com',
          password: 'password123',
          full_name: 'Test User',
          role: 'restaurant_administrator',
          restaurant_id: '550e8400-e29b-41d4-a716-446655440000', // Non-existent
        };

        await expect(userModel.create(userData)).rejects.toThrow('Restaurant not found');
      });
    });

    describe('Read Operations', () => {
      let testUser;

      beforeEach(async () => {
        const userData = {
          email: 'read-test@example.com',
          username: 'readtestuser',
          password: 'password123',
          full_name: 'Read Test User',
          role: 'waiter',
          status: 'active',
        };

        testUser = await userModel.create(userData);
        testUsers.push(testUser);
      });

      it('should find user by ID successfully', async () => {
        const result = await userModel.findById(testUser.id);

        expect(result).toBeDefined();
        expect(result.id).toBe(testUser.id);
        expect(result.email).toBe(testUser.email);
        expect(result.username).toBe(testUser.username);
        expect(result.password).toBeUndefined(); // Should be sanitized
      });

      it('should return null for non-existent user ID', async () => {
        const result = await userModel.findById('550e8400-e29b-41d4-a716-446655440000');
        expect(result).toBeNull();
      });

      it('should find user by email successfully', async () => {
        const result = await userModel.findByEmail(testUser.email);

        expect(result).toBeDefined();
        expect(result.id).toBe(testUser.id);
        expect(result.email).toBe(testUser.email);
        expect(result.password).toBeUndefined(); // Should be sanitized
      });

      it('should find user by email case-insensitively', async () => {
        const result = await userModel.findByEmail(testUser.email.toUpperCase());

        expect(result).toBeDefined();
        expect(result.id).toBe(testUser.id);
      });

      it('should return null for non-existent email', async () => {
        const result = await userModel.findByEmail('nonexistent@example.com');
        expect(result).toBeNull();
      });

      it('should find user by username successfully', async () => {
        const result = await userModel.findByUsername(testUser.username);

        expect(result).toBeDefined();
        expect(result.id).toBe(testUser.id);
        expect(result.username).toBe(testUser.username);
        expect(result.password).toBeUndefined(); // Should be sanitized
      });

      it('should find user by username case-insensitively', async () => {
        const result = await userModel.findByUsername(testUser.username.toUpperCase());

        expect(result).toBeDefined();
        expect(result.id).toBe(testUser.id);
      });

      it('should return null for non-existent username', async () => {
        const result = await userModel.findByUsername('nonexistentuser');
        expect(result).toBeNull();
      });
    });

    describe('Update Operations', () => {
      let testUser;

      beforeEach(async () => {
        const userData = {
          email: 'update-test@example.com',
          username: 'updatetestuser',
          password: 'password123',
          full_name: 'Update Test User',
          role: 'waiter',
          status: 'active',
        };

        testUser = await userModel.create(userData);
        testUsers.push(testUser);
      });

      it('should update user successfully', async () => {
        const updateData = {
          full_name: 'Updated Test User',
          status: 'inactive',
        };

        const result = await userModel.update(testUser.id, updateData);

        expect(result).toBeDefined();
        expect(result.id).toBe(testUser.id);
        expect(result.full_name).toBe(updateData.full_name);
        expect(result.status).toBe(updateData.status);
        expect(result.updated_at).toBeDefined();
        expect(result.password).toBeUndefined(); // Should be sanitized
      });

      it('should update email and check uniqueness', async () => {
        const newEmail = 'updated-email@example.com';
        const updateData = { email: newEmail };

        const result = await userModel.update(testUser.id, updateData);

        expect(result.email).toBe(newEmail);
      });

      it('should throw error when updating to existing email', async () => {
        // Create another user
        const anotherUser = await userModel.create({
          email: 'another@example.com',
          password: 'password123',
          full_name: 'Another User',
          role: 'waiter',
        });
        testUsers.push(anotherUser);

        // Try to update first user's email to the second user's email
        await expect(userModel.update(testUser.id, { email: anotherUser.email })).rejects.toThrow(
          'Email already exists'
        );
      });

      it('should throw error when updating to existing username', async () => {
        // Create another user
        const anotherUser = await userModel.create({
          username: 'anotherusername',
          password: 'password123',
          full_name: 'Another User',
          role: 'waiter',
        });
        testUsers.push(anotherUser);

        // Try to update first user's username to the second user's username
        await expect(
          userModel.update(testUser.id, { username: anotherUser.username })
        ).rejects.toThrow('Username already exists');
      });

      it('should throw error for non-existent user', async () => {
        await expect(
          userModel.update('550e8400-e29b-41d4-a716-446655440000', { full_name: 'Updated' })
        ).rejects.toThrow('User not found');
      });

      it('should validate restaurant exists when updating restaurant_id', async () => {
        await expect(
          userModel.update(testUser.id, { restaurant_id: '550e8400-e29b-41d4-a716-446655440000' })
        ).rejects.toThrow('Restaurant not found');
      });
    });

    describe('Delete Operations', () => {
      let testUser;

      beforeEach(async () => {
        const userData = {
          email: 'delete-test@example.com',
          password: 'password123',
          full_name: 'Delete Test User',
          role: 'waiter',
          status: 'active',
        };

        testUser = await userModel.create(userData);
        testUsers.push(testUser);
      });

      it('should soft delete user successfully', async () => {
        const result = await userModel.deleteUser(testUser.id);

        expect(result).toBe(true);

        // Verify user is marked as inactive
        const updatedUser = await userModel.findById(testUser.id);
        expect(updatedUser.status).toBe('inactive');
      });

      it('should return false for non-existent user', async () => {
        const result = await userModel.deleteUser('550e8400-e29b-41d4-a716-446655440000');
        expect(result).toBe(false);
      });
    });
  });

  describe('2. Authentication Operations', () => {
    let testUser;
    const originalPassword = 'testpassword123';

    beforeEach(async () => {
      const userData = {
        email: 'auth-test@example.com',
        username: 'authtestuser',
        password: originalPassword,
        full_name: 'Auth Test User',
        role: 'waiter',
        status: 'active',
      };

      testUser = await userModel.create(userData);
      testUsers.push(testUser);
    });

    it('should authenticate user with email and password', async () => {
      const result = await userModel.authenticate(testUser.email, originalPassword);

      expect(result).toBeDefined();
      expect(result.id).toBe(testUser.id);
      expect(result.email).toBe(testUser.email);
      expect(result.password).toBeUndefined(); // Should be sanitized

      // Verify last_login_at was updated
      const updatedUser = await db.executeQuery('SELECT last_login_at FROM users WHERE id = $1', [
        testUser.id,
      ]);
      expect(updatedUser.rows[0].last_login_at).toBeDefined();
    });

    it('should authenticate user with username and password', async () => {
      const result = await userModel.authenticate(testUser.username, originalPassword);

      expect(result).toBeDefined();
      expect(result.id).toBe(testUser.id);
      expect(result.username).toBe(testUser.username);
    });

    it('should return null for invalid password', async () => {
      const result = await userModel.authenticate(testUser.email, 'wrongpassword');
      expect(result).toBeNull();
    });

    it('should return null for non-existent user', async () => {
      const result = await userModel.authenticate('nonexistent@example.com', originalPassword);
      expect(result).toBeNull();
    });

    it('should return null for inactive user', async () => {
      // Mark user as inactive
      await userModel.update(testUser.id, { status: 'inactive' });

      const result = await userModel.authenticate(testUser.email, originalPassword);
      expect(result).toBeNull();
    });

    it('should change password successfully', async () => {
      const newPassword = 'newpassword123';
      const result = await userModel.changePassword(testUser.id, newPassword);

      expect(result).toBeDefined();
      expect(result.id).toBe(testUser.id);

      // Verify new password works
      const authResult = await userModel.authenticate(testUser.email, newPassword);
      expect(authResult).toBeDefined();
      expect(authResult.id).toBe(testUser.id);

      // Verify old password doesn't work
      const oldAuthResult = await userModel.authenticate(testUser.email, originalPassword);
      expect(oldAuthResult).toBeNull();

      // Verify password_changed_at and first_login_password_change were updated
      const updatedUser = await db.executeQuery(
        'SELECT password_changed_at, first_login_password_change FROM users WHERE id = $1',
        [testUser.id]
      );
      expect(updatedUser.rows[0].password_changed_at).toBeDefined();
      expect(updatedUser.rows[0].first_login_password_change).toBe(false);
    });
  });

  describe('3. Email Confirmation Operations', () => {
    let testUser;
    let confirmationToken;

    beforeEach(async () => {
      const userData = {
        email: 'confirm-test@example.com',
        password: 'password123',
        full_name: 'Confirm Test User',
        role: 'restaurant_administrator',
        restaurant_id: testRestaurantId,
        status: 'pending',
      };

      testUser = await userModel.create(userData);
      testUsers.push(testUser);

      // Get the confirmation token from the database
      const tokenQuery = await db.executeQuery(
        'SELECT email_confirmation_token FROM users WHERE id = $1',
        [testUser.id]
      );
      confirmationToken = tokenQuery.rows[0].email_confirmation_token;
    });

    it('should confirm email with valid token', async () => {
      const result = await userModel.confirmEmail(confirmationToken);

      expect(result).toBeDefined();
      expect(result.id).toBe(testUser.id);
      expect(result.email_confirmed).toBe(true);

      // Verify token was cleared
      const updatedUser = await db.executeQuery(
        'SELECT email_confirmation_token, email_confirmation_expires FROM users WHERE id = $1',
        [testUser.id]
      );
      expect(updatedUser.rows[0].email_confirmation_token).toBeNull();
      expect(updatedUser.rows[0].email_confirmation_expires).toBeNull();
    });

    it('should throw error for invalid token', async () => {
      await expect(userModel.confirmEmail('invalid_token')).rejects.toThrow(
        'Invalid or expired confirmation token'
      );
    });

    it('should throw error for expired token', async () => {
      // Set token as expired
      await db.executeQuery(
        'UPDATE users SET email_confirmation_expires = $1 WHERE id = $2',
        [new Date(Date.now() - 1000), testUser.id] // 1 second ago
      );

      await expect(userModel.confirmEmail(confirmationToken)).rejects.toThrow(
        'Invalid or expired confirmation token'
      );
    });
  });

  describe('4. Restaurant Relationship Operations', () => {
    it('should get users by restaurant ID', async () => {
      // Create multiple users for the same restaurant
      const users = [];
      for (let i = 0; i < 3; i++) {
        const userData = {
          email: `restaurant-user-${i}@example.com`,
          password: 'password123',
          full_name: `Restaurant User ${i}`,
          role: 'waiter',
          restaurant_id: testRestaurantId,
          status: 'active',
        };

        const user = await userModel.create(userData);
        users.push(user);
        testUsers.push(user);
      }

      const result = await userModel.getUsersByRestaurant(testRestaurantId);

      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThanOrEqual(3);
      expect(result.every((user) => user.restaurant_id === testRestaurantId)).toBe(true);
      expect(result.every((user) => user.password === undefined)).toBe(true); // Should be sanitized
    });

    it('should filter users by status and role', async () => {
      // Create users with different statuses and roles
      const activeWaiter = await userModel.create({
        email: 'active-waiter@example.com',
        password: 'password123',
        full_name: 'Active Waiter',
        role: 'waiter',
        restaurant_id: testRestaurantId,
        status: 'active',
      });
      testUsers.push(activeWaiter);

      const inactiveWaiter = await userModel.create({
        email: 'inactive-waiter@example.com',
        password: 'password123',
        full_name: 'Inactive Waiter',
        role: 'waiter',
        restaurant_id: testRestaurantId,
        status: 'inactive',
      });
      testUsers.push(inactiveWaiter);

      const activeFoodRunner = await userModel.create({
        email: 'active-runner@example.com',
        password: 'password123',
        full_name: 'Active Food Runner',
        role: 'food_runner',
        restaurant_id: testRestaurantId,
        status: 'active',
      });
      testUsers.push(activeFoodRunner);

      // Test filtering by status
      const activeUsers = await userModel.getUsersByRestaurant(testRestaurantId, {
        status: 'active',
      });
      expect(activeUsers.every((user) => user.status === 'active')).toBe(true);

      // Test filtering by role
      const waiters = await userModel.getUsersByRestaurant(testRestaurantId, { role: 'waiter' });
      expect(waiters.every((user) => user.role === 'waiter')).toBe(true);

      // Test filtering by both status and role
      const activeWaiters = await userModel.getUsersByRestaurant(testRestaurantId, {
        status: 'active',
        role: 'waiter',
      });
      expect(
        activeWaiters.every((user) => user.status === 'active' && user.role === 'waiter')
      ).toBe(true);
      expect(activeWaiters.length).toBe(1);
      expect(activeWaiters[0].id).toBe(activeWaiter.id);
    });

    it('should check restaurant exists correctly', async () => {
      const exists = await userModel.checkRestaurantExists(testRestaurantId);
      expect(exists).toBe(true);

      const doesNotExist = await userModel.checkRestaurantExists(
        '550e8400-e29b-41d4-a716-446655440000'
      );
      expect(doesNotExist).toBe(false);
    });
  });

  describe('5. Query and Filtering Tests', () => {
    beforeEach(async () => {
      // Create test users with various attributes
      const testUsersData = [
        {
          email: 'admin@test.com',
          password: 'password123',
          full_name: 'Admin User',
          role: 'restaurant_administrator',
          restaurant_id: testRestaurantId,
          status: 'active',
        },
        {
          username: 'waiter1',
          password: 'password123',
          full_name: 'Waiter One',
          role: 'waiter',
          status: 'active',
        },
        {
          username: 'waiter2',
          password: 'password123',
          full_name: 'Waiter Two',
          role: 'waiter',
          status: 'inactive',
        },
        {
          username: 'runner1',
          password: 'password123',
          full_name: 'Runner One',
          role: 'food_runner',
          status: 'pending',
        },
      ];

      for (const userData of testUsersData) {
        const user = await userModel.create(userData);
        testUsers.push(user);
      }
    });

    it('should find users with specific columns', async () => {
      const user = testUsers[0];
      const result = await userModel.findById(user.id, ['id', 'email', 'full_name']);

      expect(result).toBeDefined();
      expect(result.id).toBe(user.id);
      expect(result.email).toBeDefined();
      expect(result.full_name).toBeDefined();
      // Other fields should not be present if columns are specified correctly by BaseModel
    });

    it('should handle case-insensitive email searches', async () => {
      const user = testUsers.find((u) => u.email);
      const upperCaseEmail = user.email.toUpperCase();
      const lowerCaseEmail = user.email.toLowerCase();

      const upperResult = await userModel.findByEmail(upperCaseEmail);
      const lowerResult = await userModel.findByEmail(lowerCaseEmail);

      expect(upperResult).toBeDefined();
      expect(lowerResult).toBeDefined();
      expect(upperResult.id).toBe(user.id);
      expect(lowerResult.id).toBe(user.id);
    });

    it('should handle case-insensitive username searches', async () => {
      const user = testUsers.find((u) => u.username);
      const upperCaseUsername = user.username.toUpperCase();
      const lowerCaseUsername = user.username.toLowerCase();

      const upperResult = await userModel.findByUsername(upperCaseUsername);
      const lowerResult = await userModel.findByUsername(lowerCaseUsername);

      expect(upperResult).toBeDefined();
      expect(lowerResult).toBeDefined();
      expect(upperResult.id).toBe(user.id);
      expect(lowerResult.id).toBe(user.id);
    });
  });

  describe('6. Database Constraint Tests', () => {
    it('should respect database constraints for invalid UUIDs', async () => {
      // This test assumes the database has proper UUID validation
      const userData = {
        email: 'constraint-test@example.com',
        password: 'password123',
        full_name: 'Constraint Test User',
        role: 'waiter',
        restaurant_id: 'invalid-uuid-format',
      };

      // This should fail at the application level before hitting the database
      await expect(userModel.create(userData)).rejects.toThrow();
    });

    it('should handle database errors gracefully', async () => {
      // Force a database error by trying to insert invalid data
      const originalExecuteQuery = userModel.executeQuery;
      userModel.executeQuery = jest.fn().mockRejectedValue(new Error('Database connection failed'));

      const userData = {
        email: 'db-error-test@example.com',
        password: 'password123',
        full_name: 'DB Error Test User',
        role: 'waiter',
      };

      await expect(userModel.create(userData)).rejects.toThrow('Database connection failed');

      // Restore original method
      userModel.executeQuery = originalExecuteQuery;
    });
  });
});
