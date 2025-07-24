const MenuCategoryModel = require('../../models/menu/MenuCategoryModel');
const { logger } = require('../../utils/logger');

/**
 * Menu Category Controller
 * Handles all CRUD operations for menu categories
 */
class MenuCategoryController {
  constructor() {
    this.model = new MenuCategoryModel();
    this.logger = logger.child({ controller: 'MenuCategoryController' });
  }

  /**
   * Create a new category
   * POST /api/menu/categories
   */
  async create(req, res) {
    try {
      const categoryData = {
        ...req.body,
        restaurant_id: req.params.restaurant_id || req.user.restaurant_id,
        created_by: req.user.id,
      };

      const category = await this.model.create(categoryData);

      this.logger.info('Category created successfully', {
        categoryId: category.id,
        userId: req.user.id,
        restaurantId: categoryData.restaurant_id,
      });

      res.status(201).json({
        success: true,
        message: 'Categoria criada com sucesso',
        data: category,
      });
    } catch (error) {
      this.logger.error('Error creating category:', error);

      if (error.message.includes('Validation error')) {
        return res.status(400).json({
          success: false,
          message: 'Dados de entrada inválidos',
          error: error.message,
        });
      }

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message,
      });
    }
  }

  /**
   * Get all categories for a restaurant
   * GET /api/menu/categories
   */
  async getAll(req, res) {
    try {
      const restaurantId = req.params.restaurant_id || req.user.restaurant_id;
      const languageId = req.query.language_id ? parseInt(req.query.language_id, 10) : null;
      const includeHierarchy = req.query.hierarchy === 'true';

      let categories;

      if (includeHierarchy) {
        categories = await this.model.getHierarchy(restaurantId, languageId);
      } else {
        categories = await this.model.findByRestaurantWithTranslations(restaurantId, languageId);
      }

      res.json({
        success: true,
        data: categories,
        meta: {
          total: Array.isArray(categories) ? categories.length : 0,
          includeHierarchy,
          languageId,
        },
      });
    } catch (error) {
      this.logger.error('Error fetching categories:', error);

      res.status(500).json({
        success: false,
        message: 'Erro ao buscar categorias',
        error: error.message,
      });
    }
  }

  /**
   * Get a single category by ID
   * GET /api/menu/categories/:id
   */
  async getById(req, res) {
    try {
      const categoryId = parseInt(req.params.id, 10);

      if (isNaN(categoryId)) {
        return res.status(400).json({
          success: false,
          message: 'ID da categoria inválido',
        });
      }

      const category = await this.model.findByIdWithTranslations(categoryId);

      if (!category) {
        return res.status(404).json({
          success: false,
          message: 'Categoria não encontrada',
        });
      }

      // Check if user has access to this category's restaurant
      const restaurantId = req.params.restaurant_id || req.user.restaurant_id;
      if (category.restaurant_id !== restaurantId) {
        return res.status(403).json({
          success: false,
          message: 'Acesso negado à categoria',
        });
      }

      res.json({
        success: true,
        data: category,
      });
    } catch (error) {
      this.logger.error('Error fetching category:', error);

      res.status(500).json({
        success: false,
        message: 'Erro ao buscar categoria',
        error: error.message,
      });
    }
  }

  /**
   * Update a category
   * PUT /api/menu/categories/:id
   */
  async update(req, res) {
    try {
      const categoryId = parseInt(req.params.id, 10);

      if (isNaN(categoryId)) {
        return res.status(400).json({
          success: false,
          message: 'ID da categoria inválido',
        });
      }

      // Check if category exists and user has access
      const existingCategory = await this.model.findByIdWithTranslations(categoryId);
      if (!existingCategory) {
        return res.status(404).json({
          success: false,
          message: 'Categoria não encontrada',
        });
      }

      const restaurantId = req.params.restaurant_id || req.user.restaurant_id;
      if (existingCategory.restaurant_id !== restaurantId) {
        return res.status(403).json({
          success: false,
          message: 'Acesso negado à categoria',
        });
      }

      const updateData = {
        ...req.body,
        updated_by: req.user.id,
      };

      const updatedCategory = await this.model.update(categoryId, updateData);

      this.logger.info('Category updated successfully', {
        categoryId,
        userId: req.user.id,
        restaurantId,
      });

      res.json({
        success: true,
        message: 'Categoria atualizada com sucesso',
        data: updatedCategory,
      });
    } catch (error) {
      this.logger.error('Error updating category:', error);

      if (error.message.includes('Validation error')) {
        return res.status(400).json({
          success: false,
          message: 'Dados de entrada inválidos',
          error: error.message,
        });
      }

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message,
      });
    }
  }

  /**
   * Update display order for multiple categories
   * PUT /api/menu/categories/display-order
   */
  async updateDisplayOrder(req, res) {
    try {
      const { categories } = req.body;

      if (!Array.isArray(categories) || categories.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Lista de categorias é obrigatória',
        });
      }

      // Validate category order data
      for (const cat of categories) {
        if (!cat.id || typeof cat.display_order !== 'number') {
          return res.status(400).json({
            success: false,
            message: 'Dados de ordenação inválidos',
          });
        }
      }

      await this.model.updateDisplayOrder(categories);

      this.logger.info('Category display order updated', {
        categoriesCount: categories.length,
        userId: req.user.id,
      });

      res.json({
        success: true,
        message: 'Ordem de exibição atualizada com sucesso',
      });
    } catch (error) {
      this.logger.error('Error updating category display order:', error);

      res.status(500).json({
        success: false,
        message: 'Erro ao atualizar ordem de exibição',
        error: error.message,
      });
    }
  }

  /**
   * Check if a category can be deleted
   * GET /api/menu/categories/:id/can-delete
   */
  async canDelete(req, res) {
    try {
      const categoryId = parseInt(req.params.id, 10);

      if (isNaN(categoryId)) {
        return res.status(400).json({
          success: false,
          message: 'ID da categoria inválido',
        });
      }

      // Check if category exists and user has access
      const category = await this.model.findByIdWithTranslations(categoryId);
      if (!category) {
        return res.status(404).json({
          success: false,
          message: 'Categoria não encontrada',
        });
      }

      const restaurantId = req.params.restaurant_id || req.user.restaurant_id;
      if (category.restaurant_id !== restaurantId) {
        return res.status(403).json({
          success: false,
          message: 'Acesso negado à categoria',
        });
      }

      const deleteInfo = await this.model.canDelete(categoryId);

      res.json({
        success: true,
        data: deleteInfo,
      });
    } catch (error) {
      this.logger.error('Error checking if category can be deleted:', error);

      res.status(500).json({
        success: false,
        message: 'Erro ao verificar se categoria pode ser removida',
        error: error.message,
      });
    }
  }

  /**
   * Delete a category
   * DELETE /api/menu/categories/:id
   */
  async delete(req, res) {
    try {
      const categoryId = parseInt(req.params.id, 10);

      if (isNaN(categoryId)) {
        return res.status(400).json({
          success: false,
          message: 'ID da categoria inválido',
        });
      }

      // Check if category exists and user has access
      const category = await this.model.findByIdWithTranslations(categoryId);
      if (!category) {
        return res.status(404).json({
          success: false,
          message: 'Categoria não encontrada',
        });
      }

      const restaurantId = req.params.restaurant_id || req.user.restaurant_id;
      if (category.restaurant_id !== restaurantId) {
        return res.status(403).json({
          success: false,
          message: 'Acesso negado à categoria',
        });
      }

      const deletedCategory = await this.model.delete(categoryId);

      this.logger.info('Category deleted successfully', {
        categoryId,
        userId: req.user.id,
        restaurantId,
      });

      res.json({
        success: true,
        message: 'Categoria removida com sucesso',
        data: deletedCategory,
      });
    } catch (error) {
      this.logger.error('Error deleting category:', error);

      if (error.message.includes('Cannot delete category')) {
        return res.status(400).json({
          success: false,
          message: 'Não é possível remover categoria com itens ou subcategorias',
          error: error.message,
        });
      }

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message,
      });
    }
  }

  /**
   * Get category hierarchy
   * GET /api/menu/categories/hierarchy
   */
  async getHierarchy(req, res) {
    try {
      const restaurantId = req.params.restaurant_id || req.user.restaurant_id;
      const languageId = req.query.language_id ? parseInt(req.query.language_id, 10) : null;

      const hierarchy = await this.model.getHierarchy(restaurantId, languageId);

      res.json({
        success: true,
        data: hierarchy,
        meta: {
          languageId,
          total: hierarchy.length,
        },
      });
    } catch (error) {
      this.logger.error('Error fetching category hierarchy:', error);

      res.status(500).json({
        success: false,
        message: 'Erro ao buscar hierarquia de categorias',
        error: error.message,
      });
    }
  }
}

module.exports = MenuCategoryController;
