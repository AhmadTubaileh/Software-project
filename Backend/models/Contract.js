const db = require('../config/database');

class Contract {
  // Get items available for installment
  static getInstallmentItems() {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          i.*,
          (i.quantity - IFNULL(reserved.reserved_count, 0)) as available_quantity
        FROM items i
        LEFT JOIN (
          SELECT item_id, COUNT(*) as reserved_count 
          FROM installment_contracts 
          WHERE status = 'pending'
          GROUP BY item_id
        ) reserved ON i.id = reserved.item_id
        WHERE i.available = 1 
        AND i.installment = 1
        AND (i.quantity - IFNULL(reserved.reserved_count, 0)) > 0
        ORDER BY i.name
      `;
      
      db.query(query, (err, results) => {
        if (err) {
          reject(err);
          return;
        }
        
        // Convert BLOB images to base64
        const items = results.map(item => {
          if (item.item_image) {
            try {
              item.item_image = Buffer.from(item.item_image).toString('base64');
            } catch (error) {
              console.error('Error serializing image:', error);
              item.item_image = null;
            }
          }
          return item;
        });
        
        resolve(items);
      });
    });
  }

  // Apply for new contract
  static apply(applicationData) {
    return new Promise((resolve, reject) => {
      const { customer_data, sponsors_data, contract_data } = applicationData;

      // Start transaction manually since we don't have connection pooling
      db.query('START TRANSACTION', (startErr) => {
        if (startErr) {
          reject(startErr);
          return;
        }

        let customerId;

        // 1. Check if customer exists
        const customerCheckQuery = 'SELECT id FROM contract_customers WHERE id_card_number = ?';
        db.query(customerCheckQuery, [customer_data.id_card_number], (err, customerResults) => {
          if (err) {
            return rollbackAndReject(err, reject);
          }

          if (customerResults.length > 0) {
            customerId = customerResults[0].id;
            // Update customer - only update image if a new one was provided
            const updateCustomerQuery = `
              UPDATE contract_customers 
              SET full_name = ?, phone = ?, address = ?, email = ?, 
                  id_card_image = COALESCE(?, id_card_image)
              WHERE id = ?
            `;
            
            db.query(updateCustomerQuery, [
              customer_data.full_name,
              customer_data.phone,
              customer_data.address,
              customer_data.email,
              customer_data.id_card_image, // Will be NULL if no new image, keeping existing
              customerId
            ], (updateErr) => {
              if (updateErr) {
                return rollbackAndReject(updateErr, reject);
              }
              proceedWithContract();
            });
          } else {
            // Create new customer
            const insertCustomerQuery = `
              INSERT INTO contract_customers 
              (full_name, phone, id_card_number, address, email, id_card_image) 
              VALUES (?, ?, ?, ?, ?, ?)
            `;
            
            db.query(insertCustomerQuery, [
              customer_data.full_name,
              customer_data.phone,
              customer_data.id_card_number,
              customer_data.address,
              customer_data.email,
              customer_data.id_card_image
            ], (insertErr, insertResult) => {
              if (insertErr) {
                return rollbackAndReject(insertErr, reject);
              }
              customerId = insertResult.insertId;
              proceedWithContract();
            });
          }

          function proceedWithContract() {
            // 2. Check item availability (considering pending reservations)
            const checkAvailabilityQuery = `
              SELECT 
                quantity,
                (SELECT COUNT(*) FROM installment_contracts WHERE item_id = ? AND status = 'pending') as pending_reservations
              FROM items 
              WHERE id = ?
            `;
            
            db.query(checkAvailabilityQuery, [contract_data.item_id, contract_data.item_id], (availErr, availabilityResults) => {
              if (availErr) {
                return rollbackAndReject(availErr, reject);
              }

              if (availabilityResults.length === 0) {
                return rollbackAndReject(new Error('Item not found'), reject);
              }

              const availableQuantity = availabilityResults[0].quantity - availabilityResults[0].pending_reservations;
              if (availableQuantity <= 0) {
                return rollbackAndReject(new Error('Item is no longer available for reservation'), reject);
              }

              // 3. Create sale record - set customer_id to NULL for installment contracts
              const saleQuery = `
                INSERT INTO sales 
                (user_id, customer_id, item_id, sale_type, total_price, sale_id) 
                VALUES (?, NULL, ?, 'installment', ?, ?)
              `;
              
              const saleId = `S${Date.now()}`;
              db.query(saleQuery, [
                contract_data.worker_id,
                contract_data.item_id,
                contract_data.total_price,
                saleId
              ], (saleErr, saleResult) => {
                if (saleErr) {
                  return rollbackAndReject(saleErr, reject);
                }

                const saleInsertId = saleResult.insertId;

                // 4. Create installment contract with 'pending' status (this reserves the item)
                const contractQuery = `
                  INSERT INTO installment_contracts 
                  (sale_id, user_id, customer_id, item_id, total_price, down_payment, months, monthly_payment, start_date, status) 
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
                `;
                
                db.query(contractQuery, [
                  saleInsertId,
                  contract_data.worker_id,
                  customerId, // Use contract_customer id here
                  contract_data.item_id,
                  contract_data.total_price,
                  contract_data.down_payment,
                  contract_data.months,
                  contract_data.monthly_payment,
                  contract_data.start_date
                ], (contractErr, contractResult) => {
                  if (contractErr) {
                    return rollbackAndReject(contractErr, reject);
                  }

                  const contractId = contractResult.insertId;

                  // 5. Create contract approval record
                  const approvalQuery = `
                    INSERT INTO contract_approvals 
                    (contract_id, approver_id, status) 
                    VALUES (?, ?, 'pending_review')
                  `;
                  
                  db.query(approvalQuery, [
                    contractId,
                    contract_data.worker_id
                  ], (approvalErr) => {
                    if (approvalErr) {
                      return rollbackAndReject(approvalErr, reject);
                    }

                    // 6. Create sponsor records
                    let sponsorsProcessed = 0;
                    if (sponsors_data.length === 0) {
                      return finalizeContract();
                    }

                    sponsors_data.forEach((sponsor) => {
                      const sponsorQuery = `
                        INSERT INTO contract_sponsors 
                        (contract_id, full_name, phone, id_card_number, relationship, address, id_card_image) 
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                      `;
                      
                      db.query(sponsorQuery, [
                        contractId,
                        sponsor.full_name,
                        sponsor.phone,
                        sponsor.id_card_number,
                        sponsor.relationship,
                        sponsor.address,
                        sponsor.id_card_image
                      ], (sponsorErr) => {
                        if (sponsorErr) {
                          return rollbackAndReject(sponsorErr, reject);
                        }
                        
                        sponsorsProcessed++;
                        if (sponsorsProcessed === sponsors_data.length) {
                          finalizeContract();
                        }
                      });
                    });

                    function finalizeContract() {
                      // 7. Create inventory log for reservation (using 'sale' type with 0 quantity change)
                      const inventoryQuery = `
                        INSERT INTO inventory_logs 
                        (item_id, worker_id, change_type, quantity_changed) 
                        VALUES (?, ?, 'sale', 0)
                      `;
                      
                      db.query(inventoryQuery, [
                        contract_data.item_id,
                        contract_data.worker_id
                      ], (inventoryErr) => {
                        if (inventoryErr) {
                          return rollbackAndReject(inventoryErr, reject);
                        }

                        // Commit transaction
                        db.query('COMMIT', (commitErr) => {
                          if (commitErr) {
                            return rollbackAndReject(commitErr, reject);
                          }
                          
                          resolve({
                            contractId,
                            saleId: saleInsertId
                          });
                        });
                      });
                    }
                  });
                });
              });
            });
          }
        });

        // Helper function to rollback and reject
        function rollbackAndReject(error, rejectCallback) {
          db.query('ROLLBACK', () => {
            rejectCallback(error);
          });
        }
      });
    });
  }

  // Approve contract - create payment schedule WITHOUT changing item quantity
  static approve(contractId, approverId) {
    return new Promise((resolve, reject) => {
      db.query('START TRANSACTION', (startErr) => {
        if (startErr) {
          reject(startErr);
          return;
        }

        // 1. Get contract details
        const getContractQuery = `
          SELECT ic.*, cc.full_name as customer_name, i.name as item_name
          FROM installment_contracts ic
          LEFT JOIN contract_customers cc ON ic.customer_id = cc.id
          LEFT JOIN items i ON ic.item_id = i.id
          WHERE ic.id = ? AND ic.status = "pending"
        `;
        db.query(getContractQuery, [contractId], (err, contractResults) => {
          if (err) {
            return rollbackAndReject(err, reject);
          }

          if (contractResults.length === 0) {
            return rollbackAndReject(new Error('Contract not found or already processed'), reject);
          }

          const contract = contractResults[0];
          const itemId = contract.item_id;

          // 2. Update contract status to 'active'
          const updateContractQuery = 'UPDATE installment_contracts SET status = "active" WHERE id = ?';
          db.query(updateContractQuery, [contractId], (updateErr) => {
            if (updateErr) {
              return rollbackAndReject(updateErr, reject);
            }

            // 3. Update approval status to 'approved'
            const updateApprovalQuery = `
              UPDATE contract_approvals 
              SET status = 'approved', approver_id = ?, updated_at = NOW() 
              WHERE contract_id = ?
            `;
            db.query(updateApprovalQuery, [approverId, contractId], (approvalErr) => {
              if (approvalErr) {
                return rollbackAndReject(approvalErr, reject);
              }

              // 4. DO NOT decrease item quantity - item stays reserved for installment
              // Create inventory log for approved installment contract (using 'sale' type with 0 quantity change)
              const createInventoryLog = () => {
                const inventoryQuery = `
                  INSERT INTO inventory_logs 
                  (item_id, worker_id, change_type, quantity_changed) 
                  VALUES (?, ?, 'sale', 0)
                `;
                db.query(inventoryQuery, [itemId, approverId], (inventoryErr) => {
                  if (inventoryErr) {
                    return rollbackAndReject(inventoryErr, reject);
                  }

                  // 5. Create payment schedule in installment_payments table
                  const createPaymentSchedule = () => {
                    const monthlyPayment = contract.monthly_payment;
                    const months = contract.months;
                    const startDate = new Date(contract.start_date);
                    
                    let paymentsCreated = 0;

                    // If no payments to create (months = 0), commit transaction
                    if (months <= 0) {
                      commitTransaction();
                      return;
                    }

                    for (let month = 1; month <= months; month++) {
                      const dueDate = new Date(startDate);
                      dueDate.setMonth(dueDate.getMonth() + month);
                      
                      const paymentQuery = `
                        INSERT INTO installment_payments 
                        (sale_id, month_number, due_date, amount_due, amount_paid, status) 
                        VALUES (?, ?, ?, ?, 0.00, 'pending')
                      `;
                      
                      db.query(paymentQuery, [
                        contract.sale_id,
                        month,
                        dueDate.toISOString().split('T')[0],
                        monthlyPayment
                      ], (paymentErr) => {
                        if (paymentErr) {
                          return rollbackAndReject(paymentErr, reject);
                        }
                        
                        paymentsCreated++;
                        if (paymentsCreated === months) {
                          // All payments created, commit transaction
                          commitTransaction();
                        }
                      });
                    }
                  };

                  // Start creating payment schedule
                  createPaymentSchedule();
                });
              };

              // Start the process
              createInventoryLog();
            });
          });
        });

        function commitTransaction() {
          db.query('COMMIT', (commitErr) => {
            if (commitErr) {
              return rollbackAndReject(commitErr, reject);
            }
            
            resolve({
              success: true,
              message: 'Contract approved successfully and payment schedule created',
              contractId: contractId,
              paymentsCreated: contract.months
            });
          });
        }

        // Helper function to rollback and reject
        function rollbackAndReject(error, rejectCallback) {
          db.query('ROLLBACK', () => {
            rejectCallback(error);
          });
        }
      });
    });
  }

  // Reject contract - increase item quantity by 1 (release reservation)
  static reject(contractId, approverId, reason) {
    return new Promise((resolve, reject) => {
      db.query('START TRANSACTION', (startErr) => {
        if (startErr) {
          reject(startErr);
          return;
        }

        // 1. Get contract details to find the item_id
        const getContractQuery = 'SELECT item_id FROM installment_contracts WHERE id = ? AND status = "pending"';
        db.query(getContractQuery, [contractId], (err, contractResults) => {
          if (err) {
            return rollbackAndReject(err, reject);
          }

          if (contractResults.length === 0) {
            return rollbackAndReject(new Error('Contract not found or already processed'), reject);
          }

          const itemId = contractResults[0].item_id;

          // 2. Update contract status to 'rejected'
          const updateContractQuery = 'UPDATE installment_contracts SET status = "rejected" WHERE id = ?';
          db.query(updateContractQuery, [contractId], (updateErr) => {
            if (updateErr) {
              return rollbackAndReject(updateErr, reject);
            }

            // 3. Update approval status to 'rejected'
            const updateApprovalQuery = `
              UPDATE contract_approvals 
              SET status = 'rejected', approver_id = ?, reason = ?, updated_at = NOW() 
              WHERE contract_id = ?
            `;
            db.query(updateApprovalQuery, [approverId, reason, contractId], (approvalErr) => {
              if (approvalErr) {
                return rollbackAndReject(approvalErr, reject);
              }

              // 4. INCREASE item quantity by 1 (release the reservation)
              const increaseQuantityQuery = 'UPDATE items SET quantity = quantity + 1 WHERE id = ?';
              db.query(increaseQuantityQuery, [itemId], (quantityErr) => {
                if (quantityErr) {
                  return rollbackAndReject(quantityErr, reject);
                }

                // 5. Create inventory log for reservation release (using 'return' type with +1 quantity change)
                const inventoryQuery = `
                  INSERT INTO inventory_logs 
                  (item_id, worker_id, change_type, quantity_changed) 
                  VALUES (?, ?, 'return', 1)
                `;
                db.query(inventoryQuery, [itemId, approverId], (inventoryErr) => {
                  if (inventoryErr) {
                    return rollbackAndReject(inventoryErr, reject);
                  }

                  // Commit transaction
                  db.query('COMMIT', (commitErr) => {
                    if (commitErr) {
                      return rollbackAndReject(commitErr, reject);
                    }
                    
                    resolve({
                      success: true,
                      message: 'Contract rejected successfully - item quantity increased'
                    });
                  });
                });
              });
            });
          });
        });

        // Helper function to rollback and reject
        function rollbackAndReject(error, rejectCallback) {
          db.query('ROLLBACK', () => {
            rejectCallback(error);
          });
        }
      });
    });
  }

  // Get all pending contracts for admin review
  static getPendingContracts() {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          ic.*,
          cc.full_name as customer_name,
          cc.phone as customer_phone,
          i.name as item_name,
          i.price_cash,
          i.price_installment_total,
          i.quantity as item_quantity,
          u.username as worker_name,
          ca.status as approval_status
        FROM installment_contracts ic
        LEFT JOIN contract_customers cc ON ic.customer_id = cc.id
        LEFT JOIN items i ON ic.item_id = i.id
        LEFT JOIN users u ON ic.user_id = u.id
        LEFT JOIN contract_approvals ca ON ic.id = ca.contract_id
        WHERE ic.status = 'pending'
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

  // Get all contracts with filters
  static getAllContracts(status = null) {
    return new Promise((resolve, reject) => {
      let query = `
        SELECT 
          ic.*,
          cc.full_name as customer_name,
          cc.phone as customer_phone,
          i.name as item_name,
          i.price_cash,
          i.price_installment_total,
          u.username as worker_name,
          ca.status as approval_status,
          ca.reason as rejection_reason,
          ca.approver_id,
          ca.updated_at as decision_date,
          (SELECT COUNT(*) FROM installment_payments ip WHERE ip.sale_id = ic.sale_id) as total_payments,
          (SELECT COUNT(*) FROM installment_payments ip WHERE ip.sale_id = ic.sale_id AND ip.status = 'paid') as paid_payments
        FROM installment_contracts ic
        LEFT JOIN contract_customers cc ON ic.customer_id = cc.id
        LEFT JOIN items i ON ic.item_id = i.id
        LEFT JOIN users u ON ic.user_id = u.id
        LEFT JOIN contract_approvals ca ON ic.id = ca.contract_id
      `;
      
      const params = [];
      if (status && status !== 'all') {
        query += ' WHERE ic.status = ?';
        params.push(status);
      }
      
      query += ' ORDER BY ic.created_at DESC';

      db.query(query, params, (err, results) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(results);
      });
    });
  }

  // Get contract details by ID - FIXED CUSTOMER IMAGE CONVERSION
  static getById(contractId) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          ic.*,
          cc.full_name as customer_name,
          cc.phone as customer_phone,
          cc.id_card_number as customer_id_card_number,
          cc.id_card_image as customer_id_card_image,
          cc.address as customer_address,
          cc.email as customer_email,
          i.name as item_name,
          i.description as item_description,
          u.username as worker_name,
          ca.status as approval_status,
          ca.reason as rejection_reason,
          ca.approver_id,
          ca.updated_at as decision_date
        FROM installment_contracts ic
        LEFT JOIN contract_customers cc ON ic.customer_id = cc.id
        LEFT JOIN items i ON ic.item_id = i.id
        LEFT JOIN users u ON ic.user_id = u.id
        LEFT JOIN contract_approvals ca ON ic.id = ca.contract_id
        WHERE ic.id = ?
      `;
      
      db.query(query, [contractId], (err, results) => {
        if (err) {
          reject(err);
          return;
        }
        
        const contract = results[0] || null;
        
        // Convert customer image if exists - FIXED AND SIMPLIFIED VERSION
        if (contract && contract.customer_id_card_image) {
          try {
            console.log('Customer image data type:', typeof contract.customer_id_card_image);
            console.log('Customer image is Buffer?', Buffer.isBuffer(contract.customer_id_card_image));
            
            // Handle all possible image data formats consistently
            if (Buffer.isBuffer(contract.customer_id_card_image)) {
              // It's a Buffer - convert to base64 string
              contract.customer_id_card_image = contract.customer_id_card_image.toString('base64');
              console.log('✓ Converted customer image from Buffer to base64 string');
            } 
            // If it's already a string, ensure it's proper base64
            else if (typeof contract.customer_id_card_image === 'string') {
              // If it doesn't have data URL prefix, it's raw base64
              if (!contract.customer_id_card_image.startsWith('data:')) {
                console.log('✓ Customer image is raw base64 string, keeping as is');
                // Keep as raw base64 - frontend will add data URL prefix
              } else {
                console.log('✓ Customer image already has data URL prefix');
              }
            }
            
            console.log('Customer image after conversion - length:', contract.customer_id_card_image?.length);
          } catch (error) {
            console.error('Error converting customer image:', error);
            contract.customer_id_card_image = null;
          }
        } else {
          console.log('No customer image found or image is null');
        }
        
        resolve(contract);
      });
    });
  }

  // Get sponsors for a contract
  static getSponsors(contractId) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          id,
          full_name,
          phone,
          id_card_number,
          id_card_image,
          relationship,
          address
        FROM contract_sponsors 
        WHERE contract_id = ?
        ORDER BY id
      `;
      
      db.query(query, [contractId], (err, results) => {
        if (err) {
          reject(err);
          return;
        }
        
        // Convert BLOB images to base64 - FIXED VERSION
        const sponsors = results.map(sponsor => {
          if (sponsor.id_card_image) {
            try {
              console.log('Sponsor image data type:', typeof sponsor.id_card_image);
              
              // Handle BLOB data properly (same logic as customer)
              if (Buffer.isBuffer(sponsor.id_card_image)) {
                sponsor.id_card_image = sponsor.id_card_image.toString('base64');
              } else if (sponsor.id_card_image.type === 'Buffer' && sponsor.id_card_image.data) {
                sponsor.id_card_image = Buffer.from(sponsor.id_card_image.data).toString('base64');
              } else if (typeof sponsor.id_card_image === 'string') {
                if (!sponsor.id_card_image.startsWith('data:')) {
                  sponsor.id_card_image = `data:image/jpeg;base64,${sponsor.id_card_image}`;
                }
              }
            } catch (error) {
              console.error('Error converting sponsor image:', error);
              sponsor.id_card_image = null;
            }
          }
          return sponsor;
        });
        
        resolve(sponsors);
      });
    });
  }

  // Get payment schedule for a contract
  static getPaymentSchedule(saleId) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT * FROM installment_payments 
        WHERE sale_id = ? 
        ORDER BY month_number
      `;
      
      db.query(query, [saleId], (err, results) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(results);
      });
    });
  }

  // Get reserved count for an item
  static getReservedCount(itemId) {
    return new Promise((resolve, reject) => {
      const query = 'SELECT COUNT(*) as reserved_count FROM installment_contracts WHERE item_id = ? AND status = "pending"';
      db.query(query, [itemId], (err, results) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(results[0].reserved_count);
      });
    });
  }
}

module.exports = Contract;