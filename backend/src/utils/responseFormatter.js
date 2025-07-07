/**
 * Response Formatter Utility
 * Provides consistent response formatting across the application
 */

const { logger } = require('./logger');

class ResponseFormatter {
  /**
   * Format success response
   * @param {Object} data - Response data
   * @param {String} message - Success message
   * @param {Object} meta - Additional metadata (pagination, etc.)
   * @returns {Object} Formatted response
   */
  static success(data = null, message = 'Success', meta = null) {
    const response = {
      success: true,
      message,
      data,
      timestamp: new Date().toISOString(),
    };

    if (meta) {
      response.meta = meta;
    }

    return response;
  }

  /**
   * Format error response
   * @param {String} message - Error message
   * @param {Number} statusCode - HTTP status code
   * @param {Object} details - Additional error details
   * @returns {Object} Formatted error response
   */
  static error(message = 'An error occurred', statusCode = 500, details = null) {
    const response = {
      success: false,
      error: {
        message,
        code: statusCode,
        timestamp: new Date().toISOString(),
      },
    };

    if (details) {
      response.error.details = details;
    }

    return response;
  }

  /**
   * Format validation error response
   * @param {Array} errors - Validation errors array
   * @param {String} message - Main error message
   * @returns {Object} Formatted validation error response
   */
  static validationError(errors = [], message = 'Validation failed') {
    return this.error(message, 400, {
      type: 'validation',
      errors,
    });
  }

  /**
   * Format paginated response
   * @param {Array} data - Array of items
   * @param {Object} pagination - Pagination info
   * @param {String} message - Success message
   * @returns {Object} Formatted paginated response
   */
  static paginated(data = [], pagination = {}, message = 'Data retrieved successfully') {
    return this.success(data, message, { pagination });
  }

  /**
   * Format created resource response
   * @param {Object} data - Created resource data
   * @param {String} message - Success message
   * @returns {Object} Formatted creation response
   */
  static created(data, message = 'Resource created successfully') {
    return this.success(data, message);
  }

  /**
   * Format updated resource response
   * @param {Object} data - Updated resource data
   * @param {String} message - Success message
   * @returns {Object} Formatted update response
   */
  static updated(data, message = 'Resource updated successfully') {
    return this.success(data, message);
  }

  /**
   * Format deleted resource response
   * @param {String} message - Success message
   * @returns {Object} Formatted deletion response
   */
  static deleted(message = 'Resource deleted successfully') {
    return this.success(null, message);
  }

  /**
   * Format not found response
   * @param {String} resource - Resource name
   * @returns {Object} Formatted not found response
   */
  static notFound(resource = 'Resource') {
    return this.error(`${resource} not found`, 404);
  }

  /**
   * Format unauthorized response
   * @param {String} message - Error message
   * @returns {Object} Formatted unauthorized response
   */
  static unauthorized(message = 'Unauthorized access') {
    return this.error(message, 401);
  }

  /**
   * Format forbidden response
   * @param {String} message - Error message
   * @returns {Object} Formatted forbidden response
   */
  static forbidden(message = 'Access forbidden') {
    return this.error(message, 403);
  }

  /**
   * Send formatted response
   * @param {Object} res - Express response object
   * @param {Number} statusCode - HTTP status code
   * @param {Object} data - Response data
   */
  static send(res, statusCode, data) {
    res.status(statusCode).json(data);
  }

  /**
   * Send success response
   * @param {Object} res - Express response object
   * @param {Object} data - Response data
   * @param {String} message - Success message
   * @param {Number} statusCode - HTTP status code
   * @param {Object} meta - Additional metadata
   */
  static sendSuccess(res, data = null, message = 'Success', statusCode = 200, meta = null) {
    this.send(res, statusCode, this.success(data, message, meta));
  }

  /**
   * Send error response
   * @param {Object} res - Express response object
   * @param {String} message - Error message
   * @param {Number} statusCode - HTTP status code
   * @param {Object} details - Additional error details
   */
  static sendError(res, message = 'An error occurred', statusCode = 500, details = null) {
    this.send(res, statusCode, this.error(message, statusCode, details));
  }
}

module.exports = ResponseFormatter;
