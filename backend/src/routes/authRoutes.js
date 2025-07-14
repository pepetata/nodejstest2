const express = require('express');
const AuthController = require('../controllers/authController');
const { validateRegistration, validateLogin } = require('../utils/validationUtils');
const authMiddleware = require('../middleware/authMiddleware');
const XSSMiddleware = require('../middleware/xssMiddleware');

const router = express.Router();
const authController = new AuthController();

// Public routes - with specific restaurant data sanitization
router.post(
  '/register',
  XSSMiddleware.sanitizeRestaurantData, // Additional XSS protection for registration
  validateRegistration,
  (req, res, next) => authController.register(req, res, next)
);

router.post('/login', validateLogin, (req, res, next) => authController.login(req, res, next));

// Protected routes

// Get current authenticated user
router.get('/me', authMiddleware, (req, res, next) => authController.me(req, res, next));

router.post('/logout', authMiddleware, (req, res, next) => authController.logout(req, res, next));

module.exports = router;
