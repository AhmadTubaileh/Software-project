const Tesseract = require('tesseract.js');
const { preprocessImageForOCR, preprocessImageWithBinarization } = require('../middleware/ocrProcessing');

/**
 * OCR Service for extracting ID card numbers from images
 * Uses Tesseract.js for local OCR processing
 */

/**
 * Extract ID card number from image
 * @param {Buffer} imageBuffer - Preprocessed image buffer
 * @returns {Promise<Object>} - Extracted ID number and confidence
 */
exports.extractIdCardNumber = async (imageBuffer) => {
  try {
    if (!imageBuffer || imageBuffer.length === 0) {
      throw new Error('Invalid image buffer');
    }

    console.log('🤖 Starting OCR extraction...');

    // Step 1: Preprocess image for better OCR accuracy
    let preprocessedImage = await preprocessImageForOCR(imageBuffer);

    // Step 2: Run OCR with Tesseract
    // Using 'eng+ara' to support both English and Arabic/Hebrew text
    // This is important for Palestinian ID cards which have bilingual text
    let { data: { text, confidence } } = await Tesseract.recognize(
      preprocessedImage,
      'eng+ara', // Language: English + Arabic (supports Arabic and Hebrew characters)
      {
        logger: (m) => {
          // Log progress (optional, can be removed for production)
          if (m.status === 'recognizing text') {
            console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
          }
        }
      }
    );

    console.log(`✅ OCR extraction complete (Confidence: ${Math.round(confidence)}%)`);
    console.log(`📄 Full Raw OCR text (first 500 chars):`);
    console.log(text.substring(0, 500));
    console.log(`📄 Full Raw OCR text length: ${text.length} characters`);

    // Step 3: Extract ID number from OCR text using pattern matching
    let idNumber = extractIdNumberFromText(text);

    // Step 4: If extraction failed, try with binarization preprocessing
    if (!idNumber) {
      console.log('⚠️ Could not extract ID number with standard preprocessing, trying binarization...');
      preprocessedImage = await preprocessImageWithBinarization(imageBuffer);
      
      const binarizedResult = await Tesseract.recognize(
        preprocessedImage,
        'eng+ara',
        {
          logger: (m) => {
            if (m.status === 'recognizing text') {
              console.log(`Binarized OCR Progress: ${Math.round(m.progress * 100)}%`);
            }
          }
        }
      );
      
      console.log(`✅ Binarized OCR complete (Confidence: ${Math.round(binarizedResult.data.confidence)}%)`);
      console.log(`📄 Binarized OCR text (first 500 chars):`);
      console.log(binarizedResult.data.text.substring(0, 500));
      
      idNumber = extractIdNumberFromText(binarizedResult.data.text);
      
      if (idNumber) {
        console.log('✅ Successfully extracted ID number using binarization preprocessing');
        text = binarizedResult.data.text;
        confidence = binarizedResult.data.confidence;
      } else {
        console.log('⚠️ Still could not extract ID number with binarization');
        console.log('📄 Full OCR text for debugging:', text);
      }
    }

    return {
      success: true,
      idNumber: idNumber,
      confidence: confidence / 100, // Convert to 0-1 scale
      rawText: text.trim()
    };

  } catch (error) {
    console.error('❌ OCR extraction error:', error.message);
    throw new Error(`OCR extraction failed: ${error.message}`);
  }
};

/**
 * Extract ID card number from OCR text using pattern matching
 * Optimized for Palestinian ID cards (9 digits, can have spaces like "4 0913570 4")
 * 
 * @param {string} text - Raw OCR text
 * @returns {string|null} - Extracted ID number or null
 */
