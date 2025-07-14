// Quick authentication setup for testing
// Run this in the browser console at http://localhost:3001

// Set the authentication token with the correct restaurant ID
const token =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI3NzBlODQwMC1lMjliLTQxZDQtYTcxNi00NDY2NTU0NDAwMDEiLCJlbWFpbCI6ImFkbWluQHBpenphcmlhYmVsbGF2aXN0YS5jb20uYnIiLCJyZXN0YXVyYW50SWQiOiJkNmI2NWM3NC0zYjllLTQ2MmItYmM4ZC1lODE1M2ZiNjQwN2UiLCJpYXQiOjE3NTI0OTY5OTQsImV4cCI6MTc1MjU4MzM5NH0.FnSe8-bd-_q-z68KNDeSAL4isHyiqohJGKTUBRmxBIM';

localStorage.setItem('token', token);
console.log('✅ Authentication token set successfully!');
console.log('✅ Token includes restaurant ID: d6b65c74-3b9e-462b-bc8d-e8153fb6407e');
console.log('You can now test the restaurant profile editing functionality.');
console.log('Navigate to the Admin Restaurant Profile page and try editing the data.');

// Optional: Also set it in sessionStorage for completeness
sessionStorage.setItem('token', token);

// Reload the page to apply the authentication
location.reload();
