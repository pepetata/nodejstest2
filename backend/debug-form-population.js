// Debug form population
console.log('=== Debugging Form Population ===');

// Sample data from the API (based on logs)
const foundUser = {
  role_location_pairs: [
    {
      role_id: 'aeb91604-e30b-4fa4-b36c-d96ad7327f50',
      location_id: '684a5fdb-57c5-400f-b4e6-802d044c74b5',
      role_name: 'restaurant_administrator',
      location_name: 'Localização 2',
    },
    {
      role_id: 'aeb91604-e30b-4fa4-b36c-d96ad7327f50',
      location_id: 'ce105616-c754-4693-b309-b1c9eb1d3218',
      role_name: 'restaurant_administrator',
      location_name: 'Localização Principal',
    },
  ],
};

// Sample roles from the database
const roles = [
  { id: 'aeb91604-e30b-4fa4-b36c-d96ad7327f50', name: 'restaurant_administrator' },
  { id: 'other-role-id', name: 'waiter' },
];

// Test the form population logic
const role_location_pairs =
  foundUser.role_location_pairs?.length > 0
    ? foundUser.role_location_pairs.reduce((acc, pair) => {
        // Group by role_id and collect location_ids
        const existingRole = acc.find((item) => item.role_id === pair.role_id?.toString());
        if (existingRole) {
          existingRole.location_ids.push(pair.location_id?.toString());
        } else {
          acc.push({
            role_id: pair.role_id?.toString() || '',
            location_ids: [pair.location_id?.toString() || ''],
          });
        }
        return acc;
      }, [])
    : [{ role_id: '', location_ids: [] }];

console.log('Original role_location_pairs:', foundUser.role_location_pairs);
console.log('Processed role_location_pairs:', role_location_pairs);

// Test if the role_id matches the dropdown options
const firstRoleId = role_location_pairs[0].role_id;
const matchingRole = roles.find((r) => r.id === firstRoleId);

console.log('First role_id:', firstRoleId);
console.log('Matching role in dropdown:', matchingRole);
console.log('Role match found:', !!matchingRole);
