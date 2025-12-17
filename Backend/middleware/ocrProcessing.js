const sharp = require('sharp');

/**
 * Image Processing Module for OCR
 * Preprocesses images to improve OCR accuracy
 */

/**
 * Preprocess image for OCR extraction
 * Focuses on top-center region where ID number is typically located
 * @param {Buffer} imageBuffer - Original image buffer
 * @returns {Promise<Buffer>} - Preprocessed image buffer
 */
exports.preprocessImageForOCR = async (imageBuffer) => {
  try {
    if (!imageBuffer || imageBuffer.length === 0) {
      throw new Error('Invalid image buffer');
    }

    console.log(`🔄 Starting image preprocessing... (Original size: ${Math.round(imageBuffer.length / 1024)}KB)`);

    // Get image metadata to determine dimensions
    const metadata = await sharp(imageBuffer).metadata();
    const width = metadata.width;
    const height = metadata.height;

    console.log(`📐 Image dimensions: ${width}x${height}`);

    // Step 1: Auto-rotate based on EXIF data (deskewing)
    let processed = await sharp(imageBuffer)
      .rotate() // Auto-rotate based on EXIF orientation
      .toBuffer();

    // Get rotated dimensions (in case rotation changed them)
    const rotatedMetadata = await sharp(processed).metadata();
    const rotatedWidth = rotatedMetadata.width;
    const rotatedHeight = rotatedMetadata.height;

    // Step 2: Crop to top-center region where ID number is located
    // Focus on upper 40% of image, center 60% width (adjust these values as needed)
    const cropTop = 0; // Start from top
    const cropHeight = Math.floor(rotatedHeight * 0.40); // Top 40% of image
    const cropLeft = Math.floor(rotatedWidth * 0.20); // Start 20% from left
    const cropWidth = Math.floor(rotatedWidth * 0.60); // 60% width (center region)

    console.log(`✂️ Cropping to top-center region: ${cropLeft},${cropTop},${cropWidth}x${cropHeight}`);

    processed = await sharp(processed)
      .extract({
        left: cropLeft,
        top: cropTop,
        width: cropWidth,
        height: cropHeight
      })
      .toBuffer();

    // Step 3: Enhance contrast and brightness for better text visibility
    // Increased sharpening for better text edge detection (important for Arabic/Hebrew)
    processed = await sharp(processed)
      .normalize() // Enhance contrast
      .sharpen({ sigma: 1.5, flat: 1, jagged: 2 }) // Enhanced sharpening for text clarity
      .toBuffer();

    // Step 4: Convert to grayscale (better for OCR)
    processed = await sharp(processed)
      .greyscale()
      .toBuffer();

    // Step 5: Enhance contrast further for better text clarity
    // Increased contrast boost for Arabic/Hebrew text recognition
    processed = await sharp(processed)
      .linear(1.3, -(128 * 0.3)) // Increased contrast boost
      .normalize() // Normalize again
      .toBuffer();

    console.log(`✅ Image preprocessing complete (Processed size: ${Math.round(processed.length / 1024)}KB)`);

    return processed;
  } catch (error) {
    console.error('❌ Image preprocessing error:', error.message);
    // Return original buffer if preprocessing fails
    return imageBuffer;
  }
};

/**
 * Alternative preprocessing with binarization (black & white)
 * Also focuses on top-center region where ID number is located
 * Use this if OCR accuracy is low with standard preprocessing
 */
exports.preprocessImageWithBinarization = async (imageBuffer) => {
  try {
    if (!imageBuffer || imageBuffer.length === 0) {
      throw new Error('Invalid image buffer');
    }

    console.log(`🔄 Starting binarization preprocessing...`);

    // Rotate and get dimensions
    const rotatedMetadata = await sharp(imageBuffer).rotate().metadata();
    const rotatedWidth = rotatedMetadata.width;
    const rotatedHeight = rotatedMetadata.height;

    // Crop to top-center region (same as standard preprocessing)
    const cropTop = 0;
    const cropHeight = Math.floor(rotatedHeight * 0.40); // Top 40% of image
    const cropLeft = Math.floor(rotatedWidth * 0.20); // Start 20% from left
    const cropWidth = Math.floor(rotatedWidth * 0.60); // 60% width (center region)

    console.log(`✂️ Cropping to top-center region for binarization: ${cropLeft},${cropTop},${cropWidth}x${cropHeight}`);

    // Rotate, crop, enhance, and convert to grayscale
    let processed = await sharp(imageBuffer)
      .rotate()
      .extract({
        left: cropLeft,
        top: cropTop,
        width: cropWidth,
        height: cropHeight
      })
      .normalize()
      .greyscale()
      .toBuffer();

    // Apply threshold to create black and white image
    // This helps OCR when background is noisy
    processed = await sharp(processed)
      .threshold(128) // Threshold at mid-point (0-255)
      .toBuffer();

    console.log(`✅ Binarization preprocessing complete`);

    return processed;
  } catch (error) {
    console.error('❌ Binarization preprocessing error:', error.message);
    return imageBuffer;
  }
};
