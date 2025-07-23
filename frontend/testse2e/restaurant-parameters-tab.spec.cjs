// Restaurant Parameters Tab E2E Tests
const { test, expect } = require('@playwright/test');

// Test data
const testRestaurant = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  name: 'Test Restaurant',
  urlName: 'test-restaurant',
};

const testUser = {
  username: 'admin@testrestaurant.com',
  password: 'TestPassword123!',
  fullName: 'Test Admin',
};

const mockLanguages = [
  {
    id: 1,
    name: 'Português',
    native_name: 'Português',
    language_code: 'pt-BR',
    icon_file: 'br.svg',
    display_order: 10,
    is_default: true,
    is_active: true,
  },
  {
    id: 2,
    name: 'English',
    native_name: 'English',
    language_code: 'en',
    icon_file: 'us.svg',
    display_order: 20,
    is_default: false,
    is_active: true,
  },
  {
    id: 3,
    name: 'Español',
    native_name: 'Español',
    language_code: 'es',
    icon_file: 'es.svg',
    display_order: 30,
    is_default: false,
    is_active: true,
  },
  {
    id: 4,
    name: 'Français',
    native_name: 'Français',
    language_code: 'fr',
    icon_file: 'fr.svg',
    display_order: 40,
    is_default: false,
    is_active: true,
  },
];

