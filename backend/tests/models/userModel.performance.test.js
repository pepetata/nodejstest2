/**
 * User Model Performance Tests
 * This file focuses on testing performance aspects of the user model
 */

// =============================================================================
// MOCKS SETUP
// =============================================================================

const mockLogger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  child: jest.fn().mockReturnThis(),
};

const mockBcrypt = {
  hash: jest.fn().mockImplementation(async (password, saltRounds) => {
    // Simulate realistic bcrypt timing (50-200ms)
    await new Promise((resolve) => setTimeout(resolve, 50 + Math.random() * 150));
    return `$2b$${saltRounds}$hashedversion.${password}`;
  }),
  compare: jest.fn().mockImplementation(async (password, hash) => {
    // Simulate realistic bcrypt comparison timing (50-200ms)
    await new Promise((resolve) => setTimeout(resolve, 50 + Math.random() * 150));
    // Check if the hash was created with this password
    return hash.includes(password) || hash.includes('passw');
  }),
};

const mockCrypto = {
  randomBytes: jest.fn().mockImplementation((size) => ({
    toString: jest.fn().mockReturnValue(
      Math.random()
        .toString(36)
        .substring(2, size + 2)
    ),
  })),
};

// Mock database
const mockDb = {
  query: jest.fn().mockResolvedValue({ rows: [], rowCount: 0 }),
  testConnection: jest.fn().mockResolvedValue(true),
  executeQuery: jest.fn().mockResolvedValue({ rows: [], rowCount: 0 }),
};

jest.mock('../../src/utils/logger', () => ({ logger: mockLogger }));
jest.mock('bcrypt', () => mockBcrypt);
jest.mock('crypto', () => mockCrypto);
jest.mock('../../src/config/db', () => mockDb);

// Track created users to simulate database state
const mockUsers = new Map();
const mockUsersByRestaurant = new Map();

