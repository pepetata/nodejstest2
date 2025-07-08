const UserService = require('../services/userService');
const { logger } = require('../utils/logger');
const ResponseFormatter = require('../utils/responseFormatter');
const ValidationMiddleware = require('../middleware/validationMiddleware');
const userValidationSchemas = require('../validations/userValidations');
const asyncHandler = require('../utils/asyncHandler');

/**
 * User Controller
 * Handles HTTP requests for user management with comprehensive features:
 * - Input validation with centralized schemas
 * - Error handling with centralized error handler
 * - Structured logging with request context
 * - Authentication and authorization
 * - Data transformation and sanitization
 * - Asynchronous operations with proper error handling
 * - Dependency injection for testability
 * - Idempotency for state-changing operations
 * - Consistent response formatting
 */
class UserController {
  constructor(userServiceInstance = null) {
    this.userService = userServiceInstance || new UserService();
    this.logger = logger.child({ controller: 'UserController' });
  }

  /**
   * Create a new user
   * POST /api/v1/users
   *
   * @route POST /api/v1/users
   * @access Private - Admin only
   * @body {Object} userData - User creation data
   * @returns {Object} 201 - Created user data
   * @returns {Object} 400 - Validation error
   * @returns {Object} 403 - Insufficient permissions
   * @returns {Object} 409 - Duplicate email/username
   */
  createUser = asyncHandler(async (req, res) => {
    const requestId = req.requestId || `req_${Date.now()}`;
    const logMeta = {
      operation: 'createUser',
      requestId,
      userId: req.user?.id,
      method: req.method,
      path: req.path,
    };

    this.logger.info('Creating new user', {
      ...logMeta,
      role: req.body.role,
      hasEmail: !!req.body.email,
      hasUsername: !!req.body.username,
    });

    try {
      // Only check authorization if req.user exists (admin endpoint)
      if (req.user && !this.isAuthorizedToManageUsers(req.user)) {
        this.logger.warn('Unauthorized user creation attempt', {
          ...logMeta,
          userRole: req.user.role,
        });

        return res
          .status(403)
          .json(
            ResponseFormatter.error(
              'Insufficient permissions to create users',
              403,
              null,
              requestId
            )
          );
      }

      const userData = req.body;
      const newUser = await this.userService.createUser(userData, req.user);

      this.logger.info('User created successfully', {
        ...logMeta,
        newUserId: newUser.id,
        role: newUser.role,
        status: newUser.status,
      });

      return res.status(201).json(
        ResponseFormatter.success(newUser, 'User created successfully', {
          resourceId: newUser.id,
          location: `/api/v1/users/${newUser.id}`,
        })
      );
    } catch (error) {
      this.logger.error('Failed to create user', {
        ...logMeta,
        error: error.message,
        code: error.code,
        statusCode: error.statusCode,
      });

      // Handle specific business logic errors
      if (error.message.includes('Email already exists')) {
        return res
          .status(409)
          .json(
            ResponseFormatter.error(
              'Email address is already in use',
              409,
              { field: 'email' },
              requestId
            )
          );
      }

      if (error.message.includes('Username already exists')) {
        return res
          .status(409)
          .json(
            ResponseFormatter.error(
              'Username is already in use',
              409,
              { field: 'username' },
              requestId
            )
          );
      }

      throw error; // Let global error handler deal with unexpected errors
    }
  });

  /**
   * Get user by ID
   * GET /api/v1/users/:id
   *
   * @route GET /api/v1/users/:id
   * @access Private - Self or Admin
   * @param {String} id - User ID
   * @returns {Object} 200 - User data
   * @returns {Object} 404 - User not found
   * @returns {Object} 403 - Insufficient permissions
   */
  getUserById = asyncHandler(async (req, res) => {
    const requestId = req.requestId || `req_${Date.now()}`;
    const { id: userId } = req.params;

    const controllerLogger = this.logger.child({
      operation: 'getUserById',
      requestId,
      targetUserId: userId,
      currentUserId: req.user?.id,
      method: req.method,
      path: req.path,
    });

    controllerLogger.debug('Fetching user by ID');

    try {
      const user = await this.userService.getUserById(userId, req.user);

      if (!user) {
        controllerLogger.warn('User not found', { userId });

        return res
          .status(404)
          .json(ResponseFormatter.error('User not found', 404, null, requestId));
      }

      controllerLogger.debug('User retrieved successfully', {
        targetUserId: user.id,
        role: user.role,
      });

      return res.status(200).json(ResponseFormatter.success(user, 'User retrieved successfully'));
    } catch (error) {
      if (error.statusCode === 403) {
        controllerLogger.warn('Access denied', {
          error: error.message,
          userId,
        });

        return res.status(403).json(ResponseFormatter.error(error.message, 403, null, requestId));
      }

      throw error;
    }
  });

