const express = require('express');
const authController = require('../controllers/authController');
const { validateRegistration, validateLogin } = require('../utils/validationUtils');
const authMiddleware = require('../middleware/authMiddleware');
const XSSMiddleware = require('../middleware/xssMiddleware');

const router = express.Router();

// Public routes - with specific restaurant data sanitization
router.post(
  '/register',
  XSSMiddleware.sanitizeRestaurantData, // Additional XSS protection for registration
  validateRegistration,
  authController.register
);

router.post('/login', validateLogin, authController.login);

// Protected routes
router.post('/logout', authMiddleware, authController.logout);

module.exports = router;
