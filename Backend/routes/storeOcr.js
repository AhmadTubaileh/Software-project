const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { extractIdCardNumber, compareIdNumbers } = require('../services/ocrService');
const upload = require('../middleware/upload');

/**
 * POST /api/ocr/verify-store-customer-id
 * Verify customer ID card for store installment application
 * - Extracts ID number from uploaded photo
 * - Compares with manually entered ID number
 * - Checks against logged-in user's saved ID in database
 */
router.post('/verify-store-customer-id', upload.single('id_card_image'), async (req, res) => {
  try {
    const { id_card_number, user_id } = req.body;

    console.log('🔍 Starting store customer ID card verification...');
    console.log('User ID:', user_id);
    console.log('Entered ID number:', id_card_number);

    // Validate inputs
    if (!id_card_number || !id_card_number.trim()) {
      return res.status(400).json({
        success: false,
        error: 'ID card number is required'
      });
    }

    if (!user_id) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'ID card image is required'
      });
    }

    // Step 1: Get user's saved ID card from database
    const getUserQuery = 'SELECT id_card FROM users WHERE id = ?';
    const userResults = await new Promise((resolve, reject) => {
      db.query(getUserQuery, [user_id], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });

    if (!userResults || userResults.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const savedIdCard = userResults[0].id_card;
    console.log('Saved ID card in database:', savedIdCard || 'NULL');

    // Step 2: Extract ID number from uploaded image using OCR
    const imageBuffer = req.file.buffer;
    console.log(`📸 Processing ID card image (${Math.round(imageBuffer.length / 1024)}KB)...`);

    const extractionResult = await extractIdCardNumber(imageBuffer);

    if (!extractionResult.success || !extractionResult.idNumber) {
      return res.status(400).json({
        success: false,
        error: 'Failed to extract ID number from image. Please ensure the image is clear and the ID number is visible.',
        extractionConfidence: extractionResult.confidence || 0,
        rawText: extractionResult.rawText ? extractionResult.rawText.substring(0, 500) : null,
        hint: 'Try taking a clearer photo with better lighting'
      });
    }

    console.log(`✅ Extracted ID number: ${extractionResult.idNumber} (Confidence: ${Math.round(extractionResult.confidence * 100)}%)`);

    // Step 3: Compare extracted ID with manually entered ID
    const inputComparison = compareIdNumbers(
      extractionResult.idNumber,
      id_card_number
    );

    console.log(`🔍 Input comparison: ${inputComparison.match ? 'MATCH ✓' : 'MISMATCH ✗'}`);

    if (!inputComparison.match) {
      return res.status(400).json({
        success: false,
        error: 'The ID number extracted from the photo does not match the ID number you entered.',
        extractedIdNumber: extractionResult.idNumber,
        enteredIdNumber: id_card_number,
        extractionConfidence: extractionResult.confidence,
        hint: 'Please check that the photo is clear and the ID number is correct'
      });
    }

    // Step 4: Check against saved ID in database
    let databaseMatch = null;
    let canProceed = false;
    let message = '';

    if (savedIdCard && savedIdCard.trim()) {
      // User has a saved ID - must match
      const dbComparison = compareIdNumbers(
        extractionResult.idNumber,
        savedIdCard
      );

      databaseMatch = dbComparison.match;
      console.log(`🔍 Database comparison: ${dbComparison.match ? 'MATCH ✓' : 'MISMATCH ✗'}`);

      if (dbComparison.match) {
        canProceed = true;
        message = 'ID verified successfully! Matches your saved ID.';
      } else {
        canProceed = false;
        message = 'Your ID does not match with the saved ID number in your account.';
      }
    } else {
      // User has no saved ID (NULL) - can proceed, will be saved on submission
      databaseMatch = null;
      canProceed = true;
      message = 'ID verified successfully! This ID will be saved to your account.';
      console.log('✅ User has no saved ID, verification passed');
    }

    // Step 5: Return verification result
    res.json({
      success: true,
      verified: canProceed,
      extractedIdNumber: extractionResult.idNumber,
      enteredIdNumber: id_card_number,
      savedIdNumber: savedIdCard || null,
      databaseMatch: databaseMatch,
      extractionConfidence: extractionResult.confidence,
      message: message,
      imageBuffer: imageBuffer.toString('base64') // Return for frontend to use in submission
    });

  } catch (error) {
    console.error('❌ Store customer ID verification error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to verify ID card'
    });
  }
});

module.exports = router;
