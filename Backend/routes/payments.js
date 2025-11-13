const express = require('express');
const router = express.Router();
const Payment = require('../models/Payment');

// GET /api/payments/search - Search contracts by customer name
router.get('/search', async (req, res) => {
  try {
    const { customer } = req.query;
    
    if (!customer) {
      return res.status(400).json({
        success: false,
        error: 'Customer name is required'
      });
    }

    const contracts = await Payment.searchContracts(customer);
    
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

// GET /api/payments/contract/:id - Get payments for a contract
router.get('/contract/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const payments = await Payment.getPaymentsByContract(id);
    
    res.json({
      success: true,
      payments
    });
  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch payments'
    });
  }
});

// POST /api/payments/process - Process a payment
router.post('/process', async (req, res) => {
  const { payment_id, amount_paid, worker_id } = req.body;
  
  if (!payment_id || !amount_paid || !worker_id) {
    return res.status(400).json({
      success: false,
      error: 'Payment ID, amount paid, and worker ID are required'
    });
  }

  const db = require('../config/database');
  
  db.query('START TRANSACTION', async (startErr) => {
    if (startErr) {
      return res.status(500).json({
        success: false,
        error: 'Failed to start transaction'
      });
    }

    try {
      // 1. Get payment details
      const payment = await Payment.getPaymentById(payment_id);
      if (!payment) {
        throw new Error('Payment not found');
      }

      const currentAmountDue = payment.amount_due;
      const itemId = payment.item_id;
      const contractId = payment.contract_id;
      const saleId = payment.sale_id;

      console.log(`Processing payment: ${amount_paid}, Current Amount Due: ${currentAmountDue}`);

      let resultMessage = '';

      // 2. Process payment based on amount
      if (amount_paid === currentAmountDue) {
        // Exact amount - set amount_due to 0 and mark as paid
        resultMessage = await processExactPayment(payment, amount_paid, worker_id, itemId, contractId, saleId);
      } else if (amount_paid < currentAmountDue) {
        // Partial payment - decrease amount_due
        resultMessage = await processPartialPayment(payment, amount_paid, worker_id, itemId, contractId, saleId);
      } else {
        // Overpayment - set current amount_due to 0 and apply excess to next payment
        resultMessage = await processOverpayment(payment, amount_paid, worker_id, itemId, contractId, saleId);
      }

      // Commit transaction
      db.query('COMMIT', (commitErr) => {
        if (commitErr) {
          throw commitErr;
        }
        res.json({
          success: true,
          message: resultMessage
        });
      });

    } catch (error) {
      // Rollback on error
      db.query('ROLLBACK', () => {
        console.error('Payment processing error:', error);
        res.status(500).json({
          success: false,
          error: error.message || 'Failed to process payment'
        });
      });
    }
  });
});

// GET /api/payments/transactions/:payment_id - Get transaction history for a payment
router.get('/transactions/:payment_id', async (req, res) => {
  try {
    const { payment_id } = req.params;
    const transactions = await Payment.getPaymentTransactions(payment_id);
    
    res.json({
      success: true,
      transactions
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch transactions'
    });
  }
});

// GET /api/payments/summary/:contract_id - Get payment summary for contract
router.get('/summary/:contract_id', async (req, res) => {
  try {
    const { contract_id } = req.params;
    const summary = await Payment.getPaymentSummary(contract_id);
    
    res.json({
      success: true,
      summary
    });
  } catch (error) {
    console.error('Get payment summary error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch payment summary'
    });
  }
});

// GET /api/payments/overdue - Get overdue payments
router.get('/overdue', async (req, res) => {
  try {
    const overduePayments = await Payment.getOverduePayments();
    
    res.json({
      success: true,
      overdue_payments: overduePayments,
      total_overdue: overduePayments.length
    });
  } catch (error) {
    console.error('Get overdue payments error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch overdue payments'
    });
  }
});

