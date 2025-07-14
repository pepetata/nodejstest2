// userService.js
// Service layer for user API calls
import api from '../utils/api.js';

const API_BASE = '/users';

const userService = {
  // Forgot password (request reset link)
  forgotPassword: (email) => api.post(`${API_BASE}/forgot-password`, { email }),
  // Reset password (with token)
  resetPassword: (token, password) => api.post(`${API_BASE}/reset-password`, { token, password }),
  // Get all users
  getAll: () => api.get(API_BASE),
  // Get a user by ID
  getById: (id) => api.get(`${API_BASE}/${id}`),
  // Register a new user
  register: (data) => {
    console.log(`register data=`, data);
    return api.post(`${API_BASE}/register`, data);
  },
  // Create a new user
  create: (data) => api.post(API_BASE, data),
  // Update a user
  update: (id, data) => api.put(`${API_BASE}/${id}`, data),
  // Delete a user
  delete: (id) => api.delete(`${API_BASE}/${id}`),
  // Login (if needed)
  login: (credentials) => api.post('/auth/login', credentials),
  // Confirm user email
  confirmEmail: (token) => api.post(`${API_BASE}/confirm-email`, { token }),
  // Resend confirmation email
  resendConfirmation: ({ email, username, token }) => {
    if (email || username) {
      return api.post(`${API_BASE}/resend-confirmation`, { email, username });
    }
    if (token) {
      return api.post(`${API_BASE}/resend-confirmation`, { email_confirmation_token: token });
    }
    throw new Error('É necessário informar e-mail ou nome de usuário para reenviar confirmação.');
  },
};

export default userService;
