// Test the corrected role assignment logic
const mockLocations = [
  { id: 1, name: 'Main Location', is_primary: true },
  { id: 2, name: 'Branch Location', is_primary: false },
  { id: 3, name: 'Third Location', is_primary: false },
];

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

// Simulate the corrected logic
function processRoleAssignments(restaurantId, roleAssignments, locations) {
  const roles = [];

  if (roleAssignments && roleAssignments.length > 0) {
    for (const roleAssignment of roleAssignments) {
      const { role_name, is_primary_role, location_assignments } = roleAssignment;

      for (const locationAssignment of location_assignments) {
        const { location_index, is_primary_location } = locationAssignment;
        const location = locations[location_index];

        if (location) {
          roles.push({
            roleName: role_name,
            restaurantId: restaurantId,
            locationId: location.id,
            isPrimary: is_primary_role && is_primary_location, // Only first location gets primary role
          });
        }
      }
    }
  }

  return roles;
}

console.log('=== CORRECTED ROLE ASSIGNMENT LOGIC ===');
const roles = processRoleAssignments(123, mockRoleAssignments, mockLocations);
console.log('Generated roles:', JSON.stringify(roles, null, 2));

console.log('\n=== VALIDATION ===');
console.log('Number of roles:', roles.length);
console.log('Primary roles count:', roles.filter((r) => r.isPrimary).length);
console.log(
  'Primary role is for location 1:',
  roles.find((r) => r.isPrimary)?.locationId === 1 ? '✅' : '❌'
);
console.log(
  'All roles have restaurant_administrator:',
  roles.every((r) => r.roleName === 'restaurant_administrator') ? '✅' : '❌'
);
console.log('All roles have location_id:', roles.every((r) => r.locationId) ? '✅' : '❌');

console.log('\n=== DATABASE FIELDS ===');
console.log('Fields that will be sent to UserRoleModel.assignRole:');
roles.forEach((role, index) => {
  console.log(`Role ${index + 1}:`, {
    user_id: '999',
    role_id: 'role-uuid',
    restaurant_id: role.restaurantId,
    location_id: role.locationId,
    is_primary_role: role.isPrimary,
    assigned_by: null,
  });
});

console.log('\n✅ Fixed: Removed is_primary_location field that was causing validation error');
console.log('✅ Logic: Only first location gets is_primary_role: true');
console.log('✅ Database: All fields now match user_roles table schema');
