const db = require('../config/database');

class Payment {
  // Search contracts by customer name or ID card number
// In Payment model (Payment.js)
static searchContracts(searchValue, searchType = 'name') {
  return new Promise((resolve, reject) => {
    let query, params;
    
    if (searchType === 'id_card') {
      // Search by exact ID card number
      query = `
        SELECT 
          ic.*,
          cc.full_name as customer_name,
          cc.phone as customer_phone,
          cc.id_card_number as customer_id_card,
          i.name as item_name,
          u.username as worker_name
        FROM installment_contracts ic
        LEFT JOIN contract_customers cc ON ic.customer_id = cc.id
        LEFT JOIN items i ON ic.item_id = i.id
        LEFT JOIN users u ON ic.user_id = u.id
        WHERE cc.id_card_number = ? 
          AND ic.status = 'active'
        ORDER BY ic.created_at DESC
      `;
      params = [searchValue];
    } else {
      // Default: search by name (partial match)
      query = `
        SELECT 
          ic.*,
          cc.full_name as customer_name,
          cc.phone as customer_phone,
          cc.id_card_number as customer_id_card,
          i.name as item_name,
          u.username as worker_name
        FROM installment_contracts ic
        LEFT JOIN contract_customers cc ON ic.customer_id = cc.id
        LEFT JOIN items i ON ic.item_id = i.id
        LEFT JOIN users u ON ic.user_id = u.id
        WHERE cc.full_name LIKE ? 
          AND ic.status = 'active'
        ORDER BY ic.created_at DESC
      `;
      params = [`%${searchValue}%`];
    }
    
    console.log(`🔍 Executing ${searchType} search for: ${searchValue}`);
    console.log(`📊 Query: ${query.substring(0, 100)}...`);
    
    db.query(query, params, (err, results) => {
      if (err) {
        console.error('❌ Database query error:', err);
        reject(err);
        return;
      }
      console.log(`✅ Found ${results.length} contracts`);
      resolve(results);
    });
  });
}

  // Get payments for a contract
  static getPaymentsByContract(contractId) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT * FROM installment_payments 
        WHERE contract_id = ? 
        ORDER BY month_number
      `;
      
      db.query(query, [contractId], (err, results) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(results);
      });
    });
  }

  // Get payment by ID with contract details
static getPaymentById(paymentId) {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        ip.*,
        ic.id as contract_id,
        ic.customer_id,
        ic.item_id,
        ic.down_payment,
        ic.monthly_payment,
        ic.installment_last_payment,
        ic.months,
        ic.status as contract_status,
        cc.full_name as customer_name
      FROM installment_payments ip
      LEFT JOIN installment_contracts ic ON ip.contract_id = ic.id
      LEFT JOIN contract_customers cc ON ic.customer_id = cc.id
      WHERE ip.id = ?
    `;
    
    console.log(`🔍 Fetching payment ${paymentId}`);
    
