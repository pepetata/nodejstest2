// Comprehensive Authentication Test Script
// This script tests all authentication scenarios to ensure the system works correctly

async function runComprehensiveAuthTest() {
  console.log('🚀 Starting Comprehensive Authentication Test...');
  console.log('='.repeat(50));

  const testResults = [];

  // Helper function to add test results
  const addTestResult = (test, result, details = '') => {
    testResults.push({ test, result, details });
    console.log(`${result ? '✅' : '❌'} ${test} ${details ? '- ' + details : ''}`);
  };

  // Test 1: Clear authentication state
  console.log('\n1. CLEARING AUTHENTICATION STATE');
  try {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('persist:auth');
    localStorage.removeItem('persist:root');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    addTestResult('Clear authentication state', true);
  } catch (error) {
    addTestResult('Clear authentication state', false, error.message);
  }

  // Test 2: Main domain access when unauthenticated
  console.log('\n2. MAIN DOMAIN ACCESS - UNAUTHENTICATED');
  try {
    const currentUrl = window.location.href;
    const isMainDomain = window.location.hostname === 'localhost';
    const showsHomePage = window.location.pathname === '/';

    addTestResult('Main domain access', isMainDomain && showsHomePage, `URL: ${currentUrl}`);

    // Check navbar buttons
    const loginBtn = document.querySelector('button[href="/login"], a[href="/login"]');
    const registerBtn = document.querySelector('button[href="/register"], a[href="/register"]');
    const logoutBtn = document.querySelector('button:contains("Sair do Sistema")');
    const dashboardBtn = document.querySelector('button:contains("Meu Painel")');

    addTestResult('Navbar shows Login button', !!loginBtn);
    addTestResult('Navbar shows Register button', !!registerBtn);
    addTestResult('Navbar does NOT show Logout button', !logoutBtn);
    addTestResult('Navbar does NOT show Dashboard button', !dashboardBtn);
  } catch (error) {
    addTestResult('Main domain access test', false, error.message);
  }

  // Test 3: Simulate authentication for padre4
  console.log('\n3. SIMULATING AUTHENTICATION FOR PADRE4');
  try {
    // Find and click the simulate auth button
    const simulateBtn = document.querySelector('button:contains("Simulate Auth (padre4)")');
    if (simulateBtn) {
      simulateBtn.click();
      addTestResult('Simulate padre4 authentication', true);

      // Wait for state update
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Check if authenticated
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      addTestResult('Token present after simulation', !!token);
    } else {
      addTestResult('Find simulate auth button', false, 'Button not found');
    }
  } catch (error) {
    addTestResult('Simulate authentication', false, error.message);
  }

  // Test 4: Test subdomain access while authenticated
  console.log('\n4. TESTING SUBDOMAIN ACCESS - AUTHENTICATED');

  // Test URLs to check
  const testUrls = [
    { url: 'http://padre4.localhost:3000/admin', expected: 'Admin Dashboard' },
    { url: 'http://padre4.localhost:3000/login', expected: 'Redirect to Admin' },
    { url: 'http://padre4.localhost:3000/', expected: 'Redirect to Admin' },
    { url: 'http://padre2.localhost:3000/admin', expected: 'Redirect to Main Domain' },
    { url: 'http://padre2.localhost:3000/login', expected: 'Redirect to Main Domain' },
    { url: 'http://nonexistent.localhost:3000/', expected: '404 Not Found' },
  ];

  console.log('Test URLs (check manually in browser):');
  testUrls.forEach(({ url, expected }) => {
    console.log(`  ${url} -> Expected: ${expected}`);
  });

  // Test 5: Test logout functionality
  console.log('\n5. TESTING LOGOUT FUNCTIONALITY');
  try {
    // Check if logout button is present when authenticated
    const logoutBtn = document.querySelector('button:contains("Sair do Sistema")');
    addTestResult('Logout button present when authenticated', !!logoutBtn);

    if (logoutBtn) {
      console.log('Click logout button to test modal functionality');
    }
  } catch (error) {
    addTestResult('Logout functionality test', false, error.message);
  }

  // Test Summary
  console.log('\n' + '='.repeat(50));
  console.log('🏁 TEST SUMMARY');
  console.log('='.repeat(50));

  const passed = testResults.filter((r) => r.result).length;
  const failed = testResults.filter((r) => !r.result).length;

  console.log(`Total Tests: ${testResults.length}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Success Rate: ${((passed / testResults.length) * 100).toFixed(1)}%`);

  if (failed > 0) {
    console.log('\n❌ FAILED TESTS:');
    testResults
      .filter((r) => !r.result)
      .forEach(({ test, details }) => {
        console.log(`  - ${test} ${details ? '(' + details + ')' : ''}`);
      });
  }

  console.log('\n📋 MANUAL TEST CHECKLIST:');
  console.log('1. Test each URL in the list above');
  console.log('2. Verify navbar buttons change based on authentication');
  console.log('3. Test logout modal functionality');
  console.log('4. Test cross-restaurant authentication restrictions');
  console.log('5. Test invalid restaurant subdomain (404 page)');

  return testResults;
}

// Run the test
runComprehensiveAuthTest().catch(console.error);
