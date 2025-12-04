const db = require('../config/database');

class Overdue {
  // In Overdue model, update syncOverduePayments method:
static syncOverduePayments() {
  return new Promise((resolve, reject) => {
    db.query('START TRANSACTION', async (startErr) => {
      if (startErr) {
        reject(startErr);
        return;
      }

      try {
        const stats = {
          added: 0,
          resolved: 0,
          status_changed: 0,
          not_responding_to_pending: 0
        };

        // 1. Add new overdue payments to summary
        const addNewQuery = `
          INSERT INTO installment_overdue_summary (payment_id, status, last_followup_date)
          SELECT ip.id, 'pending', NOW()
          FROM installment_payments ip
          LEFT JOIN installment_overdue_summary ios ON ip.id = ios.payment_id
          WHERE ip.status IN ('pending', 'partial')
            AND ip.is_overdue = 1
            AND ios.id IS NULL
        `;
        
        const addResult = await this.queryPromise(addNewQuery);
        stats.added = addResult.affectedRows;
        console.log(`✅ Added ${stats.added} new overdue payments to summary`);

        // 2. Update resolved payments
        const updateResolvedQuery = `
          UPDATE installment_overdue_summary ios
          INNER JOIN installment_payments ip ON ios.payment_id = ip.id
          SET ios.status = 'resolved',
              ios.updated_at = NOW()
          WHERE ip.status = 'paid'
            AND ios.status != 'resolved'
        `;
        
        const resolvedResult = await this.queryPromise(updateResolvedQuery);
        stats.resolved = resolvedResult.affectedRows;
        console.log(`✅ Updated ${stats.resolved} payments to resolved status`);

        // 3. Update waiting payments to pending if past follow-up date
        const updateWaitingQuery = `
          UPDATE installment_overdue_summary
          SET status = 'pending',
              updated_at = NOW()
          WHERE status = 'waiting'
            AND next_followup_date IS NOT NULL
            AND next_followup_date <= CURDATE()
        `;
        
        const waitingResult = await this.queryPromise(updateWaitingQuery);
        stats.status_changed = waitingResult.affectedRows;
        console.log(`✅ Changed ${stats.status_changed} waiting payments to pending`);

        // 4. NEW: Update "not_responding" payments to "pending" when next follow-up date arrives
        const updateNotRespondingQuery = `
          UPDATE installment_overdue_summary
          SET status = 'pending',
              updated_at = NOW()
          WHERE status = 'not_responding'
            AND next_followup_date IS NOT NULL
            AND next_followup_date <= CURDATE()
        `;
        
        const notRespondingResult = await this.queryPromise(updateNotRespondingQuery);
        stats.not_responding_to_pending = notRespondingResult.affectedRows;
        console.log(`✅ Changed ${stats.not_responding_to_pending} not_responding payments to pending`);

        // Commit transaction
        await this.queryPromise('COMMIT');
        console.log('💾 Sync transaction committed');

        resolve(stats);
      } catch (error) {
        await this.queryPromise('ROLLBACK');
        reject(error);
      }
    });
  });
}

