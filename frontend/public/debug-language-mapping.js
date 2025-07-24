// Test the language mapping issue
const testToken =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjYWMxYzVkZS01OGQ4LTQzN2EtYWY1Yi0zZGU3ODgzMDEyNWEiLCJlbWFpbCI6ImZsYXZpb19sdWl6X2ZlcnJlaXJhQGhvdG1haWwuY29tIiwicmVzdGF1cmFudElkIjoiYzc3NDI4NjYtZjc3Yi00ZjY4LTg1ODYtNTdkNjMxYWYzMDFhIiwiaWF0IjoxNzUzMzgzMTc5LCJleHAiOjE3NTM0Njk1Nzl9.I327Tasts8-WA8Hl2j_RyPyLP7M6BWI4BTPN-pByRRg';

async function testLanguageMapping() {
  try {
    console.log('Testing language mapping...');

    // Fetch both datasets
    const [availableResponse, restaurantResponse] = await Promise.all([
      fetch('/api/v1/languages/available', {
        headers: { Authorization: `Bearer ${testToken}` },
      }),
      fetch('/api/v1/restaurants/c7742866-f77b-4f68-8586-57d631af301a/languages', {
        headers: { Authorization: `Bearer ${testToken}` },
      }),
    ]);

    const availableData = await availableResponse.json();
    const restaurantData = await restaurantResponse.json();

    const availableLanguages = availableData.data || [];
    const restaurantLanguages = restaurantData.data || [];

    console.log('=== AVAILABLE LANGUAGES ===');
    console.log('Total:', availableLanguages.length);
    console.log('Sample:', availableLanguages.slice(0, 3));

    console.log('=== RESTAURANT LANGUAGES ===');
    console.log('Total:', restaurantLanguages.length);
    console.log('Data:', restaurantLanguages);

    // Test the mapping logic from the frontend
    const languageMap = {};
    availableLanguages.forEach((lang) => {
      languageMap[lang.language_code] = lang.id;
    });

    console.log('=== LANGUAGE MAP ===');
    console.log('Language Map:', languageMap);

    // Test form translation initialization
    const initialTranslations = {};
    restaurantLanguages.forEach((lang) => {
      const languageCode = lang.language_code || lang.code;
      initialTranslations[languageCode] = { name: '', description: '' };
    });

    console.log('=== INITIAL TRANSLATIONS ===');
    console.log('Translations object:', initialTranslations);

    // Test the transform function
    const formData = {
      translations: {
        'pt-BR': { name: 'Teste português', description: 'Desc português' },
        es: { name: 'Teste español', description: 'Desc español' },
      },
      display_order: 0,
      is_active: true,
    };

    console.log('=== FORM DATA BEFORE TRANSFORM ===');
    console.log('FormData:', formData);

    // Transform function simulation
    const translations = Object.entries(formData.translations)
      .filter(([_, translation]) => translation.name.trim())
      .map(([languageCode, translation]) => ({
        language_id: languageMap[languageCode],
        name: translation.name.trim(),
        description: translation.description?.trim() || null,
      }));

    const transformedData = {
      ...formData,
      translations,
      display_order: parseInt(formData.display_order) || 0,
      status: formData.is_active ? 'active' : 'inactive',
      is_active: undefined,
    };

    console.log('=== TRANSFORMED DATA ===');
    console.log('Final translations array:', translations);
    console.log('Full transformed data:', transformedData);

    // Check for missing language_ids
    const missingIds = translations.filter((t) => !t.language_id);
    if (missingIds.length > 0) {
      console.error('❌ MISSING LANGUAGE IDS:', missingIds);
    } else {
      console.log('✅ All translations have language_id');
    }
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test
testLanguageMapping();
