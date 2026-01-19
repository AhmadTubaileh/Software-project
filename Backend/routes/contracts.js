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
    const { status, branch_id, showAllBranches } = req.query;
    
    // Get user info from query or session (for validation and branch filtering)
    // Note: PaymentProcessing should pass showAll=true to bypass branch filtering
    const userId = req.query.userId || (req.user ? req.user.id : null);
    const userType = parseInt(req.query.userType || (req.user ? req.user.user_type : 0));
    const showAll = req.query.showAll === 'true'; // For PaymentProcessing page
    
    // Validate user_type (must be 0-9)
    if (userType < 0 || userType > 9 || isNaN(userType)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid user type. Must be between 0 and 9.'
      });
    }
    
    let branchIds = null;
    
    // If specific branch_id is provided, use that (override accessible branches filter)
    if (branch_id) {
      const branchId = parseInt(branch_id);
      if (!isNaN(branchId)) {
        branchIds = [branchId];
      }
    } else if (showAllBranches === 'true') {
      // When "All Branches" is selected, show ALL contracts (no branch filtering)
      // branchIds remains null to show all branches
      branchIds = null;
    } else if (!showAll && userId) {
      // Otherwise, get accessible branches for filtering
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

    // Handle customer file uploads and existing images
    if (req.files && req.files['customer_id_card_image']) {
      console.log('Customer image uploaded as file');
      customer_data.id_card_image = req.files['customer_id_card_image'][0].buffer;
    } else if (customer_data.id_card_image) {
      console.log('Customer image already in data (from database)');
      // Keep existing image data - it will be processed by the Contract.apply method
    } else {
      console.log('Customer has no image');
      customer_data.id_card_image = null;
    }

    // Handle sponsor file uploads and existing images
    console.log('Processing sponsor images');
    sponsors_data.forEach((sponsor, index) => {
      const fileField = `sponsor_${index}_id_card_image`;

      // First, check for uploaded files
      if (req.files && req.files[fileField]) {
        console.log(`Sponsor ${index} image uploaded as file`);
        sponsor.id_card_image = req.files[fileField][0].buffer;
      }
      // If no uploaded file but sponsor already has image data (from database verification)
      else if (sponsor.id_card_image) {
        console.log(`Sponsor ${index} image already in data (from database)`);
        // Keep existing image data - it will be processed by insertSponsorSafely
      }
      else {
        console.log(`Sponsor ${index} has no image`);
        sponsor.id_card_image = null;
      }
    });

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

    // Handle customer file uploads and existing images
    if (req.files && req.files['customer_id_card_image']) {
      console.log('Customer image uploaded as file');
      customer_data.id_card_image = req.files['customer_id_card_image'][0].buffer;
    } else if (customer_data.id_card_image) {
      console.log('Customer image already in data (from database)');
      // Keep existing image data - it will be processed by the Contract.apply method
    } else {
      console.log('Customer has no image');
      customer_data.id_card_image = null;
    }

    // Handle sponsor file uploads and existing images
    console.log('Processing sponsor images');
    sponsors_data.forEach((sponsor, index) => {
      const fileField = `sponsor_${index}_id_card_image`;

      // First, check for uploaded files
      if (req.files && req.files[fileField]) {
        console.log(`Sponsor ${index} image uploaded as file`);
        sponsor.id_card_image = req.files[fileField][0].buffer;
      }
      // If no uploaded file but sponsor already has image data (from database verification)
      else if (sponsor.id_card_image) {
        console.log(`Sponsor ${index} image already in data (from database)`);
        // Keep existing image data - it will be processed by insertSponsorSafely
      }
      else {
        console.log(`Sponsor ${index} has no image`);
        sponsor.id_card_image = null;
      }
    });

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

// POST /api/contracts/transfer-transactions - Transfer transaction(s) to contract's branch
// Updates transaction branch_id to contract's branch_id
router.post('/transfer-transactions', async (req, res) => {
  try {
    const { transaction_ids } = req.body; // Array of transaction IDs
    
    if (!transaction_ids || !Array.isArray(transaction_ids) || transaction_ids.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Transaction IDs array is required'
      });
    }

    // Get user info (optional - for logging)
    const userId = req.body.userId || (req.user ? req.user.id : null);

    // Start transaction
    db.query('START TRANSACTION', async (startErr) => {
      if (startErr) {
        return res.status(500).json({
          success: false,
          error: 'Failed to start transaction'
        });
      }

      try {
        let updatedCount = 0;
        const errors = [];

        // Process each transaction
        for (const transactionId of transaction_ids) {
          // Get transaction details and contract branch_id
          const transactionData = await new Promise((resolve, reject) => {
            const query = `
              SELECT 
                it.id,
                it.branch_id as current_branch_id,
                ip.contract_id,
                ic.branch_id as contract_branch_id
              FROM installment_transactions it
              INNER JOIN installment_payments ip ON it.payment_id = ip.id
              INNER JOIN installment_contracts ic ON ip.contract_id = ic.id
              WHERE it.id = ?
            `;
            
            db.query(query, [transactionId], (err, results) => {
              if (err) {
                reject(err);
                return;
              }
              if (results.length === 0) {
                reject(new Error(`Transaction ${transactionId} not found`));
                return;
              }
              resolve(results[0]);
            });
          });

          // Check if transfer is needed
          if (transactionData.current_branch_id === transactionData.contract_branch_id) {
            // Already in correct branch, skip
            continue;
          }

          // Update transaction branch_id to contract's branch_id
          await new Promise((resolve, reject) => {
            const updateQuery = `
              UPDATE installment_transactions
              SET branch_id = ?
              WHERE id = ?
            `;
            
            db.query(updateQuery, [transactionData.contract_branch_id, transactionId], (err, result) => {
              if (err) {
                reject(err);
                return;
              }
              resolve(result);
            });
          });

          updatedCount++;
        }

        // Commit transaction
        await new Promise((resolve, reject) => {
          db.query('COMMIT', (err) => {
            if (err) {
              reject(err);
            } else {
              resolve();
            }
          });
        });

        res.json({
          success: true,
          message: `Successfully transferred ${updatedCount} transaction(s)`,
          updated_count: updatedCount,
          total_requested: transaction_ids.length
        });
      } catch (error) {
        // Rollback on error
        await new Promise((resolve) => {
          db.query('ROLLBACK', () => resolve());
        });

        console.error('Transfer transactions error:', error);
        res.status(500).json({
          success: false,
          error: error.message || 'Failed to transfer transactions'
        });
      }
    });
  } catch (error) {
    console.error('Transfer transactions error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to transfer transactions'
    });
  }
});

