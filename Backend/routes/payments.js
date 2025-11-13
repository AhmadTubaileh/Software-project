const express = require('express');
const router = express.Router();
const db = require('../config/database');

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

    const query = `
      SELECT 
        ic.*,
        cc.full_name as customer_name,
        cc.phone as customer_phone,
        i.name as item_name,
        ca.status as approval_status
      FROM installment_contracts ic
      LEFT JOIN contract_customers cc ON ic.customer_id = cc.id
      LEFT JOIN items i ON ic.item_id = i.id
      LEFT JOIN contract_approvals ca ON ic.id = ca.contract_id
      WHERE cc.full_name LIKE ? AND ic.status = 'active'
      ORDER BY ic.created_at DESC
    `;
    
    db.query(query, [`%${customer}%`], (err, results) => {
      if (err) {
        console.error('Search contracts error:', err);
        return res.status(500).json({
          success: false,
          error: 'Failed to search contracts'
        });
      }

      res.json({
        success: true,
        contracts: results
      });
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
    
    // First get sale_id from contract
    const contractQuery = 'SELECT sale_id FROM installment_contracts WHERE id = ?';
    db.query(contractQuery, [id], (err, contractResults) => {
      if (err) {
        console.error('Get contract error:', err);
        return res.status(500).json({
          success: false,
          error: 'Failed to fetch contract'
        });
      }

      if (contractResults.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Contract not found'
        });
      }

      const saleId = contractResults[0].sale_id;

      // Get payments for this sale
      const paymentsQuery = `
        SELECT * FROM installment_payments 
        WHERE sale_id = ? 
        ORDER BY month_number
      `;
      
      db.query(paymentsQuery, [saleId], (paymentsErr, paymentsResults) => {
        if (paymentsErr) {
          console.error('Get payments error:', paymentsErr);
          return res.status(500).json({
            success: false,
            error: 'Failed to fetch payments'
          });
        }

        res.json({
          success: true,
          payments: paymentsResults
        });
      });
    });
  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch payments'
    });
  }
});

