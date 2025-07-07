const ResponseFormatter = require('../utils/responseFormatter');
const { logger } = require('../utils/logger');

const errorHandler = (err, req, res, _next) => {
  const errorLogger = logger.child({
    middleware: 'errorHandler',
    method: req.method,
    path: req.path,
    userId: req.user?.id,
  });

  errorLogger.error('Application error', {
    error: err.message,
    stack: err.stack,
    code: err.code,
    name: err.name,
  });

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((e) => e.message);
    return res
      .status(400)
      .json(ResponseFormatter.error('Validation Error', 400, { validationErrors: errors }));
  }

  // Duplicate key error (MongoDB)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json(ResponseFormatter.error(`${field} already exists`, 400));
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json(ResponseFormatter.error('Invalid token', 401));
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json(ResponseFormatter.error('Token expired', 401));
  }

  // PostgreSQL errors
  if (err.code === '23505') {
    // Unique violation
    return res.status(409).json(ResponseFormatter.error('Data already exists', 409));
  }

  if (err.code === '23503') {
    // Foreign key violation
    return res.status(400).json(ResponseFormatter.error('Referenced data does not exist', 400));
  }

  if (err.code === '23502') {
    // Not null violation
    return res.status(400).json(ResponseFormatter.error('Required field is missing', 400));
  }

  if (err.code === '22001') {
    // String data right truncation
    return res.status(400).json(ResponseFormatter.error('Data too long for field', 400));
  }

  // Custom application errors
  if (err.message) {
    const statusCode = err.statusCode || 500;
    const details =
      process.env.NODE_ENV === 'development'
        ? {
            stack: err.stack,
            code: err.code,
          }
        : null;

    return res.status(statusCode).json(ResponseFormatter.error(err.message, statusCode, details));
  }

  // Default error
  const details =
    process.env.NODE_ENV === 'development'
      ? {
          stack: err.stack,
          code: err.code,
          name: err.name,
        }
      : null;

  res.status(500).json(ResponseFormatter.error('Internal server error', 500, details));
};

module.exports = errorHandler;
