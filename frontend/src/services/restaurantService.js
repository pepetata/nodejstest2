// restaurantService.js
// Service layer for restaurant API calls
import api from '../utils/api.js';

const API_BASE = '/restaurants';

const restaurantService = {
  // Get all restaurants
  getAll: () => api.get(API_BASE),

  // Get a restaurant by ID
  getById: (id) => api.get(`${API_BASE}/${id}`),

  // Create a new restaurant
  create: (data) => {
    console.log(`service - restaurantPayload=`, data);
    return api.post(API_BASE, data);
  },

  // Update a restaurant
  update: (id, data) => api.put(`${API_BASE}/${id}`, data),

  // Delete a restaurant
  delete: (id) => api.delete(`${API_BASE}/${id}`),

  // Get restaurant locations
  getLocations: (restaurantId) => api.get(`${API_BASE}/${restaurantId}/locations`),

  // Update a specific location
  updateLocation: (restaurantId, locationId, data) =>
    api.put(`${API_BASE}/${restaurantId}/locations/${locationId}`, data),

  // Upload restaurant media (logo, favicon, images, videos)
  uploadMedia: (restaurantId, files, mediaType, locationId = null) => {
    const formData = new FormData();

    // Add files to form data
    if (Array.isArray(files)) {
      files.forEach((file) => {
        formData.append(`files`, file);
      });
    } else {
      formData.append('files', files);
    }

    formData.append('mediaType', mediaType);

    // Add locationId for location-specific media (images/videos)
    if (locationId) {
      formData.append('locationId', locationId);
    }

    return api.post(`${API_BASE}/${restaurantId}/media`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // Get restaurant media
  getMedia: (restaurantId, locationId = null) => {
    const params = locationId ? `?locationId=${locationId}` : '';
    return api.get(`${API_BASE}/${restaurantId}/media${params}`);
  },

  // Delete restaurant media
  deleteMedia: (restaurantId, mediaId, mediaType) =>
    api.delete(`${API_BASE}/${restaurantId}/media/${mediaId}?type=${mediaType}`),

  // Check if URL name is available
  checkUrlAvailability: (urlName) => api.get(`${API_BASE}/check-url/${urlName}`),

  // Get restaurant by URL name
  getByUrlName: (urlName) => api.get(`${API_BASE}/by-url/${urlName}`),

  // Get restaurant statistics
  getStats: (id) => api.get(`${API_BASE}/${id}/stats`),

  // Get restaurant menu categories
  getMenuCategories: (id) => api.get(`${API_BASE}/${id}/menu/categories`),

  // Get restaurant menu items
  getMenuItems: (id) => api.get(`${API_BASE}/${id}/menu/items`),
};

export default restaurantService;
