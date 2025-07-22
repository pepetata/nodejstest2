const express = require('express');
const { UserController, resetPassword } = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');
const ValidationMiddleware = require('../middleware/validationMiddleware');
const XSSMiddleware = require('../middleware/xssMiddleware');
const RateLimitMiddleware = require('../middleware/rateLimitMiddleware');
const userValidationSchemas = require('../validations/userValidations');

const router = express.Router();
const userController = new UserController();

/**
 * @route POST /api/v1/users/reset-password
 * @desc Reset user password using token
 * @access Public
 */
router.post('/reset-password', resetPassword);

/**
 * @route POST /api/v1/users/forgot-password
 * @desc Request password reset link
 * @access Public
 */
router.post('/forgot-password', userController.forgotPassword);

/**
 * User Management Routes
 * All routes require authentication and include XSS protection
 * Different rate limiting rules applied based on operation sensitivity
 */

// Apply XSS middleware to all user routes
router.use(XSSMiddleware.sanitizeUserData);

// User creation rate limiting (stricter for resource creation)
const userCreationLimiter = RateLimitMiddleware.userCreation();

// User management rate limiting (moderate for CRUD operations)
const userManagementLimiter = RateLimitMiddleware.userManagement();

// User listing/search rate limiting (more permissive for read operations)
const userSearchLimiter = RateLimitMiddleware.search();

// Password change rate limiting (strict for security operations)
const passwordChangeLimiter = RateLimitMiddleware.passwordChange();

/**
 * @route POST /api/v1/users/register
 * @desc Register a new user (public endpoint)
 * @access Public
 * @middleware ValidationMiddleware, XSSMiddleware
 */
router.post(
  '/register',
  ValidationMiddleware.validate(userValidationSchemas.createUser, 'body'),
  userController.createUser
);

/**
 * @route POST /api/v1/users
 * @desc Create a new user
 * @access Private - Admin only
 * @middleware authMiddleware, userCreationLimiter, ValidationMiddleware, XSSMiddleware
 */
router.post(
  '/',
  authMiddleware,
  userCreationLimiter,
  ValidationMiddleware.validate(userValidationSchemas.createUser, 'body'),
  userController.createUser
);
/**
 * @route GET /api/v1/users
 * @desc Get all users with filtering and pagination
 * @access Private - Admin only
 * @middleware authMiddleware, userSearchLimiter, ValidationMiddleware
 */
router.get(
  '/',
  authMiddleware,
  userSearchLimiter,
  ValidationMiddleware.validate(userValidationSchemas.getUsersQuery, 'query'),
  userController.getUsers
);

/**
 * @route GET /api/v1/users/roles
 * @desc Get available roles
 * @access Private - Admin only
 * @middleware authMiddleware
 */
router.get('/roles', authMiddleware, userController.getRoles);

/**
 * @route GET /api/v1/users/locations
 * @desc Get restaurant locations
 * @access Private - Admin only
 * @middleware authMiddleware
 */
router.get('/locations', authMiddleware, userController.getRestaurantLocations);

/**
 * @route GET /api/v1/users/profile
 * @desc Get current user's profile
 * @access Private - Self only
 * @middleware authMiddleware
 */
router.get('/profile', authMiddleware, userController.getProfile);

/**
 * @route PUT /api/v1/users/profile
 * @desc Update current user's profile
 * @access Private - Self only
 * @middleware authMiddleware, ValidationMiddleware, XSSMiddleware
 */
router.put(
  '/profile',
  authMiddleware,
  userManagementLimiter,
  ValidationMiddleware.validate(userValidationSchemas.updateProfile, 'body'),
  userController.updateProfile
);

/**
 * @route GET /api/v1/users/:id
 * @desc Get user by ID
 * @access Private - Admin or self
 * @middleware authMiddleware, ValidationMiddleware
 */
router.get(
  '/:id',
  authMiddleware,
  userSearchLimiter,
  ValidationMiddleware.validate(userValidationSchemas.userIdParam, 'params'),
  userController.getUserById
);

