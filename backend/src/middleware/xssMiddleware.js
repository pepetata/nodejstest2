const XSSSanitizer = require('../utils/xssSanitizer');
const { logger } = require('../utils/logger');

/**
 * XSS Prevention Middleware
 * Sanitizes all incoming request data to prevent XSS attacks
 * Applied at the middleware layer for defense-in-depth security
 */
class XSSMiddleware {
  /**
   * Sanitize request body data
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  static sanitizeBody(req, res, next) {
    try {
      if (req.body && typeof req.body === 'object') {
        req.body = XSSMiddleware.sanitizeObject(req.body);
        logger.debug('Request body sanitized for XSS prevention', {
          path: req.path,
          method: req.method,
          hasBody: Object.keys(req.body).length > 0,
        });
      }
      next();
    } catch (error) {
      logger.error('XSS sanitization middleware error', {
        path: req.path,
        method: req.method,
        error: error.message,
      });
      next(error);
    }
  }

  /**
   * Sanitize query parameters
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  static sanitizeQuery(req, res, next) {
    try {
      if (req.query && typeof req.query === 'object') {
        req.query = XSSMiddleware.sanitizeObject(req.query);
        logger.debug('Query parameters sanitized for XSS prevention', {
          path: req.path,
          method: req.method,
          hasQuery: Object.keys(req.query).length > 0,
        });
      }
      next();
    } catch (error) {
      logger.error('XSS query sanitization middleware error', {
        path: req.path,
        method: req.method,
        error: error.message,
      });
      next(error);
    }
  }

  /**
   * Comprehensive sanitization for all request data
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  static sanitizeAll(req, res, next) {
    try {
      // Sanitize body
      if (req.body && typeof req.body === 'object') {
        req.body = XSSMiddleware.sanitizeObject(req.body);
      }

      // Sanitize query parameters
      if (req.query && typeof req.query === 'object') {
        req.query = XSSMiddleware.sanitizeObject(req.query);
      }

      // Sanitize URL parameters
      if (req.params && typeof req.params === 'object') {
        req.params = XSSMiddleware.sanitizeObject(req.params);
      }

      logger.debug('All request data sanitized for XSS prevention', {
        path: req.path,
        method: req.method,
        hasBody: req.body && Object.keys(req.body).length > 0,
        hasQuery: req.query && Object.keys(req.query).length > 0,
        hasParams: req.params && Object.keys(req.params).length > 0,
      });

      next();
    } catch (error) {
      logger.error('Comprehensive XSS sanitization middleware error', {
        path: req.path,
        method: req.method,
        error: error.message,
      });
      next(error);
    }
  }

  /**
   * Recursively sanitize object properties
   * @param {*} obj - Object to sanitize
   * @returns {*} Sanitized object
   * @private
   */
  static sanitizeObject(obj) {
    if (obj === null || obj === undefined) return obj;

    if (typeof obj === 'string') {
      return XSSSanitizer.sanitizeText(obj);
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => XSSMiddleware.sanitizeObject(item));
    }

    if (typeof obj === 'object') {
      const sanitized = {};
      for (const [key, value] of Object.entries(obj)) {
        // Sanitize both key and value
        const sanitizedKey = typeof key === 'string' ? XSSSanitizer.sanitizeText(key) : key;
        sanitized[sanitizedKey] = XSSMiddleware.sanitizeObject(value);
      }
      return sanitized;
    }

    return obj;
  }

  /**
   * Specific sanitization for restaurant data
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  static sanitizeRestaurantData(req, res, next) {
    try {
      if (req.body && typeof req.body === 'object') {
        req.body = XSSSanitizer.sanitizeRestaurantData(req.body);
        logger.debug('Restaurant data sanitized for XSS prevention', {
          path: req.path,
          method: req.method,
        });
      }
      next();
    } catch (error) {
      logger.error('Restaurant XSS sanitization middleware error', {
        path: req.path,
        method: req.method,
        error: error.message,
      });
      next(error);
    }
  }

  /**
   * Specific sanitization for location data
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  static sanitizeLocationData(req, res, next) {
    try {
      if (req.body && typeof req.body === 'object') {
        req.body = XSSSanitizer.sanitizeLocationData(req.body);
        logger.debug('Location data sanitized for XSS prevention', {
          path: req.path,
          method: req.method,
        });
      }
      next();
    } catch (error) {
      logger.error('Location XSS sanitization middleware error', {
        path: req.path,
        method: req.method,
        error: error.message,
      });
      next(error);
    }
  }
}

module.exports = XSSMiddleware;
