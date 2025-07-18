const express = require('express');
const RateLimitMiddleware = require('../../middleware/rateLimitMiddleware');

// Import existing route modules
const authRoutes = require('../authRoutes');
const locationRoutes = require('../locationRoutes');
const menuRoutes = require('../menuRoutes');
const orderRoutes = require('../orderRoutes');
const restaurantRoutes = require('../restaurantRoutes');
const userRoutes = require('../userRoutes');
const testRoutes = require('../testRoutes');

const restaurantCreationLimiter = RateLimitMiddleware.restaurantCreation();
const router = express.Router();

/**
 * API v1 Routes
 * Wraps existing routes with version-specific middleware and rate limiting
 */

// Apply general rate limiting to all v1 routes
router.use(RateLimitMiddleware.general());

// Authentication routes with stricter rate limiting
router.use('/auth', RateLimitMiddleware.auth(), authRoutes);

// Location routes
router.use('/locations', locationRoutes);

// Menu routes with search rate limiting for menu items
router.use('/menu', menuRoutes);

// Order routes
router.use('/orders', orderRoutes);

// Restaurant routes with specific rate limiting for creation
router.use(
  '/restaurants',
  (req, res, next) => {
    // Apply stricter rate limiting for restaurant creation
    if (req.method === 'POST' && req.path === '/') {
      return restaurantCreationLimiter(req, res, next);
    }
    next();
  },
  restaurantRoutes
);

// User routes with user-specific rate limiting
router.use('/users', userRoutes);

// Test routes for debugging (development only)
if (process.env.NODE_ENV !== 'production') {
  router.use('/test', testRoutes);
}

// v1 API documentation endpoint
router.get('/docs', (req, res) => {
  res.json({
    version: '1.0.0',
    title: 'Restaurant API v1',
    endpoints: [
      'POST /auth/login',
      'POST /auth/register',
      'GET /restaurants',
      'POST /restaurants',
      'GET /restaurants/:id',
      'PUT /restaurants/:id',
      'DELETE /restaurants/:id',
      'GET /locations',
      'POST /locations',
      'GET /menu',
      'POST /menu',
      'GET /orders',
      'POST /orders',
    ],
    limits: {
      general: '100/15min',
      auth: '5/15min',
      creation: '3/hour',
    },
    timestamp: new Date().toISOString(),
  });
});

// v1 API health check
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

module.exports = router;
