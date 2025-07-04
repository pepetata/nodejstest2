const express = require('express');
const router = express.Router();
const XSSMiddleware = require('../middleware/xssMiddleware');
const authMiddleware = require('../middleware/authMiddleware');

/**
 * Restaurant Location Routes
 * All routes include XSS sanitization middleware for security
 */

// Example of how to apply XSS middleware to location routes
router.post(
  '/',
  XSSMiddleware.sanitizeLocationData, // XSS prevention at route level
  authMiddleware, // Authentication (note: authMiddleware is the function itself)
  async (req, res, next) => {
    try {
      // Controller logic here
      // Data is already sanitized by middleware
      res.json({ message: 'Location created', data: req.body });
    } catch (error) {
      next(error);
    }
  }
);

router.put(
  '/:id',
  XSSMiddleware.sanitizeLocationData, // XSS prevention
  authMiddleware, // Authentication
  async (req, res, next) => {
    try {
      // Controller logic here
      res.json({ message: 'Location updated', data: req.body });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
