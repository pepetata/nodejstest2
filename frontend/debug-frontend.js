// Test script to check frontend auth state
// Run this in the browser console when on the frontend app

console.log('🔍 Checking frontend authentication state...');

// Check if token exists
const token = localStorage.getItem('token') || sessionStorage.getItem('token');
console.log('🔑 Token in storage:', token ? 'Present' : 'Missing');

if (token) {
  console.log('🔑 Token value:', token);

  // Try to decode JWT payload (just for debugging)
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    console.log('🔑 Token payload:', payload);

    // Check if token is expired
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) {
      console.log('❌ Token is expired!');
    } else {
      console.log('✅ Token is valid');
    }
  } catch (e) {
    console.log('❌ Could not decode token:', e.message);
  }
}

// Check Redux store state
if (window.__REDUX_DEVTOOLS_EXTENSION__ && window.store) {
  console.log('🔍 Redux store state:');
  console.log('Auth state:', window.store.getState().auth);
  console.log('Restaurant state:', window.store.getState().restaurant);
} else {
  console.log('ℹ️  Redux DevTools not available or store not accessible');
}

// Check current URL
console.log('🔍 Current URL:', window.location.href);

// Check if we're on the media tab
console.log('🔍 Current path:', window.location.pathname);

// Test making API call manually
if (token) {
  console.log('🔍 Testing API call manually...');

  fetch('/api/v1/restaurants/8181755a-6312-4835-b6cd-8e0c3fb30b0c/media', {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  })
    .then((response) => {
      console.log('✅ API Response Status:', response.status);
      return response.json();
    })
    .then((data) => {
      console.log('✅ API Response Data:', data);
    })
    .catch((error) => {
      console.error('❌ API Error:', error);
    });
}

console.log('📋 Copy this script and run it in the browser console on the frontend app');
