const userModel = require('../models/userModel');
const { logger } = require('../utils/logger');
const ResponseFormatter = require('../utils/responseFormatter');

/**
 * User Service
 * Handles business logic for user management operations
 * Provides dependency injection interface for controllers
 */
class UserService {
  constructor(userModelInstance = userModel) {
    this.userModel = userModelInstance;
    this.logger = logger.child({ service: 'UserService' });
  }

  /**
   * Create a new user
   * @param {Object} userData - User data
   * @param {Object} currentUser - Current authenticated user
   * @returns {Promise<Object>} Created user
   */
  async createUser(userData, currentUser = null) {
    const operationId = `create_user_${Date.now()}`;
    const serviceLogger = this.logger.child({
      operation: 'createUser',
      operationId,
      currentUserId: currentUser?.id,
    });

    serviceLogger.info('Creating new user', {
      role: userData.role,
      hasEmail: !!userData.email,
      hasUsername: !!userData.username,
      restaurantId: userData.restaurant_id,
    });

    try {
      // Add created_by field if current user exists
      if (currentUser) {
        userData.created_by = currentUser.id;
      }

      // Check authorization for restaurant assignment
      if (userData.restaurant_id && currentUser) {
        await this.validateRestaurantAccess(userData.restaurant_id, currentUser);
      }

      const newUser = await this.userModel.create(userData);

      serviceLogger.info('User created successfully', {
        userId: newUser.id,
        role: newUser.role,
        status: newUser.status,
      });

      return newUser;
    } catch (error) {
      serviceLogger.error('Failed to create user', {
        error: error.message,
        code: error.code,
      });
      throw error;
    }
  }

  /**
   * Get user by ID
   * @param {String} userId - User ID
   * @param {Object} currentUser - Current authenticated user
   * @returns {Promise<Object|null>} User data or null
   */
  async getUserById(userId, currentUser) {
    const serviceLogger = this.logger.child({
      operation: 'getUserById',
      userId,
      currentUserId: currentUser?.id,
    });

    serviceLogger.debug('Fetching user by ID');

    try {
      const user = await this.userModel.findById(userId);

      if (!user) {
        serviceLogger.warn('User not found', { userId });
        return null;
      }

      // Check if current user can access this user's data
      await this.validateUserAccess(user, currentUser);

      serviceLogger.debug('User retrieved successfully', {
        targetUserId: user.id,
        role: user.role,
        status: user.status,
      });

      return user;
    } catch (error) {
      serviceLogger.error('Failed to get user by ID', {
        error: error.message,
        userId,
      });
      throw error;
    }
  }

