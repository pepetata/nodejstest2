const express = require('express');
const MenuCategoryController = require('../../controllers/menu/MenuCategoryController');
const authMiddleware = require('../../middleware/authMiddleware');

const router = express.Router();
const categoryController = new MenuCategoryController();

/**
 * Menu Category Routes
 * All routes require authentication
 */

// Apply authentication to all routes
router.use(authMiddleware);

/**
 * @route   GET /api/menu/categories
 * @desc    Get all categories for the authenticated user's restaurant
 * @access  Private (restaurant_administrator, location_administrator)
 * @query   language_id - Optional: Filter translations by language ID
 * @query   hierarchy - Optional: Return hierarchical structure if true
 */
router.get('/', categoryController.getAll.bind(categoryController));

/**
 * @route   GET /api/menu/categories/hierarchy
 * @desc    Get category hierarchy for the authenticated user's restaurant
 * @access  Private (restaurant_administrator, location_administrator)
 * @query   language_id - Optional: Filter translations by language ID
 */
router.get('/hierarchy', categoryController.getHierarchy.bind(categoryController));

/**
 * @route   POST /api/menu/categories
 * @desc    Create a new category
 * @access  Private (restaurant_administrator, location_administrator)
 * @body    {
 *            parent_category_id?: number,
 *            display_order?: number,
 *            status?: 'active' | 'inactive',
 *            translations: [{
 *              language_id: number,
 *              name: string,
 *              description?: string
 *            }]
 *          }
 */
router.post('/', categoryController.create.bind(categoryController));

/**
 * @route   PUT /api/menu/categories/display-order
 * @desc    Update display order for multiple categories
 * @access  Private (restaurant_administrator, location_administrator)
 * @body    {
 *            categories: [{
 *              id: number,
 *              display_order: number
 *            }]
 *          }
 */
router.put('/display-order', categoryController.updateDisplayOrder.bind(categoryController));

/**
 * @route   GET /api/menu/categories/:id
 * @desc    Get a single category by ID
 * @access  Private (restaurant_administrator, location_administrator)
 * @param   id - Category ID
 */
router.get('/:id', categoryController.getById.bind(categoryController));

/**
 * @route   GET /api/menu/categories/:id/can-delete
 * @desc    Check if a category can be deleted
 * @access  Private (restaurant_administrator, location_administrator)
 * @param   id - Category ID
 */
router.get('/:id/can-delete', categoryController.canDelete.bind(categoryController));

/**
 * @route   PUT /api/menu/categories/:id
 * @desc    Update a category
 * @access  Private (restaurant_administrator, location_administrator)
 * @param   id - Category ID
 * @body    {
 *            parent_category_id?: number,
 *            display_order?: number,
 *            status?: 'active' | 'inactive',
 *            translations?: [{
 *              language_id: number,
 *              name: string,
 *              description?: string
 *            }]
 *          }
 */
router.put('/:id', categoryController.update.bind(categoryController));

/**
 * @route   DELETE /api/menu/categories/:id
 * @desc    Delete a category
 * @access  Private (restaurant_administrator, location_administrator)
 * @param   id - Category ID
 * @note    Category must not have any menu items or subcategories
 */
router.delete('/:id', categoryController.delete.bind(categoryController));

module.exports = router;
