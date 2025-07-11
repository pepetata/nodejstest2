/**
 * Async Handler Utility
 * Wraps async route handlers to automatically catch and forward errors
 * to the Express error handling middleware
 */

/**
 * Async handler wrapper
 * @param {Function} fn - Async function to wrap
 * @returns {Function} Express middleware function
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = asyncHandler;
