const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../../public/uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Helper function to create organized folder structure
const createOrganizedFolder = (mediaType, restaurantUrlName, locationUrlName = null) => {
  let folderPath;

  switch (mediaType) {
    case 'logo':
      folderPath = path.join(uploadsDir, 'logo', restaurantUrlName);
      break;
    case 'favicon':
      folderPath = path.join(uploadsDir, 'favicons', restaurantUrlName);
      break;
    case 'images':
      folderPath = path.join(uploadsDir, 'restaurant_images', restaurantUrlName, locationUrlName);
      break;
    case 'videos':
      folderPath = path.join(uploadsDir, 'restaurant_videos', restaurantUrlName, locationUrlName);
      break;
    default:
      throw new Error(`Unsupported media type: ${mediaType}`);
  }

  // Create directory if it doesn't exist
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }

  return folderPath;
};

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    try {
      const { mediaType } = req.body;
      const locationId = req.body.locationId;

      // We need to get restaurant and location URL names
      // For now, use temp directory and move files later in the service
      const tempDir = path.join(uploadsDir, 'temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      cb(null, tempDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    // Generate a unique filename while preserving the original name
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const originalName = path.parse(file.originalname).name;
    const extension = path.extname(file.originalname);
    cb(null, `${originalName}-${uniqueSuffix}${extension}`);
  },
});

// File filter
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/x-icon',
    'image/vnd.microsoft.icon',
    'video/mp4',
    'video/webm',
    'video/ogg',
    'video/avi',
    'video/mov',
    'video/wmv',
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Tipo de arquivo não suportado: ${file.mimetype}`), false);
  }
};

// Create multer instance
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
    files: 10, // Maximum 10 files
  },
});

// Middleware for restaurant media upload
const uploadRestaurantMedia = upload.array('files', 10);

module.exports = {
  uploadRestaurantMedia,
  upload,
  createOrganizedFolder,
};
