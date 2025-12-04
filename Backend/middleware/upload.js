const multer = require('multer');
const path = require('path');

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