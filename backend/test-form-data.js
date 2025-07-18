// Test the exact form data that should be set
const fetch = require('node-fetch');

async function testFormData() {
  try {
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

    // Get users and roles
    const [usersResponse, rolesResponse] = await Promise.all([
      fetch('http://localhost:5000/api/v1/users', { headers }),
      fetch('http://localhost:5000/api/v1/users/roles', { headers }),
    ]);

    const usersData = await usersResponse.json();
    const rolesData = await rolesResponse.json();

    const targetUser = usersData.data?.find(
      (user) => user.id === 'be833b40-af07-4f51-8be0-761eb7c0e64d'
    );
    const allRoles = rolesData.data || rolesData;

    // Process exactly like the frontend does
    const processedRoles =
      targetUser.role_location_pairs?.length > 0
        ? targetUser.role_location_pairs.reduce((acc, pair) => {
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

    console.log('=== EXACT FORM DATA THAT SHOULD BE SET ===');
    console.log('name:', targetUser.full_name || '');
    console.log('email:', targetUser.email || '');
    console.log('phone:', targetUser.phone || '');
    console.log('whatsapp:', targetUser.whatsapp || '');
    console.log('role_location_pairs:', JSON.stringify(processedRoles, null, 2));

    console.log('\n=== DROPDOWN VALUES THAT SHOULD BE SELECTED ===');
    processedRoles.forEach((pair, index) => {
      const role = allRoles.find((r) => r.id === pair.role_id);
      console.log(`Perfil ${index + 1}:`);
      console.log(`  dropdown value="${pair.role_id}"`);
      console.log(`  dropdown text="${role?.name}" (${role?.display_name})`);
      console.log(`  locations: ${pair.location_ids.length} selected`);
    });
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testFormData();