  /**
   * Get users with filtering and pagination
   * GET /api/v1/users
   *
   * @route GET /api/v1/users
   * @access Private - Admin or limited access
   * @query {Number} page - Page number (default: 1)
   * @query {Number} limit - Items per page (default: 20, max: 100)
   * @query {String} search - Search term
   * @query {String} role - Filter by role
   * @query {String} status - Filter by status
   * @query {String} restaurant_id - Filter by restaurant
   * @query {String} sort_by - Sort field
   * @query {String} sort_order - Sort order (asc/desc)
   * @returns {Object} 200 - Paginated users list
   * @returns {Object} 403 - Insufficient permissions
   */
  getUsers = asyncHandler(async (req, res) => {
    const requestId = req.requestId || `req_${Date.now()}`;

    const controllerLogger = this.logger.child({
      operation: 'getUsers',
      requestId,
      userId: req.user?.id,
      method: req.method,
      path: req.path,
      query: req.query,
    });

    controllerLogger.debug('Fetching users list');

    try {
      const options = req.query;
      const result = await this.userService.getUsers(options, req.user);

      controllerLogger.info('Users retrieved successfully', {
        ...logMeta,
        total: result.pagination.total,
        page: result.pagination.page,
        returned: result.users.length,
      });

      return res.status(200).json(
        ResponseFormatter.success(result.users, 'Users retrieved successfully', {
          pagination: result.pagination,
        })
      );
    } catch (error) {
      if (error.statusCode === 403) {
        controllerLogger.warn('Access denied for users list', {
          error: error.message,
        });

        return res.status(403).json(ResponseFormatter.error(error.message, 403, null, requestId));
      }

      throw error;
    }
  });

  /**
   * Update user (with idempotency support)
   * PUT /api/v1/users/:id
   * PATCH /api/v1/users/:id
   *
   * @route PUT|PATCH /api/v1/users/:id
   * @access Private - Self or Admin
   * @param {String} id - User ID
   * @body {Object} updateData - User update data
   * @header {String} If-Match - ETag for idempotency (optional)
   * @returns {Object} 200 - Updated user data
   * @returns {Object} 404 - User not found
   * @returns {Object} 403 - Insufficient permissions
   * @returns {Object} 409 - Conflict (email/username exists)
   * @returns {Object} 412 - Precondition failed (ETag mismatch)
   */
  updateUser = asyncHandler(async (req, res) => {
    const requestId = req.requestId || `req_${Date.now()}`;
    const { id: userId } = req.params;
    const updateData = req.body;
    const ifMatch = req.headers['if-match'];

    const controllerLogger = this.logger.child({
      operation: 'updateUser',
      requestId,
      targetUserId: userId,
      currentUserId: req.user?.id,
      method: req.method,
      path: req.path,
      hasIfMatch: !!ifMatch,
    });

    controllerLogger.info('Updating user', {
      fieldsToUpdate: Object.keys(updateData),
    });

    try {
      // Idempotency check with ETag (if provided)
      if (ifMatch && req.method === 'PUT') {
        const currentUser = await this.userService.getUserById(userId, req.user);
        if (currentUser && currentUser.etag !== ifMatch) {
          controllerLogger.warn('ETag mismatch for idempotent update', {
            providedETag: ifMatch,
            currentETag: currentUser.etag,
          });

          return res
            .status(412)
            .json(
              ResponseFormatter.error(
                'Resource has been modified since last retrieval',
                412,
                { current_etag: currentUser.etag },
                requestId
              )
            );
        }
      }

      const updatedUser = await this.userService.updateUser(userId, updateData, req.user);

      controllerLogger.info('User updated successfully', {
        userId: updatedUser.id,
        updatedFields: Object.keys(updateData),
      });

      return res.status(200).json(
        ResponseFormatter.success(updatedUser, 'User updated successfully', {
          etag: updatedUser.etag,
        })
      );
    } catch (error) {
      if (error.statusCode === 404) {
        controllerLogger.warn('User not found for update', { userId });

        return res
          .status(404)
          .json(ResponseFormatter.error('User not found', 404, null, requestId));
      }

      if (error.statusCode === 403) {
        controllerLogger.warn('Access denied for update', {
          error: error.message,
          userId,
        });

        return res.status(403).json(ResponseFormatter.error(error.message, 403, null, requestId));
      }

      if (error.message.includes('Email already exists')) {
        return res
          .status(409)
          .json(
            ResponseFormatter.error(
              'Email address is already in use',
              409,
              { field: 'email' },
              requestId
            )
          );
      }

      if (error.message.includes('Username already exists')) {
        return res
          .status(409)
          .json(
            ResponseFormatter.error(
              'Username is already in use',
              409,
              { field: 'username' },
              requestId
            )
          );
      }

      throw error;
    }
  });

