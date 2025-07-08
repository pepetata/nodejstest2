// @ts-check
import { test, expect } from '@playwright/test';

// Utility to generate unique restaurant and user data for each run
function generateTestData() {
  const unique = Date.now();
  return {
    restaurant: {
      restaurant_name: `Restaurante Teste ${unique}`,
      restaurant_url_name: `restaurante-teste-${unique}`,
      business_type: 'single',
      cuisine_type: 'brasileira',
      phone: '11999999999',
      whatsapp: '11999999999',
      website: '',
      description: 'Restaurante de teste automatizado',
      terms_accepted: true,
      marketing_consent: false,
    },
    user: {
      full_name: `Usuário Teste ${unique}`,
      email: `testuser${unique}@example.com`,
      password: 'SenhaForte123!',
      role: 'restaurant_administrator',
      username: `testuser${unique}`,
    },
  };
}

test.describe('Cadastro de Restaurante - E2E', () => {
  test('Deve registrar um novo restaurante e usuário com sucesso', async ({ request }) => {
    const { restaurant, user } = generateTestData();
    // Compose payload as expected by backend
    const payload = { ...restaurant, userPayload: user };

    const response = await request.post('/api/restaurants', {
      data: payload,
    });

    expect(response.status()).toBe(201);
    const body = await response.json();
    expect(body).toHaveProperty('data');
    expect(body.data.restaurant_name).toBe(restaurant.restaurant_name);
    expect(body.data.restaurant_url_name).toBe(restaurant.restaurant_url_name);
    // Optionally, check for user creation in DB or via API if endpoint exists
  });

  test('Deve rejeitar cadastro com URL já existente', async ({ request }) => {
    const { restaurant, user } = generateTestData();
    const payload = { ...restaurant, userPayload: user };
    // First registration
    await request.post('/api/restaurants', { data: payload });
    // Second registration with same URL
    const response = await request.post('/api/restaurants', { data: payload });
    expect([409, 500]).toContain(response.status());
    const body = await response.json();
    const errorMsg = body.error?.message || body.message || '';
    expect(errorMsg.toLowerCase()).toMatch(/url.*já está em uso|url.*taken/);
  });
});
