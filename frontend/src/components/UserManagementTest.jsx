import React, { useState, useEffect } from 'react';
import api from '../utils/api';

/**
 * Test Component for User Management Enhancement
 * This component tests the new role assignment functionality
 */
const UserManagementTest = () => {
  const [testResults, setTestResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [locations, setLocations] = useState([]);
  const [roles, setRoles] = useState([]);

  // Add test result
  const addResult = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setTestResults((prev) => [...prev, { message, type, timestamp }]);
  };

  // Fetch locations
  const fetchLocations = async () => {
    try {
      addResult('🔍 Fetching locations...', 'info');
      const response = await api.get('/admin/locations');

      if (response.data.success) {
        const fetchedLocations = response.data.data;
        setLocations(fetchedLocations);
        addResult(`✅ Found ${fetchedLocations.length} location(s)`, 'success');

        fetchedLocations.forEach((location, index) => {
          addResult(`   ${index + 1}. ${location.name} (ID: ${location.id})`, 'info');
        });

        return fetchedLocations;
      }
    } catch (error) {
      addResult(
        `❌ Failed to fetch locations: ${error.response?.data?.message || error.message}`,
        'error'
      );
      throw error;
    }
  };

  // Fetch roles
  const fetchRoles = async () => {
    try {
      addResult('🔍 Fetching roles...', 'info');
      const response = await api.get('/admin/roles');

      if (response.data.success) {
        const fetchedRoles = response.data.data;
        setRoles(fetchedRoles);
        addResult(`✅ Found ${fetchedRoles.length} role(s)`, 'success');

        fetchedRoles.forEach((role, index) => {
          addResult(`   ${index + 1}. ${role.name} (ID: ${role.id})`, 'info');
        });

        return fetchedRoles;
      }
    } catch (error) {
      addResult(
        `❌ Failed to fetch roles: ${error.response?.data?.message || error.message}`,
        'error'
      );
      throw error;
    }
  };

  // Test single location user creation
  const testSingleLocationUser = async () => {
    try {
      if (locations.length !== 1) {
        addResult(
          '⚠️ Current restaurant has multiple locations, skipping single location test',
          'warning'
        );
        return;
      }

      addResult('🧪 Testing Single Location Mode - Multiple Roles...', 'info');

      const selectedRoles = roles.slice(0, Math.min(3, roles.length));
      const singleLocationId = locations[0].id;

      const testUserData = {
        full_name: `Test User Single ${Date.now()}`,
        email: `testuser.single.${Date.now()}@example.com`,
        username: `testuser_single_${Date.now()}`,
        password: '12345678',
        phone: '(11) 99999-9999',
        whatsapp: '(11) 98888-8888',
        role_location_pairs: selectedRoles.map((role) => ({
          role_id: role.id,
          location_id: singleLocationId,
        })),
      };

      addResult(
        `   Assigning ${selectedRoles.length} roles to location: ${locations[0].name}`,
        'info'
      );
      selectedRoles.forEach((role) => {
        addResult(`   - ${role.name}`, 'info');
      });

      const response = await api.post('/admin/users', testUserData);

      if (response.data.success) {
        addResult('✅ Single location user created successfully!', 'success');
        addResult(`   User ID: ${response.data.data.id}`, 'info');
        addResult(`   Name: ${response.data.data.full_name}`, 'info');

        if (response.data.data.role_location_pairs) {
          addResult('   Role Assignments:', 'info');
          response.data.data.role_location_pairs.forEach((pair, index) => {
            const role = roles.find((r) => r.id === pair.role_id);
            const location = locations.find((l) => l.id === pair.location_id);
            addResult(`   ${index + 1}. ${role?.name} at ${location?.name}`, 'info');
          });
        }
      }
    } catch (error) {
      addResult(
        `❌ Single location user creation failed: ${error.response?.data?.message || error.message}`,
        'error'
      );
      if (error.response?.data?.details) {
        addResult(`   Details: ${JSON.stringify(error.response.data.details, null, 2)}`, 'error');
      }
    }
  };

  // Test multi-location user creation
  const testMultiLocationUser = async () => {
    try {
      if (locations.length < 2) {
        addResult(
          '⚠️ Current restaurant has only one location, testing single role per location',
          'warning'
        );
      }

      addResult('🧪 Testing Multi-Location Mode - Role-Location Pairs...', 'info');

      const testUserData = {
        full_name: `Test User Multi ${Date.now()}`,
        email: `testuser.multi.${Date.now()}@example.com`,
        username: `testuser_multi_${Date.now()}`,
        password: '12345678',
        phone: '(11) 99999-9999',
        whatsapp: '(11) 98888-8888',
        role_location_pairs: [],
      };

      if (locations.length >= 2) {
        // Assign different roles to different locations
        testUserData.role_location_pairs = [
          {
            role_id: roles[0]?.id,
            location_id: locations[0]?.id,
          },
          {
            role_id: roles[1]?.id || roles[0]?.id,
            location_id: locations[1]?.id,
          },
        ];
      } else {
        // Single location but test role-location pair format
        testUserData.role_location_pairs = [
          {
            role_id: roles[0]?.id,
            location_id: locations[0]?.id,
          },
        ];
      }

      addResult('   Role-Location Pairs:', 'info');
      testUserData.role_location_pairs.forEach((pair, index) => {
        const role = roles.find((r) => r.id === pair.role_id);
        const location = locations.find((l) => l.id === pair.location_id);
        addResult(`   ${index + 1}. ${role?.name} at ${location?.name}`, 'info');
      });

      const response = await api.post('/admin/users', testUserData);

      if (response.data.success) {
        addResult('✅ Multi-location user created successfully!', 'success');
        addResult(`   User ID: ${response.data.data.id}`, 'info');
        addResult(`   Name: ${response.data.data.full_name}`, 'info');

        if (response.data.data.role_location_pairs) {
          addResult('   Role Assignments:', 'info');
          response.data.data.role_location_pairs.forEach((pair, index) => {
            const role = roles.find((r) => r.id === pair.role_id);
            const location = locations.find((l) => l.id === pair.location_id);
            addResult(`   ${index + 1}. ${role?.name} at ${location?.name}`, 'info');
          });
        }
      }
    } catch (error) {
      addResult(
        `❌ Multi-location user creation failed: ${error.response?.data?.message || error.message}`,
        'error'
      );
      if (error.response?.data?.details) {
        addResult(`   Details: ${JSON.stringify(error.response.data.details, null, 2)}`, 'error');
      }
    }
  };

  // Run all tests
  const runAllTests = async () => {
    setIsLoading(true);
    setTestResults([]);

    try {
      addResult('🚀 Starting User Management Enhancement Tests', 'info');
      addResult('='.repeat(50), 'info');

      await fetchLocations();
      await fetchRoles();

      addResult('', 'info'); // Empty line
      await testSingleLocationUser();

      addResult('', 'info'); // Empty line
      await testMultiLocationUser();

      addResult('', 'info'); // Empty line
      addResult('🎉 All tests completed!', 'success');
    } catch (error) {
      addResult(`💥 Test suite failed: ${error.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Clear results
  const clearResults = () => {
    setTestResults([]);
  };

  const getResultColor = (type) => {
    switch (type) {
      case 'success':
        return '#28a745';
      case 'error':
        return '#dc3545';
      case 'warning':
        return '#ffc107';
      default:
        return '#6c757d';
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h2>🧪 User Management Enhancement Test</h2>
      <p>This component tests the new single location role assignment functionality.</p>

      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={runAllTests}
          disabled={isLoading}
          style={{
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '5px',
            marginRight: '10px',
            cursor: isLoading ? 'not-allowed' : 'pointer',
          }}
        >
          {isLoading ? '🔄 Running Tests...' : '🚀 Run All Tests'}
        </button>

        <button
          onClick={clearResults}
          style={{
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '5px',
            cursor: 'pointer',
          }}
        >
          🗑️ Clear Results
        </button>
      </div>

      <div
        style={{
          backgroundColor: '#f8f9fa',
          border: '1px solid #dee2e6',
          borderRadius: '5px',
          padding: '15px',
          minHeight: '400px',
          maxHeight: '600px',
          overflowY: 'auto',
          fontFamily: 'monospace',
          fontSize: '14px',
        }}
      >
        {testResults.length === 0 ? (
          <div style={{ color: '#6c757d', textAlign: 'center', marginTop: '50px' }}>
            Click "Run All Tests" to start testing the user management enhancement
          </div>
        ) : (
          testResults.map((result, index) => (
            <div
              key={index}
              style={{
                color: getResultColor(result.type),
                marginBottom: '5px',
                lineHeight: '1.4',
              }}
            >
              <span style={{ color: '#6c757d', fontSize: '12px' }}>[{result.timestamp}]</span>{' '}
              {result.message}
            </div>
          ))
        )}
      </div>

      <div style={{ marginTop: '20px', fontSize: '14px', color: '#6c757d' }}>
        <p>
          <strong>Test Overview:</strong>
        </p>
        <ul>
          <li>
            🏢 <strong>Current Restaurant:</strong>{' '}
            {locations.length === 1 ? 'Single Location' : `${locations.length} Locations`}
          </li>
          <li>
            📍 <strong>Locations:</strong> {locations.map((l) => l.name).join(', ')}
          </li>
          <li>
            👥 <strong>Available Roles:</strong> {roles.length} roles loaded
          </li>
        </ul>
      </div>
    </div>
  );
};

export default UserManagementTest;