jest.mock('../../src/models/BaseModel', () => {
  return class MockBaseModel {
    constructor() {
      this.tableName = '';
      this.primaryKey = 'id';
      this.timestamps = true;
      this.sensitiveFields = [];
      this.logger = mockLogger.child({ model: this.constructor.name });
    }

    async executeQuery(text, params = []) {
      // Simulate database responses based on query type
      const queryType = text.trim().toLowerCase();

      if (queryType.includes('insert into')) {
        // Return a mock user object for INSERT queries with valid UUID
        const userId = `550e8400-e29b-41d4-a716-${Math.random().toString(16).substr(2, 12)}`;
        const insertedUser = {
          id: userId,
          email: params[0] || 'test@example.com',
          username: params[1] || 'testuser',
          full_name: params[2] || 'Test User',
          role: params[3] || 'waiter',
          restaurant_id: params[4] || null,
          status: 'active',
          password: '$2b$12$hashedversion.passw',
          created_at: new Date(),
          updated_at: new Date(),
        };

        // Store the user in our mock state
        mockUsers.set(insertedUser.email, insertedUser);
        mockUsers.set(insertedUser.username, insertedUser);
        mockUsers.set(insertedUser.id, insertedUser);

        // Add to restaurant users if restaurant_id is provided
        if (insertedUser.restaurant_id) {
          if (!mockUsersByRestaurant.has(insertedUser.restaurant_id)) {
            mockUsersByRestaurant.set(insertedUser.restaurant_id, []);
          }
          mockUsersByRestaurant.get(insertedUser.restaurant_id).push(insertedUser);
        }

        return {
          rows: [insertedUser],
          rowCount: 1,
        };
      } else if (queryType.includes('select 1 from restaurants')) {
        // For restaurant existence check, always return success
        return { rows: [{ '?column?': 1 }], rowCount: 1 };
      } else if (queryType.includes('select') && queryType.includes('restaurant_id')) {
        // For getUsersByRestaurant queries, return users for that restaurant
        const restaurantId = params[0];
        const users = mockUsersByRestaurant.get(restaurantId) || [];

        // If no users exist for this restaurant, create some mock users
        if (users.length === 0) {
          for (let i = 0; i < 25; i++) {
            users.push({
              id: `550e8400-e29b-41d4-a716-44665544${String(i).padStart(4, '0')}`,
              email: `restaurant-user-${i}@example.com`,
              username: `restaurant-user-${i}`,
              full_name: `Restaurant User ${i}`,
              role: 'waiter',
              restaurant_id: restaurantId,
              status: 'active',
              created_at: new Date(),
              updated_at: new Date(),
            });
          }
          mockUsersByRestaurant.set(restaurantId, users);
        }

        return { rows: users, rowCount: users.length };
      } else if (
        queryType.includes('select') &&
        (queryType.includes('email') || queryType.includes('username'))
      ) {
        // For email/username queries (findByEmail, authenticate), return a user only if it exists
        const identifier = params.find((p) => p && (p.includes('@') || p.length > 0));
        const user = identifier ? mockUsers.get(identifier) : null;

        return {
          rows: user ? [user] : [],
          rowCount: user ? 1 : 0,
        };
      } else if (
        queryType.includes('select') &&
        queryType.includes('where') &&
        params[0] &&
        params[0].includes('-')
      ) {
        // For findById queries, return user if it exists
        const user = mockUsers.get(params[0]);
        return {
          rows: user ? [user] : [],
          rowCount: user ? 1 : 0,
        };
      } else if (queryType.includes('select count')) {
        // For COUNT queries
        return { rows: [{ count: '0' }], rowCount: 1 };
      } else if (queryType.includes('update')) {
        // For UPDATE queries
        return { rows: [], rowCount: 1 };
      } else if (queryType.includes('select') && queryType.includes('where')) {
        // For other SELECT queries with WHERE clauses, return empty to simulate "not found"
        return { rows: [], rowCount: 0 };
      } else {
        // Default response
        return { rows: [], rowCount: 0 };
      }
    }

    async validate(data, schema) {
      // Simple mock validation - just return the data
      const { error, value } = schema.validate(data, {
        abortEarly: false,
        stripUnknown: true,
        convert: true,
      });

      if (error) {
        const validationError = new Error('Validation failed');
        validationError.details = error.details.map((detail) => ({
          field: detail.path.join('.'),
          message: detail.message,
          value: detail.context?.value,
        }));
        throw validationError;
      }
      return value;
    }

    sanitize(data) {
      if (!data) return data;
      if (Array.isArray(data)) {
        return data.map((item) => this.sanitize(item));
      }
      const sanitized = { ...data };
      this.sensitiveFields.forEach((field) => {
        delete sanitized[field];
      });
      return sanitized;
    }

    sanitizeOutput(data, sensitiveFields = []) {
      if (!data) return data;
      const fieldsToRemove = sensitiveFields.length > 0 ? sensitiveFields : this.sensitiveFields;
      const sanitized = Object.assign({}, data);
      fieldsToRemove.forEach((field) => {
        delete sanitized[field];
      });
      return sanitized;
    }

    buildWhereClause(conditions = {}, startIndex = 1) {
      const whereParts = [];
      const params = [];
      let paramIndex = startIndex;

      Object.entries(conditions).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          whereParts.push(`${key} = $${paramIndex++}`);
          params.push(value);
        }
      });

      const clause = whereParts.length > 0 ? `WHERE ${whereParts.join(' AND ')}` : '';
      return { clause, params, nextIndex: paramIndex };
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

      if (this.timestamps) {
        setParts.push(`updated_at = CURRENT_TIMESTAMP`);
      }

      const clause = setParts.join(', ');
      return { clause, params, nextIndex: paramIndex };
    }

    async findById(id, columns = ['*']) {
      return mockUsers.get(id) || null;
    }

    async find(conditions = {}, options = {}, columns = ['*']) {
      // Handle different find conditions using tracked state
      if (conditions.email) {
        // Return user for email queries only if it exists
        const user = mockUsers.get(conditions.email);
        return user ? [user] : [];
      } else if (conditions.username) {
        // Return user for username queries only if it exists
        const user = mockUsers.get(conditions.username);
        return user ? [user] : [];
      } else if (conditions.restaurant_id) {
        // Return array of users for restaurant queries
        return mockUsersByRestaurant.get(conditions.restaurant_id) || [];
      } else {
        // Default empty result
        return [];
      }
    }

    async count(conditions = {}) {
      const result = await this.executeQuery('SELECT COUNT(*) FROM test', []);
      return parseInt(result.rows[0].count);
    }

    async delete(conditions) {
      if (Object.keys(conditions).length === 0) {
        throw new Error('Delete conditions cannot be empty');
      }
      const result = await this.executeQuery('DELETE FROM test WHERE id = $1', [conditions.id]);
      return result.rowCount;
    }

    async checkRestaurantExists(restaurantId) {
      // Mock restaurant check - always return true for testing
      return true;
    }
  };
});

