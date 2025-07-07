const { logger } = require('../utils/logger');
const ResponseFormatter = require('../utils/responseFormatter');

/**
 * Validation Middleware
 * Provides request validation using Joi schemas
 */
class ValidationMiddleware {
  /**
   * Create a validation middleware for request body
   * @param {Object} schema - Joi validation schema
   * @param {String} target - Target to validate ('body', 'query', 'params')
   * @returns {Function} Express middleware function
   */
  static validate(schema, target = 'body') {
    return (req, res, next) => {
      const validationLogger = logger.child({
        middleware: 'ValidationMiddleware',
        target,
        method: req.method,
        path: req.path,
      });

      let dataToValidate;
      switch (target) {
        case 'body':
          dataToValidate = req.body;
          break;
        case 'query':
          dataToValidate = req.query;
          break;
        case 'params':
          dataToValidate = req.params;
          break;
        default:
          dataToValidate = req.body;
      }

      validationLogger.debug('Validating request data', {
        target,
        hasData: !!dataToValidate,
      });

      const { error, value } = schema.validate(dataToValidate, {
        abortEarly: false,
        allowUnknown: false,
        stripUnknown: true,
      });

      if (error) {
        const validationErrors = error.details.map((detail) => ({
          field: detail.path.join('.'),
          message: detail.message,
          value: detail.context?.value,
        }));

        validationLogger.warn('Validation failed', {
          target,
          errors: validationErrors,
        });

        return res.status(400).json(
          ResponseFormatter.error('Validation failed', 400, {
            validationErrors,
            target,
          })
        );
      }

      // Replace the original data with the validated and sanitized data
      switch (target) {
        case 'body':
          req.body = value;
          break;
        case 'query':
          req.query = value;
          break;
        case 'params':
          req.params = value;
          break;
      }

      validationLogger.debug('Validation successful', { target });
      next();
    };
  }

  /**
   * Validate request body
   * @param {Object} schema - Joi validation schema
   * @returns {Function} Express middleware function
   */
  static validateBody(schema) {
    return this.validate(schema, 'body');
  }

  /**
   * Validate query parameters
   * @param {Object} schema - Joi validation schema
   * @returns {Function} Express middleware function
   */
  static validateQuery(schema) {
    return this.validate(schema, 'query');
  }

  /**
   * Validate route parameters
   * @param {Object} schema - Joi validation schema
   * @returns {Function} Express middleware function
   */
  static validateParams(schema) {
    return this.validate(schema, 'params');
  }

  /**
   * Sanitize request data by removing potentially harmful content
   * @returns {Function} Express middleware function
   */
  static sanitize() {
    return (req, res, next) => {
      const sanitizeLogger = logger.child({
        middleware: 'ValidationMiddleware.sanitize',
        method: req.method,
        path: req.path,
      });

      const sanitizeObject = (obj) => {
        if (!obj || typeof obj !== 'object') return obj;

        const sanitized = {};
        for (const [key, value] of Object.entries(obj)) {
          if (typeof value === 'string') {
            // Basic XSS prevention - remove script tags and javascript: protocol
            sanitized[key] = value
              .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
              .replace(/javascript:/gi, '')
              .trim();
          } else if (typeof value === 'object' && value !== null) {
            sanitized[key] = sanitizeObject(value);
          } else {
            sanitized[key] = value;
          }
        }
        return sanitized;
      };

      try {
        if (req.body) {
          req.body = sanitizeObject(req.body);
        }
        if (req.query) {
          req.query = sanitizeObject(req.query);
        }
        if (req.params) {
          req.params = sanitizeObject(req.params);
        }

        sanitizeLogger.debug('Request data sanitized successfully');
        next();
      } catch (error) {
        sanitizeLogger.error('Error during request sanitization', { error: error.message });
        return res.status(400).json(ResponseFormatter.error('Invalid request data', 400));
      }
    };
  }
}

module.exports = ValidationMiddleware;
