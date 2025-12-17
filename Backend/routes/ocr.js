const express = require('express');
const router = express.Router();
const Contract = require('../models/Contract');
const { extractIdCardNumber, compareIdNumbers } = require('../services/ocrService');

/**
 * POST /api/ocr/verify-id-card/:contractId
 * Verify customer ID card number matches the number extracted from ID card image
 */
router.post('/verify-id-card/:contractId', async (req, res) => {
  try {
    const contractId = parseInt(req.params.contractId);

    if (!contractId || isNaN(contractId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid contract ID'
      });
    }

    console.log(`🔍 Starting ID card verification for contract #${contractId}...`);

    // Step 1: Get contract details including customer ID card image and number
    const contract = await Contract.getById(contractId);

    if (!contract) {
      return res.status(404).json({
        success: false,
        error: 'Contract not found'
      });
    }

    // Check if ID card image exists
    if (!contract.customer_id_card_image) {
      return res.status(400).json({
        success: false,
        error: 'No ID card image found for this contract'
      });
    }

    // Check if ID card number exists
    if (!contract.customer_id_card_number) {
      return res.status(400).json({
        success: false,
        error: 'No ID card number found for this contract'
      });
    }

    // Step 2: Convert image to buffer if needed
    let imageBuffer;
    if (Buffer.isBuffer(contract.customer_id_card_image)) {
      imageBuffer = contract.customer_id_card_image;
    } else if (typeof contract.customer_id_card_image === 'string') {
      // If it's a base64 string, convert to buffer
      const base64Data = contract.customer_id_card_image.replace(/^data:image\/\w+;base64,/, '');
      imageBuffer = Buffer.from(base64Data, 'base64');
    } else {
      return res.status(400).json({
        success: false,
        error: 'Invalid image format'
      });
    }

    console.log(`📸 Processing ID card image (${Math.round(imageBuffer.length / 1024)}KB)...`);

    // Step 3: Extract ID number from image using OCR
    const extractionResult = await extractIdCardNumber(imageBuffer);

    if (!extractionResult.success || !extractionResult.idNumber) {
      // Return more detailed error information for debugging
      return res.status(400).json({
        success: false,
        error: 'Failed to extract ID number from image. Please ensure the image is clear and the ID number is visible.',
        extractionConfidence: extractionResult.confidence || 0,
        rawText: extractionResult.rawText ? extractionResult.rawText.substring(0, 500) : null,
        hint: 'Check backend console logs for full OCR text output'
      });
    }

    console.log(`✅ Extracted ID number: ${extractionResult.idNumber} (Confidence: ${Math.round(extractionResult.confidence * 100)}%)`);

    // Step 4: Compare extracted ID number with stored ID number
    const comparison = compareIdNumbers(
      extractionResult.idNumber,
      contract.customer_id_card_number
    );

    console.log(`🔍 Comparison result: ${comparison.match ? 'MATCH ✓' : 'MISMATCH ✗'}`);

    // Step 5: Return verification result
    res.json({
      success: true,
      match: comparison.match,
      extractedIdNumber: extractionResult.idNumber,
      storedIdNumber: contract.customer_id_card_number,
      normalizedExtracted: comparison.normalizedExtracted,
      normalizedStored: comparison.normalizedStored,
      reason: comparison.reason,
      extractionConfidence: extractionResult.confidence,
      contractId: contractId,
      customerName: contract.customer_name
    });

  } catch (error) {
    console.error('❌ ID card verification error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to verify ID card number'
    });
  }
});

/**
 * POST /api/ocr/verify-sponsor-id/:contractId/:sponsorId
 * Verify sponsor ID card number matches the number extracted from ID card image
 */
router.post('/verify-sponsor-id/:contractId/:sponsorId', async (req, res) => {
  try {
    const contractId = parseInt(req.params.contractId);
    const sponsorId = parseInt(req.params.sponsorId);

    if (!contractId || isNaN(contractId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid contract ID'
      });
    }

    if (!sponsorId || isNaN(sponsorId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid sponsor ID'
      });
    }

    console.log(`🔍 Starting sponsor ID card verification for contract #${contractId}, sponsor #${sponsorId}...`);

    // Step 1: Get sponsor details
    const sponsors = await Contract.getSponsors(contractId);
    const sponsor = sponsors.find(s => s.id === sponsorId);

    if (!sponsor) {
      return res.status(404).json({
        success: false,
        error: 'Sponsor not found'
      });
    }

    // Check if ID card image exists
    if (!sponsor.id_card_image) {
      return res.status(400).json({
        success: false,
        error: 'No ID card image found for this sponsor'
      });
    }

    // Check if ID card number exists
    if (!sponsor.id_card_number) {
      return res.status(400).json({
        success: false,
        error: 'No ID card number found for this sponsor'
      });
    }

    // Step 2: Convert image to buffer if needed
    // Note: getSponsors() converts buffer to base64 string, may include data URL prefix
    let imageBuffer;
    if (Buffer.isBuffer(sponsor.id_card_image)) {
      imageBuffer = sponsor.id_card_image;
    } else if (typeof sponsor.id_card_image === 'string') {
      // If it's a base64 string (may have data URL prefix), convert to buffer
      let base64Data = sponsor.id_card_image;
      
      // Remove data URL prefix if present (e.g., "data:image/jpeg;base64,")
      if (base64Data.includes(',')) {
        base64Data = base64Data.split(',')[1];
      } else if (base64Data.startsWith('data:')) {
        // If it starts with data: but no comma, it's malformed, try to extract anyway
        base64Data = base64Data.replace(/^data:image\/\w+;base64,/, '');
      }
      
      imageBuffer = Buffer.from(base64Data, 'base64');
    } else {
      return res.status(400).json({
        success: false,
        error: 'Invalid image format'
      });
    }

    console.log(`📸 Processing sponsor ID card image (${Math.round(imageBuffer.length / 1024)}KB)...`);

    // Step 3: Extract ID number from image using OCR
    const extractionResult = await extractIdCardNumber(imageBuffer);

    if (!extractionResult.success || !extractionResult.idNumber) {
      return res.status(400).json({
        success: false,
        error: 'Failed to extract ID number from image. Please ensure the image is clear and the ID number is visible.',
        extractionConfidence: extractionResult.confidence || 0,
        rawText: extractionResult.rawText ? extractionResult.rawText.substring(0, 500) : null,
        hint: 'Check backend console logs for full OCR text output'
      });
    }

    console.log(`✅ Extracted sponsor ID number: ${extractionResult.idNumber} (Confidence: ${Math.round(extractionResult.confidence * 100)}%)`);

    // Step 4: Compare extracted ID number with stored ID number
    const comparison = compareIdNumbers(
      extractionResult.idNumber,
      sponsor.id_card_number
    );

    console.log(`🔍 Sponsor comparison result: ${comparison.match ? 'MATCH ✓' : 'MISMATCH ✗'}`);

    // Step 5: Return verification result
    res.json({
      success: true,
      match: comparison.match,
      extractedIdNumber: extractionResult.idNumber,
      storedIdNumber: sponsor.id_card_number,
      normalizedExtracted: comparison.normalizedExtracted,
      normalizedStored: comparison.normalizedStored,
      reason: comparison.reason,
      extractionConfidence: extractionResult.confidence,
      contractId: contractId,
      sponsorId: sponsorId,
      sponsorName: sponsor.full_name
    });

  } catch (error) {
    console.error('❌ Sponsor ID card verification error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to verify sponsor ID card number'
    });
  }
});

module.exports = router;