function extractIdNumberFromText(text) {
  if (!text || typeof text !== 'string') {
    return null;
  }

  console.log('🔍 Searching for ID number patterns...');
  console.log('📄 OCR text sample:', text.substring(0, 200));

  // Pattern 1: Look for Palestinian ID format with spaces (e.g., "4 0913570 4")
  // This is the MOST IMPORTANT pattern - matches the exact format at top-center
  // Matches: single digit, space(s), 7 digits, space(s), single digit
  // Examples: "4 0913570 4", "4  0913570  4", "4-0913570-4", etc.
  const palestinianPattern = /\b(\d\s{0,3}\d{7}\s{0,3}\d)\b/g;
  const palestinianMatches = text.match(palestinianPattern);
  
  if (palestinianMatches && palestinianMatches.length > 0) {
    // Try each match to find the one that looks most like an ID number
    for (const match of palestinianMatches) {
      // Clean up the match: remove all spaces and non-digit characters, keep only digits
      let idNumber = match.replace(/\D/g, '');
      
      // Verify it's exactly 9 digits (Palestinian ID format)
      if (idNumber.length === 9 && /^[1-9]/.test(idNumber)) {
        // Prefer matches that start with 1-9 (not 0) - dates often start with 0
        console.log(`✅ Found Palestinian ID number (Pattern 1 - spaced format): ${idNumber} (from: "${match}")`);
        return idNumber;
      }
    }
    
    // If no perfect match, return the first 9-digit one anyway
    for (const match of palestinianMatches) {
      let idNumber = match.replace(/\D/g, '');
      if (idNumber.length === 9) {
        console.log(`✅ Found Palestinian ID number (Pattern 1 - fallback): ${idNumber}`);
        return idNumber;
      }
    }
  }

  // Pattern 2: Look for 9 consecutive digits (Palestinian ID without spaces)
  // Prefer numbers that start with 1-9 (not 0) to avoid dates
  const pattern2 = /\b\d{9}\b/g;
  const matches2 = text.match(pattern2);
  
  if (matches2 && matches2.length > 0) {
    // Prefer matches that start with 1-9 (Palestinian IDs typically start with 1-9, not 0)
    const preferredMatches = matches2.filter(m => /^[1-9]/.test(m));
    if (preferredMatches.length > 0) {
      const idNumber = preferredMatches[0];
      console.log(`✅ Found ID number (Pattern 2 - 9 digits, preferred): ${idNumber}`);
      return idNumber;
    }
    // Fallback to first match if no preferred ones
    const idNumber = matches2[0];
    console.log(`✅ Found ID number (Pattern 2 - 9 digits, fallback): ${idNumber}`);
    return idNumber;
  }

  // Pattern 3: Look for spaced format more flexibly (handles OCR spacing issues)
  // Matches: digit, optional space, 7-8 digits, optional space, digit
  const pattern3 = /\b\d\s*\d{7,8}\s*\d\b/g;
  const matches3 = text.match(pattern3);
  
  if (matches3 && matches3.length > 0) {
    // Clean and verify length
    let idNumber = matches3[0].replace(/\D/g, '');
    if (idNumber.length === 9) {
      console.log(`✅ Found ID number (Pattern 3 - spaced format): ${idNumber}`);
      return idNumber;
    }
  }

  // Pattern 4: Look for any sequence of 8-10 digits (fallback, Palestinian IDs are 9)
  const pattern4 = /\b\d{8,10}\b/g;
  const matches4 = text.match(pattern4);
  
  if (matches4 && matches4.length > 0) {
    // Filter for 9-digit matches
    const nineDigitMatches = matches4.filter(m => m.replace(/\D/g, '').length === 9);
    if (nineDigitMatches.length > 0) {
      const idNumber = nineDigitMatches[0].replace(/\D/g, '');
      console.log(`✅ Found ID number (Pattern 4 - 8-10 digit fallback): ${idNumber}`);
      return idNumber;
    }
  }

  // Pattern 5: Last resort - extract all digits and look for 9-digit sequences
  const allDigits = text.replace(/\D/g, '');
  if (allDigits.length >= 9) {
    // Look for 9-digit sequences in the digit string
    for (let i = 0; i <= allDigits.length - 9; i++) {
      const candidate = allDigits.substring(i, i + 9);
      // Palestinian IDs typically start with 1-9 (not 0) and have reasonable digit distribution
      if (/^[1-9]/.test(candidate)) {
        console.log(`✅ Found ID number (Pattern 5 - digit extraction): ${candidate}`);
        return candidate;
      }
    }
  }

  console.log('⚠️ No ID number pattern found in OCR text');
  console.log('⚠️ Available digits in text:', text.replace(/\D/g, '').substring(0, 20));
  return null;
}

/**
 * Compare extracted ID number with stored ID number
 * Handles variations in formatting (spaces, dashes, etc.)
 * 
 * @param {string} extractedId - ID number extracted from image
 * @param {string} storedId - ID number stored in database
 * @returns {Object} - Comparison result
 */
exports.compareIdNumbers = (extractedId, storedId) => {
  if (!extractedId || !storedId) {
    return {
      match: false,
      reason: 'Missing ID number(s)',
      extractedId: extractedId || null,
      storedId: storedId || null
    };
  }

  // Normalize both IDs: remove spaces, dashes, and convert to uppercase
  const normalizeId = (id) => {
    return String(id)
      .replace(/[\s\-_]/g, '') // Remove spaces, dashes, underscores
      .trim()
      .toUpperCase();
  };

  const normalizedExtracted = normalizeId(extractedId);
  const normalizedStored = normalizeId(storedId);

  const match = normalizedExtracted === normalizedStored;

  return {
    match: match,
    extractedId: extractedId,
    storedId: storedId,
    normalizedExtracted: normalizedExtracted,
    normalizedStored: normalizedStored,
    reason: match ? 'ID numbers match' : 'ID numbers do not match'
  };
};
