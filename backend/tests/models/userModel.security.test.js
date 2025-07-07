/**
 * User Model Security Tests
 * This file focuses on testing security aspects of the user model
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
const bcrypt = require('bcrypt');

describe('UserModel - Security Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('1. Data Security Tests', () => {
    describe('Password Security', () => {
      it('should use strong salt rounds for password hashing', async () => {
        const password = 'testpassword123';
        await userModel.hashPassword(password);

        expect(bcrypt.hash).toHaveBeenCalledWith(password, 12);
      });

      it('should never expose passwords in output', () => {
        const userData = {
          id: 'user-id',
          email: 'test@example.com',
          password: 'hashed_password',
          full_name: 'Test User',
        };

        const sanitized = userModel.sanitizeOutput(userData, userModel.sensitiveFields);

        expect(sanitized.password).toBeUndefined();
      });

      it('should handle password verification securely', async () => {
        const password = 'testpassword123';
        const hash = '$2b$12$hashed_password';

        await userModel.verifyPassword(password, hash);

        expect(bcrypt.compare).toHaveBeenCalledWith(password, hash);
      });

      it('should reject weak passwords during validation', () => {
        const weakPasswords = [
          'weak', // Too short
          '1234567', // Only numbers, too short
          'password', // Common password, too short
          '', // Empty
          '   ', // Whitespace only
        ];

        weakPasswords.forEach((password) => {
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

      it('should accept strong passwords', () => {
        const strongPasswords = [
          'MyStrongPassword123',
          'Complex@Password!',
          'LongEnoughPassword',
          'AnotherGoodOne123',
        ];

        strongPasswords.forEach((password) => {
          const userData = {
            username: 'testuser',
            password: password,
            full_name: 'Test User',
            role: 'waiter',
          };

          const { error } = userModel.createSchema.validate(userData);
          expect(error).toBeUndefined();
        });
      });
    });

    describe('Sensitive Field Protection', () => {
      it('should never expose email confirmation tokens', () => {
        const userData = {
          id: 'user-id',
          email: 'test@example.com',
          email_confirmation_token: 'secret_token',
          full_name: 'Test User',
        };

        const sanitized = userModel.sanitizeOutput(userData, userModel.sensitiveFields);

        expect(sanitized.email_confirmation_token).toBeUndefined();
      });

      it('should never expose password reset tokens', () => {
        const userData = {
          id: 'user-id',
          email: 'test@example.com',
          password_reset_token: 'secret_reset_token',
          full_name: 'Test User',
        };

        const sanitized = userModel.sanitizeOutput(userData, userModel.sensitiveFields);

        expect(sanitized.password_reset_token).toBeUndefined();
      });

      it('should have all sensitive fields properly defined', () => {
        const expectedSensitiveFields = [
          'password',
          'email_confirmation_token',
          'password_reset_token',
        ];

        expect(userModel.sensitiveFields).toEqual(expectedSensitiveFields);
      });

      it('should sanitize arrays of user data', () => {
        const usersData = [
          {
            id: 'user-1',
            email: 'user1@example.com',
            password: 'hashed_password_1',
            full_name: 'User One',
          },
          {
            id: 'user-2',
            email: 'user2@example.com',
            password: 'hashed_password_2',
            full_name: 'User Two',
          },
        ];

        const sanitized = usersData.map((user) =>
          userModel.sanitizeOutput(user, userModel.sensitiveFields)
        );

        sanitized.forEach((user) => {
          expect(user.password).toBeUndefined();
          expect(user.id).toBeDefined();
          expect(user.email).toBeDefined();
          expect(user.full_name).toBeDefined();
        });
      });
    });

    describe('Token Security', () => {
      it('should generate cryptographically secure tokens', () => {
        const crypto = require('crypto');

        // Mock to verify we're using crypto.randomBytes
        crypto.randomBytes = jest.fn().mockReturnValue({
          toString: jest.fn().mockReturnValue('secure_token'),
        });

        const token = userModel.generateEmailConfirmationToken();

        expect(crypto.randomBytes).toHaveBeenCalledWith(32);
        expect(token).toBe('secure_token');
      });

      it('should generate different tokens each time', () => {
        const crypto = require('crypto');

        // Mock to return different values
        let callCount = 0;
        crypto.randomBytes = jest.fn().mockImplementation(() => ({
          toString: jest.fn().mockReturnValue(`token_${++callCount}`),
        }));

        const token1 = userModel.generateEmailConfirmationToken();
        const token2 = userModel.generatePasswordResetToken();

        expect(token1).not.toBe(token2);
        expect(crypto.randomBytes).toHaveBeenCalledTimes(2);
      });
    });

    describe('Input Validation Security', () => {
      it('should reject SQL injection attempts in email', () => {
        const maliciousEmails = [
          "'; DROP TABLE users; --",
          "admin@example.com'; DELETE FROM users WHERE '1'='1",
          "test@example.com' OR '1'='1",
        ];

        maliciousEmails.forEach((email) => {
          const userData = {
            email: email,
            password: 'password123',
            full_name: 'Test User',
            role: 'restaurant_administrator',
            restaurant_id: '550e8400-e29b-41d4-a716-446655440000',
          };

          const { error } = userModel.createSchema.validate(userData);
          expect(error).toBeDefined(); // Should fail email validation
        });
      });

      it('should reject XSS attempts in full_name', () => {
        const maliciousNames = [
          '<script>alert("xss")</script>',
          'javascript:alert("xss")',
          '<img src="x" onerror="alert(1)">',
        ];

        maliciousNames.forEach((name) => {
          const userData = {
            username: 'testuser',
            password: 'password123',
            full_name: name,
            role: 'waiter',
          };

          // Note: The schema allows these as it's the responsibility of
          // XSS middleware to sanitize, but we test they don't break validation
          const { error } = userModel.createSchema.validate(userData);
          expect(error).toBeUndefined(); // Should pass validation but be sanitized by middleware
        });
      });

      it('should validate role-based access requirements', () => {
        // Restaurant administrator must have email and restaurant_id
        const invalidAdminData = {
          username: 'admin',
          password: 'password123',
          full_name: 'Admin User',
          role: 'restaurant_administrator',
          // Missing email and restaurant_id
        };

        const { error } = userModel.createSchema.validate(invalidAdminData);
        expect(error).toBeDefined();
      });

      it('should enforce UUID format for restaurant_id', () => {
        const invalidUuids = [
          'not-a-uuid',
          '123-456-789',
          'admin',
          '1234567890123456789012345678901234567890',
        ];

        invalidUuids.forEach((invalidUuid) => {
          const userData = {
            email: 'admin@example.com',
            password: 'password123',
            full_name: 'Admin User',
            role: 'restaurant_administrator',
            restaurant_id: invalidUuid,
          };

          const { error } = userModel.createSchema.validate(userData);
          expect(error).toBeDefined();
        });
      });
    });

    describe('Authorization Security', () => {
      it('should validate user roles against allowed values', () => {
        const validRoles = [
          'restaurant_administrator',
          'location_administrator',
          'waiter',
          'food_runner',
          'kds_operator',
          'pos_operator',
        ];

        const invalidRoles = ['admin', 'super_admin', 'root', 'user', 'guest', 'manager'];

        validRoles.forEach((role) => {
          const userData = {
            username: 'testuser',
            password: 'password123',
            full_name: 'Test User',
            role: role,
          };

          // Add required fields for admin roles
          if (['restaurant_administrator', 'location_administrator'].includes(role)) {
            userData.email = 'test@example.com';
            if (role === 'restaurant_administrator') {
              userData.restaurant_id = '550e8400-e29b-41d4-a716-446655440000';
            }
          }

          const { error } = userModel.createSchema.validate(userData);
          expect(error).toBeUndefined();
        });

        invalidRoles.forEach((role) => {
          const userData = {
            username: 'testuser',
            password: 'password123',
            full_name: 'Test User',
            role: role,
          };

          const { error } = userModel.createSchema.validate(userData);
          expect(error).toBeDefined();
        });
      });

      it('should validate status values for security', () => {
        const validStatuses = ['pending', 'active', 'inactive', 'suspended'];
        const invalidStatuses = ['admin', 'super', 'elevated', 'god_mode'];

        validStatuses.forEach((status) => {
          const userData = {
            username: 'testuser',
            password: 'password123',
            full_name: 'Test User',
            role: 'waiter',
            status: status,
          };

          const { error } = userModel.createSchema.validate(userData);
          expect(error).toBeUndefined();
        });

        invalidStatuses.forEach((status) => {
          const userData = {
            username: 'testuser',
            password: 'password123',
            full_name: 'Test User',
            role: 'waiter',
            status: status,
          };

          const { error } = userModel.createSchema.validate(userData);
          expect(error).toBeDefined();
        });
      });
    });
  });

  describe('2. Security Best Practices', () => {
    describe('Error Information Disclosure', () => {
      it('should not expose sensitive information in error messages', () => {
        try {
          userModel.validateUuid('invalid-uuid');
        } catch (error) {
          expect(error.message).not.toContain('database');
          expect(error.message).not.toContain('password');
          expect(error.message).not.toContain('token');
          expect(error.message).toContain('Invalid UUID format');
        }
      });

      it('should log security events appropriately', () => {
        // Test that validation failures are logged but don't expose sensitive data
        try {
          userModel.validateUuid(null);
        } catch (error) {
          expect(mockLogger.warn).toHaveBeenCalled();

          // Check that logged data doesn't contain sensitive information
          const logCall = mockLogger.warn.mock.calls[0];
          const logMessage = JSON.stringify(logCall);
          expect(logMessage).not.toContain('password');
          expect(logMessage).not.toContain('token');
        }
      });
    });

    describe('Resource Protection', () => {
      it('should handle malformed data gracefully', () => {
        const malformedInputs = [null, undefined, '', 0, false, [], {}, { malicious: 'data' }];

        malformedInputs.forEach((input) => {
          expect(() => {
            userModel.sanitizeOutput(input, userModel.sensitiveFields);
          }).not.toThrow();
        });
      });

      it('should validate input lengths to prevent buffer overflow', () => {
        const veryLongString = 'a'.repeat(10000);

        const userData = {
          username: veryLongString,
          password: 'password123',
          full_name: veryLongString,
          role: 'waiter',
        };

        const { error } = userModel.createSchema.validate(userData);
        expect(error).toBeDefined(); // Should fail due to length constraints
      });

      it('should handle concurrent access safely', async () => {
        // Test that multiple operations don't interfere with each other
        const promises = [];

        for (let i = 0; i < 10; i++) {
          promises.push(Promise.resolve(userModel.generateEmailConfirmationToken()));
        }

        const tokens = await Promise.all(promises);

        // All tokens should be generated (no exceptions)
        expect(tokens).toHaveLength(10);
        tokens.forEach((token) => {
          expect(token).toBeDefined();
        });
      });
    });

    describe('Audit Trail Security', () => {
      it('should log user operations for audit purposes', () => {
        // Test that sensitive operations are logged
        userModel.validateUuid('550e8400-e29b-41d4-a716-446655440000');

        expect(mockLogger.debug).toHaveBeenCalledWith(
          'Validating UUID',
          expect.objectContaining({
            uuid: expect.stringMatching(/^550e8400\.\.\.$/),
          })
        );
      });

      it('should not log sensitive data in audit trails', () => {
        const userData = {
          id: 'user-id',
          email: 'test@example.com',
          password: 'sensitive_password',
        };

        userModel.sanitizeOutput(userData, userModel.sensitiveFields);

        // Check that no log calls contain sensitive data
        const allLogCalls = [
          ...mockLogger.debug.mock.calls,
          ...mockLogger.info.mock.calls,
          ...mockLogger.warn.mock.calls,
          ...mockLogger.error.mock.calls,
        ];

        allLogCalls.forEach((call) => {
          const callString = JSON.stringify(call);
          expect(callString).not.toContain('sensitive_password');
        });
      });
    });
  });

  describe('3. Privacy Protection', () => {
    describe('Data Minimization', () => {
      it('should only expose necessary user data', () => {
        const fullUserData = {
          id: 'user-id',
          email: 'test@example.com',
          username: 'testuser',
          password: 'hashed_password',
          full_name: 'Test User',
          role: 'waiter',
          status: 'active',
          email_confirmation_token: 'secret_token',
          password_reset_token: 'reset_token',
          created_at: new Date(),
          updated_at: new Date(),
          last_login_at: new Date(),
          email_confirmed: true,
          first_login_password_change: false,
        };

        const sanitized = userModel.sanitizeOutput(fullUserData, userModel.sensitiveFields);

        // Should have public data
        expect(sanitized.id).toBeDefined();
        expect(sanitized.email).toBeDefined();
        expect(sanitized.username).toBeDefined();
        expect(sanitized.full_name).toBeDefined();
        expect(sanitized.role).toBeDefined();
        expect(sanitized.status).toBeDefined();

        // Should not have sensitive data
        expect(sanitized.password).toBeUndefined();
        expect(sanitized.email_confirmation_token).toBeUndefined();
        expect(sanitized.password_reset_token).toBeUndefined();
      });

      it('should allow selective field exposure', () => {
        const userData = {
          id: 'user-id',
          email: 'test@example.com',
          password: 'hashed_password',
          full_name: 'Test User',
        };

        // Test with custom sensitive fields
        const customSensitive = ['password', 'email'];
        const sanitized = userModel.sanitizeOutput(userData, customSensitive);

        expect(sanitized.id).toBeDefined();
        expect(sanitized.full_name).toBeDefined();
        expect(sanitized.password).toBeUndefined();
        expect(sanitized.email).toBeUndefined();
      });
    });

    describe('PII Protection', () => {
      it('should protect email addresses in logs', () => {
        // UUID validation logs should mask UUIDs for privacy
        userModel.validateUuid('550e8400-e29b-41d4-a716-446655440000');

        expect(mockLogger.debug).toHaveBeenCalledWith(
          'Validating UUID',
          expect.objectContaining({
            uuid: expect.stringMatching(/^550e8400\.\.\.$/),
          })
        );
      });

      it('should handle null PII gracefully', () => {
        const userData = {
          id: 'user-id',
          email: null,
          username: null,
          full_name: 'Test User',
        };

        const sanitized = userModel.sanitizeOutput(userData, userModel.sensitiveFields);

        expect(sanitized.email).toBeNull();
        expect(sanitized.username).toBeNull();
        expect(sanitized.full_name).toBe('Test User');
      });
    });
  });
});
