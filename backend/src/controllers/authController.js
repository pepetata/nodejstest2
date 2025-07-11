const authService = require('../services/authService');
const { logger } = require('../utils/logger');

class AuthController {
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
      controllerLogger.info('User login', { email: req.body.email });
      res.status(200).json(result);
    } catch (error) {
      controllerLogger.error('Login failed', { error: error.message });
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
