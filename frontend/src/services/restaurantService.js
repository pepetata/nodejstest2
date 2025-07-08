// restaurantService.js
// Service layer for restaurant API calls
import axios from 'axios';

const API_BASE = '/api/v1/restaurants';

const restaurantService = {
  // Get all restaurants
  getAll: () => axios.get(API_BASE),

  // Get a restaurant by ID
  getById: (id) => axios.get(`${API_BASE}/${id}`),

  // Create a new restaurant
  create: (data) => {
    console.log(`service - restaurantPayload=`, data);
    return axios.post(API_BASE, data);
  },

  // Update a restaurant
  update: (id, data) => axios.put(`${API_BASE}/${id}`, data),

  // Delete a restaurant
  delete: (id) => axios.delete(`${API_BASE}/${id}`),
};

export default restaurantService;