  /**
   * Get users with filtering and pagination
   * @param {Object} options - Query options
   * @param {Object} currentUser - Current authenticated user
   * @returns {Promise<Object>} Paginated users list
   */
  async getUsers(options, currentUser) {
    const serviceLogger = this.logger.child({
      operation: 'getUsers',
      currentUserId: currentUser?.id,
      filters: options,
    });

    serviceLogger.debug('Fetching users with filters');

    try {
      const { page, limit, restaurant_id, role, status, search, sort_by, sort_order } = options;

      // Build query filters
      const filters = {};

      // Restrict access based on current user's role and restaurant
      if (currentUser.role === 'restaurant_administrator') {
        filters.restaurant_id = currentUser.restaurant_id;
      } else if (restaurant_id && currentUser.role !== 'restaurant_administrator') {
        await this.validateRestaurantAccess(restaurant_id, currentUser);
        filters.restaurant_id = restaurant_id;
      }

      if (role) filters.role = role;
      if (status) filters.status = status;

      // Build query options
      const queryOptions = {
        limit,
        offset: (page - 1) * limit,
        orderBy: `${sort_by} ${sort_order.toUpperCase()}`,
      };

      // Add search if provided
      if (search) {
        queryOptions.search = {
          fields: ['full_name', 'email', 'username'],
          term: search,
        };
      }

      const result = await this.userModel.findWithPagination(filters, queryOptions);

      const totalPages = Math.ceil(result.total / limit);

      serviceLogger.info('Users retrieved successfully', {
        total: result.total,
        page,
        totalPages,
        returned: result.users.length,
      });

      return {
        users: result.users,
        pagination: {
          page,
          limit,
          total: result.total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      };
    } catch (error) {
      serviceLogger.error('Failed to get users', {
        error: error.message,
        options,
      });
      throw error;
    }
  }

  /**
   * Update user
   * @param {String} userId - User ID
   * @param {Object} updateData - Update data
   * @param {Object} currentUser - Current authenticated user
   * @returns {Promise<Object>} Updated user
   */
  async updateUser(userId, updateData, currentUser) {
    const operationId = `update_user_${userId}_${Date.now()}`;
    const serviceLogger = this.logger.child({
      operation: 'updateUser',
      operationId,
      userId,
      currentUserId: currentUser?.id,
    });

    serviceLogger.info('Updating user', {
      fieldsToUpdate: Object.keys(updateData),
    });

    try {
      // Get existing user to validate access
      const existingUser = await this.userModel.findById(userId);
      if (!existingUser) {
        const error = new Error('User not found');
        error.statusCode = 404;
        throw error;
      }

      // Validate access to update this user
      await this.validateUserAccess(existingUser, currentUser, 'update');

      // Validate restaurant assignment if being updated
      if (updateData.restaurant_id) {
        await this.validateRestaurantAccess(updateData.restaurant_id, currentUser);
      }

      // Prevent self-status changes for certain scenarios
      if (currentUser.id === userId && updateData.status === 'inactive') {
        const error = new Error('Cannot deactivate your own account');
        error.statusCode = 403;
        throw error;
      }

      const updatedUser = await this.userModel.update(userId, updateData);

      serviceLogger.info('User updated successfully', {
        userId: updatedUser.id,
        updatedFields: Object.keys(updateData),
      });

      return updatedUser;
    } catch (error) {
      serviceLogger.error('Failed to update user', {
        error: error.message,
        userId,
        updateData: Object.keys(updateData),
      });
      throw error;
    }
  }

  /**
   * Delete user (soft delete)
   * @param {String} userId - User ID
   * @param {Object} currentUser - Current authenticated user
   * @returns {Promise<Boolean>} Success status
   */
  async deleteUser(userId, currentUser) {
    const serviceLogger = this.logger.child({
      operation: 'deleteUser',
      userId,
      currentUserId: currentUser?.id,
    });

    serviceLogger.info('Deleting user');

    try {
      // Get existing user to validate access
      const existingUser = await this.userModel.findById(userId);
      if (!existingUser) {
        const error = new Error('User not found');
        error.statusCode = 404;
        throw error;
      }

      // Prevent self-deletion
      if (currentUser.id === userId) {
        const error = new Error('Cannot delete your own account');
        error.statusCode = 403;
        throw error;
      }

      // Validate access to delete this user
      await this.validateUserAccess(existingUser, currentUser, 'delete');

      const result = await this.userModel.deleteUser(userId);

      serviceLogger.info('User deleted successfully', {
        userId,
        deleted: result,
      });

      return result;
    } catch (error) {
      serviceLogger.error('Failed to delete user', {
        error: error.message,
        userId,
      });
      throw error;
    }
  }

  /**
   * Change user password
   * @param {String} userId - User ID
   * @param {String} currentPassword - Current password
   * @param {String} newPassword - New password
   * @param {Object} currentUser - Current authenticated user
   * @returns {Promise<Object>} Updated user
   */
  async changePassword(userId, currentPassword, newPassword, currentUser) {
    const serviceLogger = this.logger.child({
      operation: 'changePassword',
      userId,
      currentUserId: currentUser?.id,
    });

    serviceLogger.info('Changing user password');

    try {
      // Get existing user
      const existingUser = await this.userModel.findById(userId);
      if (!existingUser) {
        const error = new Error('User not found');
        error.statusCode = 404;
        throw error;
      }

      // Only allow users to change their own password or admin to change any
      if (currentUser.id !== userId && !this.isAdmin(currentUser)) {
        const error = new Error('Unauthorized to change this password');
        error.statusCode = 403;
        throw error;
      }

      // Verify current password (skip for admin changing other's password)
      if (currentUser.id === userId) {
        const isValidPassword = await this.userModel.verifyPassword(
          currentPassword,
          existingUser.password
        );

        if (!isValidPassword) {
          const error = new Error('Current password is incorrect');
          error.statusCode = 400;
          throw error;
        }
      }

      const updatedUser = await this.userModel.changePassword(userId, newPassword);

      serviceLogger.info('Password changed successfully', {
        userId,
      });

      return updatedUser;
    } catch (error) {
      serviceLogger.error('Failed to change password', {
        error: error.message,
        userId,
      });
      throw error;
    }
  }

  /**
   * Confirm email address
   * @param {String} token - Confirmation token
   * @returns {Promise<Object>} Updated user
   */
  async confirmEmail(token) {
    const serviceLogger = this.logger.child({
      operation: 'confirmEmail',
    });

    serviceLogger.info('Confirming email');

    try {
      const user = await this.userModel.confirmEmail(token);

      if (!user) {
        const error = new Error('Invalid or expired confirmation token');
        error.statusCode = 400;
        throw error;
      }

      serviceLogger.info('Email confirmed successfully', {
        userId: user.id,
      });

      return user;
    } catch (error) {
      serviceLogger.error('Failed to confirm email', {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Validate user access permissions
   * @param {Object} targetUser - User being accessed
   * @param {Object} currentUser - Current authenticated user
   * @param {String} operation - Operation being performed
   */
  async validateUserAccess(targetUser, currentUser, operation = 'read') {
    const serviceLogger = this.logger.child({
      operation: 'validateUserAccess',
      targetUserId: targetUser.id,
      currentUserId: currentUser.id,
      accessOperation: operation,
    });

    // Super admin can access everything
    if (this.isSuperAdmin(currentUser)) {
      return true;
    }

    // Restaurant administrators can manage users in their restaurant
    if (currentUser.role === 'restaurant_administrator') {
      if (targetUser.restaurant_id !== currentUser.restaurant_id) {
        const error = new Error('Insufficient permissions to access this user');
        error.statusCode = 403;
        serviceLogger.warn('Access denied - different restaurant', {
          currentUserRestaurant: currentUser.restaurant_id,
          targetUserRestaurant: targetUser.restaurant_id,
        });
        throw error;
      }
      return true;
    }

    // Users can only access their own data
    if (currentUser.id === targetUser.id) {
      return true;
    }

    const error = new Error('Insufficient permissions to access this user');
    error.statusCode = 403;
    serviceLogger.warn('Access denied - insufficient permissions');
    throw error;
  }

  /**
   * Validate restaurant access permissions
   * @param {String} restaurantId - Restaurant ID
   * @param {Object} currentUser - Current authenticated user
   */
  async validateRestaurantAccess(restaurantId, currentUser) {
    if (this.isSuperAdmin(currentUser)) {
      return true;
    }

    if (
      currentUser.role === 'restaurant_administrator' &&
      currentUser.restaurant_id === restaurantId
    ) {
      return true;
    }

    const error = new Error('Insufficient permissions to access this restaurant');
    error.statusCode = 403;
    throw error;
  }

  /**
   * Check if user is super admin
   * @param {Object} user - User object
   * @returns {Boolean} Is super admin
   */
  isSuperAdmin(user) {
    return user.role === 'restaurant_administrator' && !user.restaurant_id;
  }

  /**
   * Check if user is admin (any admin role)
   * @param {Object} user - User object
   * @returns {Boolean} Is admin
   */
  isAdmin(user) {
    return ['restaurant_administrator', 'location_administrator'].includes(user.role);
  }
}

module.exports = UserService;
