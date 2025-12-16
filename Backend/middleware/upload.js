const multer = require('multer');
const path = require('path');
const sharp = require('sharp');

// Image compression function
const compressImageBuffer = async (buffer) => {
  try {
    if (!buffer || buffer.length === 0) {
      return null;
    }

    // If file is already small (< 500KB), skip compression
    if (buffer.length <= 500 * 1024) {
      console.log(`Image already small (${Math.round(buffer.length / 1024)}KB), skipping compression`);
      return buffer;
    }

    // Compress using Sharp
    const compressedBuffer = await sharp(buffer)
      .jpeg({
        quality: buffer.length > 2 * 1024 * 1024 ? 70 :  // > 2MB: 70% quality
                 buffer.length > 1 * 1024 * 1024 ? 80 :  // > 1MB: 80% quality
                 85,  // Default: 85% quality
        progressive: true
      })
      .resize({
        width: 1200,  // Max width
        height: 1200, // Max height
        fit: 'inside', // Maintain aspect ratio
        withoutEnlargement: true // Don't enlarge smaller images
      })
      .toBuffer();

    console.log(`✅ Image compressed: ${Math.round(buffer.length / 1024)}KB → ${Math.round(compressedBuffer.length / 1024)}KB (${Math.round((compressedBuffer.length / buffer.length) * 100)}%)`);

    return compressedBuffer;
  } catch (error) {
    console.error('❌ Image compression failed:', error.message);
    // Return original buffer if compression fails
    return buffer;
  }
};

// Configure multer for file uploads
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  // Check if file is an image
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit for individual files
    fieldSize: 20 * 1024 * 1024, // ⭐ ADD THIS: 20MB limit for JSON fields (sponsors_data)
    fields: 50, // ⭐ ADD THIS: Max number of non-file fields
    files: 10,  // ⭐ ADD THIS: Max number of file fields
    parts: 100  // ⭐ ADD THIS: Max total parts (fields + files)
  },
  fileFilter: fileFilter
});

module.exports = upload;
module.exports.compressImageBuffer = compressImageBuffer;