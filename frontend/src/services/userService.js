// userService.js
// Service layer for user API calls
import axios from 'axios';

const API_BASE = '/api/v1/users';

const userService = {
  // Forgot password (request reset link)
  forgotPassword: (email) => axios.post(`${API_BASE}/forgot-password`, { email }),
  // Reset password (with token)
  resetPassword: (token, password) => axios.post(`${API_BASE}/reset-password`, { token, password }),
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
  // Confirm user email
  confirmEmail: (token) => axios.post(`${API_BASE}/confirm-email`, { token }),
  // Resend confirmation email
  resendConfirmation: ({ email, username, token }) => {
    if (email || username) {
      return axios.post(`${API_BASE}/resend-confirmation`, { email, username });
    }
    if (token) {
      return axios.post(`${API_BASE}/resend-confirmation`, { email_confirmation_token: token });
    }
    throw new Error('É necessário informar e-mail ou nome de usuário para reenviar confirmação.');
  },
};

export default userService;
