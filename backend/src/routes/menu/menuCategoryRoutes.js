const express = require('express');
const router = express.Router();
const MenuCategoryController = require('../../controllers/menu/MenuCategoryController');
const { authenticateToken } = require('../../middleware/auth');
const { checkAdminRole } = require('../../middleware/roleCheck');

// Create controller instance
const menuCategoryController = new MenuCategoryController();

// Apply authentication and admin role check to all routes
router.use(authenticateToken);
router.use(checkAdminRole);

/**
 * @route   GET /api/admin/menu/categories
 * @desc    Get all categories for the restaurant
 * @access  Private (Restaurant Admin, Location Admin)
 * @query   language - Language code for primary display (optional)
 */
router.get('/', menuCategoryController.getCategories);

/**
 * @route   GET /api/admin/menu/categories/:id
 * @desc    Get category by ID
 * @access  Private (Restaurant Admin, Location Admin)
 */
router.get('/:id', menuCategoryController.getCategoryById);

/**
 * @route   POST /api/admin/menu/categories
 * @desc    Create new category
 * @access  Private (Restaurant Admin, Location Admin)
 * @body    {
 *           parent_category_id?: string,
 *           display_order?: number,
 *           is_active?: boolean,
 *           translations: {
 *             [language_code]: {
 *               name: string,
 *               description?: string
 *             }
 *           }
 *         }
 */
router.post('/', menuCategoryController.createCategory);

/**
 * @route   PUT /api/admin/menu/categories/:id
 * @desc    Update category
 * @access  Private (Restaurant Admin, Location Admin)
 * @body    {
 *           parent_category_id?: string,
 *           display_order?: number,
 *           is_active?: boolean,
 *           translations?: {
 *             [language_code]: {
 *               name: string,
 *               description?: string
 *             }
 *           }
 *         }
 */
router.put('/:id', menuCategoryController.updateCategory);

/**
 * @route   PUT /api/admin/menu/categories/order
 * @desc    Update display orders for multiple categories
 * @access  Private (Restaurant Admin, Location Admin)
 * @body    {
 *           orderUpdates: [
 *             {
 *               id: string,
 *               display_order: number
 *             }
 *           ]
 *         }
 */
router.put('/order', menuCategoryController.updateDisplayOrders);

/**
 * @route   PATCH /api/admin/menu/categories/:id/status
 * @desc    Toggle category status (active/inactive)
 * @access  Private (Restaurant Admin, Location Admin)
 */
router.patch('/:id/status', menuCategoryController.toggleCategoryStatus);

/**
 * @route   DELETE /api/admin/menu/categories/:id
 * @desc    Delete category (only if no dependencies)
 * @access  Private (Restaurant Admin, Location Admin)
 */
router.delete('/:id', menuCategoryController.deleteCategory);

module.exports = router;