  /**
   * Delete user (soft delete with idempotency)
   * DELETE /api/v1/users/:id
   *
   * @route DELETE /api/v1/users/:id
   * @access Private - Admin only
   * @param {String} id - User ID
   * @header {String} If-Match - ETag for idempotency (optional)
   * @returns {Object} 200 - Success message
   * @returns {Object} 404 - User not found
   * @returns {Object} 403 - Insufficient permissions
   * @returns {Object} 412 - Precondition failed (ETag mismatch)
   */
  deleteUser = asyncHandler(async (req, res) => {
    const requestId = req.requestId || `req_${Date.now()}`;
    const { id: userId } = req.params;
    const ifMatch = req.headers['if-match'];

    const controllerLogger = this.logger.child({
      operation: 'deleteUser',
      requestId,
      targetUserId: userId,
      currentUserId: req.user?.id,
      method: req.method,
      path: req.path,
      hasIfMatch: !!ifMatch,
    });

    controllerLogger.info('Deleting user');

    try {
      // Check authorization - only admins can delete users
      if (!this.isAuthorizedToManageUsers(req.user)) {
        controllerLogger.warn('Unauthorized user deletion attempt', {
          userRole: req.user.role,
        });

        return res
          .status(403)
          .json(
            ResponseFormatter.error(
              'Insufficient permissions to delete users',
              403,
              null,
              requestId
            )
          );
      }

      // Idempotency check with ETag (if provided)
      if (ifMatch) {
        const currentUser = await this.userService.getUserById(userId, req.user);
        if (currentUser && currentUser.etag !== ifMatch) {
          controllerLogger.warn('ETag mismatch for idempotent deletion', {
            providedETag: ifMatch,
            currentETag: currentUser.etag,
          });

          return res
            .status(412)
            .json(
              ResponseFormatter.error(
                'Resource has been modified since last retrieval',
                412,
                { current_etag: currentUser.etag },
                requestId
              )
            );
        }
      }

      const result = await this.userService.deleteUser(userId, req.user);

      if (!result) {
        controllerLogger.warn('User deletion failed', { userId });

        return res
          .status(500)
          .json(ResponseFormatter.error('Failed to delete user', 500, null, requestId));
      }

      controllerLogger.info('User deleted successfully', { userId });

      return res.status(200).json(
        ResponseFormatter.success(null, 'User deleted successfully', {
          deletedId: userId,
        })
      );
    } catch (error) {
      if (error.statusCode === 404) {
        controllerLogger.warn('User not found for deletion', { userId });

        return res
          .status(404)
          .json(ResponseFormatter.error('User not found', 404, null, requestId));
      }

      if (error.statusCode === 403) {
        controllerLogger.warn('Access denied for deletion', {
          error: error.message,
          userId,
        });

        return res.status(403).json(ResponseFormatter.error(error.message, 403, null, requestId));
      }

      throw error;
    }
  });

  /**
   * Change user password
   * POST /api/v1/users/:id/change-password
   *
   * @route POST /api/v1/users/:id/change-password
   * @access Private - Self or Admin
   * @param {String} id - User ID
   * @body {Object} passwordData - Password change data
   * @returns {Object} 200 - Success message
   * @returns {Object} 400 - Invalid current password
   * @returns {Object} 404 - User not found
   * @returns {Object} 403 - Insufficient permissions
   */
  changePassword = asyncHandler(async (req, res) => {
    const requestId = req.requestId || `req_${Date.now()}`;
    const { id: userId } = req.params;
    const { current_password, new_password } = req.body;

    const controllerLogger = this.logger.child({
      operation: 'changePassword',
      requestId,
      targetUserId: userId,
      currentUserId: req.user?.id,
      method: req.method,
      path: req.path,
    });

    controllerLogger.info('Changing user password');

    try {
      const updatedUser = await this.userService.changePassword(
        userId,
        current_password,
        new_password,
        req.user
      );

      controllerLogger.info('Password changed successfully', { userId });

      return res
        .status(200)
        .json(
          ResponseFormatter.success(
            { updated_at: updatedUser.updated_at },
            'Password changed successfully'
          )
        );
    } catch (error) {
      if (error.statusCode === 404) {
        return res
          .status(404)
          .json(ResponseFormatter.error('User not found', 404, null, requestId));
      }

      if (error.statusCode === 403) {
        return res.status(403).json(ResponseFormatter.error(error.message, 403, null, requestId));
      }

      if (error.statusCode === 400) {
        return res.status(400).json(ResponseFormatter.error(error.message, 400, null, requestId));
      }

      throw error;
    }
  });