    db.query(query, [paymentId], (err, results) => {
      if (err) {
        console.error('❌ Error fetching payment:', err);
        reject(err);
        return;
      }
      
      if (results.length === 0) {
        console.log(`❌ Payment ${paymentId} not found`);
        resolve(null);
        return;
      }
      
      console.log(`✅ Payment ${paymentId} found, month_number: ${results[0].month_number}`);
      resolve(results[0]);
    });
  });
}

  // Get next unpaid payments for a contract
  static getNextUnpaidPayments(contractId, startFromMonth) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT * FROM installment_payments 
        WHERE contract_id = ? 
          AND month_number > ?
          AND amount_due > amount_paid
          AND status != 'paid'
        ORDER BY month_number
      `;
      
      db.query(query, [contractId, startFromMonth], (err, results) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(results);
      });
    });
  }

  // Update payment details
  static updatePayment(paymentId, updates) {
    return new Promise((resolve, reject) => {
      const { amount_due, amount_paid, status, paid_date } = updates;
      
      const query = `
        UPDATE installment_payments 
        SET amount_due = ?, amount_paid = ?, status = ?, paid_date = ?
        WHERE id = ?
      `;
      
      db.query(query, [amount_due, amount_paid, status, paid_date, paymentId], (err, result) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(result);
      });
    });
  }

  // Update payment amount paid (keep amount_due fixed) - UPDATED
  static updatePaymentAmountPaid(paymentId, newAmountPaid) {
    return new Promise((resolve, reject) => {
      const query = `
        UPDATE installment_payments 
        SET 
          amount_paid = ?, 
          status = CASE 
            WHEN ? >= amount_due THEN 'paid'
            WHEN ? > 0 THEN 'partial'
            ELSE status
          END,
          paid_date = CASE 
            WHEN ? >= amount_due THEN NOW()
            ELSE paid_date
          END
        WHERE id = ?
      `;
      
      db.query(query, [newAmountPaid, newAmountPaid, newAmountPaid, newAmountPaid, paymentId], (err, result) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(result);
      });
    });
  }

  // Create sales record
  static createSalesRecord(salesData) {
    return new Promise((resolve, reject) => {
      const { user_id, customer_id, item_id, price, contract_id } = salesData;
      
      const query = `
        INSERT INTO sales 
        (user_id, customer_id, item_id, sale_type, price, sale_id) 
        VALUES (?, ?, ?, 'installment', ?, ?)
      `;
      
      db.query(query, [user_id, customer_id, item_id, price, contract_id], (err, result) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(result.insertId);
      });
    });
  }

  // Create transaction record
  static createTransaction(paymentId, saleId, amountPaid, workerId) {
    return new Promise((resolve, reject) => {
      const query = `
        INSERT INTO installment_transactions 
        (payment_id, sale_id, amount_paid, worker_id) 
        VALUES (?, ?, ?, ?)
      `;
      
      db.query(query, [paymentId, saleId, amountPaid, workerId], (err, result) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(result);
      });
    });
  }

  // Create credit transaction for excess payments
  static createCreditTransaction(saleId, creditAmount, workerId, contractId) {
    return new Promise((resolve, reject) => {
      const query = `
        INSERT INTO installment_transactions 
        (sale_id, amount_paid, worker_id, transaction_type, credit_amount, contract_id) 
        VALUES (?, 0, ?, 'credit', ?, ?)
      `;
      
      db.query(query, [saleId, workerId, creditAmount, contractId], (err, result) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(result);
      });
    });
  }

  // Create inventory log (only for down payment)
  static createInventoryLog(itemId, workerId, changeType, quantityChanged) {
    return new Promise((resolve, reject) => {
      const query = `
        INSERT INTO inventory_logs 
        (item_id, worker_id, change_type, quantity_changed) 
        VALUES (?, ?, ?, ?)
      `;
      
      db.query(query, [itemId, workerId, changeType, quantityChanged], (err, result) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(result);
      });
    });
  }

  // Decrease item quantity (only for down payment)
  static decreaseItemQuantity(itemId) {
    return new Promise((resolve, reject) => {
      const query = 'UPDATE items SET quantity = quantity - 1 WHERE id = ?';
      
      db.query(query, [itemId], (err, result) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(result);
      });
    });
  }

  // Check if contract is completed (all payments have amount_due = amount_paid)
  static isContractCompleted(contractId) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT COUNT(*) as pending_count 
        FROM installment_payments 
        WHERE contract_id = ? AND amount_due > amount_paid
      `;
      
      db.query(query, [contractId], (err, results) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(results[0].pending_count === 0);
      });
    });
  }

  // Mark contract as completed
  static markContractCompleted(contractId) {
    return new Promise((resolve, reject) => {
      const query = `
        UPDATE installment_contracts 
        SET status = 'completed' 
        WHERE id = ?
      `;
      
      db.query(query, [contractId], (err, result) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(result);
      });
    });
  }

  // Get transaction history for a payment
  static getPaymentTransactions(paymentId) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT it.*, u.username as worker_name
        FROM installment_transactions it
        LEFT JOIN users u ON it.worker_id = u.id
        WHERE it.payment_id = ?
        ORDER BY it.payment_date DESC
      `;
      
      db.query(query, [paymentId], (err, results) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(results);
      });
    });
  }

  // Get payment summary for contract
  static getPaymentSummary(contractId) {
    return new Promise((resolve, reject) => {
      // Get contract details
      const contractQuery = `
        SELECT ic.*, cc.full_name as customer_name, i.name as item_name
        FROM installment_contracts ic
        LEFT JOIN contract_customers cc ON ic.customer_id = cc.id
        LEFT JOIN items i ON ic.item_id = i.id
        WHERE ic.id = ?
      `;
      
      db.query(contractQuery, [contractId], (contractErr, contractResults) => {
        if (contractErr) {
          reject(contractErr);
          return;
        }

        if (contractResults.length === 0) {
          reject(new Error('Contract not found'));
          return;
        }

        const contract = contractResults[0];

        // Get payment statistics
        const statsQuery = `
          SELECT 
            COUNT(*) as total_payments,
            SUM(amount_due) as total_amount_due,
            SUM(amount_paid) as total_amount_paid,
            COUNT(CASE WHEN amount_due = amount_paid THEN 1 END) as paid_count,
            COUNT(CASE WHEN amount_due > amount_paid AND amount_paid > 0 THEN 1 END) as partial_count,
            COUNT(CASE WHEN amount_paid = 0 THEN 1 END) as pending_count,
            SUM(CASE WHEN is_overdue = 1 THEN 1 ELSE 0 END) as overdue_count
          FROM installment_payments 
          WHERE contract_id = ?
        `;
        
        db.query(statsQuery, [contractId], (statsErr, statsResults) => {
          if (statsErr) {
            reject(statsErr);
            return;
          }

          const stats = statsResults[0];
          const summary = {
            contract: contract,
            statistics: stats,
            progress: {
              percentage: stats.total_amount_due > 0 ? 
                (stats.total_amount_paid / stats.total_amount_due * 100).toFixed(2) : 0,
              paid_amount: stats.total_amount_paid,
              remaining_amount: stats.total_amount_due - stats.total_amount_paid,
              total_due: stats.total_amount_due
            }
          };

          resolve(summary);
        });
      });
    });
  }

  // Get overdue payments
  static getOverduePayments() {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          ip.*,
          ic.id as contract_id,
          cc.full_name as customer_name,
          cc.phone as customer_phone,
          i.name as item_name
        FROM installment_payments ip
        LEFT JOIN installment_contracts ic ON ip.contract_id = ic.id
        LEFT JOIN contract_customers cc ON ic.customer_id = cc.id
        LEFT JOIN items i ON ic.item_id = i.id
        WHERE ip.due_date < CURDATE() 
          AND ip.amount_due > ip.amount_paid
          AND ip.month_number >= 1
          AND ic.status = 'active'
        ORDER BY ip.due_date ASC
      `;
      
      db.query(query, (err, results) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(results);
      });
    });
  }

  // Get all sales records for a contract
  static getContractSales(contractId) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          s.*,
          u.username as worker_name
        FROM sales s
        LEFT JOIN users u ON s.user_id = u.id
        WHERE s.sale_id = ? AND s.sale_type = 'installment'
        ORDER BY s.date DESC
      `;
      
      db.query(query, [contractId], (err, results) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(results);
      });
    });
  }

  // Get all transactions for a contract
  static getContractTransactions(contractId) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          it.*,
          ip.month_number,
          u.username as worker_name
        FROM installment_transactions it
        LEFT JOIN installment_payments ip ON it.payment_id = ip.id
        LEFT JOIN users u ON it.worker_id = u.id
        WHERE it.contract_id = ?
        ORDER BY it.payment_date DESC
      `;
      
      db.query(query, [contractId], (err, results) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(results);
      });
    });
  }

  // Get credit balance for a contract
  static getCreditBalance(contractId) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          SUM(credit_amount) as total_credit
        FROM installment_transactions 
        WHERE contract_id = ? AND transaction_type = 'credit'
      `;
      
      db.query(query, [contractId], (err, results) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(results[0]?.total_credit || 0);
      });
    });
  }

  // Get payment by contract and month
  static getPaymentByContractAndMonth(contractId, monthNumber) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT * FROM installment_payments 
        WHERE contract_id = ? AND month_number = ?
      `;
      
      db.query(query, [contractId, monthNumber], (err, results) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(results[0] || null);
      });
    });
  }

  // NEW: Check if payment exists and can be processed
  static validatePayment(paymentId) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          ip.*,
          ic.status as contract_status
        FROM installment_payments ip
        LEFT JOIN installment_contracts ic ON ip.contract_id = ic.id
        WHERE ip.id = ?
      `;
      
      db.query(query, [paymentId], (err, results) => {
        if (err) {
          reject(err);
          return;
        }
        
        if (results.length === 0) {
          resolve({ valid: false, error: 'Payment not found' });
          return;
        }
        
        const payment = results[0];
        
        if (payment.contract_status !== 'active') {
          resolve({ valid: false, error: 'Contract is not active' });
          return;
        }
        
        if (payment.amount_paid >= payment.amount_due) {
          resolve({ valid: false, error: 'Payment already fully paid' });
          return;
        }
        
        resolve({ valid: true, payment: payment });
      });
    });
  }
}

module.exports = Payment;