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

// GET /api/contracts/all - Get all contracts with filters
router.get('/all', async (req, res) => {
  try {
    const { status } = req.query;
    const contracts = await Contract.getAllContracts(status);
    
    res.json({
      success: true,
      contracts
    });
  } catch (error) {
    console.error('Get all contracts error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch contracts'
    });
  }
});

// GET /api/contracts/:id - Get contract details by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const contract = await Contract.getById(id);
    
    if (!contract) {
      return res.status(404).json({
        success: false,
        error: 'Contract not found'
      });
    }

    res.json({
      success: true,
      contract
    });
  } catch (error) {
    console.error('Get contract error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch contract details'
    });
  }
});

// GET /api/contracts/:id/payments - Get payment schedule for contract
router.get('/:id/payments', async (req, res) => {
  try {
    const { id } = req.params;
    
    // First get the contract to find sale_id
    const contract = await Contract.getById(id);
    if (!contract) {
      return res.status(404).json({
        success: false,
        error: 'Contract not found'
      });
    }

    const payments = await Contract.getPaymentSchedule(contract.sale_id);
    
    res.json({
      success: true,
      payments
    });
  } catch (error) {
    console.error('Get payment schedule error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch payment schedule'
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
      message: result.message,
      paymentsCreated: result.paymentsCreated
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