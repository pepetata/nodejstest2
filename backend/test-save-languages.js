const token =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJiZTgzM2I0MC1hZjA3LTRmNTEtOGJlMC03NjFlYjdjMGU2NGQiLCJpYXQiOjE3NTMyOTY3NzEsImV4cCI6MTc1MzM4MzE3MX0.t3nPyDVI0AU9yGmDvUiF8NBpQb3K4tGFH0Dsjbtd8ZA';
const restaurantId = '430c05f9-4298-4a68-a377-0c2188f4bfe1';

async function testSaveLanguages() {
  console.log('Testing save languages functionality...\n');

  try {
    const response = await fetch(
      `http://localhost:5000/api/v1/restaurants/${restaurantId}/languages`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          languages: [
            { language_id: 1, display_order: 1, is_default: true, is_active: true },
            { language_id: 2, display_order: 2, is_default: false, is_active: true },
            { language_id: 9, display_order: 3, is_default: false, is_active: true },
          ],
        }),
      }
    );

    console.log('Status:', response.status);
    const data = await response.json();
    console.log('Response:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testSaveLanguages();
