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
   * 100 requests per 15 minutes (production) / 1000 requests per 15 minutes (development)
   */
  static general() {
    const isDevelopment = process.env.NODE_ENV === 'development';
    return rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: isDevelopment ? 1000 : 100, // Higher limit for development
      message: {
        error: 'Too many requests',
        message: 'Too many requests from this IP, please try again later.',
        retryAfter: 15 * 60 * 1000,
        timestamp: new Date().toISOString(),
      },
      standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
      legacyHeaders: false, // Disable the `X-RateLimit-*` headers
      handler: (req, res, options) => {
        rateLimitLogger.warn('Rate limit reached for general API', {
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          path: req.path,
          method: req.method,
        });
        res.status(429).json({
          success: false,
          error: {
            message: 'Too many requests, please try again later.',
            code: 429,
            retryAfter: 15 * 60 * 1000,
            timestamp: new Date().toISOString(),
          },
        });
      },
      skip: (req, res) => {
        // Skip rate limiting for health checks and test endpoints in development
        return (
          req.path === '/health' ||
          (process.env.NODE_ENV !== 'production' && req.path.startsWith('/api/v1/test/'))
        );
      },
    });
  }

  /**
   * Authentication endpoints rate limiting
   * 5 requests per 15 minutes - stricter for auth endpoints
   */
  static getAuthRateLimiterInstance() {
    // Singleton pattern to ensure the same instance is used
    if (!this._authRateLimiter) {
      // Higher limits for development, stricter for production
      const isDevelopment = process.env.NODE_ENV !== 'production';
      const maxRequests = isDevelopment ? 100 : 20; // 100 for dev, 20 for prod
      const windowMs = 15 * 60 * 1000; // 15 minutes

      this._authRateLimiter = rateLimit({
        windowMs,
        max: maxRequests,
        message: {
          error: 'Muitas tentativas de login',
          message:
            'Você fez muitas tentativas de login. Por favor, aguarde alguns minutos antes de tentar novamente.',
          retryAfter: windowMs,
          timestamp: new Date().toISOString(),
        },
        standardHeaders: true,
        legacyHeaders: false,
        handler: (req, res, options) => {
          rateLimitLogger.warn('Rate limit reached for auth endpoints', {
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            path: req.path,
            method: req.method,
          });
          // Mensagem amigável em português para o usuário final
          const msg =
            'Você fez muitas tentativas de login. Por favor, aguarde alguns minutos antes de tentar novamente.';
          const retryAfter = 15 * 60 * 1000;
          res.status(429).json({
            sucesso: false,
            erro: {
              mensagem: msg,
              codigo: 429,
              retryAfter,
              timestamp: new Date().toISOString(),
              detalhes: {
                middleware: 'rateLimit',
                ip: req.ip,
                path: req.path,
                method: req.method,
              },
            },
          });
        },
      });
    }
    return this._authRateLimiter;
  }

  // For compatibility with existing code
  static auth() {
    return this.getAuthRateLimiterInstance();
  }

  /**
   * Restaurant creation rate limiting
   * 3 requests per hour - very strict for resource creation
   */
  static restaurantCreation() {
    return rateLimit({
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 30, // limit each IP to 3 requests per hour
      message: {
        error: 'Muitas tentativas de criação de restaurante',
        message:
          'Muitas tentativas de criação de restaurante deste IP. Por favor, tente novamente mais tarde.',
        retryAfter: 60 * 60 * 1000,
        timestamp: new Date().toISOString(),
      },
      standardHeaders: true,
      legacyHeaders: false,
      handler: (req, res, options) => {
        rateLimitLogger.warn('Rate limit reached for restaurant creation', {
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          path: req.path,
          method: req.method,
        });
        const msg =
          'Muitas tentativas de criação de restaurante deste IP. Por favor, tente novamente mais tarde.';
        const retryAfter = 60 * 60 * 1000;
        res.status(429).json({
          success: false,
          error: {
            message: msg,
            code: 429,
            retryAfter,
            timestamp: new Date().toISOString(),
          },
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
        handler: (req, res, options) => {
          rateLimitLogger.warn('Slow down limit reached', {
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            path: req.path,
            method: req.method,
          });
          res.status(429).json({
            success: false,
            error: {
              message: 'Too many requests, please try again later.',
              code: 429,
              retryAfter: 15 * 60 * 1000,
              timestamp: new Date().toISOString(),
            },
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
        handler: (req, res, options) => {
          rateLimitLogger.warn('Rate limit reached for API with slow down', {
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            path: req.path,
            method: req.method,
          });
          res.status(429).json({
            success: false,
            error: {
              message: 'Too many requests, please try again later.',
              code: 429,
              retryAfter: 15 * 60 * 1000,
              timestamp: new Date().toISOString(),
            },
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
      handler: (req, res, options) => {
        rateLimitLogger.warn('Rate limit reached for uploads', {
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          path: req.path,
          method: req.method,
        });
        res.status(429).json({
          success: false,
          error: {
            message: 'Too many upload attempts, please try again later.',
            code: 429,
            retryAfter: 60 * 60 * 1000,
            timestamp: new Date().toISOString(),
          },
        });
      },
    });
  }

  /**
   * Search endpoints rate limiting
   * 1000 requests per 15 minutes - higher limit for search
   */
  static search() {
    return rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 1000, // limit each IP to 1000 requests per windowMs
      message: {
        error: 'Too many search requests',
        message: 'Too many search requests from this IP, please try again later.',
        retryAfter: 15 * 60 * 1000,
        timestamp: new Date().toISOString(),
      },
      standardHeaders: true,
      legacyHeaders: false,
      handler: (req, res, options) => {
        rateLimitLogger.warn('Rate limit reached for search endpoints', {
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          path: req.path,
          method: req.method,
        });
        res.status(429).json({
          success: false,
          error: {
            message: 'Too many search requests, please try again later.',
            code: 429,
            retryAfter: 15 * 60 * 1000,
            timestamp: new Date().toISOString(),
          },
        });
      },
    });
  }

  /**
   * User management operations rate limiting
   * 20 requests per 15 minutes for user CRUD operations
   */
  static userManagement() {
    return rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 20, // limit each IP to 20 requests per windowMs
      message: {
        error: 'Too many user management requests',
        message: 'Too many user management requests from this IP, please try again later.',
        retryAfter: 15 * 60 * 1000,
        timestamp: new Date().toISOString(),
      },
      standardHeaders: true,
      legacyHeaders: false,
      handler: (req, res, options) => {
        rateLimitLogger.warn('Rate limit reached for user management', {
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          path: req.path,
          method: req.method,
        });
        res.status(429).json({
          success: false,
          error: {
            message: 'Too many user management requests, please try again later.',
            code: 429,
            retryAfter: 15 * 60 * 1000,
            timestamp: new Date().toISOString(),
          },
        });
      },
    });
  }

  /**
   * User creation rate limiting
   * 5 requests per hour - strict for user creation
   */
  static userCreation() {
    return rateLimit({
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 5, // limit each IP to 5 requests per hour
      message: {
        error: 'Too many user creation attempts',
        message: 'Too many user creation attempts from this IP, please try again later.',
        retryAfter: 60 * 60 * 1000,
        timestamp: new Date().toISOString(),
      },
      standardHeaders: true,
      legacyHeaders: false,
      handler: (req, res, options) => {
        rateLimitLogger.warn('Rate limit reached for user creation', {
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          path: req.path,
          method: req.method,
        });
        res.status(429).json({
          success: false,
          error: {
            message: 'Too many user creation attempts, please try again later.',
            code: 429,
            retryAfter: 60 * 60 * 1000,
            timestamp: new Date().toISOString(),
          },
        });
      },
    });
  }

  /**
   * Password change rate limiting
   * 3 requests per hour - very strict for security operations
   */
  static passwordChange() {
    return rateLimit({
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 3, // limit each IP to 3 requests per hour
      message: {
        error: 'Too many password change attempts',
        message: 'Too many password change attempts from this IP, please try again later.',
        retryAfter: 60 * 60 * 1000,
        timestamp: new Date().toISOString(),
      },
      standardHeaders: true,
      legacyHeaders: false,
      handler: (req, res, options) => {
        rateLimitLogger.warn('Rate limit reached for password changes', {
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          path: req.path,
          method: req.method,
        });
        res.status(429).json({
          success: false,
          error: {
            message: 'Too many password change attempts, please try again later.',
            code: 429,
            retryAfter: 60 * 60 * 1000,
            timestamp: new Date().toISOString(),
          },
        });
      },
    });
  }
}

module.exports = RateLimitMiddleware;
