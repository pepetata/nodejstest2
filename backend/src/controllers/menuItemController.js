const MenuItemModel = require('../models/menuItemModel');
const MenuCategoryModel = require('../models/menu/MenuCategoryModel');
const authMiddleware = require('../middleware/authMiddleware');
const { requireRestaurantAccess } = require('../middleware/restaurantAuth');
const { validationResult } = require('express-validator');

class MenuItemController {
  // Get all menu items for a restaurant
  static async getMenuItems(req, res) {
    try {
      const { restaurantId } = req.params;
      const { language = 'pt-BR', search, category_id } = req.query;

      // Verify user has access to this restaurant
      if (!req.user.restaurant_id || req.user.restaurant_id !== restaurantId) {
        return res.status(403).json({
          success: false,
          message: 'Acesso negado a este restaurante',
        });
      }

      let items;

      if (search || category_id) {
        items = await MenuItemModel.search(restaurantId, search, category_id, language);
      } else {
        items = await MenuItemModel.getByRestaurant(restaurantId, language);
      }

      res.json({
        success: true,
        data: items,
      });
    } catch (error) {
      console.error('Error fetching menu items:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor ao buscar itens do cardápio',
      });
    }
  }

  // Get single menu item by ID
  static async getMenuItem(req, res) {
    try {
      const { id } = req.params;

      const item = await MenuItemModel.getById(id);

      if (!item) {
        return res.status(404).json({
          success: false,
          message: 'Item do cardápio não encontrado',
        });
      }

      // Verify user has access to this restaurant
      if (!req.user.restaurant_id || req.user.restaurant_id !== item.restaurant_id) {
        return res.status(403).json({
          success: false,
          message: 'Acesso negado a este restaurante',
        });
      }

      res.json({
        success: true,
        data: item,
      });
    } catch (error) {
      console.error('Error fetching menu item:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor ao buscar item do cardápio',
      });
    }
  }

  // Get all menu categories for a restaurant
  static async getMenuCategories(req, res) {
    try {
      const { restaurantId } = req.params;

      // Verify user has access to this restaurant
      if (!req.user.restaurant_id || req.user.restaurant_id !== restaurantId) {
        return res.status(403).json({
          success: false,
          message: 'Acesso negado a este restaurante',
        });
      }

      const categories = await MenuCategoryModel.getByRestaurant(restaurantId);

      res.json({
        success: true,
        data: categories,
      });
    } catch (error) {
      console.error('Error fetching menu categories:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor ao buscar categorias do cardápio',
      });
    }
  }

  // Create new menu item
  static async createMenuItem(req, res) {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Dados inválidos',
          errors: errors.array(),
        });
      }

      const {
        sku,
        base_price,
        preparation_time_minutes,
        is_available = true,
        is_featured = false,
        display_order = 0,
        translations,
        category_ids = [],
      } = req.body;

      const restaurantId = req.user.restaurant_id;

      // Validate that we have at least one translation
      if (!translations || translations.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Pelo menos uma tradução é obrigatória',
        });
      }

      // Validate required fields in translations
      for (const translation of translations) {
        if (!translation.name || !translation.description) {
          return res.status(400).json({
            success: false,
            message: 'Nome e descrição são obrigatórios para todas as traduções',
          });
        }
      }

      // Validate categories exist and belong to the restaurant
      if (category_ids.length > 0) {
        for (const categoryId of category_ids) {
          const category = await MenuCategoryModel.getById(categoryId);
          if (!category || category.restaurant_id !== restaurantId) {
            return res.status(400).json({
              success: false,
              message: 'Uma ou mais categorias são inválidas',
            });
          }
        }
      }

      const itemData = {
        restaurant_id: restaurantId,
        sku,
        base_price,
        preparation_time_minutes,
        is_available,
        is_featured,
        display_order,
      };

      const newItem = await MenuItemModel.create(itemData, translations, category_ids);

      res.status(201).json({
        success: true,
        message: 'Item do cardápio criado com sucesso',
        data: newItem,
      });
    } catch (error) {
      console.error('Error creating menu item:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor ao criar item do cardápio',
      });
    }
  }

  // Update menu item
  static async updateMenuItem(req, res) {
    try {
      const { id } = req.params;

      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Dados inválidos',
          errors: errors.array(),
        });
      }

      // Check if item exists and user has access
      const existingItem = await MenuItemModel.getById(id);
      if (!existingItem) {
        return res.status(404).json({
          success: false,
          message: 'Item do cardápio não encontrado',
        });
      }

      if (!req.user.restaurant_id || req.user.restaurant_id !== existingItem.restaurant_id) {
        return res.status(403).json({
          success: false,
          message: 'Acesso negado a este restaurante',
        });
      }

      const {
        sku,
        base_price,
        preparation_time_minutes,
        is_available,
        is_featured,
        display_order,
        translations,
        category_ids = [],
      } = req.body;

      // Validate that we have at least one translation
      if (!translations || translations.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Pelo menos uma tradução é obrigatória',
        });
      }

      // Validate required fields in translations
      for (const translation of translations) {
        if (!translation.name || !translation.description) {
          return res.status(400).json({
            success: false,
            message: 'Nome e descrição são obrigatórios para todas as traduções',
          });
        }
      }

      // Validate categories exist and belong to the restaurant
      if (category_ids.length > 0) {
        for (const categoryId of category_ids) {
          const category = await MenuCategoryModel.getById(categoryId);
          if (!category || category.restaurant_id !== existingItem.restaurant_id) {
            return res.status(400).json({
              success: false,
              message: 'Uma ou mais categorias são inválidas',
            });
          }
        }
      }

      const itemData = {
        sku,
        base_price,
        preparation_time_minutes,
        is_available,
        is_featured,
        display_order,
      };

      const updatedItem = await MenuItemModel.update(id, itemData, translations, category_ids);

      res.json({
        success: true,
        message: 'Item do cardápio atualizado com sucesso',
        data: updatedItem,
      });
    } catch (error) {
      console.error('Error updating menu item:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor ao atualizar item do cardápio',
      });
    }
  }

  // Delete menu item
  static async deleteMenuItem(req, res) {
    try {
      const { id } = req.params;

      // Check if item exists and user has access
      const existingItem = await MenuItemModel.getById(id);
      if (!existingItem) {
        return res.status(404).json({
          success: false,
          message: 'Item do cardápio não encontrado',
        });
      }

      if (!req.user.restaurant_id || req.user.restaurant_id !== existingItem.restaurant_id) {
        return res.status(403).json({
          success: false,
          message: 'Acesso negado a este restaurante',
        });
      }

      await MenuItemModel.delete(id);

      res.json({
        success: true,
        message: 'Item do cardápio excluído com sucesso',
      });
    } catch (error) {
      console.error('Error deleting menu item:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor ao excluir item do cardápio',
      });
    }
  }

  // Toggle item availability
  static async toggleAvailability(req, res) {
    try {
      const { id } = req.params;

      // Check if item exists and user has access
      const existingItem = await MenuItemModel.getById(id);
      if (!existingItem) {
        return res.status(404).json({
          success: false,
          message: 'Item do cardápio não encontrado',
        });
      }

      if (!req.user.restaurant_id || req.user.restaurant_id !== existingItem.restaurant_id) {
        return res.status(403).json({
          success: false,
          message: 'Acesso negado a este restaurante',
        });
      }

      const updatedItem = await MenuItemModel.toggleAvailability(id);

      res.json({
        success: true,
        message: `Item ${updatedItem.is_available ? 'habilitado' : 'desabilitado'} com sucesso`,
        data: updatedItem,
      });
    } catch (error) {
      console.error('Error toggling item availability:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor ao alterar disponibilidade do item',
      });
    }
  }

  // Get items by category
  static async getItemsByCategory(req, res) {
    try {
      const { categoryId } = req.params;
      const { language = 'pt-BR' } = req.query;

      // Verify category exists and user has access
      const category = await MenuCategoryModel.getById(categoryId);
      if (!category) {
        return res.status(404).json({
          success: false,
          message: 'Categoria não encontrada',
        });
      }

      if (!req.user.restaurant_id || req.user.restaurant_id !== category.restaurant_id) {
        return res.status(403).json({
          success: false,
          message: 'Acesso negado a este restaurante',
        });
      }

      const items = await MenuItemModel.getByCategory(categoryId, language);

      res.json({
        success: true,
        data: items,
      });
    } catch (error) {
      console.error('Error fetching items by category:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor ao buscar itens da categoria',
      });
    }
  }
}

module.exports = MenuItemController;
