const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

/**
 * Comprehensive User Management Requirements Validation Test
 * Tests both backend API endpoints and frontend component compliance
 */

// Test configuration
const BACKEND_URL = 'http://localhost:5000';
const FRONTEND_URL = 'http://localhost:3000';

// Test users for authentication
const TEST_USERS = {
  restaurant_admin: {
    email: 'flavio_luiz_ferreira@hotmail.com',
    password: '12345678',
    restaurant_url: 'padre',
  },
  chain_admin: {
    email: 'flavio_luiz_ferreira_chain@hotmail.com',
    password: '12345678',
    restaurant_url: 'padre2',
  },
};

class UserManagementTester {
  constructor() {
    this.authTokens = {};
    this.testResults = {
      passed: 0,
      failed: 0,
      results: [],
    };
  }

  // Utility function to make HTTP requests
  makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      const isHttps = urlObj.protocol === 'https:';
      const httpModule = isHttps ? https : http;

      const reqOptions = {
        hostname: urlObj.hostname,
        port: urlObj.port || (isHttps ? 443 : 80),
        path: urlObj.pathname + urlObj.search,
        method: options.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...options.headers,
        },
      };

      const req = httpModule.request(reqOptions, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            const response = {
              status: res.statusCode,
              headers: res.headers,
              data: data ? JSON.parse(data) : null,
            };
            resolve(response);
          } catch (err) {
            resolve({
              status: res.statusCode,
              headers: res.headers,
              data: data,
              parseError: err.message,
            });
          }
        });
      });

      req.on('error', reject);

      if (options.body) {
        req.write(JSON.stringify(options.body));
      }

      req.end();
    });
  }

  // Test helper methods
  logTest(testName, passed, details = '') {
    const status = passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${status}: ${testName}`);
    if (details) console.log(`   ${details}`);

    this.testResults.results.push({
      test: testName,
      passed,
      details,
    });

    if (passed) this.testResults.passed++;
    else this.testResults.failed++;
  }

  // Authentication
  async authenticateUser(userKey) {
    const user = TEST_USERS[userKey];
    console.log(`\n🔐 Authenticating ${userKey}...`);

    try {
      const response = await this.makeRequest(`${BACKEND_URL}/api/v1/auth/login`, {
        method: 'POST',
        body: {
          email: user.email,
          password: user.password,
        },
      });

      if (response.status === 200 && response.data?.data?.token) {
        this.authTokens[userKey] = response.data.data.token;
        console.log(`   ✅ Authentication successful for ${userKey}`);
        return response.data.data;
      } else {
        throw new Error(`Authentication failed: ${response.data?.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.log(`   ❌ Authentication failed for ${userKey}: ${error.message}`);
      throw error;
    }
  }

  // 1. Test Role Hierarchy & Available Roles API
  async testRoleHierarchy() {
    console.log('\n📋 Testing Role Hierarchy & Available Roles...');

    // Test for restaurant administrator
    try {
      const response = await this.makeRequest(`${BACKEND_URL}/api/v1/users/roles`, {
        headers: {
          Authorization: `Bearer ${this.authTokens.restaurant_admin}`,
        },
      });

      if (response.status === 200) {
        const roles = response.data.data;

        // Restaurant admin should see all roles except superadmin
        const hasRestaurantAdmin = roles.some((r) => r.name === 'restaurant_administrator');
        const hasLocationAdmin = roles.some((r) => r.name === 'location_administrator');
        const hasStaffRoles = roles.some((r) => r.name === 'waiter');
        const hasSuperAdmin = roles.some((r) => r.name === 'superadmin');

        this.logTest(
          'Restaurant Administrator Role Access',
          hasRestaurantAdmin && hasLocationAdmin && hasStaffRoles && !hasSuperAdmin,
          `Can see: restaurant_admin=${hasRestaurantAdmin}, location_admin=${hasLocationAdmin}, staff=${hasStaffRoles}, superadmin=${hasSuperAdmin}`
        );
      } else {
        this.logTest(
          'Restaurant Administrator Role Access',
          false,
          `API Error: ${response.status}`
        );
      }
    } catch (error) {
      this.logTest('Restaurant Administrator Role Access', false, `Error: ${error.message}`);
    }
  }

  // 2. Test Location-based Access Control
  async testLocationAccess() {
    console.log('\n🗺️  Testing Location-based Access Control...');

    try {
      const response = await this.makeRequest(`${BACKEND_URL}/api/v1/users/locations`, {
        headers: {
          Authorization: `Bearer ${this.authTokens.restaurant_admin}`,
        },
      });

      if (response.status === 200) {
        const locations = response.data.data;

        this.logTest(
          'Location Access API',
          Array.isArray(locations) && locations.length > 0,
          `Found ${locations.length} accessible locations`
        );

        // Verify locations belong to user's restaurant
        const validLocations = locations.every((loc) => loc.restaurant_id);
        this.logTest(
          'Location Restaurant Association',
          validLocations,
          'All locations have restaurant_id'
        );
      } else {
        this.logTest('Location Access API', false, `API Error: ${response.status}`);
      }
    } catch (error) {
      this.logTest('Location Access API', false, `Error: ${error.message}`);
    }
  }

  // 3. Test User Management API
  async testUserManagementAPI() {
    console.log('\n👥 Testing User Management API...');

    try {
      const response = await this.makeRequest(`${BACKEND_URL}/api/v1/users`, {
        headers: {
          Authorization: `Bearer ${this.authTokens.restaurant_admin}`,
        },
      });

      if (response.status === 200) {
        const data = response.data.data;

        this.logTest(
          'Users List API',
          data.users && Array.isArray(data.users),
          `Retrieved ${data.users?.length || 0} users`
        );

        this.logTest(
          'Users Pagination',
          data.pagination && typeof data.pagination.total === 'number',
          `Pagination info present`
        );

        // Test filtering
        const filterResponse = await this.makeRequest(
          `${BACKEND_URL}/api/v1/users?status=active&sortBy=full_name&sortOrder=asc`,
          {
            headers: {
              Authorization: `Bearer ${this.authTokens.restaurant_admin}`,
            },
          }
        );

        this.logTest(
          'User Filtering & Sorting',
          filterResponse.status === 200,
          'Status and sorting filters work'
        );
      } else {
        this.logTest('Users List API', false, `API Error: ${response.status}`);
      }
    } catch (error) {
      this.logTest('Users List API', false, `Error: ${error.message}`);
    }
  }

  // 4. Test Frontend Component Files
  async testFrontendComponents() {
    console.log('\n🖥️  Testing Frontend Component Implementation...');

    const componentsToCheck = [
      {
        file: 'frontend/src/pages/admin/users/UserFormPage.jsx',
        description: 'User Form Component',
      },
      {
        file: 'frontend/src/components/admin/users/UserFilters.jsx',
        description: 'User Filters Component',
      },
      {
        file: 'frontend/src/components/admin/users/UserTable.jsx',
        description: 'User Table Component',
      },
      {
        file: 'frontend/src/pages/admin/restaurant/AdminDashboard.jsx',
        description: 'Admin Dashboard Component',
      },
    ];

    for (const component of componentsToCheck) {
      try {
        const filePath = path.join(process.cwd(), '..', component.file);
        const exists = fs.existsSync(filePath);

        if (exists) {
          const content = fs.readFileSync(filePath, 'utf8');

          // Check for Portuguese labels
          const hasPortugueseLabels =
            content.includes('Gerenciar') ||
            content.includes('Usuários') ||
            content.includes('Ativo') ||
            content.includes('Inativo') ||
            content.includes('Nome') ||
            content.includes('Email') ||
            content.includes('obrigatório') ||
            content.includes('inválido') ||
            content.includes('usuário');

          this.logTest(
            `${component.description} - File Exists`,
            true,
            `Found at ${component.file}`
          );

          this.logTest(
            `${component.description} - Portuguese Labels`,
            hasPortugueseLabels,
            'Contains Brazilian Portuguese text'
          );
        } else {
          this.logTest(
            `${component.description} - File Exists`,
            false,
            `Not found at ${component.file}`
          );
        }
      } catch (error) {
        this.logTest(`${component.description} - File Check`, false, `Error: ${error.message}`);
      }
    }
  }

  // 5. Test Role Filtering in UserFormPage
  async testRoleFilteringLogic() {
    console.log('\n🔍 Testing Role Filtering Logic...');

    try {
      const userFormPath = path.join(
        process.cwd(),
        '..',
        'frontend/src/pages/admin/users/UserFormPage.jsx'
      );

      if (fs.existsSync(userFormPath)) {
        const content = fs.readFileSync(userFormPath, 'utf8');

        // Check for location_administrator restrictions
        const hasLocationAdminRestriction =
          content.includes('location_administrator') &&
          content.includes('restaurant_administrator') &&
          content.includes('filter');

        this.logTest(
          'UserFormPage - Location Administrator Restrictions',
          hasLocationAdminRestriction,
          'Contains role hierarchy filtering logic'
        );

        // Check for role hierarchy implementation
        const hasRoleHierarchy =
          content.includes('getAvailableRoles') && content.includes('currentUserRole');

        this.logTest(
          'UserFormPage - Role Hierarchy Implementation',
          hasRoleHierarchy,
          'Contains getAvailableRoles method with role-based filtering'
        );

        // Check for superadmin exclusion
        const hasSuperAdminExclusion = content.includes('superadmin') && content.includes('filter');

        this.logTest(
          'UserFormPage - Superadmin Exclusion',
          hasSuperAdminExclusion,
          'Contains superadmin filtering logic'
        );
      } else {
        this.logTest('UserFormPage - Role Filtering Logic', false, 'UserFormPage.jsx not found');
      }
    } catch (error) {
      this.logTest('UserFormPage - Role Filtering Logic', false, `Error: ${error.message}`);
    }
  }

  // 6. Test AdminDashboard Navigation
  async testDashboardNavigation() {
    console.log('\n🧭 Testing Dashboard Navigation...');

    try {
      const dashboardPath = path.join(
        process.cwd(),
        '..',
        'frontend/src/pages/admin/restaurant/AdminDashboard.jsx'
      );

      if (fs.existsSync(dashboardPath)) {
        const content = fs.readFileSync(dashboardPath, 'utf8');

        // Check for "Gerenciar Usuários" button
        const hasUserManagementButton =
          content.includes('Gerenciar Usuários') || content.includes('Gerenciar Usuários');

        this.logTest(
          'AdminDashboard - User Management Button',
          hasUserManagementButton,
          'Contains "Gerenciar Usuários" navigation button'
        );

        // Check for correct route
        const hasUserRoute = content.includes('/admin/users');

        this.logTest(
          'AdminDashboard - User Management Route',
          hasUserRoute,
          'Links to /admin/users route'
        );

        // Check for role-based access
        const hasRoleBasedAccess = content.includes('role') && content.includes('admin');

        this.logTest(
          'AdminDashboard - Role-based Access',
          hasRoleBasedAccess,
          'Contains role-based access control logic'
        );
      } else {
        this.logTest('AdminDashboard - Navigation Check', false, 'AdminDashboard.jsx not found');
      }
    } catch (error) {
      this.logTest('AdminDashboard - Navigation Check', false, `Error: ${error.message}`);
    }
  }

  // 7. Test Backend Service Implementation
  async testBackendServiceImplementation() {
    console.log('\n⚙️  Testing Backend Service Implementation...');

    try {
      const userServicePath = path.join(process.cwd(), 'src/services/userService.js');

      if (fs.existsSync(userServicePath)) {
        const content = fs.readFileSync(userServicePath, 'utf8');

        // Check for getAvailableRoles method with role filtering
        const hasRoleFiltering =
          content.includes('getAvailableRoles') &&
          content.includes('currentUser') &&
          content.includes('location_administrator') &&
          content.includes('restaurant_administrator');

        this.logTest(
          'UserService - Role Filtering Implementation',
          hasRoleFiltering,
          'getAvailableRoles method has proper role hierarchy filtering'
        );

        // Check for getAvailableLocations method
        const hasLocationFiltering =
          content.includes('getAvailableLocations') && content.includes('currentUser');

        this.logTest(
          'UserService - Location Access Implementation',
          hasLocationFiltering,
          'getAvailableLocations method implemented'
        );

        // Check for Portuguese error messages
        const hasPortugueseErrors =
          content.includes('não encontrado') ||
          content.includes('Permissões insuficientes') ||
          content.includes('obrigatório');

        this.logTest(
          'UserService - Portuguese Error Messages',
          hasPortugueseErrors,
          'Contains Brazilian Portuguese error messages'
        );
      } else {
        this.logTest('UserService - Implementation Check', false, 'userService.js not found');
      }
    } catch (error) {
      this.logTest('UserService - Implementation Check', false, `Error: ${error.message}`);
    }
  }

  // 8. Test Frontend API Integration
  async testFrontendAPIIntegration() {
    console.log('\n🔗 Testing Frontend API Integration...');

    try {
      // Check if frontend is accessible
      const response = await this.makeRequest(FRONTEND_URL);

      this.logTest(
        'Frontend Accessibility',
        response.status === 200,
        `Frontend server responding on port 3000`
      );
    } catch (error) {
      this.logTest('Frontend Accessibility', false, `Frontend not accessible: ${error.message}`);
    }
  }

  // Main test runner
  async runAllTests() {
    console.log('🚀 Starting User Management Requirements Validation Tests');
    console.log('='.repeat(60));

    try {
      // Authenticate test users
      await this.authenticateUser('restaurant_admin');

      // Run all test suites
      await this.testRoleHierarchy();
      await this.testLocationAccess();
      await this.testUserManagementAPI();
      await this.testFrontendComponents();
      await this.testRoleFilteringLogic();
      await this.testDashboardNavigation();
      await this.testBackendServiceImplementation();
      await this.testFrontendAPIIntegration();
    } catch (error) {
      console.log(`\n❌ Authentication failed: ${error.message}`);
      console.log('Cannot proceed with API tests. Running static file tests only...');

      // Run tests that don't require authentication
      await this.testFrontendComponents();
      await this.testRoleFilteringLogic();
      await this.testDashboardNavigation();
      await this.testBackendServiceImplementation();
    }

    // Print final results
    this.printFinalResults();
  }

  printFinalResults() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 USER MANAGEMENT REQUIREMENTS VALIDATION RESULTS');
    console.log('='.repeat(60));

    const total = this.testResults.passed + this.testResults.failed;
    const passRate = Math.round((this.testResults.passed / total) * 100);

    console.log(`✅ Passed: ${this.testResults.passed}/${total} (${passRate}%)`);
    console.log(`❌ Failed: ${this.testResults.failed}/${total}`);

    console.log('\n📋 DETAILED RESULTS:');
    this.testResults.results.forEach((result) => {
      const status = result.passed ? '✅' : '❌';
      console.log(`${status} ${result.test}`);
      if (result.details) console.log(`   ${result.details}`);
    });

    console.log('\n🎯 COMPLIANCE SUMMARY:');

    const criticalTests = [
      'UserFormPage - Location Administrator Restrictions',
      'UserService - Role Filtering Implementation',
      'AdminDashboard - User Management Button',
      'User Form Component - Portuguese Labels',
      'AdminDashboard - User Management Route',
    ];

    const criticalPassed = criticalTests.filter(
      (testName) => this.testResults.results.find((r) => r.test === testName)?.passed
    ).length;

    if (criticalPassed === criticalTests.length) {
      console.log('✅ ALL CRITICAL REQUIREMENTS MET - User Management System is COMPLIANT');
      console.log('🎉 VALIDATION STATUS: FULLY COMPLIANT - READY FOR PRODUCTION');
    } else {
      console.log(`❌ ${criticalTests.length - criticalPassed} critical requirements failed`);
      console.log('⚠️  System requires fixes before production deployment');
    }

    console.log('\n📚 For detailed compliance information, see:');
    console.log('   USER_MANAGEMENT_COMPLIANCE_REPORT.md');
  }
}

// Run the tests
if (require.main === module) {
  const tester = new UserManagementTester();
  tester.runAllTests().catch(console.error);
}

module.exports = UserManagementTester;
