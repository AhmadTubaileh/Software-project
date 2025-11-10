const express = require('express');
const router = express.Router();
const Contract = require('../models/Contract');
const upload = require('../middleware/upload');

// GET /api/contracts/items - Get items available for installment
router.get('/items', async (req, res) => {
  try {
    const items = await Contract.getInstallmentItems();
    res.json(items);
  } catch (error) {
    console.error('Get installment items error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch installment items'
    });
  }
});

// GET /api/contracts/pending - Get all pending contracts for review
router.get('/pending', async (req, res) => {
  try {
    const contracts = await Contract.getPendingContracts();
    res.json({
      success: true,
      contracts
    });
  } catch (error) {
    console.error('Get pending contracts error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch pending contracts'
    });
  }
});

// POST /api/contracts/apply - Apply for new contract
router.post('/apply', upload.fields([
  { name: 'customer_id_card_image', maxCount: 1 },
  { name: 'sponsor_0_id_card_image', maxCount: 1 },
  { name: 'sponsor_1_id_card_image', maxCount: 1 },
  { name: 'sponsor_2_id_card_image', maxCount: 1 },
  { name: 'sponsor_3_id_card_image', maxCount: 1 },
  { name: 'sponsor_4_id_card_image', maxCount: 1 }
]), async (req, res) => {
  try {
    // Parse the form data
    const customer_data = JSON.parse(req.body.customer_data);
    const sponsors_data = JSON.parse(req.body.sponsors_data);
    const contract_data = JSON.parse(req.body.contract_data);

    // Handle file uploads
    if (req.files && req.files['customer_id_card_image']) {
      customer_data.id_card_image = req.files['customer_id_card_image'][0].buffer;
    }

    // Handle sponsor file uploads
    if (req.files) {
      sponsors_data.forEach((sponsor, index) => {
        const fileField = `sponsor_${index}_id_card_image`;
        if (req.files[fileField]) {
          sponsor.id_card_image = req.files[fileField][0].buffer;
        }
      });
    }

    // Apply for contract
    const result = await Contract.apply({
      customer_data,
      sponsors_data,
      contract_data
    });

    res.json({
      success: true,
      contractId: result.contractId,
      saleId: result.saleId,
      message: 'Contract application submitted successfully and item reserved'
    });

  } catch (error) {
    console.error('Contract application error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to submit contract application'
    });
  }
});

// PUT /api/contracts/:id/approve - Approve a contract
router.put('/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const { approver_id } = req.body;

    if (!approver_id) {
      return res.status(400).json({
        success: false,
        error: 'Approver ID is required'
      });
    }

    const result = await Contract.approve(id, approver_id);

    res.json({
      success: true,
      message: result.message
    });

  } catch (error) {
    console.error('Contract approval error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to approve contract'
    });
  }
});

// PUT /api/contracts/:id/reject - Reject a contract
router.put('/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;
    const { approver_id, reason } = req.body;

    if (!approver_id) {
      return res.status(400).json({
        success: false,
        error: 'Approver ID is required'
      });
    }

    const result = await Contract.reject(id, approver_id, reason);

    res.json({
      success: true,
      message: result.message
    });

  } catch (error) {
    console.error('Contract rejection error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to reject contract'
    });
  }
});

module.exports = router;