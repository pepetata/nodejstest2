// Debug the frontend role display issue
const fetch = require('node-fetch');

async function debugFrontendRoleDisplay() {
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

    // Get users data
    const usersResponse = await fetch('http://localhost:5000/api/v1/users', { headers });
    const usersData = await usersResponse.json();
    const targetUser = usersData.data?.find(
      (user) => user.id === 'be833b40-af07-4f51-8be0-761eb7c0e64d'
    );

    console.log('=== RAW USER DATA ===');
    console.log('User ID:', targetUser.id);
    console.log('User email:', targetUser.email);
    console.log('Role location pairs count:', targetUser.role_location_pairs?.length);

    console.log('\n=== RAW ROLE LOCATION PAIRS ===');
    targetUser.role_location_pairs.forEach((pair, index) => {
      console.log(`${index + 1}. Raw pair:`, JSON.stringify(pair, null, 2));
    });

    // Simulate the frontend processing exactly
    console.log('\n=== FRONTEND PROCESSING SIMULATION ===');

    // This is exactly what the frontend does in the useEffect
    const processedData = targetUser.role_location_pairs.reduce((acc, pair) => {
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

    console.log('Processed role_location_pairs:', JSON.stringify(processedData, null, 2));

    // Check each processed pair
    processedData.forEach((pair, index) => {
      console.log(`\n=== PERFIL ${index + 1} ANALYSIS ===`);
      console.log('Role ID:', pair.role_id);
      console.log('Role ID type:', typeof pair.role_id);
      console.log('Role ID length:', pair.role_id?.length);

      // Find the role in allRoles
      const matchingRole = allRoles.find((r) => r.id === pair.role_id);
      console.log('Matching role found:', !!matchingRole);
      if (matchingRole) {
        console.log('Role name:', matchingRole.name);
        console.log('Role display name:', matchingRole.display_name);
      } else {
        console.log('!!! NO MATCHING ROLE FOUND !!!');
        console.log(
          'Available role IDs:',
          allRoles.map((r) => r.id)
        );
      }

      // Check if role_id is empty string
      if (pair.role_id === '') {
        console.log('!!! ROLE_ID IS EMPTY STRING !!!');
      }

      // Check location_ids
      console.log('Location IDs:', pair.location_ids);
      console.log('Location IDs count:', pair.location_ids?.length);
    });

    // Check if getAvailableRoles would filter out the waiter role
    console.log('\n=== AVAILABLE ROLES SIMULATION ===');
    const currentUserRole = 'restaurant_administrator';

    processedData.forEach((pair, index) => {
      console.log(`\nFor Perfil ${index + 1}:`);

      // Get available roles like the frontend does
      let availableRoles = [];
      if (currentUserRole === 'restaurant_administrator') {
        availableRoles = allRoles.filter((role) => role.name !== 'superadmin');
      }

      // Filter out already selected roles (except current)
      const selectedRoleIds = processedData
        .map((pair, pairIndex) => (pairIndex !== index ? pair.role_id : null))
        .filter(Boolean);

      const finalRoles = availableRoles.filter((role) => !selectedRoleIds.includes(role.id));

      console.log('Current role_id:', pair.role_id);
      console.log(
        'Available roles:',
        finalRoles.map((r) => `${r.name} (${r.id})`)
      );
      console.log('Selected roles to exclude:', selectedRoleIds);

      // Check if current role is in available roles
      const currentRoleAvailable = finalRoles.find((r) => r.id === pair.role_id);
      console.log('Current role available in dropdown:', !!currentRoleAvailable);

      if (!currentRoleAvailable && pair.role_id) {
        console.log('!!! CURRENT ROLE NOT AVAILABLE IN DROPDOWN !!!');
      }
    });
  } catch (error) {
    console.error('Error:', error.message);
  }
}

debugFrontendRoleDisplay();
