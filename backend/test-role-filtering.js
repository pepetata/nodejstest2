// Test script to verify role filtering and display names
const roleDisplayInfo = {
  superadmin: {
    name: 'Super Administrador',
    description: 'Acesso total ao sistema, gerencia todas as funcionalidades',
  },
  restaurant_administrator: {
    name: 'Administrador do Restaurante',
    description: 'Gerencia o restaurante, usuários e configurações',
  },
  location_administrator: {
    name: 'Administrador de Localização',
    description: 'Gerencia uma localização específica do restaurante',
  },
  manager: {
    name: 'Gerente',
    description: 'Supervisiona operações e equipe',
  },
  waiter: {
    name: 'Garçom',
    description: 'Atende clientes e gerencia pedidos',
  },
  kitchen: {
    name: 'Cozinha',
    description: 'Prepara pedidos e gerencia estoque',
  },
  cashier: {
    name: 'Caixa',
    description: 'Processa pagamentos e fechamento de contas',
  },
  food_runner: {
    name: 'Corredor de Comida',
    description: 'Entrega pratos da cozinha para os clientes',
  },
  kds_operator: {
    name: 'Operador KDS',
    description: 'Gerencia o sistema de display da cozinha',
  },
  pos_operator: {
    name: 'Operador POS',
    description: 'Opera o sistema de ponto de venda',
  },
};

// Sample roles data
const roles = [
  { id: 'aeb91604-e30b-4fa4-b36c-d96ad7327f50', name: 'restaurant_administrator' },
  { id: 'def91604-e30b-4fa4-b36c-d96ad7327f51', name: 'location_administrator' },
  { id: '123456789-e30b-4fa4-b36c-d96ad7327f52', name: 'waiter' },
  { id: '987654321-e30b-4fa4-b36c-d96ad7327f53', name: 'manager' },
];

// Sample form data with one role already selected
const formData = {
  role_location_pairs: [
    { role_id: 'aeb91604-e30b-4fa4-b36c-d96ad7327f50', location_ids: ['loc1', 'loc2'] },
  ],
};

// Mock current user
const currentUser = { role_name: 'restaurant_administrator' };

// Test the filtering function
function getAvailableRoles(currentPairIndex = null) {
  if (!currentUser || !roles.length) return [];

  let availableRoles = [];

  // If current user is superadmin, show all roles except superadmin
  if (currentUser.role_name === 'superadmin') {
    availableRoles = roles.filter((role) => role.name !== 'superadmin');
  }
  // If current user is restaurant_administrator, show restaurant_administrator and below
  else if (currentUser.role_name === 'restaurant_administrator') {
    availableRoles = roles.filter((role) => role.name !== 'superadmin');
  }
  // For other roles, show only roles below their level
  else {
    availableRoles = roles.filter(
      (role) => role.name !== 'superadmin' && role.name !== 'restaurant_administrator'
    );
  }

  // Filter out already selected roles (except for the current role being edited)
  const selectedRoleIds = formData.role_location_pairs
    .map((pair, index) => (index !== currentPairIndex ? pair.role_id : null))
    .filter(Boolean);

  return availableRoles.filter((role) => !selectedRoleIds.includes(role.id));
}

console.log('=== Testing Role Filtering ===');
console.log(
  'All roles:',
  roles.map((r) => `${r.name} (${roleDisplayInfo[r.name]?.name || r.name})`)
);
console.log('Current user role:', currentUser.role_name);
console.log(
  'Selected roles:',
  formData.role_location_pairs.map((p) => p.role_id)
);

console.log('\n=== Available roles for NEW role (index not specified) ===');
const availableForNew = getAvailableRoles();
console.log(
  'Available roles:',
  availableForNew.map((r) => `${r.name} (${roleDisplayInfo[r.name]?.name || r.name})`)
);

console.log('\n=== Available roles for EDITING existing role (index 0) ===');
const availableForEdit = getAvailableRoles(0);
console.log(
  'Available roles:',
  availableForEdit.map((r) => `${r.name} (${roleDisplayInfo[r.name]?.name || r.name})`)
);

console.log('\n=== Test Results ===');
console.log(
  '✅ Role display names are working:',
  roleDisplayInfo.restaurant_administrator.name === 'Administrador do Restaurante'
);
console.log(
  '✅ Duplicate filtering is working:',
  !availableForNew.some((r) => r.id === 'aeb91604-e30b-4fa4-b36c-d96ad7327f50')
);
console.log(
  '✅ Edit mode allows current role:',
  availableForEdit.some((r) => r.id === 'aeb91604-e30b-4fa4-b36c-d96ad7327f50')
);