  // Helper method for promise-based queries
  static queryPromise(sql, params = []) {
    return new Promise((resolve, reject) => {
      db.query(sql, params, (err, results) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(results);
      });
    });
  }

  // Get overdue summary with filters
  static getOverdueSummary(filters = {}) {
    return new Promise((resolve, reject) => {
      let query = `
        SELECT 
          ios.*,
          ip.contract_id,
          ip.month_number,
          ip.bill_date,
          ip.due_date,
          ip.amount_due,
          ip.amount_paid,
          ip.status as payment_status,
          ic.customer_id,
          cc.full_name as customer_name,
          cc.phone as customer_phone,
          i.name as item_name,
          u.username as worker_name,
          (SELECT COUNT(*) FROM installment_overdue_followups iof WHERE iof.payment_id = ios.payment_id) as followup_count
        FROM installment_overdue_summary ios
        INNER JOIN installment_payments ip ON ios.payment_id = ip.id
        INNER JOIN installment_contracts ic ON ip.contract_id = ic.id
        INNER JOIN contract_customers cc ON ic.customer_id = cc.id
        INNER JOIN items i ON ic.item_id = i.id
        LEFT JOIN users u ON ios.last_worker_id = u.id
        WHERE 1=1
      `;
      
      const params = [];
      
      if (filters.status) {
        query += ' AND ios.status = ?';
        params.push(filters.status);
      }
      
      if (filters.contract_id) {
        query += ' AND ip.contract_id = ?';
        params.push(filters.contract_id);
      }
      
      query += ' ORDER BY ios.updated_at DESC, ip.due_date ASC';
      
      db.query(query, params, (err, results) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(results);
      });
    });
  }

  // Get contracts that have overdue payments
  static getContractsWithOverdue() {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT DISTINCT
          ic.*,
          cc.full_name as customer_name,
          cc.phone as customer_phone,
          i.name as item_name,
          u.username as worker_name,
          (
            SELECT COUNT(*) 
            FROM installment_payments ip 
            WHERE ip.contract_id = ic.id 
              AND ip.is_overdue = 1
              AND ip.status IN ('pending', 'partial')
          ) as overdue_count,
          (
            SELECT COUNT(*)
            FROM installment_overdue_summary ios
            INNER JOIN installment_payments ip2 ON ios.payment_id = ip2.id
            WHERE ip2.contract_id = ic.id
              AND ios.status != 'resolved'
          ) as active_overdue_count
        FROM installment_contracts ic
        INNER JOIN contract_customers cc ON ic.customer_id = cc.id
        INNER JOIN items i ON ic.item_id = i.id
        INNER JOIN users u ON ic.user_id = u.id
        WHERE ic.status = 'active'
          AND EXISTS (
            SELECT 1 
            FROM installment_payments ip 
            WHERE ip.contract_id = ic.id 
              AND ip.is_overdue = 1
              AND ip.status IN ('pending', 'partial')
          )
        ORDER BY ic.created_at DESC
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

  // Get overdue payments for specific contract
  static getOverduePaymentsByContract(contractId) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          ios.*,
          ip.month_number,
          ip.bill_date,
          ip.due_date,
          ip.amount_due,
          ip.amount_paid,
          ip.status as payment_status,
          (SELECT COUNT(*) FROM installment_overdue_followups iof WHERE iof.payment_id = ios.payment_id) as followup_count
        FROM installment_overdue_summary ios
        INNER JOIN installment_payments ip ON ios.payment_id = ip.id
        WHERE ip.contract_id = ?
        ORDER BY ip.month_number
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

  // Get follow-up history for a payment
  static getPaymentFollowups(paymentId) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          iof.*,
          u.username as worker_name
        FROM installment_overdue_followups iof
        LEFT JOIN users u ON iof.worker_id = u.id
        WHERE iof.payment_id = ?
        ORDER BY iof.call_date DESC
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

  // Add new follow-up entry and update summary
  static addFollowup(followupData) {
    return new Promise((resolve, reject) => {
      const {
        payment_id,
        worker_id,
        status,
        customer_response,
        promise_date,
        next_followup_date
      } = followupData;

      db.query('START TRANSACTION', async (startErr) => {
        if (startErr) {
          reject(startErr);
          return;
        }

        try {
          // 1. Insert follow-up record
          const insertFollowupQuery = `
            INSERT INTO installment_overdue_followups 
            (payment_id, worker_id, customer_response, promise_date, next_followup_date, status)
            VALUES (?, ?, ?, ?, ?, ?)
          `;
          
          const followupResult = await this.queryPromise(insertFollowupQuery, [
            payment_id,
            worker_id,
            customer_response,
            promise_date,
            next_followup_date,
            status
          ]);
          
          const followupId = followupResult.insertId;
          console.log(`✅ Added follow-up ID: ${followupId}`);

          // 2. Update summary with new status
          const updateSummaryQuery = `
            UPDATE installment_overdue_summary
            SET status = ?,
                last_followup_date = NOW(),
                next_followup_date = ?,
                promise_date = ?,
                last_response = ?,
                last_worker_id = ?,
                updated_at = NOW()
            WHERE payment_id = ?
          `;
          
          await this.queryPromise(updateSummaryQuery, [
            status,
            next_followup_date,
            promise_date,
            customer_response,
            worker_id,
            payment_id
          ]);
          
          console.log(`✅ Updated summary status to: ${status}`);

          // Commit transaction
          await this.queryPromise('COMMIT');
          
          resolve({
            followupId,
            updatedStatus: status
          });
        } catch (error) {
          await this.queryPromise('ROLLBACK');
          reject(error);
        }
      });
    });
  }

  // Update payment status directly
  static updatePaymentStatus(paymentId, status, lastWorkerId = null) {
    return new Promise((resolve, reject) => {
      const query = `
        UPDATE installment_overdue_summary
        SET status = ?,
            last_worker_id = ?,
            updated_at = NOW()
        WHERE payment_id = ?
      `;
      
      db.query(query, [status, lastWorkerId, paymentId], (err, result) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(result);
      });
    });
  }

  // Get statistics
  static getStatistics() {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          (SELECT COUNT(*) FROM installment_overdue_summary) as total_overdue,
          (SELECT COUNT(*) FROM installment_overdue_summary WHERE status = 'pending') as pending_count,
          (SELECT COUNT(*) FROM installment_overdue_summary WHERE status = 'waiting') as waiting_count,
          (SELECT COUNT(*) FROM installment_overdue_summary WHERE status = 'not_responding') as not_responding_count,
          (SELECT COUNT(*) FROM installment_overdue_summary WHERE status = 'resolved') as resolved_count,
          (SELECT COUNT(DISTINCT contract_id) FROM installment_overdue_summary ios INNER JOIN installment_payments ip ON ios.payment_id = ip.id WHERE ios.status != 'resolved') as active_contracts_count,
          (SELECT SUM(amount_due - amount_paid) FROM installment_overdue_summary ios INNER JOIN installment_payments ip ON ios.payment_id = ip.id WHERE ios.status != 'resolved') as total_overdue_amount
      `;
      
      db.query(query, (err, results) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(results[0] || {});
      });
    });
  }
  // Search contracts with overdue payments by customer name
static searchContractsByCustomerName(customerName) {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT DISTINCT
        ic.*,
        cc.full_name as customer_name,
        cc.phone as customer_phone,
        i.name as item_name,
        u.username as worker_name,
        (
          SELECT COUNT(*) 
          FROM installment_payments ip 
          WHERE ip.contract_id = ic.id 
            AND ip.is_overdue = 1
            AND ip.status IN ('pending', 'partial')
        ) as overdue_count,
        (
          SELECT COUNT(*)
          FROM installment_overdue_summary ios
          INNER JOIN installment_payments ip2 ON ios.payment_id = ip2.id
          WHERE ip2.contract_id = ic.id
            AND ios.status != 'resolved'
        ) as active_overdue_count,
        (
          SELECT SUM(amount_due - amount_paid)
          FROM installment_payments ip3
          WHERE ip3.contract_id = ic.id
            AND ip3.is_overdue = 1
            AND ip3.status IN ('pending', 'partial')
        ) as total_overdue_amount
      FROM installment_contracts ic
      INNER JOIN contract_customers cc ON ic.customer_id = cc.id
      INNER JOIN items i ON ic.item_id = i.id
      INNER JOIN users u ON ic.user_id = u.id
      WHERE ic.status = 'active'
        AND EXISTS (
          SELECT 1 
          FROM installment_payments ip 
          WHERE ip.contract_id = ic.id 
            AND ip.is_overdue = 1
            AND ip.status IN ('pending', 'partial')
        )
        AND cc.full_name LIKE ?
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

// Get contract overdue payments with follow-up messages (FIXED for older MySQL)
static getContractOverduePaymentsWithFollowups(contractId) {
  return new Promise((resolve, reject) => {
    // First get all overdue payments for the contract
    const paymentsQuery = `
      SELECT 
        ios.*,
        ip.month_number,
        ip.bill_date,
        ip.due_date,
        ip.amount_due,
        ip.amount_paid,
        ip.status as payment_status
      FROM installment_overdue_summary ios
      INNER JOIN installment_payments ip ON ios.payment_id = ip.id
      WHERE ip.contract_id = ?
      ORDER BY ip.month_number
    `;
    
    db.query(paymentsQuery, [contractId], async (paymentsErr, paymentsResults) => {
      if (paymentsErr) {
        reject(paymentsErr);
        return;
      }

      try {
        // For each payment, get its followups
        const paymentsWithFollowups = await Promise.all(
          paymentsResults.map(async (payment) => {
            const followups = await this.getPaymentFollowups(payment.payment_id);
            return {
              ...payment,
              followups: followups || []
            };
          })
        );
        
        resolve(paymentsWithFollowups);
      } catch (error) {
        reject(error);
      }
    });
  });
}

// Get follow-up history for a payment (Updated to get worker_name)
static getPaymentFollowups(paymentId) {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        iof.*,
        u.username as worker_name
      FROM installment_overdue_followups iof
      LEFT JOIN users u ON iof.worker_id = u.id
      WHERE iof.payment_id = ?
      ORDER BY iof.call_date DESC
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
// Get ALL payments for a contract (both overdue and non-overdue)
static getAllPaymentsForContract(contractId) {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        ip.*,
        ios.status as overdue_status,
        ios.last_followup_date,
        ios.next_followup_date,
        ios.promise_date,
        ios.last_response,
        ios.updated_at as overdue_updated,
        (
          SELECT COUNT(*) 
          FROM installment_overdue_followups iof 
          WHERE iof.payment_id = ip.id
        ) as followup_count,
        ic.total_price as contract_total,
        ic.down_payment as contract_down_payment,
        ic.months as contract_months,
        ic.monthly_payment as contract_monthly,
        cc.full_name as customer_name,
        i.name as item_name
      FROM installment_payments ip
      LEFT JOIN installment_overdue_summary ios ON ip.id = ios.payment_id
      INNER JOIN installment_contracts ic ON ip.contract_id = ic.id
      INNER JOIN contract_customers cc ON ic.customer_id = cc.id
      INNER JOIN items i ON ic.item_id = i.id
      WHERE ip.contract_id = ?
      ORDER BY ip.month_number ASC
    `;
    
    db.query(query, [contractId], async (err, paymentsResults) => {
      if (err) {
        reject(err);
        return;
      }

      try {
        // For each payment, get followups if it's overdue
        const paymentsWithFollowups = await Promise.all(
          paymentsResults.map(async (payment) => {
            let followups = [];
            // Only fetch followups for overdue payments
            if (payment.is_overdue === 1) {
              followups = await this.getPaymentFollowups(payment.id);
            }
            return {
              ...payment,
              followups: followups || [],
              is_overdue: payment.is_overdue === 1
            };
          })
        );
        
        resolve(paymentsWithFollowups);
      } catch (error) {
        reject(error);
      }
    });
  });
}

