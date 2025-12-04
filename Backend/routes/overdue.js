const express = require('express');
const router = express.Router();
const Overdue = require('../models/Overdue');

// GET /api/overdue/sync - Auto-sync overdue payments on page load
router.get('/sync', async (req, res) => {
  try {
    const syncResult = await Overdue.syncOverduePayments();
    
    res.json({
      success: true,
      message: 'Overdue payments synchronized successfully',
      stats: syncResult
    });
  } catch (error) {
    console.error('Sync overdue payments error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to sync overdue payments'
    });
  }
});

// GET /api/overdue/summary - Get overdue summary with filters
router.get('/summary', async (req, res) => {
  try {
    const { status, contract_id } = req.query;
    
    const filters = {};
    if (status && status !== 'all') {
      filters.status = status;
    }
    if (contract_id) {
      filters.contract_id = contract_id;
    }
    
    const overdueSummary = await Overdue.getOverdueSummary(filters);
    
    res.json({
      success: true,
      overdue_payments: overdueSummary,
      count: overdueSummary.length
    });
  } catch (error) {
    console.error('Get overdue summary error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch overdue summary'
    });
  }
});

// GET /api/overdue/contracts - Get contracts with overdue payments
router.get('/contracts', async (req, res) => {
  try {
    const contracts = await Overdue.getContractsWithOverdue();
    
    res.json({
      success: true,
      contracts,
      count: contracts.length
    });
  } catch (error) {
    console.error('Get contracts with overdue error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch contracts with overdue payments'
    });
  }
});

// GET /api/overdue/contract/:contract_id/payments - Get overdue payments for specific contract
router.get('/contract/:contract_id/payments', async (req, res) => {
  try {
    const { contract_id } = req.params;
    const overduePayments = await Overdue.getOverduePaymentsByContract(contract_id);
    
    res.json({
      success: true,
      contract_id,
      overdue_payments: overduePayments,
      count: overduePayments.length
    });
  } catch (error) {
    console.error('Get contract overdue payments error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch contract overdue payments'
    });
  }
});

// GET /api/overdue/:payment_id/followups - Get follow-up history for a payment
router.get('/:payment_id/followups', async (req, res) => {
  try {
    const { payment_id } = req.params;
    const followups = await Overdue.getPaymentFollowups(payment_id);
    
    res.json({
      success: true,
      payment_id,
      followups
    });
  } catch (error) {
    console.error('Get payment followups error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch follow-up history'
    });
  }
});

// POST /api/overdue/:payment_id/followup - Add new follow-up entry
router.post('/:payment_id/followup', async (req, res) => {
  try {
    const { payment_id } = req.params;
    const { 
      worker_id, 
      status, 
      customer_response, 
      promise_date, 
      next_followup_date 
    } = req.body;
    
    if (!worker_id || !status) {
      return res.status(400).json({
        success: false,
        error: 'Worker ID and status are required'
      });
    }
    
    const result = await Overdue.addFollowup({
      payment_id,
      worker_id,
      status,
      customer_response,
      promise_date,
      next_followup_date
    });
    
    res.json({
      success: true,
      message: 'Follow-up recorded successfully',
      followup_id: result.followupId,
      updated_status: result.updatedStatus
    });
  } catch (error) {
    console.error('Add followup error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to record follow-up'
    });
  }
});

// PUT /api/overdue/:payment_id/status - Update payment status directly
router.put('/:payment_id/status', async (req, res) => {
  try {
    const { payment_id } = req.params;
    const { status, last_worker_id } = req.body;
    
    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'Status is required'
      });
    }
    
    const result = await Overdue.updatePaymentStatus(payment_id, status, last_worker_id);
    
    res.json({
      success: true,
      message: `Payment status updated to ${status}`,
      updated: result
    });
  } catch (error) {
    console.error('Update payment status error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update payment status'
    });
  }
});
// GET /api/overdue/contracts/search - Search contracts by customer name
router.get('/contracts/search', async (req, res) => {
  try {
    const { customer_name } = req.query;
    
    if (!customer_name || customer_name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Customer name must be at least 2 characters'
      });
    }
    
    const contracts = await Overdue.searchContractsByCustomerName(customer_name.trim());
    
    res.json({
      success: true,
      contracts,
      count: contracts.length,
      search_term: customer_name
    });
  } catch (error) {
    console.error('Search contracts error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search contracts'
    });
  }
});

// GET /api/overdue/contract/:contract_id/detailed-payments - Get ALL payments for contract
router.get('/contract/:contract_id/detailed-payments', async (req, res) => {
  try {
    const { contract_id } = req.params;
    
    const contractDetails = await Overdue.getContractDetails(contract_id);
    if (!contractDetails) {
      return res.status(404).json({
        success: false,
        error: 'Contract not found'
      });
    }
    
    // Get ALL payments (overdue and non-overdue)
    const allPayments = await Overdue.getAllPaymentsForContract(contract_id);
    
    // Separate overdue vs regular payments
    const overduePayments = allPayments.filter(p => p.is_overdue);
    const regularPayments = allPayments.filter(p => !p.is_overdue);
    
    res.json({
      success: true,
      contract: contractDetails,
      all_payments: allPayments,
      overdue_payments: overduePayments,
      regular_payments: regularPayments,
      overdue_count: overduePayments.length,
      total_count: allPayments.length
    });
  } catch (error) {
    console.error('Get contract detailed payments error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch contract payments'
    });
  }
});

// GET /api/overdue/stats - Get statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = await Overdue.getStatistics();
    
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Get overdue stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch overdue statistics'
    });
  }
});

module.exports = router;