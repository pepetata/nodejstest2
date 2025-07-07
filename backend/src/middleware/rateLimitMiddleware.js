const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const { logger } = require('../utils/logger');

const rateLimitLogger = logger.child({ middleware: 'rateLimit' });

/**
 * Rate Limiting Middleware
 * Implements different rate limiting strategies for different API endpoints
 */
class RateLimitMiddleware {
  /**
   * General API rate limiting
   * 100 requests per 15 minutes
   */
  static general() {
    return rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
      message: {
        error: 'Too many requests',
        message: 'Too many requests from this IP, please try again later.',
        retryAfter: 15 * 60 * 1000,
        timestamp: new Date().toISOString(),
      },
      standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
      legacyHeaders: false, // Disable the `X-RateLimit-*` headers
      onLimitReached: (req, res, options) => {
        rateLimitLogger.warn('Rate limit reached for general API', {
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          path: req.path,
          method: req.method,
        });
      },
      skip: (req, res) => {
        // Skip rate limiting for health checks and test endpoints in development
        return (
          req.path === '/health' ||
          (process.env.NODE_ENV !== 'production' && req.path.startsWith('/api/test/'))
        );
      },
    });
  }

  /**
   * Authentication endpoints rate limiting
   * 5 requests per 15 minutes - stricter for auth endpoints
   */
  static auth() {
    return rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 5, // limit each IP to 5 requests per windowMs
      message: {
        error: 'Too many authentication attempts',
        message: 'Too many authentication attempts from this IP, please try again later.',
        retryAfter: 15 * 60 * 1000,
        timestamp: new Date().toISOString(),
      },
      standardHeaders: true,
      legacyHeaders: false,
      onLimitReached: (req, res, options) => {
        rateLimitLogger.warn('Rate limit reached for auth endpoints', {
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          path: req.path,
          method: req.method,
        });
      },
    });
  }

  /**
   * Restaurant creation rate limiting
   * 3 requests per hour - very strict for resource creation
   */
  static restaurantCreation() {
    return rateLimit({
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 3, // limit each IP to 3 requests per hour
      message: {
        error: 'Too many restaurant creation attempts',
        message: 'Too many restaurant creation attempts from this IP, please try again later.',
        retryAfter: 60 * 60 * 1000,
        timestamp: new Date().toISOString(),
      },
      standardHeaders: true,
      legacyHeaders: false,
      onLimitReached: (req, res, options) => {
        rateLimitLogger.warn('Rate limit reached for restaurant creation', {
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          path: req.path,
          method: req.method,
        });
      },
    });
  }

  /**
   * API endpoints rate limiting with slow down
   * Gradually slow down responses after certain threshold
   */
  static apiWithSlowDown() {
    return [
      slowDown({
        windowMs: 15 * 60 * 1000, // 15 minutes
        delayAfter: 50, // allow 50 requests per 15 minutes at full speed
        delayMs: 500, // add 500ms delay per request after delayAfter
        maxDelayMs: 20000, // max delay of 20 seconds
        onLimitReached: (req, res, options) => {
          rateLimitLogger.warn('Slow down limit reached', {
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            path: req.path,
            method: req.method,
          });
        },
      }),
      rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100, // limit each IP to 100 requests per windowMs
        message: {
          error: 'Too many requests',
          message: 'Too many requests from this IP, please try again later.',
          retryAfter: 15 * 60 * 1000,
          timestamp: new Date().toISOString(),
        },
        standardHeaders: true,
        legacyHeaders: false,
        onLimitReached: (req, res, options) => {
          rateLimitLogger.warn('Rate limit reached for API with slow down', {
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            path: req.path,
            method: req.method,
          });
        },
      }),
    ];
  }

  /**
   * File upload rate limiting
   * 10 requests per hour for uploads
   */
  static upload() {
    return rateLimit({
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 10, // limit each IP to 10 requests per hour
      message: {
        error: 'Too many upload attempts',
        message: 'Too many upload attempts from this IP, please try again later.',
        retryAfter: 60 * 60 * 1000,
        timestamp: new Date().toISOString(),
      },
      standardHeaders: true,
      legacyHeaders: false,
      onLimitReached: (req, res, options) => {
        rateLimitLogger.warn('Rate limit reached for uploads', {
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          path: req.path,
          method: req.method,
        });
      },
    });
  }

  /**
   * Search endpoints rate limiting
   * 200 requests per 15 minutes - higher limit for search
   */
  static search() {
    return rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 200, // limit each IP to 200 requests per windowMs
      message: {
        error: 'Too many search requests',
        message: 'Too many search requests from this IP, please try again later.',
        retryAfter: 15 * 60 * 1000,
        timestamp: new Date().toISOString(),
      },
      standardHeaders: true,
      legacyHeaders: false,
      onLimitReached: (req, res, options) => {
        rateLimitLogger.warn('Rate limit reached for search endpoints', {
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          path: req.path,
          method: req.method,
        });
      },
    });
  }
}

module.exports = RateLimitMiddleware;
