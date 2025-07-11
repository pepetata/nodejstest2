require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const db = require('./src/config/db');
const errorHandler = require('./src/middleware/errorHandler');
const requestLogger = require('./src/middleware/requestLogger');
const XSSMiddleware = require('./src/middleware/xssMiddleware');
const ApiVersioningMiddleware = require('./src/middleware/apiVersioningMiddleware');
const RateLimitMiddleware = require('./src/middleware/rateLimitMiddleware');
const path = require('path');

// Import versioned routes
const v1Routes = require('./src/routes/v1');

// Import legacy routes (for backward compatibility)
const authRoutes = require('./src/routes/authRoutes');
const locationRoutes = require('./src/routes/locationRoutes');
const menuRoutes = require('./src/routes/menuRoutes');
const orderRoutes = require('./src/routes/orderRoutes');
const restaurantRoutes = require('./src/routes/restaurantRoutes');

// Initialize express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// XSS Protection - MUST come after body parsing
app.use(XSSMiddleware.sanitizeAll);

// API Versioning - MUST come before routes
app.use('/api', ApiVersioningMiddleware.apply());

// Global rate limiting for health and test endpoints
app.use(RateLimitMiddleware.general());

// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}
app.use(requestLogger);

// Versioned API Routes
app.use('/api/v1', v1Routes);

// Legacy routes (for backward compatibility) - will be deprecated
app.use('/api/auth', RateLimitMiddleware.auth(), authRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/restaurants', restaurantRoutes);

// Serve dynamic favicon based on subdomain
app.get('/favicon.ico', (req, res) => {
  const host = req.hostname;
  const match = host.match(/^([^.]+)\.localhost$/i);
  const restaurant = match ? match[1] : null;
  if (restaurant) {
    const customFavicon = path.join(__dirname, 'public', 'favicons', restaurant, 'favicon.ico');
    res.sendFile(customFavicon, (err) => {
      if (err) {
        // fallback to default favicon
        res.sendFile(path.join(__dirname, 'public', 'favicon.ico'));
      }
    });
  } else {
    res.sendFile(path.join(__dirname, 'public', 'favicon.ico'));
  }
});

// Main API documentation endpoint
app.get('/api', (req, res) => {
  res.json({
    name: 'Restaurant Ordering System API',
    description: 'RESTful API for restaurant management and ordering',
    versions: {
      v1: {
        status: 'stable',
        endpoint: '/api/v1',
        documentation: '/api/v1/docs',
      },
    },
    endpoints: {
      '/api/v1': 'Version 1 API endpoints',
      '/api/v1/docs': 'API v1 documentation',
      '/health': 'System health check',
    },
    rateLimit: {
      enabled: true,
      general: '100 requests per 15 minutes',
      auth: '5 requests per 15 minutes',
    },
    timestamp: new Date().toISOString(),
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy' });
});

// Test endpoint to verify XSS sanitization (only in development)
if (process.env.NODE_ENV !== 'production') {
  app.post('/api/test/xss', (req, res) => {
    res.status(200).json({
      message: 'XSS test endpoint',
      receivedData: req.body,
      queryParams: req.query,
      urlParams: req.params,
    });
  });

  app.get('/api/test/xss', (req, res) => {
    res.status(200).json({
      message: 'XSS test endpoint',
      receivedData: req.body,
      queryParams: req.query,
      urlParams: req.params,
    });
  });
}

// Handle 404 - Route not found
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.originalUrl}`,
    path: req.originalUrl,
    timestamp: new Date().toISOString(),
  });
});

// Error handling middleware
app.use(errorHandler);

// Start the server
const startServer = async () => {
  try {
    // Test database connection
    await db.testConnection();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle unexpected errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  console.error('Unhandled Rejection:', error);
  process.exit(1);
});

// Only start the server if not in test mode
if (process.env.NODE_ENV !== 'test') {
  startServer();
}

// Export for testing
module.exports = app;
