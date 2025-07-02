const errorHandler = (err, req, res, _next) => {
  console.error('Error:', err);

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({
      error: 'Validation Error',
      details: errors,
    });
  }

  // Duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({
      error: `${field} already exists`,
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ error: 'Invalid token' });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ error: 'Token expired' });
  }

  // PostgreSQL errors
  if (err.code === '23505') {
    // Unique violation
    return res.status(400).json({ error: 'Data already exists' });
  }

  if (err.code === '23503') {
    // Foreign key violation
    return res.status(400).json({ error: 'Referenced data does not exist' });
  }

  // Custom application errors
  if (err.message) {
    const statusCode = err.statusCode || 400;
    return res.status(statusCode).json({ error: err.message });
  }

  // Default error
  const errorResponse = {
    error: 'Internal server error',
  };

  // Add details only in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.details = err.message;
  }

  res.status(500).json(errorResponse);
};

module.exports = errorHandler;
