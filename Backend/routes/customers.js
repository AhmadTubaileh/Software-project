const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');
const upload = require('../middleware/upload');

// POST /api/customers/check - Enhanced check across all tables
router.post('/check', async (req, res) => {
  try {
    const { id_card_number, target_type = 'customer' } = req.body;
    
    if (!id_card_number) {
      return res.status(400).json({
        success: false,
        error: 'ID card number is required'
      });
    }

    const customer = await Customer.checkByIdCard(id_card_number, target_type);
    
    res.json({
      success: true,
      exists: !!customer,
      type: customer?.type,
      source_table: customer?.source_table,
      customerData: customer || null
    });

  } catch (error) {
    console.error('Customer check error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check customer'
    });
  }
});

// POST /api/customers/create-or-update - Create or update customer (with migration logic)
router.post('/create-or-update', upload.single('id_card_image'), async (req, res) => {
  try {
    const customerData = {
      full_name: req.body.full_name,
      phone: req.body.phone,
      id_card_number: req.body.id_card_number,
      address: req.body.address,
      email: req.body.email || null,
      id_card_image: req.file ? req.file.buffer : null
    };

    // Validate required fields
    if (!customerData.full_name || !customerData.phone || !customerData.id_card_number || !customerData.address) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: full_name, phone, id_card_number, address'
      });
    }

    const result = await Customer.createOrUpdate(customerData);
    
    res.json({
      success: true,
      customerId: result.customerId,
      message: result.message,
      action: result.action
    });

  } catch (error) {
    console.error('Customer create/update error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save customer information'
    });
  }
});

// POST /api/customers/create-or-update-sponsor - Create or update sponsor
router.post('/create-or-update-sponsor', upload.single('id_card_image'), async (req, res) => {
  try {
    const sponsorData = {
      full_name: req.body.full_name,
      phone: req.body.phone,
      id_card_number: req.body.id_card_number,
      address: req.body.address,
      relationship: req.body.relationship || '',
      id_card_image: req.file ? req.file.buffer : null
    };

    // Validate required fields
    if (!sponsorData.full_name || !sponsorData.phone || !sponsorData.id_card_number || !sponsorData.address) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: full_name, phone, id_card_number, address'
      });
    }

    const result = await Customer.createOrUpdateSponsor(sponsorData);
    
    res.json({
      success: true,
      sponsorId: result.sponsorId,
      message: result.message,
      action: result.action
    });

  } catch (error) {
    console.error('Sponsor create/update error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save sponsor information'
    });
  }
});

module.exports = router;