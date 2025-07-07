/**
 * User Model Error Handling and Edge Cases Tests
 * This file focuses on testing error scenarios and edge cases
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

describe('UserModel - Error Handling and Edge Cases', () => {
  let testUsers = [];
  let testRestaurantId;

  beforeAll(async () => {
    // Ensure test database connection
    await db.testConnection();

    // Create a test restaurant
    const restaurantQuery = `
      INSERT INTO restaurants (name, email, phone, description, cuisine_type, status)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id
    `;
    const restaurantResult = await db.executeQuery(restaurantQuery, [
      'Error Test Restaurant',
      'error-test@restaurant.com',
      '+1234567890',
      'Test restaurant for error tests',
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

  describe('1. Database Error Handling', () => {
    describe('Connection Errors', () => {
      it('should handle database connection failures gracefully', async () => {
        // Mock executeQuery to simulate connection failure
        const originalExecuteQuery = userModel.executeQuery;
        userModel.executeQuery = jest.fn().mockRejectedValue(new Error('ECONNREFUSED'));

        const userData = {
          email: 'connection-error@example.com',
          password: 'password123',
          full_name: 'Connection Error User',
          role: 'waiter',
        };

        await expect(userModel.create(userData)).rejects.toThrow('ECONNREFUSED');
        expect(mockLogger.error).toHaveBeenCalled();

        // Restore original method
        userModel.executeQuery = originalExecuteQuery;
      });

      it('should handle database timeout errors', async () => {
        const originalExecuteQuery = userModel.executeQuery;
        userModel.executeQuery = jest.fn().mockRejectedValue(new Error('Query timeout'));

        const userData = {
          email: 'timeout-error@example.com',
          password: 'password123',
          full_name: 'Timeout Error User',
          role: 'waiter',
        };

        await expect(userModel.create(userData)).rejects.toThrow('Query timeout');

        userModel.executeQuery = originalExecuteQuery;
      });

      it('should handle transaction rollback scenarios', async () => {
        const originalExecuteQuery = userModel.executeQuery;
        userModel.executeQuery = jest.fn().mockRejectedValue(new Error('Transaction rolled back'));

        await expect(
          userModel.update('550e8400-e29b-41d4-a716-446655440000', { full_name: 'Updated' })
        ).rejects.toThrow('Transaction rolled back');

        userModel.executeQuery = originalExecuteQuery;
      });
    });

    describe('Constraint Violations', () => {
      it('should handle unique constraint violations gracefully', async () => {
        const userData = {
          email: 'unique-constraint@example.com',
          password: 'password123',
          full_name: 'Unique Constraint User',
          role: 'waiter',
        };

        // Create first user
        const firstUser = await userModel.create(userData);
        testUsers.push(firstUser);

        // Try to create duplicate
        await expect(userModel.create(userData)).rejects.toThrow('Email already exists');
      });

      it('should handle foreign key constraint violations', async () => {
        const userData = {
          email: 'foreign-key@example.com',
          password: 'password123',
          full_name: 'Foreign Key User',
          role: 'restaurant_administrator',
          restaurant_id: '550e8400-e29b-41d4-a716-446655440000', // Non-existent
        };

        await expect(userModel.create(userData)).rejects.toThrow('Restaurant not found');
      });

      it('should handle check constraint violations', async () => {
        // Test with invalid role
        const invalidUserData = {
          email: 'invalid-role@example.com',
          password: 'password123',
          full_name: 'Invalid Role User',
          role: 'invalid_role',
        };

        const { error } = userModel.createSchema.validate(invalidUserData);
        expect(error).toBeDefined();
      });
    });

    describe('Data Type Errors', () => {
      it('should handle invalid UUID format errors', async () => {
        await expect(userModel.findById('invalid-uuid-format')).rejects.toThrow(
          'Invalid user ID format'
        );
      });

      it('should handle null constraint violations', async () => {
        const invalidUserData = {
          email: 'null-constraint@example.com',
          // password: missing required field
          full_name: 'Null Constraint User',
          role: 'waiter',
        };

        const { error } = userModel.createSchema.validate(invalidUserData);
        expect(error).toBeDefined();
        expect(error.details[0].path).toContain('password');
      });
    });
  });

  describe('2. Validation Error Handling', () => {
    describe('Schema Validation Errors', () => {
      it('should handle empty or missing required fields', () => {
        const invalidDatasets = [
          {}, // Empty object
          { email: 'test@example.com' }, // Missing password, full_name, role
          { password: 'password123' }, // Missing email/username, full_name, role
          { role: 'waiter' }, // Missing password, full_name, email/username
        ];

        invalidDatasets.forEach((data) => {
          const { error } = userModel.createSchema.validate(data);
          expect(error).toBeDefined();
        });
      });

      it('should handle invalid email formats', () => {
        const invalidEmails = [
          'not-an-email',
          '@example.com',
          'test@',
          'test.example.com',
          '',
          null,
          123,
          {},
        ];

        invalidEmails.forEach((email) => {
          const userData = {
            email: email,
            password: 'password123',
            full_name: 'Test User',
            role: 'restaurant_administrator',
            restaurant_id: testRestaurantId,
          };

          const { error } = userModel.createSchema.validate(userData);
          expect(error).toBeDefined();
        });
      });

      it('should handle invalid username formats', () => {
        const invalidUsernames = [
          'us', // Too short
          'user@name', // Special characters not allowed
          'user-name', // Hyphens not allowed
          'user name', // Spaces not allowed
          '', // Empty
          123, // Not a string
          null,
        ];

        invalidUsernames.forEach((username) => {
          const userData = {
            username: username,
            password: 'password123',
            full_name: 'Test User',
            role: 'waiter',
          };

          const { error } = userModel.createSchema.validate(userData);
          expect(error).toBeDefined();
        });
      });

      it('should handle password validation errors', () => {
        const invalidPasswords = [
          'short', // Too short
          '', // Empty
          null, // Null
          123, // Not a string
          'a'.repeat(256), // Too long
        ];

        invalidPasswords.forEach((password) => {
          const userData = {
            username: 'testuser',
            password: password,
            full_name: 'Test User',
            role: 'waiter',
          };

          const { error } = userModel.createSchema.validate(userData);
          expect(error).toBeDefined();
        });
      });

      it('should handle conditional validation errors', () => {
        // Restaurant administrator without email
        const invalidAdmin = {
          username: 'admin',
          password: 'password123',
          full_name: 'Admin User',
          role: 'restaurant_administrator',
          restaurant_id: testRestaurantId,
        };

        const { error: adminError } = userModel.createSchema.validate(invalidAdmin);
        expect(adminError).toBeDefined();

        // Restaurant administrator without restaurant_id
        const invalidAdminNoRestaurant = {
          email: 'admin@example.com',
          password: 'password123',
          full_name: 'Admin User',
          role: 'restaurant_administrator',
        };

        const { error: noRestaurantError } =
          userModel.createSchema.validate(invalidAdminNoRestaurant);
        expect(noRestaurantError).toBeDefined();
      });
    });

    describe('Business Logic Validation Errors', () => {
      it('should handle duplicate email validation', async () => {
        const userData = {
          email: 'duplicate-test@example.com',
          password: 'password123',
          full_name: 'First User',
          role: 'waiter',
        };

        const firstUser = await userModel.create(userData);
        testUsers.push(firstUser);

        // Attempt to create another user with the same email
        const duplicateData = {
          ...userData,
          full_name: 'Second User',
        };

        await expect(userModel.create(duplicateData)).rejects.toThrow('Email already exists');
      });

      it('should handle duplicate username validation', async () => {
        const userData = {
          username: 'duplicateuser',
          password: 'password123',
          full_name: 'First User',
          role: 'waiter',
        };

        const firstUser = await userModel.create(userData);
        testUsers.push(firstUser);

        const duplicateData = {
          ...userData,
          full_name: 'Second User',
        };

        await expect(userModel.create(duplicateData)).rejects.toThrow('Username already exists');
      });

      it('should handle restaurant existence validation', async () => {
        const userData = {
          email: 'restaurant-check@example.com',
          password: 'password123',
          full_name: 'Restaurant Check User',
          role: 'restaurant_administrator',
          restaurant_id: '550e8400-e29b-41d4-a716-446655440000', // Non-existent
        };

        await expect(userModel.create(userData)).rejects.toThrow('Restaurant not found');
      });
    });
  });

  describe('3. Authentication Error Handling', () => {
    describe('Authentication Failures', () => {
      let testUser;

      beforeEach(async () => {
        const userData = {
          email: 'auth-error@example.com',
          username: 'autherroruser',
          password: 'correctpassword',
          full_name: 'Auth Error User',
          role: 'waiter',
          status: 'active',
        };

        testUser = await userModel.create(userData);
        testUsers.push(testUser);
      });

      it('should handle authentication with non-existent user', async () => {
        const result = await userModel.authenticate('nonexistent@example.com', 'password');
        expect(result).toBeNull();
      });

      it('should handle authentication with wrong password', async () => {
        const result = await userModel.authenticate(testUser.email, 'wrongpassword');
        expect(result).toBeNull();
      });

      it('should handle authentication with inactive user', async () => {
        // Deactivate user
        await userModel.update(testUser.id, { status: 'inactive' });

        const result = await userModel.authenticate(testUser.email, 'correctpassword');
        expect(result).toBeNull();
      });

      it('should handle authentication with suspended user', async () => {
        await userModel.update(testUser.id, { status: 'suspended' });

        const result = await userModel.authenticate(testUser.email, 'correctpassword');
        expect(result).toBeNull();
      });

      it('should handle bcrypt errors gracefully', async () => {
        const bcrypt = require('bcrypt');
        const originalCompare = bcrypt.compare;
        bcrypt.compare = jest.fn().mockRejectedValue(new Error('Bcrypt error'));

        await expect(userModel.authenticate(testUser.email, 'correctpassword')).rejects.toThrow(
          'Bcrypt error'
        );

        bcrypt.compare = originalCompare;
      });
    });

    describe('Password Change Errors', () => {
      let testUser;

      beforeEach(async () => {
        const userData = {
          email: 'password-change@example.com',
          password: 'oldpassword',
          full_name: 'Password Change User',
          role: 'waiter',
        };

        testUser = await userModel.create(userData);
        testUsers.push(testUser);
      });

      it('should handle password change for non-existent user', async () => {
        await expect(
          userModel.changePassword('550e8400-e29b-41d4-a716-446655440000', 'newpassword')
        ).rejects.toThrow();
      });

      it('should handle invalid UUID for password change', async () => {
        await expect(userModel.changePassword('invalid-uuid', 'newpassword')).rejects.toThrow(
          'Invalid user ID format'
        );
      });

      it('should handle bcrypt errors during password change', async () => {
        const bcrypt = require('bcrypt');
        const originalHash = bcrypt.hash;
        bcrypt.hash = jest.fn().mockRejectedValue(new Error('Hash error'));

        await expect(userModel.changePassword(testUser.id, 'newpassword')).rejects.toThrow(
          'Hash error'
        );

        bcrypt.hash = originalHash;
      });
    });
  });

  describe('4. Edge Cases', () => {
    describe('Boundary Value Testing', () => {
      it('should handle minimum length values', () => {
        const minimalData = {
          username: 'abc', // Minimum 3 characters
          password: 'abcdefgh', // Minimum 8 characters
          full_name: 'Ab', // Minimum 2 characters
          role: 'waiter',
        };

        const { error } = userModel.createSchema.validate(minimalData);
        expect(error).toBeUndefined();
      });

      it('should handle maximum length values', () => {
        const maximalData = {
          username: 'a'.repeat(100), // Maximum 100 characters
          password: 'a'.repeat(255), // Maximum 255 characters
          full_name: 'a'.repeat(255), // Maximum 255 characters
          role: 'waiter',
        };

        const { error } = userModel.createSchema.validate(maximalData);
        expect(error).toBeUndefined();
      });

      it('should reject values below minimum length', () => {
        const belowMinimumData = [
          {
            username: 'ab', // Below minimum
            password: 'abcdefgh',
            full_name: 'Test User',
            role: 'waiter',
          },
          {
            username: 'abc',
            password: 'abcdefg', // Below minimum
            full_name: 'Test User',
            role: 'waiter',
          },
          {
            username: 'abc',
            password: 'abcdefgh',
            full_name: 'A', // Below minimum
            role: 'waiter',
          },
        ];

        belowMinimumData.forEach((data) => {
          const { error } = userModel.createSchema.validate(data);
          expect(error).toBeDefined();
        });
      });

      it('should reject values above maximum length', () => {
        const aboveMaximumData = [
          {
            username: 'a'.repeat(101), // Above maximum
            password: 'abcdefgh',
            full_name: 'Test User',
            role: 'waiter',
          },
          {
            username: 'abc',
            password: 'a'.repeat(256), // Above maximum
            full_name: 'Test User',
            role: 'waiter',
          },
          {
            username: 'abc',
            password: 'abcdefgh',
            full_name: 'a'.repeat(256), // Above maximum
            role: 'waiter',
          },
        ];

        aboveMaximumData.forEach((data) => {
          const { error } = userModel.createSchema.validate(data);
          expect(error).toBeDefined();
        });
      });
    });

    describe('Null and Undefined Handling', () => {
      it('should handle null values appropriately', () => {
        const nullValueData = {
          email: null,
          username: 'testuser',
          password: 'password123',
          full_name: 'Test User',
          role: 'waiter',
          restaurant_id: null,
          created_by: null,
        };

        const { error } = userModel.createSchema.validate(nullValueData);
        expect(error).toBeUndefined();
      });

      it('should handle undefined values appropriately', () => {
        const undefinedValueData = {
          username: 'testuser',
          password: 'password123',
          full_name: 'Test User',
          role: 'waiter',
          // email, restaurant_id, created_by are undefined
        };

        const { error } = userModel.createSchema.validate(undefinedValueData);
        expect(error).toBeUndefined();
      });

      it('should handle mixed null and undefined values', () => {
        const mixedData = {
          email: null,
          username: 'testuser',
          password: 'password123',
          full_name: 'Test User',
          role: 'waiter',
          restaurant_id: null,
          // created_by is undefined
        };

        const { error } = userModel.createSchema.validate(mixedData);
        expect(error).toBeUndefined();
      });
    });

    describe('Special Character Handling', () => {
      it('should handle special characters in names', async () => {
        const specialCharNames = [
          "O'Connor",
          'José María',
          'Jean-Pierre',
          'Müller-Schmidt',
          '李小明',
          'Владимир',
        ];

        for (const name of specialCharNames) {
          const userData = {
            email: `special.${Date.now()}@example.com`,
            password: 'password123',
            full_name: name,
            role: 'waiter',
          };

          const user = await userModel.create(userData);
          testUsers.push(user);

          expect(user.full_name).toBe(name);
        }
      });

      it('should handle whitespace normalization', () => {
        const dataWithWhitespace = {
          username: 'testuser',
          password: 'password123',
          full_name: '  Test User  ', // Leading and trailing spaces
          role: 'waiter',
        };

        const { error, value } = userModel.createSchema.validate(dataWithWhitespace);
        expect(error).toBeUndefined();
        expect(value.full_name).toBe('Test User'); // Trimmed
      });
    });

    describe('Concurrency Edge Cases', () => {
      it('should handle race conditions in user creation', async () => {
        const userData = {
          email: 'race-condition@example.com',
          password: 'password123',
          full_name: 'Race Condition User',
          role: 'waiter',
        };

        // Try to create the same user simultaneously
        const promises = [userModel.create(userData), userModel.create(userData)];

        const results = await Promise.allSettled(promises);

        // One should succeed, one should fail
        const fulfilled = results.filter((r) => r.status === 'fulfilled');
        const rejected = results.filter((r) => r.status === 'rejected');

        expect(fulfilled.length).toBe(1);
        expect(rejected.length).toBe(1);
        expect(rejected[0].reason.message).toContain('already exists');

        if (fulfilled[0]) {
          testUsers.push(fulfilled[0].value);
        }
      });

      it('should handle concurrent updates', async () => {
        const userData = {
          email: 'concurrent-update@example.com',
          password: 'password123',
          full_name: 'Concurrent Update User',
          role: 'waiter',
        };

        const user = await userModel.create(userData);
        testUsers.push(user);

        // Try to update simultaneously
        const promises = [
          userModel.update(user.id, { full_name: 'Updated Name 1' }),
          userModel.update(user.id, { full_name: 'Updated Name 2' }),
        ];

        const results = await Promise.allSettled(promises);

        // Both should succeed (last one wins)
        results.forEach((result) => {
          expect(result.status).toBe('fulfilled');
        });
      });
    });
  });

  describe('5. Recovery and Resilience', () => {
    describe('Error Recovery', () => {
      it('should recover from temporary database errors', async () => {
        const originalExecuteQuery = userModel.executeQuery;
        let callCount = 0;

        // Simulate temporary failure
        userModel.executeQuery = jest.fn().mockImplementation((...args) => {
          callCount++;
          if (callCount === 1) {
            throw new Error('Temporary database error');
          }
          return originalExecuteQuery.apply(userModel, args);
        });

        const userData = {
          email: 'recovery-test@example.com',
          password: 'password123',
          full_name: 'Recovery Test User',
          role: 'waiter',
        };

        // First call should fail
        await expect(userModel.create(userData)).rejects.toThrow('Temporary database error');

        // Reset call count and try again
        callCount = 0;
        userModel.executeQuery = originalExecuteQuery;

        // Second call should succeed
        const user = await userModel.create(userData);
        testUsers.push(user);

        expect(user).toBeDefined();
      });

      it('should maintain data consistency after errors', async () => {
        const userData = {
          email: 'consistency-test@example.com',
          password: 'password123',
          full_name: 'Consistency Test User',
          role: 'waiter',
        };

        // Create user successfully
        const user = await userModel.create(userData);
        testUsers.push(user);

        // Simulate error during update
        const originalExecuteQuery = userModel.executeQuery;
        userModel.executeQuery = jest.fn().mockRejectedValue(new Error('Update failed'));

        try {
          await userModel.update(user.id, { full_name: 'Failed Update' });
        } catch (error) {
          expect(error.message).toBe('Update failed');
        }

        // Restore and verify data is unchanged
        userModel.executeQuery = originalExecuteQuery;
        const unchangedUser = await userModel.findById(user.id);

        expect(unchangedUser.full_name).toBe(userData.full_name);
      });
    });

    describe('Resource Cleanup', () => {
      it('should clean up resources after errors', async () => {
        const userData = {
          email: 'cleanup-test@example.com',
          password: 'password123',
          full_name: 'Cleanup Test User',
          role: 'waiter',
        };

        // Mock crypto to simulate token generation failure
        const crypto = require('crypto');
        const originalRandomBytes = crypto.randomBytes;
        crypto.randomBytes = jest.fn().mockImplementation(() => {
          throw new Error('Token generation failed');
        });

        await expect(userModel.create(userData)).rejects.toThrow();

        // Restore crypto
        crypto.randomBytes = originalRandomBytes;

        // Verify we can still create users normally
        const user = await userModel.create(userData);
        testUsers.push(user);

        expect(user).toBeDefined();
      });
    });
  });
});
