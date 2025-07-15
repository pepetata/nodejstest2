const RestaurantMediaModel = require('./src/models/restaurantMediaModel');

(async () => {
  try {
    console.log('Testing media endpoint...');

    // Test the getByRestaurant method
    const mediaRecords = await RestaurantMediaModel.getByRestaurant('1'); // Replace with actual restaurant ID

    console.log('Raw media records from database:');
    console.log(JSON.stringify(mediaRecords, null, 2));

    // Test organization logic
    const organizedMedia = {
      logo: null,
      favicon: null,
      images: [],
      videos: [],
    };

    mediaRecords.forEach((record) => {
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
      } else {
        // Multiple file types
        organizedMedia[record.media_type].push(mediaItem);
      }
    });

    console.log('\nOrganized media:');
    console.log(JSON.stringify(organizedMedia, null, 2));

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
})();
