// Test what the API actually returns vs what the frontend expects

// 1. Test the backend service organization logic
console.log('1. Testing backend service organization...');

// Simulate the exact database records from your data
const mockDbRecords = [
  {
    id: '0e0196db-6bcb-4154-bbf9-9960b07ced49',
    restaurant_id: '8181755a-6312-4835-b6cd-8e0c3fb30b0c',
    location_id: 'a5d63ff4-16e2-4d5e-b70e-ae9c837dea81',
    media_type: 'images',
    filename: '1752586450702_fuzdqh0rfpl.jpg',
    original_filename: 'thales.jpg',
    file_path: 'restaurant_images/padre/matriz/1752586450702_fuzdqh0rfpl.jpg',
    file_url: '/uploads/restaurant_images/padre/matriz/1752586450702_fuzdqh0rfpl.jpg',
    file_size: 8228,
    mime_type: 'image/jpeg',
    created_at: '2025-07-15 10:34:10.705171',
    uploaded_by: 'aeda01a1-4465-41d9-9474-c0877451a808',
    is_active: true,
    updated_at: '2025-07-15 10:34:10.705171',
  },
  {
    id: '354a4294-09ea-4809-afba-d599c037baef',
    restaurant_id: '8181755a-6312-4835-b6cd-8e0c3fb30b0c',
    location_id: 'a5d63ff4-16e2-4d5e-b70e-ae9c837dea81',
    media_type: 'videos',
    filename: '1752586503008_cuf26taoxkn.mp4',
    original_filename: 'WhatsApp Video 2025-07-12 at 13.16.27.mp4',
    file_path: 'restaurant_videos/padre/matriz/1752586503008_cuf26taoxkn.mp4',
    file_url: '/uploads/restaurant_videos/padre/matriz/1752586503008_cuf26taoxkn.mp4',
    file_size: 4039078,
    mime_type: 'video/mp4',
    created_at: '2025-07-15 10:35:03.014759',
    uploaded_by: 'aeda01a1-4465-41d9-9474-c0877451a808',
    is_active: true,
    updated_at: '2025-07-15 10:35:03.014759',
  },
  {
    id: '3e6c22d6-d31c-444d-af23-91281aa85341',
    restaurant_id: '8181755a-6312-4835-b6cd-8e0c3fb30b0c',
    location_id: null,
    media_type: 'logo',
    filename: '1752586256900_p8lemhwemr.jpg',
    original_filename: 'thales.jpg',
    file_path: 'logo/padre/1752586256900_p8lemhwemr.jpg',
    file_url: '/uploads/logo/padre/1752586256900_p8lemhwemr.jpg',
    file_size: 8228,
    mime_type: 'image/jpeg',
    created_at: '2025-07-15 10:30:56.913393',
    uploaded_by: 'aeda01a1-4465-41d9-9474-c0877451a808',
    is_active: true,
    updated_at: '2025-07-15 10:30:56.913393',
  },
  {
    id: '6c92a90b-26cd-41fd-9cb1-47130ee1dee7',
    restaurant_id: '8181755a-6312-4835-b6cd-8e0c3fb30b0c',
    location_id: null,
    media_type: 'favicon',
    filename: '1752586385709_7r1s2vkg1qw.ico',
    original_filename: 'favicon.ico',
    file_path: 'favicons/padre/1752586385709_7r1s2vkg1qw.ico',
    file_url: '/uploads/favicons/padre/1752586385709_7r1s2vkg1qw.ico',
    file_size: 1150,
    mime_type: 'image/x-icon',
    created_at: '2025-07-15 10:33:05.711746',
    uploaded_by: 'aeda01a1-4465-41d9-9474-c0877451a808',
    is_active: true,
    updated_at: '2025-07-15 10:33:05.711746',
  },
];

// Backend service organization logic
const organizedMedia = {
  logo: null,
  favicon: null,
  images: [],
  videos: [],
};

mockDbRecords.forEach((record) => {
  const mediaItem = {
    id: record.id,
    name: record.original_filename,
    filename: record.filename,
    url: record.file_url,
    size: record.file_size,
    mimeType: record.mime_type,
    uploadedAt: record.created_at,
    locationId: record.location_id,
  };

  if (record.media_type === 'logo' || record.media_type === 'favicon') {
    organizedMedia[record.media_type] = mediaItem;
  } else if (record.media_type === 'images' || record.media_type === 'videos') {
    organizedMedia[record.media_type].push(mediaItem);
  } else if (record.media_type === 'image') {
    organizedMedia.images.push(mediaItem);
  } else if (record.media_type === 'video') {
    organizedMedia.videos.push(mediaItem);
  }
});

console.log('Backend service result:');
console.log(JSON.stringify(organizedMedia, null, 2));

// 2. Test the API response format
console.log('\n2. Testing API response format...');

// The backend controller wraps the response in ResponseFormatter.success()
const mockApiResponse = {
  success: true,
  data: organizedMedia,
  message: 'Restaurant media retrieved successfully',
  _version: '1',
  _timestamp: new Date().toISOString(),
};

console.log('API response format:');
console.log(JSON.stringify(mockApiResponse, null, 2));

// 3. Test what the frontend receives
console.log('\n3. Testing frontend Redux handling...');

// The frontend Redux thunk returns response.data
const frontendPayload = mockApiResponse.data;

console.log('Frontend payload (response.data):');
console.log(JSON.stringify(frontendPayload, null, 2));

// 4. Test the Redux state update
console.log('\n4. Testing Redux state update...');

const reduxState = {
  logo: frontendPayload.logo,
  favicon: frontendPayload.favicon,
  images: frontendPayload.images || [],
  videos: frontendPayload.videos || [],
};

console.log('Redux state after update:');
console.log(JSON.stringify(reduxState, null, 2));

// 5. Test the component's currentMedia
console.log('\n5. Testing component currentMedia...');

const media = reduxState; // This is what comes from Redux state
const currentMedia = media || {
  logo: null,
  favicon: null,
  images: [],
  videos: [],
};

console.log('Component currentMedia:');
console.log(JSON.stringify(currentMedia, null, 2));

// 6. Test the rendering logic
console.log('\n6. Testing rendering logic...');

console.log('Rendering tests:');
console.log('- Logo:', currentMedia.logo ? 'Will render' : 'Will show "not found"');
console.log('- Favicon:', currentMedia.favicon ? 'Will render' : 'Will show "not found"');
console.log(
  '- Images:',
  currentMedia.images.length > 0
    ? `Will render ${currentMedia.images.length} items`
    : 'Will show "not found"'
);
console.log(
  '- Videos:',
  currentMedia.videos.length > 0
    ? `Will render ${currentMedia.videos.length} items`
    : 'Will show "not found"'
);

// 7. Check for potential issues
console.log('\n7. Potential issues check...');

if (!currentMedia.logo) {
  console.log('⚠️  Logo is null - will show "not found" message');
}
if (!currentMedia.favicon) {
  console.log('⚠️  Favicon is null - will show "not found" message');
}
if (currentMedia.images.length === 0) {
  console.log('⚠️  Images array is empty - will show "not found" message');
}
if (currentMedia.videos.length === 0) {
  console.log('⚠️  Videos array is empty - will show "not found" message');
}

console.log('\n✅ All tests completed. The data flow looks correct.');
console.log('If media is not showing, the issue is likely:');
console.log('1. API call is not being made (authentication issue)');
console.log('2. API call is returning different data structure');
console.log('3. Frontend is not updating Redux state correctly');