// GET /api/contracts/my-installments - Get installments for a specific customer (by user_id)
router.get('/my-installments', async (req, res) => {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    // Get contracts for this user
    const query = `
      SELECT 
        ic.*,
        cc.full_name as customer_name,
        cc.phone as customer_phone,
        i.name as item_name,
        i.description as item_description,
        ip.price_cash,
        ip.price_installment_total,
        ip.installment_first_payment,
        ip.installment_months,
        ip.installment_per_month,
        ip.installment_last_payment,
        ca.status as approval_status,
        ca.reason as rejection_reason,
        ca.updated_at as decision_date,
        b.name as branch_name,
        -- Payment summary
        (SELECT COUNT(*) FROM installment_payments ipay WHERE ipay.contract_id = ic.id) as total_payments,
        (SELECT COUNT(*) FROM installment_payments ipay WHERE ipay.contract_id = ic.id AND ipay.status = 'paid') as paid_payments,
        (SELECT COUNT(*) FROM installment_payments ipay WHERE ipay.contract_id = ic.id AND ipay.status = 'pending') as pending_payments,
        (SELECT SUM(amount_due - amount_paid) FROM installment_payments ipay WHERE ipay.contract_id = ic.id) as remaining_amount
      FROM installment_contracts ic
      LEFT JOIN contract_customers cc ON ic.customer_id = cc.id
      LEFT JOIN items i ON ic.item_id = i.id
      LEFT JOIN item_prices ip ON ic.price_id = ip.id
      LEFT JOIN contract_approvals ca ON ic.id = ca.contract_id
      LEFT JOIN branches b ON ic.branch_id = b.id
      WHERE ic.user_id = ?
      ORDER BY ic.created_at DESC
    `;
    
    db.query(query, [userId], (err, results) => {
      if (err) {
        console.error('Error fetching customer installments:', err);
        return res.status(500).json({
          success: false,
          error: 'Failed to fetch installments'
        });
      }

      res.json({
        success: true,
        contracts: results || []
      });
    });
  } catch (error) {
    console.error('Get customer installments error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch installments'
    });
  }
});

module.exports = router;