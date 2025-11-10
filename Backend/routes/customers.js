const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');
const upload = require('../middleware/upload');

// POST /api/customers/check - Check if customer exists
router.post('/check', async (req, res) => {
  try {
    const { id_card_number } = req.body;
    
    if (!id_card_number) {
      return res.status(400).json({
        success: false,
        error: 'ID card number is required'
      });
    }

    const customer = await Customer.checkByIdCard(id_card_number);
    
    res.json({
      success: true,
      exists: !!customer,
      type: customer?.type,
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

// POST /api/customers/create-or-update - Create or update customer
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
      message: result.message
    });

  } catch (error) {
    console.error('Customer create/update error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save customer information'
    });
  }
});

module.exports = router;