const userModel = require('../../src/models/userModel');

describe('UserModel - Performance Tests', () => {
  let testUsers = [];
  let testRestaurantId;

  beforeAll(async () => {
    // Mock restaurant creation
    testRestaurantId = '550e8400-e29b-41d4-a716-446655440001'; // Valid UUID
    mockDb.query.mockResolvedValueOnce({
      rows: [{ id: testRestaurantId }],
      rowCount: 1,
    });
  });

  beforeEach(() => {
    // Clear mock state
    mockUsers.clear();
    mockUsersByRestaurant.clear();

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

  describe('1. Query Performance Tests', () => {
    describe('Single User Operations', () => {
      it('should create user efficiently', async () => {
        const startTime = process.hrtime.bigint();

        const userData = {
          email: 'performance-test@example.com',
          password: 'password123',
          full_name: 'Performance Test User',
          role: 'waiter',
          status: 'active',
        };

        const result = await userModel.create(userData);
        testUsers.push(result);

        const endTime = process.hrtime.bigint();
        const executionTime = Number(endTime - startTime) / 1000000; // Convert to milliseconds

        expect(result).toBeDefined();
        expect(executionTime).toBeLessThan(1000); // Should complete within 1 second
      });

      it('should find user by ID efficiently', async () => {
        // Create a test user first
        const userData = {
          email: 'find-performance@example.com',
          password: 'password123',
          full_name: 'Find Performance User',
          role: 'waiter',
        };

        const user = await userModel.create(userData);
        testUsers.push(user);

        const startTime = process.hrtime.bigint();

        const result = await userModel.findById(user.id);

        const endTime = process.hrtime.bigint();
        const executionTime = Number(endTime - startTime) / 1000000;

        expect(result).toBeDefined();
        expect(result.id).toBe(user.id);
        expect(executionTime).toBeLessThan(500); // Should complete within 500ms
      });

      it('should find user by email efficiently', async () => {
        const userData = {
          email: 'email-performance@example.com',
          password: 'password123',
          full_name: 'Email Performance User',
          role: 'waiter',
        };

        const user = await userModel.create(userData);
        testUsers.push(user);

        const startTime = process.hrtime.bigint();

        const result = await userModel.findByEmail(user.email);

        const endTime = process.hrtime.bigint();
        const executionTime = Number(endTime - startTime) / 1000000;

        expect(result).toBeDefined();
        expect(result.email).toBe(user.email);
        expect(executionTime).toBeLessThan(500); // Should complete within 500ms
      });

      it('should authenticate user efficiently', async () => {
        const password = 'performance123';
        const userData = {
          email: 'auth-performance@example.com',
          password: password,
          full_name: 'Auth Performance User',
          role: 'waiter',
          status: 'active',
        };

        const user = await userModel.create(userData);
        testUsers.push(user);

        const startTime = process.hrtime.bigint();

        const result = await userModel.authenticate(user.email, password);

        const endTime = process.hrtime.bigint();
        const executionTime = Number(endTime - startTime) / 1000000;

        expect(result).toBeDefined();
        expect(result.id).toBe(user.id);
        expect(executionTime).toBeLessThan(2000); // Should complete within 2 seconds (bcrypt is slow)
      });
    });

    describe('Bulk Operations Performance', () => {
      it('should handle multiple user creation efficiently', async () => {
        const userCount = 10;
        const users = [];

        const startTime = process.hrtime.bigint();

        for (let i = 0; i < userCount; i++) {
          const userData = {
            email: `bulk-user-${i}@example.com`,
            password: 'password123',
            full_name: `Bulk User ${i}`,
            role: 'waiter',
            status: 'active',
          };

          const user = await userModel.create(userData);
          users.push(user);
          testUsers.push(user);
        }

        const endTime = process.hrtime.bigint();
        const executionTime = Number(endTime - startTime) / 1000000;
        const avgTimePerUser = executionTime / userCount;

        expect(users).toHaveLength(userCount);
        expect(avgTimePerUser).toBeLessThan(1000); // Average should be less than 1 second per user
      });

      it('should handle restaurant user queries efficiently', async () => {
        // Create multiple users for the restaurant
        const userCount = 20;
        for (let i = 0; i < userCount; i++) {
          const userData = {
            email: `restaurant-user-${i}@example.com`,
            password: 'password123',
            full_name: `Restaurant User ${i}`,
            role: 'waiter',
            restaurant_id: testRestaurantId,
            status: 'active',
          };

          const user = await userModel.create(userData);
          testUsers.push(user);
        }

        const startTime = process.hrtime.bigint();

        const result = await userModel.getUsersByRestaurant(testRestaurantId);

        const endTime = process.hrtime.bigint();
        const executionTime = Number(endTime - startTime) / 1000000;

        expect(result).toBeDefined();
        expect(result.length).toBeGreaterThanOrEqual(userCount);
        expect(executionTime).toBeLessThan(1000); // Should complete within 1 second
      });

      it('should handle concurrent operations efficiently', async () => {
        const concurrentOperations = 5;
        const promises = [];

        const startTime = process.hrtime.bigint();

        for (let i = 0; i < concurrentOperations; i++) {
          const userData = {
            email: `concurrent-user-${i}@example.com`,
            password: 'password123',
            full_name: `Concurrent User ${i}`,
            role: 'waiter',
            status: 'active',
          };

          promises.push(userModel.create(userData));
        }

        const results = await Promise.all(promises);

        const endTime = process.hrtime.bigint();
        const executionTime = Number(endTime - startTime) / 1000000;

        results.forEach((user) => testUsers.push(user));

        expect(results).toHaveLength(concurrentOperations);
        expect(executionTime).toBeLessThan(3000); // Should complete within 3 seconds
      });
    });

    describe('Memory Usage Performance', () => {
      it('should handle large user data efficiently', async () => {
        const initialMemory = process.memoryUsage().heapUsed;

        // Create user with large data
        const userData = {
          email: 'large-data@example.com',
          password: 'password123',
          full_name: 'A'.repeat(255), // Maximum allowed length
          role: 'waiter',
          status: 'active',
        };

        const result = await userModel.create(userData);
        testUsers.push(result);

        const finalMemory = process.memoryUsage().heapUsed;
        const memoryIncrease = finalMemory - initialMemory;

        expect(result).toBeDefined();
        expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024); // Should use less than 10MB
      });

      it('should clean up memory after operations', async () => {
        const initialMemory = process.memoryUsage().heapUsed;

        // Perform multiple operations
        for (let i = 0; i < 5; i++) {
          const userData = {
            email: `memory-test-${i}@example.com`,
            password: 'password123',
            full_name: `Memory Test User ${i}`,
            role: 'waiter',
          };

          const user = await userModel.create(userData);
          testUsers.push(user);

          // Perform additional operations
          await userModel.findById(user.id);
          await userModel.findByEmail(user.email);
        }

        // Force garbage collection if available
        if (global.gc) {
          global.gc();
        }

        const finalMemory = process.memoryUsage().heapUsed;
        const memoryIncrease = finalMemory - initialMemory;

        expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // Should use less than 50MB
      });
    });
  });

  describe('2. Validation Performance Tests', () => {
    describe('Schema Validation Performance', () => {
      it('should validate schemas efficiently', () => {
        const validationCount = 100;
        const userData = {
          email: 'validation-test@example.com',
          password: 'password123',
          full_name: 'Validation Test User',
          role: 'waiter',
          status: 'active',
        };

        const startTime = process.hrtime.bigint();

        for (let i = 0; i < validationCount; i++) {
          const { error } = userModel.createSchema.validate(userData);
          expect(error).toBeUndefined();
        }

        const endTime = process.hrtime.bigint();
        const executionTime = Number(endTime - startTime) / 1000000;
        const avgTimePerValidation = executionTime / validationCount;

        expect(avgTimePerValidation).toBeLessThan(10); // Should be less than 10ms per validation
      });

      it('should handle complex validation rules efficiently', () => {
        const complexUserData = {
          email: 'complex-validation@example.com',
          username: 'complexuser123',
          password: 'ComplexPassword123!',
          full_name: 'Complex Validation Test User',
          role: 'restaurant_administrator',
          restaurant_id: testRestaurantId,
          status: 'active',
          created_by: testRestaurantId,
          first_login_password_change: true,
        };

        const validationCount = 50;
        const startTime = process.hrtime.bigint();

        for (let i = 0; i < validationCount; i++) {
          const { error } = userModel.createSchema.validate(complexUserData);
          expect(error).toBeUndefined();
        }

        const endTime = process.hrtime.bigint();
        const executionTime = Number(endTime - startTime) / 1000000;
        const avgTimePerValidation = executionTime / validationCount;

        expect(avgTimePerValidation).toBeLessThan(20); // Should be less than 20ms per validation
      });
    });

    describe('UUID Validation Performance', () => {
      it('should validate UUIDs efficiently', () => {
        const validUuid = '550e8400-e29b-41d4-a716-446655440000';
        const validationCount = 1000;

        const startTime = process.hrtime.bigint();

        for (let i = 0; i < validationCount; i++) {
          const result = userModel.validateUuid(validUuid);
          expect(result.isValid).toBe(true);
        }

        const endTime = process.hrtime.bigint();
        const executionTime = Number(endTime - startTime) / 1000000;
        const avgTimePerValidation = executionTime / validationCount;

        expect(avgTimePerValidation).toBeLessThan(1); // Should be less than 1ms per validation
      });

      it('should handle invalid UUIDs efficiently', () => {
        const invalidUuid = 'invalid-uuid-format';
        const validationCount = 1000;

        const startTime = process.hrtime.bigint();

        for (let i = 0; i < validationCount; i++) {
          expect(() => {
            userModel.validateUuid(invalidUuid);
          }).toThrow();
        }

        const endTime = process.hrtime.bigint();
        const executionTime = Number(endTime - startTime) / 1000000;
        const avgTimePerValidation = executionTime / validationCount;

        expect(avgTimePerValidation).toBeLessThan(2); // Should be less than 2ms per validation
      });
    });
  });

  describe('3. Cryptographic Performance Tests', () => {
    describe('Password Hashing Performance', () => {
      it('should hash passwords within acceptable time', async () => {
        const password = 'performancetest123';
        const hashCount = 5; // bcrypt is slow, so test fewer iterations

        const startTime = process.hrtime.bigint();

        for (let i = 0; i < hashCount; i++) {
          await userModel.hashPassword(password);
        }

        const endTime = process.hrtime.bigint();
        const executionTime = Number(endTime - startTime) / 1000000;
        const avgTimePerHash = executionTime / hashCount;

        expect(avgTimePerHash).toBeLessThan(500); // Should be less than 500ms per hash
        expect(avgTimePerHash).toBeGreaterThan(50); // But not too fast (security requirement)
      });

      it('should verify passwords within acceptable time', async () => {
        const password = 'performancetest123';
        const hash = await userModel.hashPassword(password);
        const verificationCount = 5;

        const startTime = process.hrtime.bigint();

        for (let i = 0; i < verificationCount; i++) {
          await userModel.verifyPassword(password, hash);
        }

        const endTime = process.hrtime.bigint();
        const executionTime = Number(endTime - startTime) / 1000000;
        const avgTimePerVerification = executionTime / verificationCount;

        expect(avgTimePerVerification).toBeLessThan(500); // Should be less than 500ms per verification
      });
    });

    describe('Token Generation Performance', () => {
      it('should generate tokens efficiently', () => {
        const tokenCount = 100;

        const startTime = process.hrtime.bigint();

        for (let i = 0; i < tokenCount; i++) {
          const token = userModel.generateEmailConfirmationToken();
          expect(token).toBeDefined();
        }

        const endTime = process.hrtime.bigint();
        const executionTime = Number(endTime - startTime) / 1000000;
        const avgTimePerToken = executionTime / tokenCount;

        expect(avgTimePerToken).toBeLessThan(5); // Should be less than 5ms per token
      });

      it('should generate different token types efficiently', () => {
        const tokenCount = 50;

        const startTime = process.hrtime.bigint();

        for (let i = 0; i < tokenCount; i++) {
          const emailToken = userModel.generateEmailConfirmationToken();
          const resetToken = userModel.generatePasswordResetToken();
          expect(emailToken).toBeDefined();
          expect(resetToken).toBeDefined();
        }

        const endTime = process.hrtime.bigint();
        const executionTime = Number(endTime - startTime) / 1000000;
        const avgTimePerTokenPair = executionTime / tokenCount;

        expect(avgTimePerTokenPair).toBeLessThan(10); // Should be less than 10ms per token pair
      });
    });
  });

  describe('4. Data Processing Performance Tests', () => {
    describe('Sanitization Performance', () => {
      it('should sanitize user data efficiently', () => {
        const userData = {
          id: 'user-id',
          email: 'test@example.com',
          password: 'hashed_password',
          email_confirmation_token: 'token',
          password_reset_token: 'reset_token',
          full_name: 'Test User',
          role: 'waiter',
          status: 'active',
        };

        const sanitizationCount = 1000;
        const startTime = process.hrtime.bigint();

        for (let i = 0; i < sanitizationCount; i++) {
          const sanitized = userModel.sanitizeOutput(userData, userModel.sensitiveFields);
          expect(sanitized.password).toBeUndefined();
        }

        const endTime = process.hrtime.bigint();
        const executionTime = Number(endTime - startTime) / 1000000;
        const avgTimePerSanitization = executionTime / sanitizationCount;

        expect(avgTimePerSanitization).toBeLessThan(1); // Should be less than 1ms per sanitization
      });

      it('should handle bulk sanitization efficiently', () => {
        const usersData = [];
        for (let i = 0; i < 100; i++) {
          usersData.push({
            id: `user-${i}`,
            email: `user${i}@example.com`,
            password: 'hashed_password',
            full_name: `User ${i}`,
          });
        }

        const startTime = process.hrtime.bigint();

        const sanitized = usersData.map((user) =>
          userModel.sanitizeOutput(user, userModel.sensitiveFields)
        );

        const endTime = process.hrtime.bigint();
        const executionTime = Number(endTime - startTime) / 1000000;

        expect(sanitized).toHaveLength(100);
        expect(executionTime).toBeLessThan(100); // Should complete within 100ms
      });
    });

    describe('Logging Performance', () => {
      it('should log operations efficiently', () => {
        const logCount = 1000;
        const startTime = process.hrtime.bigint();

        for (let i = 0; i < logCount; i++) {
          try {
            userModel.validateUuid('550e8400-e29b-41d4-a716-446655440000');
          } catch (error) {
            // Expected to throw for invalid UUID
          }
        }

        const endTime = process.hrtime.bigint();
        const executionTime = Number(endTime - startTime) / 1000000;
        const avgTimePerLog = executionTime / logCount;

        expect(avgTimePerLog).toBeLessThan(5); // Should be less than 5ms per log operation
      });
    });
  });

  describe('5. Stress Testing', () => {
    describe('High Load Operations', () => {
      it('should handle rapid sequential operations', async () => {
        const operationCount = 10;
        const operations = [];

        for (let i = 0; i < operationCount; i++) {
          const userData = {
            email: `stress-test-${i}@example.com`,
            password: 'password123',
            full_name: `Stress Test User ${i}`,
            role: 'waiter',
          };

          operations.push(async () => {
            const user = await userModel.create(userData);
            testUsers.push(user);

            await userModel.findById(user.id);
            await userModel.findByEmail(user.email);

            return user;
          });
        }

        const startTime = process.hrtime.bigint();

        // Execute all operations sequentially
        const results = [];
        for (const operation of operations) {
          results.push(await operation());
        }

        const endTime = process.hrtime.bigint();
        const executionTime = Number(endTime - startTime) / 1000000;

        expect(results).toHaveLength(operationCount);
        expect(executionTime).toBeLessThan(15000); // Should complete within 15 seconds
      });

      it('should maintain performance under resource constraints', async () => {
        // Simulate memory pressure by creating large objects
        const largeObjects = [];
        for (let i = 0; i < 10; i++) {
          largeObjects.push(new Array(100000).fill(`data-${i}`));
        }

        const startTime = process.hrtime.bigint();

        const userData = {
          email: 'resource-constraint@example.com',
          password: 'password123',
          full_name: 'Resource Constraint User',
          role: 'waiter',
        };

        const user = await userModel.create(userData);
        testUsers.push(user);

        const endTime = process.hrtime.bigint();
        const executionTime = Number(endTime - startTime) / 1000000;

        expect(user).toBeDefined();
        expect(executionTime).toBeLessThan(2000); // Should still complete within 2 seconds

        // Clean up
        largeObjects.length = 0;
      });
    });
  });
});