test.describe('Restaurant Parameters Tab', () => {
  let page;
  let context;

  test.beforeAll(async ({ browser }) => {
    context = await browser.newContext();
    page = await context.newPage();
  });

  test.afterAll(async () => {
    await context.close();
  });

  test.beforeEach(async () => {
    // Mock API responses
    await page.route('**/api/v1/languages/available', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: mockLanguages,
        }),
      });
    });

    await page.route('**/api/v1/restaurants/*/languages', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [
              {
                language_id: 1,
                language_code: 'pt-BR',
                name: 'Português',
                native_name: 'Português',
                display_order: 1,
                is_default: true,
                is_active: true,
              },
            ],
          }),
        });
      } else if (route.request().method() === 'PUT') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message: 'Languages updated successfully',
          }),
        });
      }
    });

    // Mock authentication state
    await page.addInitScript(() => {
      localStorage.setItem('token', 'mock-jwt-token');
      window.__REDUX_STATE__ = {
        auth: {
          isAuthenticated: true,
          user: {
            id: 1,
            username: 'admin@testrestaurant.com',
            full_name: 'Test Admin',
            role: 'restaurant_admin',
          },
          restaurant: {
            id: '123e4567-e89b-12d3-a456-426614174000',
            name: 'Test Restaurant',
            restaurant_url_name: 'test-restaurant',
          },
        },
      };
    });

    // Navigate to the parameters tab
    await page.goto('http://localhost:3000/test-restaurant/admin/restaurant-profile');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Initial Load and UI', () => {
    test('should load parameters tab and display sections', async () => {
      // Click on Parameters tab
      await page.getByRole('button', { name: /parâmetros/i }).click();
      await page.waitForLoadState('networkidle');

      // Verify tab header
      await expect(page.getByRole('heading', { name: 'Parâmetros do Restaurante' })).toBeVisible();
      await expect(
        page.getByText('Configure os parâmetros e configurações avançadas')
      ).toBeVisible();

      // Verify Languages section
      await expect(page.getByRole('button', { name: /idiomas do menu/i })).toBeVisible();
      await expect(page.getByText('Configure os idiomas disponíveis no seu menu')).toBeVisible();

      // Verify General Parameters section
      await expect(page.getByRole('button', { name: /parâmetros gerais/i })).toBeVisible();
      await expect(page.getByText('Em desenvolvimento - Outras configurações')).toBeVisible();
    });

    test('should show collapsible sections with toggle indicators', async () => {
      await page.getByRole('button', { name: /parâmetros/i }).click();
      await page.waitForLoadState('networkidle');

      // Languages section should be open by default
      const languagesSection = page.getByRole('button', { name: /idiomas do menu/i });
      await expect(languagesSection).toHaveClass(/expanded/);
      await expect(page.getByText('▼')).toBeVisible();

      // General section should be closed by default
      const generalSection = page.getByRole('button', { name: /parâmetros gerais/i });
      await expect(generalSection).not.toHaveClass(/expanded/);
      await expect(page.getByText('▶')).toBeVisible();

      // Toggle general section
      await generalSection.click();
      await expect(generalSection).toHaveClass(/expanded/);
      await expect(page.getByText('🚧 Em desenvolvimento...')).toBeVisible();
    });

    test('should display loading state initially', async () => {
      await page.getByRole('button', { name: /parâmetros/i }).click();

      // Should show loading spinner initially
      await expect(page.getByText('Carregando idiomas...')).toBeVisible();
      await page.waitForLoadState('networkidle');
    });
  });

  test.describe('Language Management - Read Operations', () => {
    test('should display current restaurant languages', async () => {
      await page.getByRole('button', { name: /parâmetros/i }).click();
      await page.waitForLoadState('networkidle');

      // Verify languages list header
      await expect(page.getByText('Idiomas Configurados (1)')).toBeVisible();

      // Verify default language is shown
      await expect(page.getByText('Português')).toBeVisible();
      await expect(page.getByText('(Português)')).toBeVisible();
      await expect(page.getByText('pt-BR')).toBeVisible();
      await expect(page.getByText('Padrão')).toBeVisible();

      // Edit button should be visible
      await expect(page.getByRole('button', { name: /✏️ editar idiomas/i })).toBeVisible();
    });

    test('should show empty state when no languages configured', async () => {
      // Mock empty restaurant languages
      await page.route('**/api/v1/restaurants/*/languages', async (route) => {
        if (route.request().method() === 'GET') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              data: [],
            }),
          });
        }
      });

      await page.reload();
      await page.getByRole('button', { name: /parâmetros/i }).click();
      await page.waitForLoadState('networkidle');

      await expect(page.getByText('Idiomas Configurados (0)')).toBeVisible();
      await expect(page.getByText('Nenhum idioma configurado ainda.')).toBeVisible();
    });
  });

  test.describe('Language Management - Edit Operations', () => {
    test('should enter edit mode and show edit controls', async () => {
      await page.getByRole('button', { name: /parâmetros/i }).click();
      await page.waitForLoadState('networkidle');

      // Click edit button
      await page.getByRole('button', { name: /✏️ editar idiomas/i }).click();

      // Verify edit controls appear
      await expect(page.getByRole('button', { name: /✕ cancelar/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /💾 salvar/i })).toBeVisible();

      // Verify language controls appear
      await expect(page.getByRole('button', { name: /🗑️/i })).toBeVisible();

      // Verify add language section appears
      await expect(page.getByText('Adicionar Idioma')).toBeVisible();
      await expect(page.getByRole('combobox')).toBeVisible();
    });

    test('should add a new language', async () => {
      await page.getByRole('button', { name: /parâmetros/i }).click();
      await page.waitForLoadState('networkidle');

      // Enter edit mode
      await page.getByRole('button', { name: /✏️ editar idiomas/i }).click();

      // Add English language
      const languageSelect = page.getByRole('combobox');
      await languageSelect.selectOption('2'); // English ID

      // Verify English was added
      await expect(page.getByText('English')).toBeVisible();
      await expect(page.getByText('(English)')).toBeVisible();
      await expect(page.getByText('en')).toBeVisible();

      // Verify count updated
      await expect(page.getByText('Idiomas Configurados (2)')).toBeVisible();

      // Portuguese should still be default
      const portugueseBadge = page
        .locator('.language-item')
        .filter({ hasText: 'Português' })
        .locator('.default-badge');
      await expect(portugueseBadge).toBeVisible();
    });

    test('should set a language as default', async () => {
      await page.getByRole('button', { name: /parâmetros/i }).click();
      await page.waitForLoadState('networkidle');

      // Enter edit mode
      await page.getByRole('button', { name: /✏️ editar idiomas/i }).click();

      // Add English language
      await page.getByRole('combobox').selectOption('2');

      // Set English as default
      const englishItem = page.locator('.language-item').filter({ hasText: 'English' });
      await englishItem.getByRole('button', { name: /tornar padrão/i }).click();

      // Verify English is now default
      const englishBadge = englishItem.locator('.default-badge');
      await expect(englishBadge).toBeVisible();

      // Verify Portuguese is no longer default
      const portugueseItem = page.locator('.language-item').filter({ hasText: 'Português' });
      await expect(portugueseItem.locator('.default-badge')).not.toBeVisible();

      // Verify "Tornar Padrão" button appears on Portuguese
      await expect(portugueseItem.getByRole('button', { name: /tornar padrão/i })).toBeVisible();
    });

    test('should remove a language', async () => {
      await page.getByRole('button', { name: /parâmetros/i }).click();
      await page.waitForLoadState('networkidle');

      // Enter edit mode
      await page.getByRole('button', { name: /✏️ editar idiomas/i }).click();

      // Add English and Spanish
      await page.getByRole('combobox').selectOption('2'); // English
      await page.getByRole('combobox').selectOption('3'); // Spanish

      // Verify we have 3 languages
      await expect(page.getByText('Idiomas Configurados (3)')).toBeVisible();

      // Remove English
      const englishItem = page.locator('.language-item').filter({ hasText: 'English' });
      await englishItem.getByRole('button', { name: /🗑️/i }).click();

      // Verify English was removed
      await expect(page.getByText('Idiomas Configurados (2)')).toBeVisible();
      await expect(page.getByText('English')).not.toBeVisible();

      // Verify Portuguese is still default
      const portugueseBadge = page
        .locator('.language-item')
        .filter({ hasText: 'Português' })
        .locator('.default-badge');
      await expect(portugueseBadge).toBeVisible();
    });

    test('should automatically set first language as default when removing default', async () => {
      await page.getByRole('button', { name: /parâmetros/i }).click();
      await page.waitForLoadState('networkidle');

      // Enter edit mode
      await page.getByRole('button', { name: /✏️ editar idiomas/i }).click();

      // Add English
      await page.getByRole('combobox').selectOption('2');

      // Set English as default
      const englishItem = page.locator('.language-item').filter({ hasText: 'English' });
      await englishItem.getByRole('button', { name: /tornar padrão/i }).click();

      // Remove English (which is default)
      await englishItem.getByRole('button', { name: /🗑️/i }).click();

      // Verify Portuguese automatically became default again
      const portugueseBadge = page
        .locator('.language-item')
        .filter({ hasText: 'Português' })
        .locator('.default-badge');
      await expect(portugueseBadge).toBeVisible();
    });

    test('should cancel editing and revert changes', async () => {
      await page.getByRole('button', { name: /parâmetros/i }).click();
      await page.waitForLoadState('networkidle');

      // Enter edit mode
      await page.getByRole('button', { name: /✏️ editar idiomas/i }).click();

      // Add English
      await page.getByRole('combobox').selectOption('2');
      await expect(page.getByText('Idiomas Configurados (2)')).toBeVisible();

      // Cancel editing
      await page.getByRole('button', { name: /✕ cancelar/i }).click();

      // Verify changes were reverted
      await expect(page.getByText('Idiomas Configurados (1)')).toBeVisible();
      await expect(page.getByText('English')).not.toBeVisible();
      await expect(page.getByRole('button', { name: /✏️ editar idiomas/i })).toBeVisible();
    });

    test('should save changes successfully', async () => {
      await page.getByRole('button', { name: /parâmetros/i }).click();
      await page.waitForLoadState('networkidle');

      // Enter edit mode
      await page.getByRole('button', { name: /✏️ editar idiomas/i }).click();

      // Add English
      await page.getByRole('combobox').selectOption('2');

      // Save changes
      await page.getByRole('button', { name: /💾 salvar/i }).click();

      // Verify loading state during save
      await expect(page.getByRole('button', { name: /💾 salvando.../i })).toBeVisible();

      // Wait for save to complete
      await page.waitForLoadState('networkidle');

      // Verify success message
      await expect(page.getByText('Idiomas atualizados com sucesso!')).toBeVisible();

      // Verify edit mode is exited
      await expect(page.getByRole('button', { name: /✏️ editar idiomas/i })).toBeVisible();

      // Verify changes persisted
      await expect(page.getByText('Idiomas Configurados (2)')).toBeVisible();
      await expect(page.getByText('English')).toBeVisible();
    });
  });

  test.describe('Error Handling', () => {
    test('should handle API errors gracefully', async () => {
      // Mock API error
      await page.route('**/api/v1/languages/available', async (route) => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'Internal server error',
          }),
        });
      });

      await page.reload();
      await page.getByRole('button', { name: /parâmetros/i }).click();
      await page.waitForLoadState('networkidle');

      // Verify error message is displayed
      await expect(page.getByText(/erro ao carregar idiomas/i)).toBeVisible();
    });

    test('should handle save errors gracefully', async () => {
      await page.getByRole('button', { name: /parâmetros/i }).click();
      await page.waitForLoadState('networkidle');

      // Mock save error
      await page.route('**/api/v1/restaurants/*/languages', async (route) => {
        if (route.request().method() === 'PUT') {
          await route.fulfill({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({
              error: 'Failed to save languages',
            }),
          });
        }
      });

      // Enter edit mode and make changes
      await page.getByRole('button', { name: /✏️ editar idiomas/i }).click();
      await page.getByRole('combobox').selectOption('2');

      // Try to save
      await page.getByRole('button', { name: /💾 salvar/i }).click();
      await page.waitForLoadState('networkidle');

      // Verify error message
      await expect(page.getByText(/erro ao salvar idiomas/i)).toBeVisible();

      // Verify still in edit mode
      await expect(page.getByRole('button', { name: /✕ cancelar/i })).toBeVisible();
    });
  });

  test.describe('Help and Information', () => {
    test('should display help section with important information', async () => {
      await page.getByRole('button', { name: /parâmetros/i }).click();
      await page.waitForLoadState('networkidle');

      // Enter edit mode to see help section
      await page.getByRole('button', { name: /✏️ editar idiomas/i }).click();

      // Verify help section
      await expect(page.getByText('💡 Informações Importantes:')).toBeVisible();
      await expect(page.getByText(/o idioma padrão será usado quando/i)).toBeVisible();
      await expect(page.getByText(/pelo menos um idioma deve estar configurado/i)).toBeVisible();
      await expect(page.getByText(/português é automaticamente adicionado/i)).toBeVisible();
    });

    test('should show empty state help text when editing with no languages', async () => {
      // Mock empty restaurant languages
      await page.route('**/api/v1/restaurants/*/languages', async (route) => {
        if (route.request().method() === 'GET') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              data: [],
            }),
          });
        }
      });

      await page.reload();
      await page.getByRole('button', { name: /parâmetros/i }).click();
      await page.waitForLoadState('networkidle');

      // Enter edit mode
      await page.getByRole('button', { name: /✏️ editar idiomas/i }).click();

      // Verify help text appears
      await expect(page.getByText('Adicione pelo menos um idioma para seu menu.')).toBeVisible();
    });

    test('should show message when all languages are added', async () => {
      await page.getByRole('button', { name: /parâmetros/i }).click();
      await page.waitForLoadState('networkidle');

      // Enter edit mode
      await page.getByRole('button', { name: /✏️ editar idiomas/i }).click();

      // Add all available languages
      await page.getByRole('combobox').selectOption('2'); // English
      await page.getByRole('combobox').selectOption('3'); // Spanish
      await page.getByRole('combobox').selectOption('4'); // French

      // Verify message when all languages are added
      await expect(
        page.getByText('Todos os idiomas disponíveis já foram adicionados.')
      ).toBeVisible();

      // Verify select is not visible or disabled
      const selectOptions = await page.getByRole('combobox').locator('option').count();
      expect(selectOptions).toBe(1); // Only the default "Selecione..." option
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper ARIA labels and keyboard navigation', async () => {
      await page.getByRole('button', { name: /parâmetros/i }).click();
      await page.waitForLoadState('networkidle');

      // Test keyboard navigation on collapsible sections
      await page.keyboard.press('Tab');
      await page.keyboard.press('Enter'); // Should toggle section

      // Test form controls accessibility
      await page.getByRole('button', { name: /✏️ editar idiomas/i }).click();

      // Test language select accessibility
      const languageSelect = page.getByRole('combobox');
      await expect(languageSelect).toBeVisible();
      await languageSelect.focus();
      await page.keyboard.press('ArrowDown');

      // Test button accessibility
      const saveButton = page.getByRole('button', { name: /💾 salvar/i });
      await expect(saveButton).toBeVisible();
      await saveButton.focus();
    });
  });
});