// Get detailed contract info with customer
static getContractDetails(contractId) {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        ic.*,
        cc.full_name as customer_name,
        cc.phone as customer_phone,
        cc.id_card_number,
        cc.address as customer_address,
        cc.email as customer_email,
        i.name as item_name,
        i.description as item_description,
        u.username as worker_name
      FROM installment_contracts ic
      INNER JOIN contract_customers cc ON ic.customer_id = cc.id
      INNER JOIN items i ON ic.item_id = i.id
      INNER JOIN users u ON ic.user_id = u.id
      WHERE ic.id = ?
    `;
    
    db.query(query, [contractId], (err, results) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(results[0] || null);
    });
  });
}

  // Get payment details for follow-up
  static getPaymentWithDetails(paymentId) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          ios.*,
          ip.*,
          ic.customer_id,
          cc.full_name as customer_name,
          cc.phone as customer_phone,
          i.name as item_name
        FROM installment_overdue_summary ios
        INNER JOIN installment_payments ip ON ios.payment_id = ip.id
        INNER JOIN installment_contracts ic ON ip.contract_id = ic.id
        INNER JOIN contract_customers cc ON ic.customer_id = cc.id
        INNER JOIN items i ON ic.item_id = i.id
        WHERE ios.payment_id = ?
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
}

module.exports = Overdue;