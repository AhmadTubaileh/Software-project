const express = require('express');
const router = express.Router();
const Contract = require('../models/Contract');
const upload = require('../middleware/upload');
const db = require('../config/database');
const Employee = require('../models/Employee');

// Helper function to get accessible branch IDs for a user
async function getAccessibleBranchIds(userId, userType) {
  return new Promise((resolve, reject) => {
    // Admins see all branches (return null to skip filtering)
    if (userType === 0) {
      resolve(null);
      return;
    }
    
    // Get accessible branches for non-admin users
    Employee.getAccessibleBranches(userId, (err, results) => {
      if (err) {
        console.error('Error getting accessible branches:', err);
        reject(err);
        return;
      }
      
      if (!results || results.length === 0) {
        // No accessible branches, return empty array (will show no contracts)
        resolve([]);
        return;
      }
      
      const branchIds = results.map(b => b.id);
      resolve(branchIds);
    });
  });
}

// GET /api/contracts/items - Get items available for installment with latest prices (filtered by branch)
router.get('/items', async (req, res) => {
  try {
    const { branch_id } = req.query;
    const branchId = branch_id ? parseInt(branch_id) : null;
    
    const items = await Contract.getInstallmentItems(branchId);
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
    // Get user info from query or session (for branch filtering)
    const userId = req.query.userId || (req.user ? req.user.id : null);
    const userType = req.query.userType || (req.user ? req.user.user_type : 0);
    
    let branchIds = null;
    if (userId) {
      try {
        branchIds = await getAccessibleBranchIds(userId, userType);
      } catch (err) {
        console.error('Error getting accessible branches:', err);
        // Continue without branch filtering if error
      }
    }
    
    const contracts = await Contract.getPendingContracts(branchIds);
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
    
    // Get user info from query or session (for branch filtering)
    // Note: PaymentProcessing should pass showAll=true to bypass branch filtering
    const userId = req.query.userId || (req.user ? req.user.id : null);
    const userType = req.query.userType || (req.user ? req.user.user_type : 0);
    const showAll = req.query.showAll === 'true'; // For PaymentProcessing page
    
    let branchIds = null;
    if (!showAll && userId) {
      try {
        branchIds = await getAccessibleBranchIds(userId, userType);
      } catch (err) {
        console.error('Error getting accessible branches:', err);
        // Continue without branch filtering if error
      }
    }
    
    const contracts = await Contract.getAllContracts(status, branchIds);
    
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

// GET /api/contracts/branch-analysis - Get contracts with branch analysis
// NOTE: This route MUST come before /:id to avoid route conflicts
router.get('/branch-analysis', async (req, res) => {
  try {
    const userId = req.query.userId || (req.user ? req.user.id : null);
    const userType = req.query.userType || (req.user ? req.user.user_type : 0);
    const { branchId } = req.query;
    
    let branchIds = null;
    if (userId && userType !== 0) {
      // Non-admins: filter by accessible branches
      try {
        branchIds = await getAccessibleBranchIds(userId, userType);
      } catch (err) {
        console.error('Error getting accessible branches:', err);
        // Continue without branch filtering if error
      }
    }
    // Admins: branchIds remains null (see all branches)
    
    // If specific branchId is provided, use that (override accessible branches filter)
    if (branchId) {
      const parsedBranchId = parseInt(branchId);
      if (!isNaN(parsedBranchId)) {
        branchIds = [parsedBranchId];
      }
    }
    
    const contracts = await Contract.getContractsWithBranchAnalysis(branchIds);
    
    res.json({
      success: true,
      contracts
    });
  } catch (error) {
    console.error('Get branch analysis error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch branch analysis'
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

// GET /api/contracts/:id/sponsors - Get sponsors for a contract
router.get('/:id/sponsors', async (req, res) => {
  try {
    const { id } = req.params;
    const sponsors = await Contract.getSponsors(id);
    
    res.json({
      success: true,
      sponsors
    });
  } catch (error) {
    console.error('Get sponsors error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch sponsors'
    });
  }
});

// GET /api/contracts/:id/payments - Get payment schedule for contract
router.get('/:id/payments', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if contract exists
    const contract = await Contract.getById(id);
    if (!contract) {
      return res.status(404).json({
        success: false,
        error: 'Contract not found'
      });
    }

    const payments = await Contract.getPaymentSchedule(id);
    
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

// GET /api/contracts/:id/payment-summary - Get payment summary for contract
router.get('/:id/payment-summary', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if contract exists
    const contract = await Contract.getById(id);
    if (!contract) {
      return res.status(404).json({
        success: false,
        error: 'Contract not found'
      });
    }

    const summary = await Contract.getPaymentSummary(id);
    
    res.json({
      success: true,
      summary
    });
  } catch (error) {
    console.error('Get payment summary error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch payment summary'
    });
  }
});

// POST /api/contracts/apply - Apply for new contract (single)
router.post('/apply', upload.fields([
  { name: 'customer_id_card_image', maxCount: 1 },
  { name: 'sponsor_0_id_card_image', maxCount: 1 },
  { name: 'sponsor_1_id_card_image', maxCount: 1 },
  { name: 'sponsor_2_id_card_image', maxCount: 1 },
  { name: 'sponsor_3_id_card_image', maxCount: 1 },
  { name: 'sponsor_4_id_card_image', maxCount: 1 }
]), async (req, res) => {
  try {
    console.log('Contract application request received');
    
    // Parse the form data
    const customer_data = JSON.parse(req.body.customer_data);
    const sponsors_data = JSON.parse(req.body.sponsors_data);
    const contract_data = JSON.parse(req.body.contract_data);

    console.log('Data parsed:', {
      customer_name: customer_data.full_name,
      sponsors_count: sponsors_data.length,
      item_id: contract_data.item_id
    });

    // Handle file uploads
    if (req.files && req.files['customer_id_card_image']) {
      console.log('Customer image uploaded');
      customer_data.id_card_image = req.files['customer_id_card_image'][0].buffer;
    }

    // Handle sponsor file uploads
    if (req.files) {
      console.log('Processing sponsor images');
      sponsors_data.forEach((sponsor, index) => {
        const fileField = `sponsor_${index}_id_card_image`;
        if (req.files[fileField]) {
          console.log(`Sponsor ${index} image uploaded`);
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

    console.log('Contract application successful:', result.contractId);

    res.json({
      success: true,
      contractId: result.contractId,
      item_name: result.item_name,
      total_price: result.total_price,
      message: `Contract for ${result.item_name} submitted successfully`
    });

  } catch (error) {
    console.error('Contract application error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to submit contract application'
    });
  }
});

// POST /api/contracts/apply-multiple - Apply for multiple contracts
router.post('/apply-multiple', upload.fields([
  { name: 'customer_id_card_image', maxCount: 1 },
  { name: 'sponsor_0_id_card_image', maxCount: 1 },
  { name: 'sponsor_1_id_card_image', maxCount: 1 },
  { name: 'sponsor_2_id_card_image', maxCount: 1 },
  { name: 'sponsor_3_id_card_image', maxCount: 1 },
  { name: 'sponsor_4_id_card_image', maxCount: 1 }
]), async (req, res) => {
  try {
    console.log('Multiple contract application request received');
    
    // Parse the form data
    const customer_data = JSON.parse(req.body.customer_data);
    const sponsors_data = JSON.parse(req.body.sponsors_data);
    const contracts_data = JSON.parse(req.body.contracts_data); // Array of contracts

    console.log('Data parsed:', {
      customer_name: customer_data.full_name,
      sponsors_count: sponsors_data.length,
      contracts_count: contracts_data.length
    });

    if (!Array.isArray(contracts_data) || contracts_data.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No contracts provided'
      });
    }

    // Handle file uploads
    if (req.files && req.files['customer_id_card_image']) {
      console.log('Customer image uploaded');
      customer_data.id_card_image = req.files['customer_id_card_image'][0].buffer;
    }

    // Handle sponsor file uploads
    if (req.files) {
      console.log('Processing sponsor images');
      sponsors_data.forEach((sponsor, index) => {
        const fileField = `sponsor_${index}_id_card_image`;
        if (req.files[fileField]) {
          console.log(`Sponsor ${index} image uploaded`);
          sponsor.id_card_image = req.files[fileField][0].buffer;
        }
      });
    }

    // Prepare contracts for batch processing
    const contractsToProcess = contracts_data.map(contract_data => ({
      customer_data,
      sponsors_data,
      contract_data
    }));

    // Process contracts
    const result = await Contract.applyMultiple(contractsToProcess);

    console.log('Multiple contract processing completed:', {
      total: result.total,
      successful: result.successful,
      failed: result.failed
    });

    if (result.successful === 0) {
      return res.status(500).json({
        success: false,
        error: 'All contracts failed to submit',
        details: result.errors
      });
    }

    res.json({
      success: true,
      message: `${result.successful} out of ${result.total} contract(s) submitted successfully`,
      results: result.results,
      errors: result.errors.length > 0 ? result.errors : null,
      total: result.total,
      successful: result.successful,
      failed: result.failed
    });

  } catch (error) {
    console.error('Multiple contract application error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to submit contract applications'
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
      paymentsCreated: result.paymentsCreated,
      breakdown: result.breakdown || null
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

// GET /api/contracts/search/customer - Search contracts by customer name
router.get('/search/customer', async (req, res) => {
  try {
    const { name } = req.query;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Customer name is required'
      });
    }

    const contracts = await Contract.searchByCustomer(name);
    
    res.json({
      success: true,
      contracts
    });
  } catch (error) {
    console.error('Search contracts error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search contracts'
    });
  }
});

module.exports = router;