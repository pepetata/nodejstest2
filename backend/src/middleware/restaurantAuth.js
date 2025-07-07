/**
 * Restaurant Authorization Middleware
 * Handles restaurant-specific authorization and permissions
 */

const { logger } = require('../utils/logger');
const ResponseFormatter = require('../utils/responseFormatter');

/**
 * Check if user has restaurant administrator role
 */
const requireRestaurantAdmin = (req, res, next) => {
  const logContext = {
    userId: req.user?.id,
    userRole: req.user?.role,
    endpoint: req.originalUrl,
  };

  logger.debug('Checking restaurant administrator authorization', logContext);

  if (!req.user) {
    logger.warn('Authorization check failed: No user in request', logContext);
    return ResponseFormatter.sendError(res, 'Authentication required', 401);
  }

  if (req.user.role !== 'restaurant_administrator') {
    logger.warn('Authorization check failed: Insufficient permissions', {
      ...logContext,
      requiredRole: 'restaurant_administrator',
    });
    return ResponseFormatter.sendError(res, 'Restaurant administrator access required', 403);
  }

  logger.debug('Restaurant administrator authorization successful', logContext);
  next();
};

/**
 * Check if user can access specific restaurant
 * @param {String} restaurantIdParam - Parameter name containing restaurant ID
 */
const requireRestaurantAccess = (restaurantIdParam = 'id') => {
  return (req, res, next) => {
    const restaurantId = req.params[restaurantIdParam];
    const logContext = {
      userId: req.user?.id,
      userRole: req.user?.role,
      restaurantId,
      userRestaurantId: req.user?.restaurant_id,
      endpoint: req.originalUrl,
    };

    logger.debug('Checking restaurant access authorization', logContext);

    if (!req.user) {
      logger.warn('Restaurant access check failed: No user in request', logContext);
      return ResponseFormatter.sendError(res, 'Authentication required', 401);
    }

    // Restaurant administrators can only access their own restaurant
    if (req.user.role === 'restaurant_administrator') {
      if (!req.user.restaurant_id) {
        logger.warn(
          'Restaurant access check failed: Restaurant admin without restaurant assignment',
          logContext
        );
        return ResponseFormatter.sendError(
          res,
          'Restaurant administrator not assigned to a restaurant',
          403
        );
      }

      if (restaurantId && req.user.restaurant_id !== restaurantId) {
        logger.warn(
          'Restaurant access check failed: Access to different restaurant denied',
          logContext
        );
        return ResponseFormatter.sendError(res, 'Access denied to this restaurant', 403);
      }
    }

    // Location administrators and other roles need additional checks
    if (
      ['location_administrator', 'waiter', 'food_runner', 'kds_operator', 'pos_operator'].includes(
        req.user.role
      )
    ) {
      if (!req.user.restaurant_id) {
        logger.warn(
          'Restaurant access check failed: Staff member without restaurant assignment',
          logContext
        );
        return ResponseFormatter.sendError(res, 'Staff member not assigned to a restaurant', 403);
      }

      if (restaurantId && req.user.restaurant_id !== restaurantId) {
        logger.warn(
          'Restaurant access check failed: Staff access to different restaurant denied',
          logContext
        );
        return ResponseFormatter.sendError(res, 'Access denied to this restaurant', 403);
      }
    }

    logger.debug('Restaurant access authorization successful', logContext);
    next();
  };
};

/**
 * Check if user can modify restaurant data
 */
const requireRestaurantModifyAccess = (req, res, next) => {
  const logContext = {
    userId: req.user?.id,
    userRole: req.user?.role,
    endpoint: req.originalUrl,
  };

  logger.debug('Checking restaurant modification authorization', logContext);

  if (!req.user) {
    logger.warn('Restaurant modification check failed: No user in request', logContext);
    return ResponseFormatter.sendError(res, 'Authentication required', 401);
  }

  // Only restaurant administrators can modify restaurant data
  if (req.user.role !== 'restaurant_administrator') {
    logger.warn('Restaurant modification check failed: Insufficient permissions', {
      ...logContext,
      requiredRole: 'restaurant_administrator',
    });
    return ResponseFormatter.sendError(
      res,
      'Only restaurant administrators can modify restaurant data',
      403
    );
  }

  logger.debug('Restaurant modification authorization successful', logContext);
  next();
};

/**
 * Check if user can view restaurant data (read access)
 */
const requireRestaurantReadAccess = (req, res, next) => {
  const logContext = {
    userId: req.user?.id,
    userRole: req.user?.role,
    endpoint: req.originalUrl,
  };

  logger.debug('Checking restaurant read authorization', logContext);

  if (!req.user) {
    logger.warn('Restaurant read check failed: No user in request', logContext);
    return ResponseFormatter.sendError(res, 'Authentication required', 401);
  }

  // All restaurant roles can read restaurant data
  const allowedRoles = [
    'restaurant_administrator',
    'location_administrator',
    'waiter',
    'food_runner',
    'kds_operator',
    'pos_operator',
  ];

  if (!allowedRoles.includes(req.user.role)) {
    logger.warn('Restaurant read check failed: Invalid role', {
      ...logContext,
      allowedRoles,
    });
    return ResponseFormatter.sendError(res, 'Restaurant access required', 403);
  }

  logger.debug('Restaurant read authorization successful', logContext);
  next();
};

module.exports = {
  requireRestaurantAdmin,
  requireRestaurantAccess,
  requireRestaurantModifyAccess,
  requireRestaurantReadAccess,
};
