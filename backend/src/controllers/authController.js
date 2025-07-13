const authService = require('../services/authService');
const { logger } = require('../utils/logger');

class AuthController {
  // Returns the current authenticated user (for session rehydration)
  async me(req, res, next) {
    const controllerLogger = logger.child({ controller: 'AuthController', operation: 'me' });
    try {
      // Remove sensitive fields (like password) before sending
      if (!req.user) {
        controllerLogger.warn('No user found in request');
        return res.status(401).json({ error: 'Usuário não autenticado.' });
      }
      const { password, ...userWithoutPassword } = req.user;
      controllerLogger.info('Returning current user', { userId: req.user.id });
      res.status(200).json({ user: userWithoutPassword });
    } catch (error) {
      controllerLogger.error('Failed to get current user', { error: error.message });
      next(error);
    }
  }
  async register(req, res, next) {
    const controllerLogger = logger.child({ controller: 'AuthController', operation: 'register' });
    try {
      const result = await authService.register(req.body);
      controllerLogger.info('User registered', { email: req.body.email });
      res.status(201).json(result);
    } catch (error) {
      controllerLogger.error('Register failed', { error: error.message });
      next(error);
    }
  }

  async login(req, res, next) {
    const controllerLogger = logger.child({ controller: 'AuthController', operation: 'login' });
    try {
      const result = await authService.login(req.body);
      // Reset rate limit counter after successful login (call the singleton instance directly)
      const RateLimitMiddleware = require('../middleware/rateLimitMiddleware');
      const authRateLimiter = RateLimitMiddleware.getAuthRateLimiterInstance();
      if (authRateLimiter && typeof authRateLimiter.resetKey === 'function') {
        controllerLogger.debug('Calling authRateLimiter.resetKey', { ip: req.ip });
        authRateLimiter.resetKey(req.ip);
        controllerLogger.debug('Called authRateLimiter.resetKey', { ip: req.ip });
      }
      controllerLogger.info('User login', { email: req.body.email });
      res.status(200).json(result);
    } catch (error) {
      controllerLogger.error('Login failed', { error: error.message });
      // Handle pending confirmation error specifically
      if (error.code === 'PENDING_CONFIRMATION') {
        return res.status(error.statusCode).json({
          error: error.message,
          code: error.code,
          email: error.email,
        });
      }
      next(error);
    }
  }

  async logout(req, res, next) {
    const controllerLogger = logger.child({ controller: 'AuthController', operation: 'logout' });
    try {
      await authService.logout(req.user.id);
      controllerLogger.info('User logout', { userId: req.user.id });
      res.status(200).json({ message: 'Logged out successfully' });
    } catch (error) {
      controllerLogger.error('Logout failed', { error: error.message });
      next(error);
    }
  }
}

module.exports = new AuthController();
