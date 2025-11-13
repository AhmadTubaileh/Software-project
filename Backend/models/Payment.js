const db = require('../config/database');

class Payment {
  // Search contracts by customer name
  static searchContracts(customerName) {
    return new Promise((resolve, reject) => {
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
      
      db.query(query, [`%${customerName}%`], (err, results) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(results);
      });
    });
  }

  // Get payments for a contract
  static getPaymentsByContract(contractId) {
    return new Promise((resolve, reject) => {
      // First get sale_id from contract
      const contractQuery = 'SELECT sale_id FROM installment_contracts WHERE id = ?';
      db.query(contractQuery, [contractId], (err, contractResults) => {
        if (err) {
          reject(err);
          return;
        }

        if (contractResults.length === 0) {
          reject(new Error('Contract not found'));
          return;
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
            reject(paymentsErr);
            return;
          }
          resolve(paymentsResults);
        });
      });
    });
  }

  // Get payment by ID with contract details
  static getPaymentById(paymentId) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT ip.*, ic.item_id, ic.id as contract_id, ic.sale_id
        FROM installment_payments ip
        JOIN installment_contracts ic ON ip.sale_id = ic.sale_id
        WHERE ip.id = ?
      `;
      
      db.query(query, [paymentId], (err, results) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(results[0] || null);
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

  // Create transaction record
  static createTransaction(paymentId, amountPaid, workerId) {
    return new Promise((resolve, reject) => {
      const query = `
        INSERT INTO installment_transactions 
        (payment_id, amount_paid, worker_id) 
        VALUES (?, ?, ?)
      `;
      
      db.query(query, [paymentId, amountPaid, workerId], (err, result) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(result);
      });
    });
  }

  // Create inventory log
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

  // Check if contract is completed (all payments have amount_due = 0)
  static isContractCompleted(saleId) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT COUNT(*) as pending_count 
        FROM installment_payments 
        WHERE sale_id = ? AND amount_due > 0
      `;
      
      db.query(query, [saleId], (err, results) => {
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

  // Get next unpaid payment
  static getNextUnpaidPayment(saleId, currentMonth) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT * FROM installment_payments 
        WHERE sale_id = ? AND month_number > ? AND amount_due > 0
        ORDER BY month_number LIMIT 1
      `;
      
      db.query(query, [saleId, currentMonth], (err, results) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(results[0] || null);
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
            reject(statsErr);
            return;
          }

          const stats = statsResults[0];
          const summary = {
            contract: contract,
            statistics: stats,
            progress: {
              percentage: stats.original_total > 0 ? ((stats.original_total - stats.total_remaining_due) / stats.original_total * 100).toFixed(2) : 0,
              paid_amount: stats.total_paid,
              remaining_amount: stats.total_remaining_due
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
          reject(err);
          return;
        }
        resolve(results);
      });
    });
  }
}

module.exports = Payment;