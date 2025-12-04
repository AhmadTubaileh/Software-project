const express = require('express');
const router = express.Router();
const Payment = require('../models/Payment');

// GET /api/payments/search - Search contracts by customer name or ID card number
router.get('/search', async (req, res) => {
  try {
    const { name, id_card } = req.query;
    
    // Determine search type
    let searchValue, searchType;
    
    if (id_card) {
      searchValue = id_card;
      searchType = 'id_card';
    } else if (name) {
      searchValue = name;
      searchType = 'name';
    } else {
      return res.status(400).json({
        success: false,
        error: 'Either customer name or ID card number is required'
      });
    }

    const contracts = await Payment.searchContracts(searchValue, searchType);
    
    res.json({
      success: true,
      contracts,
      search_type: searchType,
      search_value: searchValue
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

// POST /api/payments/process - Process a payment WITH FIXED AMOUNT_DUE LOGIC
router.post('/process', async (req, res) => {
  const { payment_id, amount_paid, worker_id } = req.body;
  
  if (!payment_id || !amount_paid || !worker_id) {
    return res.status(400).json({
      success: false,
      error: 'Payment ID, amount paid, and worker ID are required'
    });
  }

  const paymentAmount = parseFloat(parseFloat(amount_paid).toFixed(2)); // FIX: Parse with 2 decimals
  if (paymentAmount <= 0) {
    return res.status(400).json({
      success: false,
      error: 'Amount must be greater than 0'
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
      // 1. Get payment details with contract info
      const payment = await Payment.getPaymentById(payment_id);
      if (!payment) {
        throw new Error('Payment not found');
      }

      const contractId = payment.contract_id;
      const currentAmountPaid = parseFloat(payment.amount_paid);
      const amountDue = parseFloat(payment.amount_due);
      const monthNumber = payment.month_number; // FIX: Get month_number from payment
      const customerId = payment.customer_id;
      const itemId = payment.item_id;

      console.log(`🚀 Processing payment ${payment_id}:`);
      console.log(`   Month: ${monthNumber} | Amount Due: ${amountDue} | Already Paid: ${currentAmountPaid}`);
      console.log(`   Payment Amount: ${paymentAmount}`);

      // 2. SPECIAL RULE: For down payment (month 0), must pay exact amount
      if (monthNumber === 0) { // FIX: Now monthNumber is defined
        const dueAmount = parseFloat(amountDue);
        const paidAmount = parseFloat(paymentAmount);
        
        console.log(`🔍 Down Payment Validation:`);
        console.log(`   Due Amount: ${dueAmount} (type: ${typeof dueAmount})`);
        console.log(`   Paid Amount: ${paidAmount} (type: ${typeof paidAmount})`);
        
        // Check if down payment is already paid
        if (currentAmountPaid >= dueAmount) {
          throw new Error(`Down payment already fully paid. Amount paid: ${currentAmountPaid.toFixed(2)}`);
        }
        
        // Allow small rounding differences (0.01 tolerance)
        const tolerance = 0.01;
        const difference = Math.abs(paidAmount - dueAmount);
        
        console.log(`   Difference: ${difference}`);
        console.log(`   Within tolerance? ${difference <= tolerance}`);
        
        if (difference > tolerance) {
          throw new Error(`Down payment must be exact amount: $${dueAmount.toFixed(2)}. You paid: $${paidAmount.toFixed(2)}`);
        }
        
        console.log(`✅ Down payment amount validated successfully`);
      }

      // 3. Create sales record for this payment session
      const salesRecordId = await Payment.createSalesRecord({
        user_id: worker_id,
        customer_id: customerId,
        item_id: itemId,
        price: paymentAmount, // Total amount paid in this session
        contract_id: contractId
      });

      console.log(`   Created sales record ID: ${salesRecordId}`);

      // 4. Process payment with FIXED AMOUNT_DUE logic
      let remainingPayment = paymentAmount;
      let currentPaymentId = payment_id;
      let processedPayments = [];
      let inventoryUpdated = false;

      while (remainingPayment > 0) {
        const currentPayment = await Payment.getPaymentById(currentPaymentId);
        if (!currentPayment) {
          console.log(`   No more payments to process`);
          break;
        }

        const currentPaid = parseFloat(currentPayment.amount_paid);
        const paymentDue = parseFloat(currentPayment.amount_due);
        const paymentRemaining = paymentDue - currentPaid;
        
        console.log(`   Processing payment ${currentPaymentId}:`);
        console.log(`     Due: ${paymentDue} | Paid: ${currentPaid} | Remaining: ${paymentRemaining}`);
        console.log(`     Available from payment: ${remainingPayment}`);
        
        if (paymentRemaining <= 0) {
          // This payment is already fully paid, move to next
          console.log(`     Already fully paid, moving to next payment`);
          const nextPayments = await Payment.getNextUnpaidPayments(contractId, currentPayment.month_number);
          if (nextPayments.length === 0) {
            console.log(`     No more payments, excess will be recorded as credit`);
            break;
          }
          currentPaymentId = nextPayments[0].id;
          continue;
        }

        // Calculate how much to apply to this payment
        const amountToApply = Math.min(remainingPayment, paymentRemaining);
        console.log(`     Applying ${amountToApply} to this payment`);
        
        // Update payment amount paid (DO NOT CHANGE amount_due)
        const newAmountPaid = currentPaid + amountToApply;
        await Payment.updatePaymentAmountPaid(currentPaymentId, newAmountPaid);
        
        // Create transaction
        await Payment.createTransaction(currentPaymentId, salesRecordId, amountToApply, worker_id);
        
        processedPayments.push({
          payment_id: currentPaymentId,
          month_number: currentPayment.month_number,
          amount_applied: amountToApply,
          amount_due: paymentDue,
          new_amount_paid: newAmountPaid,
          new_status: newAmountPaid >= paymentDue ? 'paid' : 'partial'
        });

        remainingPayment -= amountToApply;
        console.log(`     Remaining to distribute: ${remainingPayment}`);
        
        // 5. SPECIAL: If this is down payment (month 0) and fully paid
        if (currentPayment.month_number === 0 && newAmountPaid >= paymentDue) {
          // Decrease inventory
          await Payment.decreaseItemQuantity(itemId);
          
          // Create inventory log
          await Payment.createInventoryLog(itemId, worker_id, 'sale', -1);
          
          inventoryUpdated = true;
          console.log(`     Inventory decreased for item ${itemId}`);
        }

        // If we still have remaining payment amount, move to next payment
        if (remainingPayment > 0) {
          const nextPayments = await Payment.getNextUnpaidPayments(contractId, currentPayment.month_number);
          if (nextPayments.length === 0) {
            // No more payments, keep remaining as credit
            console.log(`     No more payments, recording excess ${remainingPayment} as credit`);
            
            // Create credit transaction for excess
            await Payment.createCreditTransaction(salesRecordId, remainingPayment, worker_id, contractId);
            
            processedPayments.push({
              type: 'credit',
              amount: remainingPayment,
              message: 'Excess amount recorded as credit'
            });
            
            remainingPayment = 0;
            break;
          }
          currentPaymentId = nextPayments[0].id;
          console.log(`     Moving to next payment: ${currentPaymentId}`);
        }
      }

      // 6. Check if contract is completed
      const isCompleted = await Payment.isContractCompleted(contractId);
      if (isCompleted) {
        await Payment.markContractCompleted(contractId);
        console.log(`   Contract ${contractId} marked as completed`);
      }

      // Commit transaction
      db.query('COMMIT', (commitErr) => {
        if (commitErr) {
          throw commitErr;
        }
        
        console.log(`✅ Payment processing completed successfully`);
        
        res.json({
          success: true,
          message: `Payment processed successfully`,
          details: {
            sales_record_id: salesRecordId,
            contract_id: contractId,
            total_amount_paid: paymentAmount,
            payments_processed: processedPayments.length,
            processed_payments: processedPayments,
            inventory_updated: inventoryUpdated,
            contract_completed: isCompleted
          }
        });
      });

    } catch (error) {
      // Rollback on error
      db.query('ROLLBACK', () => {
        console.error('❌ Payment processing error:', error);
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

// GET /api/payments/sales/:contract_id - Get all sales records for a contract
router.get('/sales/:contract_id', async (req, res) => {
  try {
    const { contract_id } = req.params;
    const sales = await Payment.getContractSales(contract_id);
    
    res.json({
      success: true,
      sales
    });
  } catch (error) {
    console.error('Get contract sales error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch sales records'
    });
  }
});

// GET /api/payments/contract-transactions/:contract_id - Get all transactions for a contract
router.get('/contract-transactions/:contract_id', async (req, res) => {
  try {
    const { contract_id } = req.params;
    const transactions = await Payment.getContractTransactions(contract_id);
    
    res.json({
      success: true,
      transactions
    });
  } catch (error) {
    console.error('Get contract transactions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch transactions'
    });
  }
});

// GET /api/payments/credit/:contract_id - Get credit balance for a contract
router.get('/credit/:contract_id', async (req, res) => {
  try {
    const { contract_id } = req.params;
    const creditBalance = await Payment.getCreditBalance(contract_id);
    
    res.json({
      success: true,
      credit_balance: creditBalance
    });
  } catch (error) {
    console.error('Get credit balance error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch credit balance'
    });
  }
});

module.exports = router;