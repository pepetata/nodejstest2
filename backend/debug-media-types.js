// Simple test to check media types in database
// This will help us identify if media_type values are correct

// Expected media types from schema:
const expectedMediaTypes = ['logo', 'favicon', 'images', 'videos'];

// If database has: 'logo', 'favicon', 'image', 'video' (singular)
// Then we need to handle this mapping in the frontend or fix the database

console.log('Expected media types:', expectedMediaTypes);

// Test the organiztion logic with different scenarios
function testOrganizeMedia(mediaRecords) {
  const organizedMedia = {
    logo: null,
    favicon: null,
    images: [],
    videos: [],
  };

  console.log('Input records:', mediaRecords);

  mediaRecords.forEach((record) => {
    console.log(`Processing record with media_type: "${record.media_type}"`);

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
      // Single file types
      organizedMedia[record.media_type] = mediaItem;
      console.log(`Added ${record.media_type} to organizedMedia`);
    } else if (record.media_type === 'images' || record.media_type === 'videos') {
      // Multiple file types (plural)
      organizedMedia[record.media_type].push(mediaItem);
      console.log(`Added ${record.media_type} to organizedMedia array`);
    } else if (record.media_type === 'image') {
      // Handle singular 'image' -> 'images'
      organizedMedia.images.push(mediaItem);
      console.log(`Mapped singular 'image' to 'images' array`);
    } else if (record.media_type === 'video') {
      // Handle singular 'video' -> 'videos'
      organizedMedia.videos.push(mediaItem);
      console.log(`Mapped singular 'video' to 'videos' array`);
    } else {
      console.log(`Unknown media_type: "${record.media_type}"`);
    }
  });

  console.log('Final organized media:', organizedMedia);
  return organizedMedia;
}

// Test with potential database values
const testRecords = [
  {
    id: 1,
    media_type: 'logo',
    original_filename: 'logo.png',
    filename: 'logo_123.png',
    file_url: '/uploads/logo_123.png',
    file_size: 1024,
    mime_type: 'image/png',
    created_at: new Date(),
    location_id: null,
  },
  {
    id: 2,
    media_type: 'favicon',
    original_filename: 'favicon.ico',
    filename: 'favicon_456.ico',
    file_url: '/uploads/favicon_456.ico',
    file_size: 512,
    mime_type: 'image/x-icon',
    created_at: new Date(),
    location_id: null,
  },
  {
    id: 3,
    media_type: 'image',
    original_filename: 'restaurant.jpg',
    filename: 'restaurant_789.jpg',
    file_url: '/uploads/restaurant_789.jpg',
    file_size: 2048,
    mime_type: 'image/jpeg',
    created_at: new Date(),
    location_id: 1,
  },
  {
    id: 4,
    media_type: 'video',
    original_filename: 'promo.mp4',
    filename: 'promo_101.mp4',
    file_url: '/uploads/promo_101.mp4',
    file_size: 5120,
    mime_type: 'video/mp4',
    created_at: new Date(),
    location_id: 1,
  },
];

testOrganizeMedia(testRecords);