// Payment processing helper functions
async function processExactPayment(payment, amountPaid, workerId, itemId, contractId, saleId) {
  await Payment.updatePayment(payment.id, {
    amount_due: 0,
    amount_paid: payment.amount_paid + amountPaid,
    status: 'paid',
    paid_date: new Date()
  });

  await Payment.createTransaction(payment.id, amountPaid, workerId);
  await Payment.createInventoryLog(itemId, workerId, 'sale', 0);

  const isCompleted = await Payment.isContractCompleted(saleId);
  if (isCompleted) {
    await Payment.markContractCompleted(contractId);
    return `Payment of ${amountPaid} processed. Payment marked as PAID. All payments completed! Contract marked as COMPLETED.`;
  }

  return `Payment of ${amountPaid} processed. Payment marked as PAID. Amount due set to 0.`;
}

async function processPartialPayment(payment, amountPaid, workerId, itemId, contractId, saleId) {
  const newAmountDue = payment.amount_due - amountPaid;
  
  await Payment.updatePayment(payment.id, {
    amount_due: newAmountDue,
    amount_paid: payment.amount_paid + amountPaid,
    status: 'partial',
    paid_date: payment.paid_date
  });

  await Payment.createTransaction(payment.id, amountPaid, workerId);
  await Payment.createInventoryLog(itemId, workerId, 'sale', 0);

  return `Partial payment of ${amountPaid} processed. Amount due decreased to ${newAmountDue}.`;
}

async function processOverpayment(payment, amountPaid, workerId, itemId, contractId, saleId) {
  const excessAmount = amountPaid - payment.amount_due;
  
  // Set current payment amount_due to 0 and mark as paid
  await Payment.updatePayment(payment.id, {
    amount_due: 0,
    amount_paid: payment.amount_paid + amountPaid,
    status: 'paid',
    paid_date: new Date()
  });

  await Payment.createTransaction(payment.id, amountPaid, workerId);

  // Apply excess to next payment if any
  if (excessAmount > 0) {
    await applyExcessToNextPayment(saleId, payment.month_number, excessAmount, workerId, itemId, contractId, saleId);
    return `Payment processed. Excess ${excessAmount} applied to next payment.`;
  }

  await Payment.createInventoryLog(itemId, workerId, 'sale', 0);
  
  const isCompleted = await Payment.isContractCompleted(saleId);
  if (isCompleted) {
    await Payment.markContractCompleted(contractId);
    return `Payment processed. Current payment marked as PAID. All payments completed! Contract marked as COMPLETED.`;
  }

  return `Payment processed. Current payment marked as PAID with amount due set to 0.`;
}

async function applyExcessToNextPayment(saleId, currentMonth, excessAmount, workerId, itemId, contractId, saleId) {
  const nextPayment = await Payment.getNextUnpaidPayment(saleId, currentMonth);
  
  if (!nextPayment) {
    await Payment.createInventoryLog(itemId, workerId, 'sale', 0);
    return;
  }

  let newAmountDue = nextPayment.amount_due - excessAmount;
  
  if (newAmountDue <= 0) {
    const remainingExcess = -newAmountDue;
    newAmountDue = 0;
    
    // Update next payment to 0 and mark as paid
    await Payment.updatePayment(nextPayment.id, {
      amount_due: 0,
      amount_paid: nextPayment.amount_paid + nextPayment.amount_due,
      status: 'paid',
      paid_date: new Date()
    });

    await Payment.createTransaction(nextPayment.id, nextPayment.amount_due, workerId);

    // If there's still excess, apply to the next payment recursively
    if (remainingExcess > 0) {
      await applyExcessToNextPayment(saleId, nextPayment.month_number, remainingExcess, workerId, itemId, contractId, saleId);
    } else {
      await Payment.createInventoryLog(itemId, workerId, 'sale', 0);
    }
  } else {
    // Partial application to next payment
    await Payment.updatePayment(nextPayment.id, {
      amount_due: newAmountDue,
      amount_paid: nextPayment.amount_paid + excessAmount,
      status: 'partial',
      paid_date: nextPayment.paid_date
    });

    await Payment.createTransaction(nextPayment.id, excessAmount, workerId);
    await Payment.createInventoryLog(itemId, workerId, 'sale', 0);
  }

  // Check if contract is completed after applying excess
  const isCompleted = await Payment.isContractCompleted(saleId);
  if (isCompleted) {
    await Payment.markContractCompleted(contractId);
  }
}

module.exports = router;