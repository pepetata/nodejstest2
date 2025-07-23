// Language Management API E2E Tests
const { test, expect } = require('@playwright/test');

const API_BASE_URL = 'http://localhost:5000';

test.describe('Language Management API', () => {
  let authToken;
  let restaurantId;

  test.beforeAll(async ({ request }) => {
    // Login to get auth token
    const loginResponse = await request.post(`${API_BASE_URL}/api/v1/auth/login`, {
      data: {
        username: 'admin@testrestaurant.com',
        password: 'TestPassword123!',
      },
    });

    if (loginResponse.ok()) {
      const loginData = await loginResponse.json();
      authToken = loginData.token;
      restaurantId = loginData.user.restaurant_id;
    } else {
      console.log('Login failed, tests may use mock data');
      authToken = 'mock-token';
      restaurantId = '123e4567-e89b-12d3-a456-426614174000';
    }
  });

  test.describe('GET /api/v1/languages/available', () => {
    test('should return available languages', async ({ request }) => {
      const response = await request.get(`${API_BASE_URL}/api/v1/languages/available`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.ok()).toBeTruthy();
      const data = await response.json();

      expect(data).toHaveProperty('success', true);
      expect(data).toHaveProperty('data');
      expect(Array.isArray(data.data)).toBeTruthy();
      expect(data.data.length).toBeGreaterThan(0);

      // Verify language structure
      const language = data.data[0];
      expect(language).toHaveProperty('id');
      expect(language).toHaveProperty('name');
      expect(language).toHaveProperty('native_name');
      expect(language).toHaveProperty('language_code');
      expect(language).toHaveProperty('is_active', true);
    });

    test('should require authentication', async ({ request }) => {
      const response = await request.get(`${API_BASE_URL}/api/v1/languages/available`);

      expect(response.status()).toBe(401);
    });

    test('should return languages in correct order', async ({ request }) => {
      const response = await request.get(`${API_BASE_URL}/api/v1/languages/available`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      const data = await response.json();
      const languages = data.data;

      // Should be ordered by display_order ASC, name ASC
      for (let i = 1; i < languages.length; i++) {
        const prev = languages[i - 1];
        const curr = languages[i];

        if (prev.display_order === curr.display_order) {
          expect(prev.name.localeCompare(curr.name)).toBeLessThanOrEqual(0);
        } else {
          expect(prev.display_order).toBeLessThanOrEqual(curr.display_order);
        }
      }
    });

    test('should include Portuguese Brazilian as default', async ({ request }) => {
      const response = await request.get(`${API_BASE_URL}/api/v1/languages/available`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      const data = await response.json();
      const languages = data.data;

      const portuguese = languages.find((lang) => lang.language_code === 'pt-BR');
      expect(portuguese).toBeDefined();
      expect(portuguese.name).toBe('Português');
      expect(portuguese.is_default).toBe(true);
    });
  });

  test.describe('GET /api/v1/restaurants/:id/languages', () => {
    test('should return restaurant languages', async ({ request }) => {
      const response = await request.get(
        `${API_BASE_URL}/api/v1/restaurants/${restaurantId}/languages`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      expect(response.ok()).toBeTruthy();
      const data = await response.json();

      expect(data).toHaveProperty('success', true);
      expect(data).toHaveProperty('data');
      expect(Array.isArray(data.data)).toBeTruthy();
    });

    test('should require authentication', async ({ request }) => {
      const response = await request.get(
        `${API_BASE_URL}/api/v1/restaurants/${restaurantId}/languages`
      );

      expect(response.status()).toBe(401);
    });

    test('should return 404 for non-existent restaurant', async ({ request }) => {
      const fakeRestaurantId = '123e4567-e89b-12d3-a456-426614174999';
      const response = await request.get(
        `${API_BASE_URL}/api/v1/restaurants/${fakeRestaurantId}/languages`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      expect(response.status()).toBe(404);
    });

    test('should return languages with correct structure', async ({ request }) => {
      // First, add some languages
      await request.put(`${API_BASE_URL}/api/v1/restaurants/${restaurantId}/languages`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        data: {
          languages: [
            {
              language_id: 1,
              display_order: 1,
              is_default: true,
              is_active: true,
            },
            {
              language_id: 2,
              display_order: 2,
              is_default: false,
              is_active: true,
            },
          ],
        },
      });

      const response = await request.get(
        `${API_BASE_URL}/api/v1/restaurants/${restaurantId}/languages`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      const data = await response.json();
      const languages = data.data;

      if (languages.length > 0) {
        const language = languages[0];
        expect(language).toHaveProperty('language_id');
        expect(language).toHaveProperty('language_code');
        expect(language).toHaveProperty('name');
        expect(language).toHaveProperty('native_name');
        expect(language).toHaveProperty('display_order');
        expect(language).toHaveProperty('is_default');
        expect(language).toHaveProperty('is_active');
      }
    });
  });

  test.describe('PUT /api/v1/restaurants/:id/languages', () => {
    test('should update restaurant languages successfully', async ({ request }) => {
      const languagesToUpdate = [
        {
          language_id: 1, // Portuguese
          display_order: 1,
          is_default: true,
          is_active: true,
        },
        {
          language_id: 2, // English
          display_order: 2,
          is_default: false,
          is_active: true,
        },
      ];

      const response = await request.put(
        `${API_BASE_URL}/api/v1/restaurants/${restaurantId}/languages`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
          data: {
            languages: languagesToUpdate,
          },
        }
      );

      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data).toHaveProperty('success', true);
    });

    test('should require authentication', async ({ request }) => {
      const response = await request.put(
        `${API_BASE_URL}/api/v1/restaurants/${restaurantId}/languages`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
          data: {
            languages: [],
          },
        }
      );

      expect(response.status()).toBe(401);
    });

    test('should validate language data structure', async ({ request }) => {
      const response = await request.put(
        `${API_BASE_URL}/api/v1/restaurants/${restaurantId}/languages`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
          data: {
            languages: [
              {
                // Missing required fields
                language_id: 1,
              },
            ],
          },
        }
      );

      expect(response.status()).toBe(400);
    });

    test('should enforce single default language', async ({ request }) => {
      const languagesWithMultipleDefaults = [
        {
          language_id: 1,
          display_order: 1,
          is_default: true,
          is_active: true,
        },
        {
          language_id: 2,
          display_order: 2,
          is_default: true, // Both set as default
          is_active: true,
        },
      ];

      const response = await request.put(
        `${API_BASE_URL}/api/v1/restaurants/${restaurantId}/languages`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
          data: {
            languages: languagesWithMultipleDefaults,
          },
        }
      );

      expect(response.status()).toBe(400);
      const data = await response.json();
      expect(data.message).toContain('default');
    });

    test('should require at least one language', async ({ request }) => {
      const response = await request.put(
        `${API_BASE_URL}/api/v1/restaurants/${restaurantId}/languages`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
          data: {
            languages: [],
          },
        }
      );

      expect(response.status()).toBe(400);
      const data = await response.json();
      expect(data.message).toContain('least one language');
    });

    test('should handle non-existent language IDs', async ({ request }) => {
      const response = await request.put(
        `${API_BASE_URL}/api/v1/restaurants/${restaurantId}/languages`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
          data: {
            languages: [
              {
                language_id: 9999, // Non-existent language
                display_order: 1,
                is_default: true,
                is_active: true,
              },
            ],
          },
        }
      );

      expect(response.status()).toBe(400);
    });

    test('should persist changes correctly', async ({ request }) => {
      const languagesToSet = [
        {
          language_id: 1,
          display_order: 1,
          is_default: true,
          is_active: true,
        },
        {
          language_id: 3, // Spanish
          display_order: 2,
          is_default: false,
          is_active: true,
        },
      ];

      // Update languages
      const updateResponse = await request.put(
        `${API_BASE_URL}/api/v1/restaurants/${restaurantId}/languages`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
          data: {
            languages: languagesToSet,
          },
        }
      );

      expect(updateResponse.ok()).toBeTruthy();

      // Verify changes were persisted
      const getResponse = await request.get(
        `${API_BASE_URL}/api/v1/restaurants/${restaurantId}/languages`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      const data = await getResponse.json();
      const languages = data.data;

      expect(languages).toHaveLength(2);

      const portuguese = languages.find((lang) => lang.language_id === 1);
      const spanish = languages.find((lang) => lang.language_id === 3);

      expect(portuguese).toBeDefined();
      expect(portuguese.is_default).toBe(true);

      expect(spanish).toBeDefined();
      expect(spanish.is_default).toBe(false);
    });
  });

  test.describe('Error Handling', () => {
    test('should handle database errors gracefully', async ({ request }) => {
      // This test might require specific database conditions
      // For now, we'll test general error response structure
      const response = await request.get(
        `${API_BASE_URL}/api/v1/restaurants/invalid-uuid/languages`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      expect(response.status()).toBeGreaterThanOrEqual(400);
      const data = await response.json();
      expect(data).toHaveProperty('error');
    });

    test('should handle malformed JSON gracefully', async ({ request }) => {
      const response = await request.put(
        `${API_BASE_URL}/api/v1/restaurants/${restaurantId}/languages`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
          data: 'invalid json',
        }
      );

      expect(response.status()).toBe(400);
    });
  });
});