// POST /api/payments/process - Process a payment (UPDATED LOGIC)
router.post('/process', async (req, res) => {
  const { payment_id, amount_paid, worker_id } = req.body;
  
  if (!payment_id || !amount_paid || !worker_id) {
    return res.status(400).json({
      success: false,
      error: 'Payment ID, amount paid, and worker ID are required'
    });
  }

  db.query('START TRANSACTION', (startErr) => {
    if (startErr) {
      return res.status(500).json({
        success: false,
        error: 'Failed to start transaction'
      });
    }

    // 1. Get payment details with FOR UPDATE to lock the row
    const getPaymentQuery = `
      SELECT ip.*, ic.item_id, ic.id as contract_id 
      FROM installment_payments ip
      JOIN installment_contracts ic ON ip.sale_id = ic.sale_id
      WHERE ip.id = ? FOR UPDATE
    `;
    
    db.query(getPaymentQuery, [payment_id], (err, paymentResults) => {
      if (err) {
        return rollbackAndRespond(err, res);
      }

      if (paymentResults.length === 0) {
        return rollbackAndRespond(new Error('Payment not found'), res);
      }

      const payment = paymentResults[0];
      const currentAmountDue = payment.amount_due;
      const itemId = payment.item_id;
      const contractId = payment.contract_id;

      console.log(`Processing payment: ${amount_paid}, Current Amount Due: ${currentAmountDue}`);

      // 2. Process payment based on amount
      if (amount_paid === currentAmountDue) {
        // Exact amount - set amount_due to 0 and mark as paid
        processExactPayment(payment, amount_paid, worker_id, res, itemId, contractId);
      } else if (amount_paid < currentAmountDue) {
        // Partial payment - decrease amount_due
        processPartialPayment(payment, amount_paid, worker_id, res, itemId, contractId);
      } else {
        // Overpayment - set current amount_due to 0 and apply excess to next payment
        processOverpayment(payment, amount_paid, worker_id, res, itemId, contractId);
      }
    });

    function processExactPayment(payment, amountPaid, workerId, res, itemId, contractId) {
      const updatePaymentQuery = `
        UPDATE installment_payments 
        SET amount_due = 0, amount_paid = amount_paid + ?, status = 'paid', paid_date = CURDATE()
        WHERE id = ?
      `;
      
      db.query(updatePaymentQuery, [amountPaid, payment.id], (updateErr) => {
        if (updateErr) {
          return rollbackAndRespond(updateErr, res);
        }

        createTransactionAndLog(payment.id, amountPaid, workerId, res, itemId, contractId, 
          `Payment of ${amountPaid} processed. Payment marked as PAID. Amount due set to 0.`);
      });
    }

    function processPartialPayment(payment, amountPaid, workerId, res, itemId, contractId) {
      const newAmountDue = payment.amount_due - amountPaid;
      
      const updatePaymentQuery = `
        UPDATE installment_payments 
        SET amount_due = ?, amount_paid = amount_paid + ?, status = 'partial'
        WHERE id = ?
      `;
      
      db.query(updatePaymentQuery, [newAmountDue, amountPaid, payment.id], (updateErr) => {
        if (updateErr) {
          return rollbackAndRespond(updateErr, res);
        }

        createTransactionAndLog(payment.id, amountPaid, workerId, res, itemId, contractId,
          `Partial payment of ${amountPaid} processed. Amount due decreased to ${newAmountDue}.`);
      });
    }

    function processOverpayment(payment, amountPaid, workerId, res, itemId, contractId) {
      const excessAmount = amountPaid - payment.amount_due;
      
      // Set current payment amount_due to 0 and mark as paid
      const updateCurrentQuery = `
        UPDATE installment_payments 
        SET amount_due = 0, amount_paid = amount_paid + ?, status = 'paid', paid_date = CURDATE()
        WHERE id = ?
      `;
      
      db.query(updateCurrentQuery, [amountPaid, payment.id], (currentErr) => {
        if (currentErr) {
          return rollbackAndRespond(currentErr, res);
        }

        // Create transaction for the full amount paid
        const currentTransactionQuery = `
          INSERT INTO installment_transactions 
          (payment_id, amount_paid, worker_id) 
          VALUES (?, ?, ?)
        `;
        
        db.query(currentTransactionQuery, [payment.id, amountPaid, workerId], (currentTransactionErr) => {
          if (currentTransactionErr) {
            return rollbackAndRespond(currentTransactionErr, res);
          }

          // Apply excess to next payment if any
          if (excessAmount > 0) {
            applyExcessToNextPayment(payment.sale_id, payment.month_number, excessAmount, workerId, res, itemId, contractId);
          } else {
            createInventoryLogAndComplete(itemId, workerId, res, contractId,
              `Payment processed. Current payment marked as PAID with amount due set to 0.`);
          }
        });
      });
    }

    function applyExcessToNextPayment(saleId, currentMonth, excessAmount, workerId, res, itemId, contractId) {
      // Get next unpaid payment
      const nextPaymentQuery = `
        SELECT * FROM installment_payments 
        WHERE sale_id = ? AND month_number > ? AND amount_due > 0
        ORDER BY month_number LIMIT 1
      `;
      
      db.query(nextPaymentQuery, [saleId, currentMonth], (nextErr, nextResults) => {
        if (nextErr) {
          return rollbackAndRespond(nextErr, res);
        }

        if (nextResults.length === 0) {
          // No next payment - just log and complete
          return createInventoryLogAndComplete(itemId, workerId, res, contractId,
            `Payment processed with excess ${excessAmount}. No future payments to apply excess.`);
        }

        const nextPayment = nextResults[0];
        let newAmountDue = nextPayment.amount_due - excessAmount;
        
        // If excess is more than next payment amount_due, set to 0 and continue with remaining excess
        if (newAmountDue <= 0) {
          const remainingExcess = -newAmountDue; // This will be positive if newAmountDue is negative
          newAmountDue = 0;
          
          // Update next payment to 0 and mark as paid
          const updateNextQuery = `
            UPDATE installment_payments 
            SET amount_due = 0, amount_paid = amount_paid + ?, status = 'paid', paid_date = CURDATE()
            WHERE id = ?
          `;
          
          db.query(updateNextQuery, [nextPayment.amount_due, nextPayment.id], (updateNextErr) => {
            if (updateNextErr) {
              return rollbackAndRespond(updateNextErr, res);
            }

            // Create transaction for the amount applied to next payment
            const excessTransactionQuery = `
              INSERT INTO installment_transactions 
              (payment_id, amount_paid, worker_id) 
              VALUES (?, ?, ?)
            `;
            
            db.query(excessTransactionQuery, [nextPayment.id, nextPayment.amount_due, workerId], (excessTransactionErr) => {
              if (excessTransactionErr) {
                return rollbackAndRespond(excessTransactionErr, res);
              }

              // If there's still excess, apply to the next payment recursively
              if (remainingExcess > 0) {
                applyExcessToNextPayment(saleId, nextPayment.month_number, remainingExcess, workerId, res, itemId, contractId);
              } else {
                createInventoryLogAndComplete(itemId, workerId, res, contractId,
                  `Payment processed. Excess applied to month ${nextPayment.month_number}.`);
              }
            });
          });
        } else {
          // Partial application to next payment
          const updateNextQuery = `
            UPDATE installment_payments 
            SET amount_due = ?, amount_paid = amount_paid + ?, status = 'partial'
            WHERE id = ?
          `;
          
          db.query(updateNextQuery, [newAmountDue, excessAmount, nextPayment.id], (updateNextErr) => {
            if (updateNextErr) {
              return rollbackAndRespond(updateNextErr, res);
            }

            // Create transaction for excess amount applied to next payment
            const excessTransactionQuery = `
              INSERT INTO installment_transactions 
              (payment_id, amount_paid, worker_id) 
              VALUES (?, ?, ?)
            `;
            
            db.query(excessTransactionQuery, [nextPayment.id, excessAmount, workerId], (excessTransactionErr) => {
              if (excessTransactionErr) {
                return rollbackAndRespond(excessTransactionErr, res);
              }

              createInventoryLogAndComplete(itemId, workerId, res, contractId,
                `Payment processed. Excess ${excessAmount} applied to month ${nextPayment.month_number}. New amount due: ${newAmountDue}`);
            });
          });
        }
      });
    }

    function createTransactionAndLog(paymentId, amountPaid, workerId, res, itemId, contractId, message) {
      // Create transaction record
      const transactionQuery = `
        INSERT INTO installment_transactions 
        (payment_id, amount_paid, worker_id) 
        VALUES (?, ?, ?)
      `;
      
      db.query(transactionQuery, [paymentId, amountPaid, workerId], (transactionErr) => {
        if (transactionErr) {
          return rollbackAndRespond(transactionErr, res);
        }

        createInventoryLogAndComplete(itemId, workerId, res, contractId, message);
      });
    }

    function createInventoryLogAndComplete(itemId, workerId, res, contractId, message) {
      // Create inventory log
      const inventoryQuery = `
        INSERT INTO inventory_logs 
        (item_id, worker_id, change_type, quantity_changed) 
        VALUES (?, ?, 'sale', 0)
      `;
      
      db.query(inventoryQuery, [itemId, workerId], (inventoryErr) => {
        if (inventoryErr) {
          return rollbackAndRespond(inventoryErr, res);
        }

        checkContractCompletion(contractId, res, message);
      });
    }

    function checkContractCompletion(contractId, res, originalMessage) {
      // Check if all payments have amount_due = 0
      const completionQuery = `
        SELECT COUNT(*) as pending_count 
        FROM installment_payments ip
        JOIN installment_contracts ic ON ip.sale_id = ic.sale_id
        WHERE ic.id = ? AND ip.amount_due > 0
      `;
      
      db.query(completionQuery, [contractId], (completionErr, completionResults) => {
        if (completionErr) {
          return rollbackAndRespond(completionErr, res);
        }

        let finalMessage = originalMessage;
        
        if (completionResults[0].pending_count === 0) {
          // Mark contract as completed
          const updateContractQuery = `
            UPDATE installment_contracts 
            SET status = 'completed' 
            WHERE id = ?
          `;
          
          db.query(updateContractQuery, [contractId], (contractErr) => {
            if (contractErr) {
              return rollbackAndRespond(contractErr, res);
            }
            finalMessage += ' All payments completed! Contract marked as COMPLETED.';
            commitAndRespond(res, finalMessage);
          });
        } else {
          commitAndRespond(res, finalMessage);
        }
      });
    }

    function commitAndRespond(res, message) {
      db.query('COMMIT', (commitErr) => {
        if (commitErr) {
          return rollbackAndRespond(commitErr, res);
        }
        res.json({
          success: true,
          message: message
        });
      });
    }

    function rollbackAndRespond(error, res) {
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
    
    const query = `
      SELECT it.*, u.username as worker_name
      FROM installment_transactions it
      LEFT JOIN users u ON it.worker_id = u.id
      WHERE it.payment_id = ?
      ORDER BY it.payment_date DESC
    `;
    
    db.query(query, [payment_id], (err, results) => {
      if (err) {
        console.error('Get transactions error:', err);
        return res.status(500).json({
          success: false,
          error: 'Failed to fetch transactions'
        });
      }

      res.json({
        success: true,
        transactions: results
      });
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
    
    // Get contract details
    const contractQuery = `
      SELECT ic.*, cc.full_name as customer_name, i.name as item_name
      FROM installment_contracts ic
      LEFT JOIN contract_customers cc ON ic.customer_id = cc.id
      LEFT JOIN items i ON ic.item_id = i.id
      WHERE ic.id = ?
    `;
    
    db.query(contractQuery, [contract_id], (contractErr, contractResults) => {
      if (contractErr) {
        console.error('Get contract summary error:', contractErr);
        return res.status(500).json({
          success: false,
          error: 'Failed to fetch contract summary'
        });
      }

      if (contractResults.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Contract not found'
        });
      }

      const contract = contractResults[0];

      // Get payment statistics based on amount_due
      const statsQuery = `
        SELECT 
          COUNT(*) as total_payments,
          SUM(amount_due + amount_paid) as original_total,
          SUM(amount_due) as total_remaining_due,
          SUM(amount_paid) as total_paid,
          COUNT(CASE WHEN amount_due = 0 THEN 1 END) as completed_count,
          COUNT(CASE WHEN amount_due > 0 AND amount_paid > 0 THEN 1 END) as partial_count,
          COUNT(CASE WHEN amount_due > 0 AND amount_paid = 0 THEN 1 END) as pending_count
        FROM installment_payments 
        WHERE sale_id = ?
      `;
      
      db.query(statsQuery, [contract.sale_id], (statsErr, statsResults) => {
        if (statsErr) {
          console.error('Get payment stats error:', statsErr);
          return res.status(500).json({
            success: false,
            error: 'Failed to fetch payment statistics'
          });
        }

        const stats = statsResults[0];

        res.json({
          success: true,
          summary: {
            contract: contract,
            statistics: stats,
            progress: {
              percentage: stats.original_total > 0 ? ((stats.original_total - stats.total_remaining_due) / stats.original_total * 100).toFixed(2) : 0,
              paid_amount: stats.total_paid,
              remaining_amount: stats.total_remaining_due
            }
          }
        });
      });
    });
  } catch (error) {
    console.error('Get payment summary error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch payment summary'
    });
  }
});

// GET /api/payments/overdue - Get overdue payments
router.get('/overdue', async (req, res) => {
  try {
    const query = `
      SELECT 
        ip.*,
        ic.id as contract_id,
        cc.full_name as customer_name,
        cc.phone as customer_phone,
        i.name as item_name
      FROM installment_payments ip
      JOIN installment_contracts ic ON ip.sale_id = ic.sale_id
      JOIN contract_customers cc ON ic.customer_id = cc.id
      JOIN items i ON ic.item_id = i.id
      WHERE ip.due_date < CURDATE() 
      AND ip.amount_due > 0
      AND ic.status = 'active'
      ORDER BY ip.due_date ASC
    `;
    
    db.query(query, (err, results) => {
      if (err) {
        console.error('Get overdue payments error:', err);
        return res.status(500).json({
          success: false,
          error: 'Failed to fetch overdue payments'
        });
      }

      res.json({
        success: true,
        overdue_payments: results,
        total_overdue: results.length
      });
    });
  } catch (error) {
    console.error('Get overdue payments error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch overdue payments'
    });
  }
});

module.exports = router;