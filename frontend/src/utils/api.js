import axios from 'axios';

// Create axios instance with default config
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to add auth token to requests
api.interceptors.request.use(
  (config) => {
    // Read token from both localStorage and sessionStorage
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    console.log('🔑 API Request Interceptor - Token:', token ? 'Present' : 'Missing');
    console.log('🔑 API Request Interceptor - URL:', config.url);
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
      console.log('🔑 API Request Interceptor - Authorization header added');
    } else {
      console.log('🔑 API Request Interceptor - No token found, skipping auth header');
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle common errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle authentication errors
    if (error.response && error.response.status === 401) {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (token) {
        // Only redirect if user was authenticated
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');
        window.location.href = '/login';
      }
      // If no token, just reject so login page can show error
    }
    return Promise.reject(error);
  }
);

export default api;
