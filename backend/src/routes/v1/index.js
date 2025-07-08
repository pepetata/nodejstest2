const express = require('express');
const RateLimitMiddleware = require('../../middleware/rateLimitMiddleware');

// Import existing route modules
const authRoutes = require('../authRoutes');
const locationRoutes = require('../locationRoutes');
const menuRoutes = require('../menuRoutes');
const orderRoutes = require('../orderRoutes');
const restaurantRoutes = require('../restaurantRoutes');
const userRoutes = require('../userRoutes');

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
      return RateLimitMiddleware.restaurantCreation()(req, res, next);
    }
    next();
  },
  restaurantRoutes
);

// User routes with user-specific rate limiting
router.use('/users', userRoutes);

// v1 API documentation endpoint
router.get('/docs', (req, res) => {
  res.json({
    version: '1.0.0',
    title: 'Restaurant API v1',
    description: 'REST API for restaurant ordering system',
    endpoints: {
      auth: {
        '/auth/login': {
          method: 'POST',
          description: 'User authentication',
          rateLimit: '5 requests per 15 minutes',
        },
        '/auth/register': {
          method: 'POST',
          description: 'User registration',
          rateLimit: '5 requests per 15 minutes',
        },
      },
      restaurants: {
        '/restaurants': {
          methods: ['GET', 'POST'],
          description: 'Restaurant management',
          rateLimit: {
            GET: '100 requests per 15 minutes',
            POST: '3 requests per hour',
          },
        },
        '/restaurants/:id': {
          methods: ['GET', 'PUT', 'DELETE'],
          description: 'Individual restaurant operations',
          rateLimit: '100 requests per 15 minutes',
        },
      },
      locations: {
        '/locations': {
          methods: ['GET', 'POST'],
          description: 'Location management',
          rateLimit: '100 requests per 15 minutes',
        },
      },
      menu: {
        '/menu': {
          methods: ['GET', 'POST'],
          description: 'Menu management',
          rateLimit: '100 requests per 15 minutes',
        },
      },
      orders: {
        '/orders': {
          methods: ['GET', 'POST'],
          description: 'Order management',
          rateLimit: '100 requests per 15 minutes',
        },
      },
    },
    rateLimit: {
      general: '100 requests per 15 minutes',
      auth: '5 requests per 15 minutes',
      restaurantCreation: '3 requests per hour',
      search: '200 requests per 15 minutes',
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
