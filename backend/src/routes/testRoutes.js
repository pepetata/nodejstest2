const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * @route GET /api/v1/test/simple
 * @desc Simple test route
 * @access Public
 */
router.get('/simple', (req, res) => {
  res.json({ success: true, message: 'Simple test route working' });
});

/**
 * @route GET /api/v1/test/auth
 * @desc Test route with auth
 * @access Private
 */
router.get('/auth', authMiddleware, (req, res) => {
  res.json({
    success: true,
    message: 'Auth test route working',
    user: req.user?.id,
  });
});

/**
 * @route GET /api/v1/test/roles
 * @desc Test roles route (copy of user roles)
 * @access Private
 */
router.get('/roles', authMiddleware, (req, res) => {
  try {
    // Simple test response (same as user roles)
    res.json({
      success: true,
      data: [
        { id: 1, name: 'admin', display_name: 'Administrator' },
        { id: 2, name: 'manager', display_name: 'Manager' },
        { id: 3, name: 'staff', display_name: 'Staff' },
      ],
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
