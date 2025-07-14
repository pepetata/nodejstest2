// DEBUG SCRIPT - Run this in browser console at http://localhost:3001
// This will help us identify the authentication issue

console.log('🔍 DEBUGGING AUTHENTICATION ISSUE...\n');

// 1. Check if token is stored
const localToken = localStorage.getItem('token');
const sessionToken = sessionStorage.getItem('token');

console.log('1. TOKEN STORAGE CHECK:');
console.log(
  'localStorage token:',
  localToken ? 'EXISTS (' + localToken.substring(0, 20) + '...)' : 'NOT FOUND'
);
console.log(
  'sessionStorage token:',
  sessionToken ? 'EXISTS (' + sessionToken.substring(0, 20) + '...)' : 'NOT FOUND'
);

// 2. Check API base URL configuration
console.log('\n2. API CONFIGURATION CHECK:');
console.log(
  'VITE_API_BASE_URL:',
  import.meta.env.VITE_API_BASE_URL || 'NOT SET (using default /api/v1)'
);

// 3. Set the correct token
const correctToken =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI3NzBlODQwMC1lMjliLTQxZDQtYTcxNi00NDY2NTU0NDAwMDEiLCJlbWFpbCI6ImFkbWluQHBpenphcmlhYmVsbGF2aXN0YS5jb20uYnIiLCJyZXN0YXVyYW50SWQiOiJkNmI2NWM3NC0zYjllLTQ2MmItYmM4ZC1lODE1M2ZiNjQwN2UiLCJpYXQiOjE3NTI0OTY5OTQsImV4cCI6MTc1MjU4MzM5NH0.FnSe8-bd-_q-z68KNDeSAL4isHyiqohJGKTUBRmxBIM';

console.log('\n3. SETTING CORRECT TOKEN:');
localStorage.setItem('token', correctToken);
sessionStorage.setItem('token', correctToken);
console.log('✅ Token set in both localStorage and sessionStorage');

// 4. Test API call manually
console.log('\n4. TESTING API CALL:');

// Create a test axios instance to verify the interceptor
import axios from 'axios';

const testAPI = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add the same interceptor logic
testAPI.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
      console.log('🔑 Authorization header added:', `Bearer ${token.substring(0, 20)}...`);
    } else {
      console.log('❌ No token found for authorization header');
    }
    console.log('📤 Request config:', {
      url: config.url,
      baseURL: config.baseURL,
      method: config.method,
      headers: config.headers,
    });
    return config;
  },
  (error) => {
    console.log('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Test the actual restaurant endpoint
console.log('Testing GET request to restaurant profile...');
testAPI
  .get('/restaurants/d6b65c74-3b9e-462b-bc8d-e8153fb6407e')
  .then((response) => {
    console.log('✅ GET request successful:', response.status, response.data);
  })
  .catch((error) => {
    console.log(
      '❌ GET request failed:',
      error.response?.status,
      error.response?.data || error.message
    );
    console.log('Full error:', error);
  });

console.log('\n🔄 Reloading page to apply changes...');
setTimeout(() => {
  location.reload();
}, 2000);
