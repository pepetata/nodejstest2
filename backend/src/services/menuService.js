const menuItemModel = require('../models/menuItemModel');

class MenuService {
  async getAllMenuItems() {
    return await menuItemModel.findAll();
  }

  async getMenuItemById(id) {
    const menuItem = await menuItemModel.findById(id);
    if (!menuItem) {
      throw new Error('Menu item not found');
    }
    return menuItem;
  }

  async createMenuItem(menuItemData) {
    const { name, description, price, category, image, isAvailable } = menuItemData;

    return await menuItemModel.create({
      name,
      description,
      price,
      category,
      image,
      isAvailable: isAvailable !== undefined ? isAvailable : true,
    });
  }

  async updateMenuItem(id, updateData) {
    const menuItem = await menuItemModel.findById(id);
    if (!menuItem) {
      throw new Error('Menu item not found');
    }

    return await menuItemModel.update(id, updateData);
  }

  async deleteMenuItem(id) {
    const menuItem = await menuItemModel.findById(id);
    if (!menuItem) {
      throw new Error('Menu item not found');
    }

    return await menuItemModel.delete(id);
  }
}

module.exports = new MenuService();
