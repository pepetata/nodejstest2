const express = require('express');
const { body } = require('express-validator');
const MenuItemController = require('../controllers/menuItemController');
const authMiddleware = require('../middleware/authMiddleware');
const { requireRestaurantAccess } = require('../middleware/restaurantAuth');

const router = express.Router();

// Validation middleware
const validateMenuItem = [
  body('base_price')
    .isFloat({ min: 0 })
    .withMessage('Preço base deve ser um número válido maior que zero'),
  body('preparation_time_minutes')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Tempo de preparo deve ser um número inteiro positivo'),
  body('translations').isArray({ min: 1 }).withMessage('Pelo menos uma tradução é obrigatória'),
  body('translations.*.language_code').notEmpty().withMessage('Código do idioma é obrigatório'),
  body('translations.*.name')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Nome é obrigatório e deve ter no máximo 255 caracteres'),
  body('translations.*.description')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Descrição é obrigatória'),
  body('category_ids').optional().isArray().withMessage('IDs das categorias devem ser um array'),
  body('category_ids.*').optional().isUUID().withMessage('ID da categoria deve ser um UUID válido'),
];

// Routes

// GET /api/restaurants/:restaurantId/menu-categories - Get all menu categories for restaurant
router.get(
  '/restaurants/:restaurantId/menu-categories',
  authMiddleware,
  requireRestaurantAccess,
  MenuItemController.getMenuCategories
);

// GET /api/restaurants/:restaurantId/menu-items - Get all menu items for restaurant
router.get(
  '/restaurants/:restaurantId/menu-items',
  authMiddleware,
  requireRestaurantAccess,
  MenuItemController.getMenuItems
);

// GET /api/menu-items/:id - Get single menu item
router.get('/menu-items/:id', authMiddleware, MenuItemController.getMenuItem);

// POST /api/menu-items - Create new menu item
router.post('/menu-items', authMiddleware, validateMenuItem, MenuItemController.createMenuItem);

// PUT /api/menu-items/:id - Update menu item
router.put('/menu-items/:id', authMiddleware, validateMenuItem, MenuItemController.updateMenuItem);

// DELETE /api/menu-items/:id - Delete menu item
router.delete('/menu-items/:id', authMiddleware, MenuItemController.deleteMenuItem);

// PATCH /api/menu-items/:id/toggle-availability - Toggle menu item availability
router.patch(
  '/menu-items/:id/toggle-availability',
  authMiddleware,
  MenuItemController.toggleAvailability
);

// GET /api/categories/:categoryId/menu-items - Get menu items by category
router.get(
  '/categories/:categoryId/menu-items',
  authMiddleware,
  MenuItemController.getItemsByCategory
);

module.exports = router;
