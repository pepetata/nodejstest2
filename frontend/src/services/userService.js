// userService.js
// Service layer for user API calls
import api from '../utils/api.js';

const API_BASE = '/users';

const userService = {
  // Authentication related
  forgotPassword: (email) => api.post(`${API_BASE}/forgot-password`, { email }),
  resetPassword: (token, password) => api.post(`${API_BASE}/reset-password`, { token, password }),
  login: (credentials) => api.post('/auth/login', credentials),

  // Email confirmation
  confirmEmail: (token) => api.post(`${API_BASE}/confirm-email`, { token }),
  resendConfirmation: ({ email, username, token }) => {
    if (email || username) {
      return api.post(`${API_BASE}/resend-confirmation`, { email, username });
    }
    if (token) {
      return api.post(`${API_BASE}/resend-confirmation`, { email_confirmation_token: token });
    }
    throw new Error('É necessário informar e-mail ou nome de usuário para reenviar confirmação.');
  },

  // User registration (for restaurant creation)
  register: (data) => {
    return api.post(`${API_BASE}/register`, data);
  },

  // Users management (admin functions)

  // Get users with filtering, sorting, and pagination
  getUsers: (params = {}) => {
    const queryParams = new URLSearchParams();

    if (params.search) queryParams.append('search', params.search);
    if (params.role) queryParams.append('role', params.role);
    if (params.location) queryParams.append('location', params.location);
    if (params.status) queryParams.append('status', params.status);
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

    const queryString = queryParams.toString();
    return api.get(`${API_BASE}${queryString ? `?${queryString}` : ''}`);
  },

  // Get user by ID with full details
  getById: (id) => api.get(`${API_BASE}/${id}`),

  // Create new user
  createUser: (userData) => api.post(`${API_BASE}`, userData),

  // Update user
  updateUser: (id, userData) => api.put(`${API_BASE}/${id}`, userData),

  // Toggle user status (activate/deactivate)
  toggleStatus: (id, status) => api.patch(`${API_BASE}/${id}/status`, { status }),

  // Delete user (with dependency check)
  deleteUser: (id) => api.delete(`${API_BASE}/${id}`),

  // Check if user can be deleted (has dependencies)
  checkDependencies: (id) => api.get(`${API_BASE}/${id}/dependencies`),

  // Roles management
  getRoles: () => api.get(`${API_BASE}/roles`),

  // Locations management
  getLocations: () => api.get(`${API_BASE}/locations`),

  // Assign role to user
  assignRole: (userId, roleData) => api.post(`${API_BASE}/${userId}/roles`, roleData),

  // Remove role from user
  removeRole: (userId, roleId) => api.delete(`${API_BASE}/${userId}/roles/${roleId}`),

  // Update user role assignment
  updateRole: (userId, roleId, roleData) =>
    api.put(`${API_BASE}/${userId}/roles/${roleId}`, roleData),

  // Bulk operations
  bulkUpdateStatus: (userIds, status) => api.patch(`${API_BASE}/bulk/status`, { userIds, status }),
  bulkDelete: (userIds) => api.delete(`${API_BASE}/bulk`, { data: { userIds } }),

  // Profile management
  getProfile: () => api.get(`${API_BASE}/profile`),
  updateProfile: (profileData) => api.put(`${API_BASE}/profile`, profileData),

  // Deprecated legacy methods (kept for compatibility)
  getAll: () => api.get(API_BASE),
  create: (data) => api.post(API_BASE, data),
  update: (id, data) => api.put(`${API_BASE}/${id}`, data),
  delete: (id) => api.delete(`${API_BASE}/${id}`),
};

export default userService;
