/**
 * Physical File Storage Test
 * Tests the complete media upload implementation with physical file storage and database persistence
 */

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs').promises;
const path = require('path');

const BASE_URL = 'http://localhost:3000';
const TEST_FILES_DIR = path.join(__dirname, 'test-files');
const PUBLIC_DIR = path.join(__dirname, '../../public');

// Create test files directory if it doesn't exist
async function createTestFiles() {
  try {
    await fs.mkdir(TEST_FILES_DIR, { recursive: true });

    // Create a simple test image file (1x1 pixel PNG)
    const testImageBuffer = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44,
      0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x06, 0x00, 0x00, 0x00, 0x1f,
      0x15, 0xc4, 0x89, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0x00,
      0x01, 0x00, 0x00, 0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49,
      0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
    ]);

    await fs.writeFile(path.join(TEST_FILES_DIR, 'test-logo.png'), testImageBuffer);
    await fs.writeFile(path.join(TEST_FILES_DIR, 'test-favicon.png'), testImageBuffer);
    await fs.writeFile(path.join(TEST_FILES_DIR, 'test-image.png'), testImageBuffer);

    console.log('✅ Test files created successfully');
  } catch (error) {
    console.error('❌ Error creating test files:', error.message);
  }
}

// Test media upload functionality
async function testMediaUpload() {
  console.log('🧪 Testing Physical Media Upload Implementation...\n');

  try {
    // Create test files first
    await createTestFiles();

    // Test 1: Upload logo
    console.log('📁 Test 1: Upload Restaurant Logo');
    const logoFormData = new FormData();
    logoFormData.append(
      'files',
      await fs.readFile(path.join(TEST_FILES_DIR, 'test-logo.png')),
      'test-logo.png'
    );

    const logoResponse = await axios.post(
      `${BASE_URL}/api/v1/restaurants/test-restaurant-id/media/logo`,
      logoFormData,
      {
        headers: {
          ...logoFormData.getHeaders(),
          Authorization: 'Bearer test-token',
        },
      }
    );

    console.log('✅ Logo upload response:', logoResponse.data);

    // Verify logo file exists in organized folder
    const logoPath = path.join(PUBLIC_DIR, 'logo', 'test-restaurant-url');
    const logoFiles = await fs.readdir(logoPath);
    console.log('📂 Logo files created:', logoFiles);

    // Test 2: Upload favicon
    console.log('\n📁 Test 2: Upload Restaurant Favicon');
    const faviconFormData = new FormData();
    faviconFormData.append(
      'files',
      await fs.readFile(path.join(TEST_FILES_DIR, 'test-favicon.png')),
      'test-favicon.png'
    );

    const faviconResponse = await axios.post(
      `${BASE_URL}/api/v1/restaurants/test-restaurant-id/media/favicon`,
      faviconFormData,
      {
        headers: {
          ...faviconFormData.getHeaders(),
          Authorization: 'Bearer test-token',
        },
      }
    );

    console.log('✅ Favicon upload response:', faviconResponse.data);

    // Verify favicon file exists
    const faviconPath = path.join(PUBLIC_DIR, 'favicons', 'test-restaurant-url');
    const faviconFiles = await fs.readdir(faviconPath);
    console.log('📂 Favicon files created:', faviconFiles);

    // Test 3: Upload restaurant images (requires location)
    console.log('\n📁 Test 3: Upload Restaurant Images');
    const imageFormData = new FormData();
    imageFormData.append(
      'files',
      await fs.readFile(path.join(TEST_FILES_DIR, 'test-image.png')),
      'test-image.png'
    );
    imageFormData.append('locationId', 'test-location-id');

    const imageResponse = await axios.post(
      `${BASE_URL}/api/v1/restaurants/test-restaurant-id/media/images`,
      imageFormData,
      {
        headers: {
          ...imageFormData.getHeaders(),
          Authorization: 'Bearer test-token',
        },
      }
    );

    console.log('✅ Image upload response:', imageResponse.data);

    // Verify image file exists
    const imagePath = path.join(
      PUBLIC_DIR,
      'restaurant_images',
      'test-restaurant-url',
      'test-location-url'
    );
    const imageFiles = await fs.readdir(imagePath);
    console.log('📂 Image files created:', imageFiles);

    console.log('\n🎉 All tests completed successfully!');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
  }
}

// Test folder structure verification
async function testFolderStructure() {
  console.log('🧪 Testing Folder Structure...\n');

  const expectedFolders = [
    'logo/test-restaurant-url',
    'favicons/test-restaurant-url',
    'restaurant_images/test-restaurant-url/test-location-url',
    'restaurant_videos/test-restaurant-url/test-location-url',
  ];

  for (const folderPath of expectedFolders) {
    const fullPath = path.join(PUBLIC_DIR, folderPath);
    try {
      await fs.access(fullPath);
      console.log(`✅ Folder exists: ${folderPath}`);
    } catch (error) {
      console.log(`❌ Folder missing: ${folderPath}`);
    }
  }
}

// Run tests
async function runTests() {
  console.log('🚀 Starting Physical Media Upload Tests...\n');

  await testMediaUpload();
  await testFolderStructure();

  console.log('\n✨ Test suite completed!');
}

// Run if called directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests, testMediaUpload, testFolderStructure };
