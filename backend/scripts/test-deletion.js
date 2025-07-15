require('dotenv').config();
const restaurantService = require('../src/services/restaurantService');

/**
 * Test deletion functionality
 */
async function testDeletion() {
  try {
    // Test media ID from the test record we just created
    const mediaId = 'd98b3234-ef2b-4fca-a5d6-2560cbeee2be';
    const restaurantId = '8181755a-6312-4835-b6cd-8e0c3fb30b0c';
    const mediaType = 'images';

    const user = { id: 'test-user' };

    console.log('🧪 Testing media deletion...');
    console.log(`Media ID: ${mediaId}`);
    console.log(`Restaurant ID: ${restaurantId}`);
    console.log(`Media Type: ${mediaType}`);

    const result = await restaurantService.deleteRestaurantMedia(
      restaurantId,
      mediaId,
      mediaType,
      user
    );

    console.log('✅ Deletion test completed successfully!');
    console.log('Result:', result);
  } catch (error) {
    console.error('❌ Deletion test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run the test
testDeletion();
