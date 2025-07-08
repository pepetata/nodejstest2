// userService.js
// Service layer for user API calls
import axios from 'axios';

const API_BASE = '/api/v1/users';

const userService = {
  // Get all users
  getAll: () => axios.get(API_BASE),

  // Get a user by ID
  getById: (id) => axios.get(`${API_BASE}/${id}`),

  // Register a new user
  register: (data) => {
    console.log(`register data=`, data);
    return axios.post(`${API_BASE}/register`, data);
  },

  // Create a new user
  create: (data) => axios.post(API_BASE, data),

  // Update a user
  update: (id, data) => axios.put(`${API_BASE}/${id}`, data),

  // Delete a user
  delete: (id) => axios.delete(`${API_BASE}/${id}`),

  // Login (if needed)
  login: (credentials) => axios.post('/api/v1/auth/login', credentials),
};

export default userService;