  /**
   * Confirm email address
   * POST /api/v1/users/confirm-email
   *
   * @route POST /api/v1/users/confirm-email
   * @access Public
   * @body {Object} confirmationData - Email confirmation data
   * @returns {Object} 200 - Success message
   * @returns {Object} 400 - Invalid token
   */
  confirmEmail = asyncHandler(async (req, res) => {
    const requestId = req.requestId || `req_${Date.now()}`;
    const { token } = req.body;

    const controllerLogger = this.logger.child({
      operation: 'confirmEmail',
      requestId,
      method: req.method,
      path: req.path,
    });

    controllerLogger.info('Confirming email address');

    try {
      const user = await this.userService.confirmEmail(token);

      controllerLogger.info('Email confirmed successfully', {
        userId: user.id,
      });

      return res.status(200).json(
        ResponseFormatter.success(
          {
            user_id: user.id,
            email_confirmed: user.email_confirmed,
            updated_at: user.updated_at,
          },
          'Email confirmed successfully'
        )
      );
    } catch (error) {
      if (error.statusCode === 400) {
        return res.status(400).json(ResponseFormatter.error(error.message, 400, null, requestId));
      }

      throw error;
    }
  });

  /**
   * Get users by restaurant
   * GET /api/v1/users/restaurant/:restaurantId
   *
   * @route GET /api/v1/users/restaurant/:restaurantId
   * @access Private - Admin or restaurant members
   * @param {String} restaurantId - Restaurant UUID
   * @query {Object} filters - Optional filters
   * @returns {Object} 200 - List of users
   * @returns {Object} 400 - Validation error
   * @returns {Object} 403 - Insufficient permissions
   * @returns {Object} 404 - Restaurant not found
   */
  getUsersByRestaurant = asyncHandler(async (req, res) => {
    const requestId = req.requestId || `req_${Date.now()}`;
    const { restaurantId } = req.params;

    const controllerLogger = this.logger.child({
      operation: 'getUsersByRestaurant',
      requestId,
      userId: req.user?.id,
      restaurantId,
      method: req.method,
      path: req.path,
    });

    controllerLogger.info('Retrieving users by restaurant', {
      restaurantId,
      filters: req.query,
    });

    try {
      const result = await this.userService.getUsersByRestaurant(restaurantId, req.query, req.user);

      controllerLogger.info('Users retrieved successfully', {
        userCount: result.users.length,
        totalCount: result.pagination.total,
      });

      return res.status(200).json(
        ResponseFormatter.success(result.users, 'Users retrieved successfully', {
          pagination: result.pagination,
          restaurant: result.restaurant,
        })
      );
    } catch (error) {
      if (error.statusCode === 403) {
        return res.status(403).json(ResponseFormatter.error(error.message, 403, null, requestId));
      }
      if (error.statusCode === 404) {
        return res.status(404).json(ResponseFormatter.error(error.message, 404, null, requestId));
      }

      throw error;
    }
  });

  /**
   * Check if user is authorized to manage users
   * @param {Object} user - Current user
   * @returns {Boolean} Authorization status
   */
  isAuthorizedToManageUsers(user) {
    return ['restaurant_administrator', 'location_administrator'].includes(user.role);
  }

  /**
   * Get validation middleware for specific operation
   * @param {String} operation - Operation name
   * @param {String} target - Validation target ('body', 'params', 'query')
   * @returns {Function} Validation middleware
   */
  static getValidationMiddleware(operation, target = 'body') {
    const schema = userValidationSchemas[operation];
    if (!schema) {
      throw new Error(`No validation schema found for operation: ${operation}`);
    }
    return ValidationMiddleware.validate(schema, target);
  }
}

module.exports = UserController;
