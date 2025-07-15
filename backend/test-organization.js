// Direct test of the media organization logic
const mediaRecords = [
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

// Test the organization logic
const organizedMedia = {
  logo: null,
  favicon: null,
  images: [],
  videos: [],
};

console.log('Testing media organization with actual database data...');
console.log('Input records:', mediaRecords.length);

mediaRecords.forEach((record) => {
  console.log(`Processing record: ${record.id}, type: ${record.media_type}`);

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
    console.log(`✅ Added ${record.media_type} to single file`);
  } else if (record.media_type === 'images' || record.media_type === 'videos') {
    // Multiple file types (plural)
    organizedMedia[record.media_type].push(mediaItem);
    console.log(`✅ Added ${record.media_type} to array`);
  } else if (record.media_type === 'image') {
    // Handle singular 'image' -> 'images'
    organizedMedia.images.push(mediaItem);
    console.log(`✅ Mapped singular 'image' to 'images' array`);
  } else if (record.media_type === 'video') {
    // Handle singular 'video' -> 'videos'
    organizedMedia.videos.push(mediaItem);
    console.log(`✅ Mapped singular 'video' to 'videos' array`);
  } else {
    console.log(`❌ Unknown media type: ${record.media_type}`);
  }
});

console.log('\n🎯 Final organized media:');
console.log('Logo:', organizedMedia.logo ? 'Present' : 'None');
console.log('Favicon:', organizedMedia.favicon ? 'Present' : 'None');
console.log('Images:', organizedMedia.images.length);
console.log('Videos:', organizedMedia.videos.length);

console.log('\n📊 Full organized media structure:');
console.log(JSON.stringify(organizedMedia, null, 2));
