const express = require('express');
const menuController = require('../../controllers/menu/menuController');
const authMiddleware = require('../../middleware/authMiddleware');
const { validateMenuItem } = require('../../utils/validationUtils');

const router = express.Router();

// Public routes
router.get('/', menuController.getAllMenuItems);
router.get('/:id', menuController.getMenuItemById);

// Protected routes (admin only)
router.post('/', authMiddleware, validateMenuItem, menuController.createMenuItem);
router.put('/:id', authMiddleware, validateMenuItem, menuController.updateMenuItem);
router.delete('/:id', authMiddleware, menuController.deleteMenuItem);

module.exports = router;