/**
 * @route PUT /api/v1/users/:id
 * @desc Update user (full update with idempotency)
 * @access Private - Admin or self (limited fields)
 * @middleware authMiddleware, ValidationMiddleware, XSSMiddleware
 * @headers If-Match - ETag for idempotency
 */
router.put(
  '/:id',
  authMiddleware,
  userManagementLimiter,
  ValidationMiddleware.validate(userValidationSchemas.userIdParam, 'params'),
  ValidationMiddleware.validate(userValidationSchemas.updateUser, 'body'),
  userController.updateUser
);

/**
 * @route PATCH /api/v1/users/:id
 * @desc Partially update user (with idempotency)
 * @access Private - Admin or self (limited fields)
 * @middleware authMiddleware, ValidationMiddleware, XSSMiddleware
 * @headers If-Match - ETag for idempotency
 */
router.patch(
  '/:id',
  authMiddleware,
  userManagementLimiter,
  ValidationMiddleware.validate(userValidationSchemas.userIdParam, 'params'),
  ValidationMiddleware.validate(userValidationSchemas.updateUser, 'body'),
  userController.updateUser
);

/**
 * @route DELETE /api/v1/users/:id
 * @desc Soft delete user (with idempotency)
 * @access Private - Admin only
 * @middleware authMiddleware, ValidationMiddleware
 * @headers If-Match - ETag for idempotency
 */
router.delete(
  '/:id',
  authMiddleware,
  userManagementLimiter,
  ValidationMiddleware.validate(userValidationSchemas.userIdParam, 'params'),
  userController.deleteUser
);

/**
 * @route PATCH /api/v1/users/:id/status
 * @desc Toggle user status (activate/deactivate)
 * @access Private - Admin only
 * @middleware authMiddleware, userManagementLimiter, ValidationMiddleware
 */
router.patch(
  '/:id/status',
  authMiddleware,
  userManagementLimiter,
  ValidationMiddleware.validate(userValidationSchemas.userIdParam, 'params'),
  ValidationMiddleware.validate(userValidationSchemas.toggleUserStatus, 'body'),
  userController.toggleUserStatus
);

/**
 * @route POST /api/v1/users/:id/change-password
 * @desc Change user password
 * @access Private - Admin or self
 * @middleware authMiddleware, passwordChangeLimiter, ValidationMiddleware
 */
router.post(
  '/:id/change-password',
  authMiddleware,
  passwordChangeLimiter,
  ValidationMiddleware.validate(userValidationSchemas.userIdParam, 'params'),
  ValidationMiddleware.validate(userValidationSchemas.changePassword, 'body'),
  userController.changePassword
);

/**
 * @route POST /api/v1/users/confirm-email
 * @desc Confirm user email address
 * @access Public
 * @middleware ValidationMiddleware
 */
router.post(
  '/confirm-email',
  ValidationMiddleware.validate(userValidationSchemas.confirmEmail, 'body'),
  userController.confirmEmail
);

/**
 * @route GET /api/v1/users/restaurant/:restaurantId
 * @desc Get users by restaurant
 * @access Private - Admin or restaurant members
 * @middleware authMiddleware, userSearchLimiter, ValidationMiddleware
 */
router.get(
  '/restaurant/:restaurantId',
  authMiddleware,
  userSearchLimiter,
  ValidationMiddleware.validate(userValidationSchemas.getUsersByRestaurant, 'params'),
  ValidationMiddleware.validate(userValidationSchemas.getUsersByRestaurantQuery, 'query'),
  userController.getUsersByRestaurant
);

/**
 * @route POST /api/v1/users/resend-confirmation
 * @desc Resend confirmation email
 * @access Public
 * @middleware ValidationMiddleware
 */
router.post(
  '/resend-confirmation',
  ValidationMiddleware.validate(userValidationSchemas.resendConfirmation, 'body'),
  userController.resendConfirmationEmail
);

module.exports = router;
