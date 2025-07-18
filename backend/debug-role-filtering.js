// Debug the role filtering issue
const fetch = require('node-fetch');

async function debugRoleFiltering() {
  try {
    // Login first
    const loginResponse = await fetch('http://localhost:5000/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'flavio_luiz_ferreira_chain@hotmail.com',
        password: '12345678',
      }),
    });

    const loginData = await loginResponse.json();
    const token = loginData.token;
    const headers = { Authorization: `Bearer ${token}` };

    // Get roles data
    const rolesResponse = await fetch('http://localhost:5000/api/v1/users/roles', { headers });
    const rolesData = await rolesResponse.json();
    const allRoles = rolesData.data || rolesData;

    console.log('=== ALL AVAILABLE ROLES ===');
    allRoles.forEach((role, index) => {
      console.log(
        `${index + 1}. Role ID: ${role.id}, Name: ${role.name}, Display: ${role.display_name}`
      );
    });

    // Get users data
    const usersResponse = await fetch('http://localhost:5000/api/v1/users', { headers });
    const usersData = await usersResponse.json();
    const targetUser = usersData.data?.find(
      (user) => user.id === 'be833b40-af07-4f51-8be0-761eb7c0e64d'
    );

    console.log('\n=== USER ROLE ASSIGNMENTS ===');
    targetUser.role_location_pairs.forEach((pair, index) => {
      console.log(`${index + 1}. Role ID: ${pair.role_id}, Role Name: ${pair.role_name}`);
    });

    // Process the data like the frontend does
    const processedRoles = targetUser.role_location_pairs.reduce((acc, pair) => {
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
    }, []);

    console.log('\n=== PROCESSED ROLE GROUPS ===');
    processedRoles.forEach((group, index) => {
      const matchingRole = allRoles.find((r) => r.id === group.role_id);
      console.log(`Perfil ${index + 1}:`);
      console.log(`  Role ID: ${group.role_id}`);
      console.log(`  Role Name: ${matchingRole?.name || 'NOT FOUND'}`);
      console.log(`  Display Name: ${matchingRole?.display_name || 'NOT FOUND'}`);
      console.log(`  Location IDs: ${group.location_ids.join(', ')}`);
    });

    // Simulate getAvailableRoles for each role group
    console.log('\n=== AVAILABLE ROLES FOR EACH GROUP ===');
    processedRoles.forEach((group, index) => {
      console.log(
        `\nFor Perfil ${index + 1} (current role: ${allRoles.find((r) => r.id === group.role_id)?.name}):`
      );

      // Filter roles like the frontend does
      const currentUserRole = 'restaurant_administrator'; // From auth
      let availableRoles = [];

      if (currentUserRole === 'restaurant_administrator') {
        availableRoles = allRoles.filter((role) => role.name !== 'superadmin');
      }

      // Filter out already selected roles (except current)
      const selectedRoleIds = processedRoles
        .map((pair, pairIndex) => (pairIndex !== index ? pair.role_id : null))
        .filter(Boolean);

      const finalRoles = availableRoles.filter((role) => !selectedRoleIds.includes(role.id));

      console.log(`  Available roles: ${finalRoles.map((r) => r.name).join(', ')}`);
      console.log(
        `  Selected roles to exclude: ${selectedRoleIds.map((id) => allRoles.find((r) => r.id === id)?.name).join(', ')}`
      );
    });
  } catch (error) {
    console.error('Error:', error.message);
  }
}

debugRoleFiltering();
