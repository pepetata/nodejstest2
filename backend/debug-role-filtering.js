// Test to check current user structure and role filtering
console.log('=== Debugging Current User and Role Filtering ===');

// Simulate the current user structure based on backend logs
const currentUser = {
  role: 'restaurant_administrator',
  role_name: 'restaurant_administrator', // This might be different
  is_admin: true,
};

// Simulate roles from database
const roles = [
  { id: 'aeb91604-e30b-4fa4-b36c-d96ad7327f50', name: 'restaurant_administrator' },
  { id: 'def91604-e30b-4fa4-b36c-d96ad7327f51', name: 'location_administrator' },
  { id: '123456789-e30b-4fa4-b36c-d96ad7327f52', name: 'waiter' },
  { id: '987654321-e30b-4fa4-b36c-d96ad7327f53', name: 'manager' },
];

// Test the filtering logic
function getAvailableRoles(currentPairIndex = null) {
  let availableRoles = [];

  console.log('Current user:', currentUser);
  console.log('Current user role_name:', currentUser.role_name);
  console.log('Current user role:', currentUser.role);

  // If current user is superadmin, show all roles except superadmin
  if (currentUser.role_name === 'superadmin') {
    availableRoles = roles.filter((role) => role.name !== 'superadmin');
  }
  // If current user is restaurant_administrator, show restaurant_administrator and below
  else if (currentUser.role_name === 'restaurant_administrator') {
    availableRoles = roles.filter((role) => role.name !== 'superadmin');
    console.log('✅ Matched restaurant_administrator condition');
  }
  // For other roles, show only roles below their level
  else {
    availableRoles = roles.filter(
      (role) => role.name !== 'superadmin' && role.name !== 'restaurant_administrator'
    );
    console.log('❌ Fell through to other roles condition');
  }

  console.log('Available roles after permission filtering:', availableRoles);

  // Filter out already selected roles (except for the current role being edited)
  const formData = {
    role_location_pairs: [
      { role_id: 'aeb91604-e30b-4fa4-b36c-d96ad7327f50', location_ids: ['loc1', 'loc2'] },
    ],
  };

  const selectedRoleIds = formData.role_location_pairs
    .map((pair, index) => (index !== currentPairIndex ? pair.role_id : null))
    .filter(Boolean);

  console.log('Selected role IDs to exclude:', selectedRoleIds);
  console.log('Current pair index:', currentPairIndex);

  const finalRoles = availableRoles.filter((role) => !selectedRoleIds.includes(role.id));
  console.log('Final available roles:', finalRoles);

  return finalRoles;
}

// Test for editing existing role (index 0)
console.log('\n=== Testing for editing existing role (index 0) ===');
const rolesForEdit = getAvailableRoles(0);
console.log(
  'Roles available for editing:',
  rolesForEdit.map((r) => r.name)
);

// Test for adding new role
console.log('\n=== Testing for adding new role ===');
const rolesForNew = getAvailableRoles();
console.log(
  'Roles available for new role:',
  rolesForNew.map((r) => r.name)
);

// Check if restaurant_administrator is available
const hasRestaurantAdmin = rolesForEdit.some((r) => r.name === 'restaurant_administrator');
console.log('Restaurant administrator available for editing:', hasRestaurantAdmin);
