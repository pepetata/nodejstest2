const menuService = require('../services/menuService');

class MenuController {
  async getAllMenuItems(req, res, next) {
    try {
      const menuItems = await menuService.getAllMenuItems();
      res.status(200).json(menuItems);
    } catch (error) {
      next(error);
    }
  }

  async getMenuItemById(req, res, next) {
    try {
      const menuItem = await menuService.getMenuItemById(req.params.id);
      res.status(200).json(menuItem);
    } catch (error) {
      next(error);
    }
  }

  async createMenuItem(req, res, next) {
    try {
      const menuItem = await menuService.createMenuItem(req.body);
      res.status(201).json(menuItem);
    } catch (error) {
      next(error);
    }
  }

  async updateMenuItem(req, res, next) {
    try {
      const menuItem = await menuService.updateMenuItem(req.params.id, req.body);
      res.status(200).json(menuItem);
    } catch (error) {
      next(error);
    }
  }

  async deleteMenuItem(req, res, next) {
    try {
      await menuService.deleteMenuItem(req.params.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new MenuController();
