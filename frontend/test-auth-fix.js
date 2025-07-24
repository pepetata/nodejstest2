// Test script to verify authentication fixes
// Run this in the browser console at http://localhost:3000

console.log('🔧 Testing Authentication Fixes...\n');

// Function to clear all auth data
function clearAuth() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('rememberMe');
  localStorage.removeItem('persist:auth');
  localStorage.removeItem('persist:root');
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('user');
  console.log('✅ All authentication data cleared');
}

// Function to check current auth state
function checkAuthState() {
  console.log('\n📊 Current Authentication State:');
  console.log('localStorage token:', localStorage.getItem('token') ? 'Present' : 'Missing');
  console.log('sessionStorage token:', sessionStorage.getItem('token') ? 'Present' : 'Missing');
  console.log('localStorage rememberMe:', localStorage.getItem('rememberMe') || 'Not set');

  // Try to access Redux store if available
  if (window.__REDUX_DEVTOOLS_EXTENSION__ && window.store) {
    const state = window.store.getState();
    console.log('Redux auth state:', {
      user: !!state.auth.user,
      token: !!state.auth.token,
      restaurant: !!state.auth.restaurant,
      rememberMe: state.auth.rememberMe,
      status: state.auth.status,
    });
  }
}

// Function to simulate login with remember me
function simulateLogin(rememberMe = false) {
  console.log(`\n🔑 Simulating login with rememberMe=${rememberMe}...`);

  // This simulates what happens after a successful login
  const mockToken =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ0ZXN0LXVzZXItaWQiLCJlbWFpbCI6InRlc3RAdGVzdC5jb20iLCJpYXQiOjE2MzI0MzA0MDB9.test-signature';

  if (rememberMe) {
    localStorage.setItem('rememberMe', 'true');
    localStorage.setItem('token', mockToken);
    sessionStorage.removeItem('token');
  } else {
    localStorage.setItem('rememberMe', 'false');
    sessionStorage.setItem('token', mockToken);
    localStorage.removeItem('token');
  }

  console.log(`✅ Token stored in ${rememberMe ? 'localStorage' : 'sessionStorage'}`);
  checkAuthState();
}

// Function to test page refresh behavior
function testPageRefresh() {
  console.log('\n🔄 To test page refresh behavior:');
  console.log('1. Call simulateLogin(true) for remember me test');
  console.log('2. Call simulateLogin(false) for session-only test');
  console.log('3. Refresh the page (F5) and see if auth state persists');
  console.log('4. Open new tab to http://localhost:3000 and check auth state');
}

// Function to test subdomain behavior
function testSubdomain() {
  console.log('\n🌐 To test subdomain behavior:');
  console.log('1. Login with remember me enabled');
  console.log('2. Navigate to a restaurant subdomain (e.g., padre4.localhost:3000)');
  console.log('3. Navigate back to main domain (localhost:3000)');
  console.log('4. Check if authentication persists');
}

// Export functions globally for easy access
window.testAuth = {
  clearAuth,
  checkAuthState,
  simulateLogin,
  testPageRefresh,
  testSubdomain,
};

// Initial state check
checkAuthState();

console.log('\n📝 Available test functions:');
console.log('- testAuth.clearAuth() - Clear all auth data');
console.log('- testAuth.checkAuthState() - Check current auth state');
console.log('- testAuth.simulateLogin(rememberMe) - Simulate login');
console.log('- testAuth.testPageRefresh() - Show page refresh test instructions');
console.log('- testAuth.testSubdomain() - Show subdomain test instructions');

console.log('\n🏁 Authentication fix testing script loaded!');
