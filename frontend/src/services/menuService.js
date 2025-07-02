import api from '../utils/api';

class MenuService {
  async getAllMenuItems() {
    const response = await api.get('/menu');
    return response.data;
  }

  async getMenuItemById(id) {
    const response = await api.get(`/menu/${id}`);
    return response.data;
  }

  async getMenuItemsByCategory(category) {
    const response = await api.get(`/menu?category=${category}`);
    return response.data;
  }

  // Admin-only methods
  async createMenuItem(menuItem) {
    const response = await api.post('/menu', menuItem);
    return response.data;
  }

  async updateMenuItem(id, menuItem) {
    const response = await api.put(`/menu/${id}`, menuItem);
    return response.data;
  }

  async deleteMenuItem(id) {
    const response = await api.delete(`/menu/${id}`);
    return response.data;
  }
}

export default new MenuService();
