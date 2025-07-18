// Debug frontend loading timing issue
const fetch = require('node-fetch');

async function debugFrontendLoadingTiming() {
  try {
    console.log('=== STEP 1: LOGIN ===');
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

    console.log('Login successful:', !!token);

    console.log('\n=== STEP 2: GET USERS (happens first in frontend) ===');
    const usersResponse = await fetch('http://localhost:5000/api/v1/users', { headers });
    const usersData = await usersResponse.json();
    const targetUser = usersData.data?.find(
      (user) => user.id === 'be833b40-af07-4f51-8be0-761eb7c0e64d'
    );

    console.log('Users fetched, target user found:', !!targetUser);
    if (targetUser) {
      console.log('Role location pairs count:', targetUser.role_location_pairs?.length);

      // Process form data like frontend does
      const formData = {
        role_location_pairs:
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
            : [{ role_id: '', location_ids: [] }],
      };

      console.log('Form data populated:');
      formData.role_location_pairs.forEach((pair, index) => {
        console.log(
          `  Perfil ${index + 1}: role_id = "${pair.role_id}", locations = ${pair.location_ids.length}`
        );
      });
    }

    console.log('\n=== STEP 3: GET ROLES (happens after users) ===');
    const rolesResponse = await fetch('http://localhost:5000/api/v1/users/roles', { headers });
    const rolesData = await rolesResponse.json();
    const allRoles = rolesData.data || rolesData;

    console.log('Roles fetched, count:', allRoles.length);

    // Now simulate dropdown rendering
    console.log('\n=== STEP 4: DROPDOWN RENDERING SIMULATION ===');

    if (targetUser) {
      const formData = {
        role_location_pairs:
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
            : [{ role_id: '', location_ids: [] }],
      };

      // Role display info (same as frontend)
      const roleDisplayInfo = {
        superadmin: { name: 'Super Administrador' },
        restaurant_administrator: { name: 'Administrador do Restaurante' },
        location_administrator: { name: 'Administrador de Localização' },
        manager: { name: 'Gerente' },
        waiter: { name: 'Garçom' },
        kitchen: { name: 'Cozinha' },
        cashier: { name: 'Caixa' },
        food_runner: { name: 'Entregador' },
        kds_operator: { name: 'Operador de Tela da Cozinha' },
        pos_operator: { name: 'Operador de PDV' },
      };

      formData.role_location_pairs.forEach((pair, index) => {
        console.log(`\nPerfil ${index + 1} dropdown simulation:`);
        console.log(`  Current role_id: "${pair.role_id}"`);
        console.log(`  Current role_id type: ${typeof pair.role_id}`);
        console.log(`  Current role_id empty: ${pair.role_id === ''}`);

        // Find the role in roles array
        const currentRole = allRoles.find((r) => r.id === pair.role_id);
        console.log(`  Role found in roles array: ${!!currentRole}`);
        if (currentRole) {
          console.log(`  Role name: ${currentRole.name}`);
          console.log(
            `  Role display name from roleDisplayInfo: ${roleDisplayInfo[currentRole.name]?.name}`
          );
        }

        // Check if role_id would make the dropdown show the correct selection
        if (pair.role_id === '') {
          console.log('  ⚠️  DROPDOWN WOULD SHOW: "Selecione um perfil" (empty role_id)');
        } else if (currentRole) {
          const displayName = roleDisplayInfo[currentRole.name]?.name || currentRole.name;
          console.log(`  ✅ DROPDOWN WOULD SHOW: "${displayName}"`);
        } else {
          console.log('  ❌ DROPDOWN WOULD SHOW: "Selecione um perfil" (role not found)');
        }
      });
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

debugFrontendLoadingTiming();
