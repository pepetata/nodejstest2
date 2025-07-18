// Test script to verify backend database query logic
const path = require('path');

// Mock database result for restaurant_locations query
const mockLocations = [
  { id: 1, name: 'Main Location', is_primary: true },
  { id: 2, name: 'Branch Location', is_primary: false },
  { id: 3, name: 'Third Location', is_primary: false },
];

// Mock role assignment data structure (from Register.jsx)
const mockRoleAssignments = [
  {
    role_name: 'restaurant_administrator',
    is_primary_role: true,
    location_assignments: [
      { location_index: 0, is_primary_location: true },
      { location_index: 1, is_primary_location: false },
      { location_index: 2, is_primary_location: false },
    ],
  },
];

// Function to simulate backend role assignment processing
function processRoleAssignments(restaurantId, userId, roleAssignments, locations) {
  const userRoleInserts = [];

  for (const roleAssignment of roleAssignments) {
    const { role_name, is_primary_role, location_assignments } = roleAssignment;

    for (const locationAssignment of location_assignments) {
      const { location_index, is_primary_location } = locationAssignment;
      const location = locations[location_index];

      if (location) {
        userRoleInserts.push({
          user_id: userId,
          restaurant_id: restaurantId,
          role_name: role_name,
          location_id: location.id,
          is_primary_role: is_primary_role,
          is_primary_location: is_primary_location,
        });
      }
    }
  }

  return userRoleInserts;
}

// Test the processing
console.log('=== BACKEND PROCESSING TEST ===');
console.log('Mock Locations:', JSON.stringify(mockLocations, null, 2));
console.log('Mock Role Assignments:', JSON.stringify(mockRoleAssignments, null, 2));

const userRoleInserts = processRoleAssignments(
  123, // restaurant_id
  456, // user_id
  mockRoleAssignments,
  mockLocations
);

console.log('\n=== GENERATED USER ROLE INSERTS ===');
console.log(JSON.stringify(userRoleInserts, null, 2));

// Verify the structure
console.log('\n=== VERIFICATION ===');
console.log('Should have 3 user role records:', userRoleInserts.length === 3 ? '✅' : '❌');
console.log(
  'First location should be primary:',
  userRoleInserts[0].is_primary_location === true ? '✅' : '❌'
);
console.log(
  'Other locations should not be primary:',
  userRoleInserts[1].is_primary_location === false &&
    userRoleInserts[2].is_primary_location === false
    ? '✅'
    : '❌'
);
console.log(
  'All should have restaurant_administrator role:',
  userRoleInserts.every((r) => r.role_name === 'restaurant_administrator') ? '✅' : '❌'
);
console.log(
  'All should have correct restaurant_id:',
  userRoleInserts.every((r) => r.restaurant_id === 123) ? '✅' : '❌'
);
console.log(
  'All should have correct user_id:',
  userRoleInserts.every((r) => r.user_id === 456) ? '✅' : '❌'
);
console.log(
  'Location IDs should match:',
  userRoleInserts[0].location_id === 1 &&
    userRoleInserts[1].location_id === 2 &&
    userRoleInserts[2].location_id === 3
    ? '✅'
    : '❌'
);

console.log('\n=== SINGLE LOCATION TEST ===');
const singleLocationRoles = [
  {
    role_name: 'restaurant_administrator',
    is_primary_role: true,
    location_assignments: [{ location_index: 0, is_primary_location: true }],
  },
];

const singleLocationInserts = processRoleAssignments(
  123, // restaurant_id
  456, // user_id
  singleLocationRoles,
  [mockLocations[0]] // Only first location
);

console.log('Single location inserts:', JSON.stringify(singleLocationInserts, null, 2));
console.log('Should have 1 user role record:', singleLocationInserts.length === 1 ? '✅' : '❌');
console.log(
  'Should be primary location:',
  singleLocationInserts[0].is_primary_location === true ? '✅' : '❌'
);
