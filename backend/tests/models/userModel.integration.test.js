const userModel = require('../../src/models/userModel');
const BaseModel = require('../../src/models/BaseModel');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

// Mock dependencies
jest.mock('../../src/utils/logger', () => ({
  logger: {
    child: jest.fn(() => ({
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    })),
  },
}));

jest.mock('../../src/config/db');

describe('UserModel Integration Tests (Coverage Boost)', () => {
  let mockDb;
  let testUser;
  let testRestaurantId;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    jest.restoreAllMocks();

    // Generate test data
    testRestaurantId = uuidv4();
    testUser = {
      id: uuidv4(),
      email: 'test@example.com',
      username: 'testuser',
      password: '$2b$12$hashedpassword',
      full_name: 'Test User',
      role: 'waiter',
      restaurant_id: testRestaurantId,
      status: 'active',
      email_confirmed: false,
      first_login_password_change: true,
      created_at: new Date(),
      updated_at: new Date(),
    };

    // Mock BaseModel methods
    BaseModel.prototype.executeQuery = jest.fn();
    BaseModel.prototype.validate = jest.fn().mockResolvedValue({}); // Return empty object for validation
    BaseModel.prototype.find = jest.fn();
    BaseModel.prototype.findById = jest.fn();
    BaseModel.prototype.sanitizeOutput = jest.fn((user) => user); // Return user as-is
    BaseModel.prototype.buildSetClause = jest.fn();
  });

  describe('User Creation - create()', () => {
    test('should create user with email and generate confirmation token', async () => {
      const userData = {
        email: 'new@example.com',
        password: 'password123',
        full_name: 'New User',
        role: 'restaurant_administrator',
        restaurant_id: testRestaurantId,
      };

      const hashedPassword = await bcrypt.hash(userData.password, 12);
      const expectedUser = {
        ...userData,
        id: uuidv4(),
        password: hashedPassword,
        status: 'pending',
        email_confirmed: false,
        email_confirmation_token: expect.any(String),
        email_confirmation_expires: expect.any(Date),
      };

      // Mock validation and database operations
      BaseModel.prototype.validate.mockResolvedValue(userData);
      BaseModel.prototype.executeQuery.mockResolvedValue({
        rows: [expectedUser],
      });
      BaseModel.prototype.sanitizeOutput.mockReturnValue(expectedUser);

      // Mock the find methods to return null (no existing users)
      jest.spyOn(userModel, 'findByEmail').mockResolvedValue(null);
      jest.spyOn(userModel, 'findByUsername').mockResolvedValue(null);
      jest.spyOn(userModel, 'checkRestaurantExists').mockResolvedValue(true);

      const result = await userModel.create(userData);

      // Mock validation to return the user data directly (no schema object)
      BaseModel.prototype.validate.mockResolvedValueOnce(userData);
      BaseModel.prototype.executeQuery.mockResolvedValueOnce({
        rows: [{ ...testUser, id: result.id }],
      });

      expect(result).toBeDefined();
      expect(BaseModel.prototype.validate).toHaveBeenCalledWith(userData, expect.any(Object));
      expect(BaseModel.prototype.executeQuery).toHaveBeenCalled();
    });

    test('should throw error for duplicate email', async () => {
      const userData = {
        email: 'existing@example.com',
        password: 'password123',
        full_name: 'Test User',
        role: 'waiter',
      };

      BaseModel.prototype.validate.mockResolvedValue(userData);
      jest.spyOn(userModel, 'findByEmail').mockResolvedValue(testUser);

      await expect(userModel.create(userData)).rejects.toThrow('Email already exists');
    });

    test('should throw error for duplicate username', async () => {
      const userData = {
        username: 'existinguser',
        password: 'password123',
        full_name: 'Test User',
        role: 'waiter',
      };

      BaseModel.prototype.validate.mockResolvedValue(userData);
      jest.spyOn(userModel, 'findByEmail').mockResolvedValue(null);
      jest.spyOn(userModel, 'findByUsername').mockResolvedValue(testUser);

      await expect(userModel.create(userData)).rejects.toThrow('Username already exists');
    });

    test('should throw error for non-existent restaurant', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        full_name: 'Test User',
        role: 'waiter',
        restaurant_id: uuidv4(),
      };

      BaseModel.prototype.validate.mockResolvedValue(userData);
      jest.spyOn(userModel, 'findByEmail').mockResolvedValue(null);
      jest.spyOn(userModel, 'findByUsername').mockResolvedValue(null);
      jest.spyOn(userModel, 'checkRestaurantExists').mockResolvedValue(false);

      await expect(userModel.create(userData)).rejects.toThrow('Restaurant not found');
    });
  });

  describe('User Retrieval - findById()', () => {
    test('should find user by valid ID', async () => {
      const userId = uuidv4();

      BaseModel.prototype.findById.mockResolvedValue(testUser);
      BaseModel.prototype.sanitizeOutput.mockReturnValue(testUser);

      const result = await userModel.findById(userId);

      expect(result).toEqual(testUser);
      expect(BaseModel.prototype.findById).toHaveBeenCalledWith(userId, ['*']);
    });

    test('should return null for non-existent user', async () => {
      const userId = uuidv4();

      BaseModel.prototype.findById.mockResolvedValue(null);

      const result = await userModel.findById(userId);

      expect(result).toBeNull();
    });

    test('should throw error for invalid UUID', async () => {
      const invalidId = 'invalid-uuid';

      await expect(userModel.findById(invalidId)).rejects.toThrow('Invalid user ID format');
    });
  });

  describe('User Search - findByEmail() and findByUsername()', () => {
    test('should find user by email', async () => {
      const email = 'test@example.com';

      // Setup mocks to return the test user in an array (find returns array)
      BaseModel.prototype.find.mockResolvedValueOnce([testUser]);
      BaseModel.prototype.sanitizeOutput.mockReturnValueOnce(testUser);

      const result = await userModel.findByEmail(email);

      expect(result).toEqual(testUser);
      expect(BaseModel.prototype.find).toHaveBeenCalledWith({ email: email.toLowerCase() });
    });

    test('should find user by username', async () => {
      const username = 'testuser';

      // Setup mocks to return the test user in an array (find returns array)
      BaseModel.prototype.find.mockResolvedValueOnce([testUser]);
      BaseModel.prototype.sanitizeOutput.mockReturnValueOnce(testUser);

      const result = await userModel.findByUsername(username);

      expect(result).toEqual(testUser);
      expect(BaseModel.prototype.find).toHaveBeenCalledWith({ username: username.toLowerCase() });
    });

    test('should return null when user not found by email', async () => {
      const email = 'nonexistent@example.com';

      BaseModel.prototype.find.mockResolvedValue([]);

      const result = await userModel.findByEmail(email);

      expect(result).toBeNull();
    });

    test('should return null when user not found by username', async () => {
      const username = 'nonexistentuser';

      BaseModel.prototype.find.mockResolvedValue([]);

      const result = await userModel.findByUsername(username);

      expect(result).toBeNull();
    });
  });

  describe('User Authentication - authenticate()', () => {
    test('should authenticate user with email and password', async () => {
      const email = 'test@example.com';
      const password = 'password123';
      const activeUser = {
        ...testUser,
        status: 'active',
        password: await bcrypt.hash(password, 12),
      };

      BaseModel.prototype.find.mockResolvedValue([activeUser]);
      BaseModel.prototype.sanitizeOutput.mockReturnValue(activeUser);
      jest.spyOn(userModel, 'update').mockResolvedValue(activeUser);

      const result = await userModel.authenticate(email, password);

      expect(result).toEqual(activeUser);
      expect(BaseModel.prototype.find).toHaveBeenCalledWith({ email: email.toLowerCase() });
      expect(userModel.update).toHaveBeenCalledWith(
        activeUser.id,
        expect.objectContaining({
          last_login_at: expect.any(Date),
        })
      );
    });

    test('should authenticate user with username and password', async () => {
      const username = 'testuser';
      const password = 'password123';
      const activeUser = {
        ...testUser,
        status: 'active',
        password: await bcrypt.hash(password, 12),
      };

      BaseModel.prototype.find.mockResolvedValue([activeUser]);
      BaseModel.prototype.sanitizeOutput.mockReturnValue(activeUser);
      jest.spyOn(userModel, 'update').mockResolvedValue(activeUser);

      const result = await userModel.authenticate(username, password);

      expect(result).toEqual(activeUser);
      expect(BaseModel.prototype.find).toHaveBeenCalledWith({ username: username.toLowerCase() });
    });

    test('should return null for non-existent user', async () => {
      BaseModel.prototype.find.mockResolvedValue([]);

      const result = await userModel.authenticate('nonexistent@example.com', 'password');

      expect(result).toBeNull();
    });

    test('should return null for inactive user', async () => {
      const inactiveUser = { ...testUser, status: 'inactive' };

      BaseModel.prototype.find.mockResolvedValue([inactiveUser]);

      const result = await userModel.authenticate('test@example.com', 'password');

      expect(result).toBeNull();
    });

    test('should return null for wrong password', async () => {
      const activeUser = {
        ...testUser,
        status: 'active',
        password: await bcrypt.hash('correctpassword', 12),
      };

      BaseModel.prototype.find.mockResolvedValue([activeUser]);

      const result = await userModel.authenticate('test@example.com', 'wrongpassword');

      expect(result).toBeNull();
    });
  });

  describe('User Updates - update()', () => {
    test('should update user successfully', async () => {
      const userId = uuidv4();
      const updateData = { full_name: 'Updated Name', status: 'active' };
      const updatedUser = { ...testUser, ...updateData };

      BaseModel.prototype.validate.mockResolvedValueOnce(updateData);
      BaseModel.prototype.findById.mockResolvedValueOnce(testUser);
      BaseModel.prototype.buildSetClause.mockReturnValueOnce({
        clause: 'full_name = $1, status = $2',
        params: ['Updated Name', 'active'],
      });
      BaseModel.prototype.executeQuery.mockResolvedValueOnce({
        rows: [updatedUser],
      });
      BaseModel.prototype.sanitizeOutput.mockReturnValueOnce(updatedUser);
      jest.spyOn(userModel, 'findByEmail').mockResolvedValueOnce(null);
      jest.spyOn(userModel, 'findByUsername').mockResolvedValueOnce(null);

      const result = await userModel.update(userId, updateData);

      expect(result).toEqual(updatedUser);
    });

    test('should throw error for non-existent user', async () => {
      const userId = uuidv4();
      const updateData = { full_name: 'Updated Name' };

      BaseModel.prototype.validate.mockResolvedValueOnce(updateData);
      BaseModel.prototype.findById.mockResolvedValueOnce(null); // Return null for non-existent user

      await expect(userModel.update(userId, updateData)).rejects.toThrow('User not found');
    });

    test('should throw error for empty update data', async () => {
      const userId = uuidv4();

      BaseModel.prototype.validate.mockResolvedValueOnce({}); // Return empty validation result

      await expect(userModel.update(userId, {})).rejects.toThrow('No valid fields to update');
    });
  });

  describe('User Deletion - deleteUser()', () => {
    test('should soft delete user', async () => {
      const userId = uuidv4();
      const deletedUser = { ...testUser, status: 'inactive' };

      jest.spyOn(userModel, 'update').mockResolvedValue(deletedUser);

      const result = await userModel.deleteUser(userId);

      expect(result).toBe(true);
      expect(userModel.update).toHaveBeenCalledWith(userId, { status: 'inactive' });
    });

    test('should return false if update fails', async () => {
      const userId = uuidv4();

      jest.spyOn(userModel, 'update').mockResolvedValue(null);

      const result = await userModel.deleteUser(userId);

      expect(result).toBe(false);
    });
  });

  describe('Email Confirmation - confirmEmail()', () => {
    test('should confirm email with valid token', async () => {
      const token = 'valid-token';
      const confirmedUser = {
        ...testUser,
        email_confirmed: true,
        email_confirmation_token: null,
        email_confirmation_expires: null,
      };

      BaseModel.prototype.executeQuery.mockResolvedValue({
        rows: [confirmedUser],
      });
      BaseModel.prototype.sanitizeOutput.mockReturnValue(confirmedUser);

      const result = await userModel.confirmEmail(token);

      expect(result).toEqual(confirmedUser);
      expect(BaseModel.prototype.executeQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE'),
        [token]
      );
    });

    test('should throw error for invalid token', async () => {
      const token = 'invalid-token';

      BaseModel.prototype.executeQuery.mockResolvedValue({
        rows: [],
      });

      await expect(userModel.confirmEmail(token)).rejects.toThrow(
        'Invalid or expired confirmation token'
      );
    });
  });

  describe('Password Change - changePassword()', () => {
    test('should change password successfully', async () => {
      const userId = uuidv4();
      const newPassword = 'newpassword123';
      const updatedUser = { ...testUser, first_login_password_change: false };

      jest.spyOn(userModel, 'update').mockResolvedValue(updatedUser);

      const result = await userModel.changePassword(userId, newPassword);

      expect(result).toEqual(updatedUser);
      expect(userModel.update).toHaveBeenCalledWith(
        userId,
        expect.objectContaining({
          password: expect.any(String),
          password_changed_at: expect.any(Date),
          first_login_password_change: false,
        })
      );
    });
  });

  describe('Restaurant Operations', () => {
    test('should check if restaurant exists', async () => {
      const restaurantId = uuidv4();

      BaseModel.prototype.executeQuery.mockResolvedValueOnce({
        rows: [{ exists: 1 }], // Non-empty array indicates restaurant exists
      });

      const result = await userModel.checkRestaurantExists(restaurantId);

      expect(result).toBe(true);
      expect(BaseModel.prototype.executeQuery).toHaveBeenCalledWith(
        'SELECT 1 FROM restaurants WHERE id = $1',
        [restaurantId]
      );
    });

    test('should return false when restaurant does not exist', async () => {
      const restaurantId = uuidv4();

      BaseModel.prototype.executeQuery.mockResolvedValue({
        rows: [],
      });

      const result = await userModel.checkRestaurantExists(restaurantId);

      expect(result).toBe(false);
    });

    test('should get users by restaurant', async () => {
      const restaurantId = uuidv4();
      const users = [testUser, { ...testUser, id: uuidv4() }];

      BaseModel.prototype.find.mockResolvedValue(users);
      BaseModel.prototype.sanitizeOutput.mockImplementation((user) => user);

      const result = await userModel.getUsersByRestaurant(restaurantId);

      expect(result).toHaveLength(2);
      expect(BaseModel.prototype.find).toHaveBeenCalledWith(
        { restaurant_id: restaurantId },
        { orderBy: 'created_at DESC' }
      );
    });

    test('should filter users by restaurant with options', async () => {
      const restaurantId = uuidv4();
      const options = { status: 'active', role: 'waiter' };

      BaseModel.prototype.find.mockResolvedValue([testUser]);
      BaseModel.prototype.sanitizeOutput.mockReturnValue(testUser);

      const result = await userModel.getUsersByRestaurant(restaurantId, options);

      expect(BaseModel.prototype.find).toHaveBeenCalledWith(
        { restaurant_id: restaurantId, status: 'active', role: 'waiter' },
        { orderBy: 'created_at DESC' }
      );
    });
  });

  describe('Error Handling', () => {
    test('should handle database errors in create', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        full_name: 'Test User',
        role: 'waiter',
      };

      BaseModel.prototype.validate.mockResolvedValue(userData);
      jest.spyOn(userModel, 'findByEmail').mockResolvedValue(null);
      jest.spyOn(userModel, 'findByUsername').mockResolvedValue(null);
      BaseModel.prototype.executeQuery.mockRejectedValue(new Error('Database connection failed'));

      await expect(userModel.create(userData)).rejects.toThrow('Database connection failed');
    });

    test('should handle database errors in findByEmail', async () => {
      BaseModel.prototype.find.mockRejectedValueOnce(new Error('Database error'));

      await expect(userModel.findByEmail('test@example.com')).rejects.toThrow('Database error');
    });

    test('should handle database errors in authenticate', async () => {
      BaseModel.prototype.find.mockRejectedValue(new Error('Database error'));

      await expect(userModel.authenticate('test@example.com', 'password')).rejects.toThrow(
        'Database error'
      );
    });
  });
});
