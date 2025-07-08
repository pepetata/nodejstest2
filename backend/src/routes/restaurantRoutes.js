const express = require('express');
const RestaurantController = require('../controllers/restaurantController');
const ValidationMiddleware = require('../middleware/validationMiddleware');
const authMiddleware = require('../middleware/authMiddleware');
const restaurantAuth = require('../middleware/restaurantAuth');
const RestaurantValidation = require('../validations/restaurantValidation');
const { logger } = require('../utils/logger');

const Joi = require('joi');

const router = express.Router();
const routerLogger = logger.child({ module: 'restaurantRoutes' });
const restaurantController = new RestaurantController(logger);

// Apply request logging for all restaurant routes
router.use((req, res, next) => {
  routerLogger.info('Restaurant route accessed', {
    method: req.method,
    path: req.path,
    query: req.query,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });
  next();
});

// Apply sanitization to all routes
router.use(ValidationMiddleware.sanitize());

/**
 * Public Routes (no authentication required)
 */

// GET /api/restaurants - Get all restaurants with filtering and pagination
router.get(
  '/',
  ValidationMiddleware.validateQuery(RestaurantValidation.querySchema),
  restaurantController.getRestaurants.bind(restaurantController)
);

// GET /api/restaurants/by-url/:urlName - Get restaurant by URL name
router.get(
  '/by-url/:urlName',
  ValidationMiddleware.validateParams(
    Joi.object({
      urlName: RestaurantValidation.urlNameSchema,
    })
  ),
  restaurantController.getRestaurantByUrlName.bind(restaurantController)
);

// GET /api/restaurants/check-url/:urlName - Check URL name availability
router.get(
  '/check-url/:urlName',
  ValidationMiddleware.validateParams(
    Joi.object({
      urlName: RestaurantValidation.urlNameSchema,
    })
  ),
  restaurantController.checkUrlAvailability.bind(restaurantController)
);

// GET /api/restaurants/:id - Get restaurant by ID
router.get(
  '/:id',
  ValidationMiddleware.validateParams(
    Joi.object({
      id: RestaurantValidation.uuidSchema,
    })
  ),
  restaurantController.getRestaurantById.bind(restaurantController)
);

// GET /api/restaurants/:id/stats - Get restaurant statistics
router.get(
  '/:id/stats',
  ValidationMiddleware.validateParams(
    Joi.object({
      id: RestaurantValidation.uuidSchema,
    })
  ),
  restaurantController.getRestaurantStats.bind(restaurantController)
);

/**
 * Protected Routes (authentication required)
 */

// POST /api/restaurants - Create a new restaurant
// Requires authentication and admin role
router.post(
  '/',
  ValidationMiddleware.validateBody(RestaurantValidation.createSchema),
  restaurantController.createRestaurant.bind(restaurantController)
);

// PUT /api/restaurants/:id - Update a restaurant
// Requires authentication and appropriate permissions
router.put(
  '/:id',
  authMiddleware,
  ValidationMiddleware.validateParams(
    Joi.object({
      id: RestaurantValidation.uuidSchema,
    })
  ),
  restaurantAuth.requireRestaurantModifyAccess, // Check if user can modify this restaurant
  ValidationMiddleware.validateBody(RestaurantValidation.updateSchema),
  restaurantController.updateRestaurant.bind(restaurantController)
);

// DELETE /api/restaurants/:id - Delete a restaurant
// Requires authentication and appropriate permissions
router.delete(
  '/:id',
  authMiddleware,
  ValidationMiddleware.validateParams(
    Joi.object({
      id: RestaurantValidation.uuidSchema,
    })
  ),
  restaurantAuth.requireRestaurantModifyAccess, // Check if user can delete this restaurant
  restaurantController.deleteRestaurant.bind(restaurantController)
);

/**
 * Error handling for restaurant routes
 */
router.use((error, req, res, next) => {
  routerLogger.error('Restaurant route error', {
    error: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
    userId: req.user?.id,
  });
  next(error);
});

module.exports = router;
