const db = require('../config/database');

class Contract {
  // Get items available for installment with latest prices
  static getInstallmentItems() {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          i.id,
          i.name,
          i.description,
          i.available,
          i.installment,
          i.quantity,
          i.item_image,
          ip.id as price_id,
          ip.price_cash,
          ip.price_installment_total,
          ip.installment_first_payment,
          ip.installment_months,
          ip.installment_per_month,
          ip.installment_last_payment,
          ip.buy_price,
          ip.on_sale_price
        FROM items i
        LEFT JOIN item_prices ip ON i.id = ip.item_id
        WHERE i.available = 1 
          AND i.installment = 1
          AND ip.date = (
            SELECT MAX(date) 
            FROM item_prices 
            WHERE item_id = i.id
          )
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

  // Apply for new contract with price_id (single contract)
  static apply(applicationData) {
    return new Promise((resolve, reject) => {
      const { customer_data, sponsors_data, contract_data } = applicationData;

      db.query('START TRANSACTION', (startErr) => {
        if (startErr) {
          reject(startErr);
          return;
        }

        let customerId;
        let saleInsertId;
        let contractId;

        // 1. Check if customer exists
        const customerCheckQuery = 'SELECT id FROM contract_customers WHERE id_card_number = ?';
        db.query(customerCheckQuery, [customer_data.id_card_number], (err, customerResults) => {
          if (err) {
            return rollbackAndReject(err, reject);
          }

          if (customerResults.length > 0) {
            customerId = customerResults[0].id;
            // Update customer
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
              customer_data.id_card_image,
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
            // 2. Check item availability
            const checkAvailabilityQuery = `
              SELECT quantity, name FROM items WHERE id = ?
            `;
            
            db.query(checkAvailabilityQuery, [contract_data.item_id], (availErr, availabilityResults) => {
              if (availErr) {
                return rollbackAndReject(availErr, reject);
              }

              if (availabilityResults.length === 0) {
                return rollbackAndReject(new Error('Item not found'), reject);
              }

              const availableQuantity = availabilityResults[0].quantity;
              const itemName = availabilityResults[0].name;
              
              if (availableQuantity <= 0) {
                return rollbackAndReject(new Error(`Item "${itemName}" is out of stock`), reject);
              }

              // 3. DECREASE ITEM QUANTITY IMMEDIATELY
              const decreaseQuantityQuery = 'UPDATE items SET quantity = quantity - 1 WHERE id = ?';
              db.query(decreaseQuantityQuery, [contract_data.item_id], (decreaseErr) => {
                if (decreaseErr) {
                  return rollbackAndReject(decreaseErr, reject);
                }

                // 4. Create inventory log for quantity deduction
                const inventoryQuery = `
                  INSERT INTO inventory_logs 
                  (item_id, worker_id, change_type, quantity_changed) 
                  VALUES (?, ?, 'sale', -1)
                `;
                
                db.query(inventoryQuery, [
                  contract_data.item_id,
                  contract_data.worker_id
                ], (inventoryErr) => {
                  if (inventoryErr) {
                    return rollbackAndReject(inventoryErr, reject);
                  }

                  // 5. Create sale record
                  const saleQuery = `
                    INSERT INTO sales 
                    (user_id, customer_id, item_id, sale_type, total_price, sale_id) 
                    VALUES (?, NULL, ?, 'installment', ?, ?)
                  `;
                  
                  const saleId = `S${Date.now()}_${Math.floor(Math.random() * 1000)}_${contract_data.contract_number || '1'}`;
                  db.query(saleQuery, [
                    contract_data.worker_id,
                    contract_data.item_id,
                    contract_data.total_price,
                    saleId
                  ], (saleErr, saleResult) => {
                    if (saleErr) {
                      return rollbackAndReject(saleErr, reject);
                    }

                    saleInsertId = saleResult.insertId;

                    // 6. Create installment contract with price_id
                    const contractQuery = `
                      INSERT INTO installment_contracts 
                      (sale_id, user_id, customer_id, item_id, price_id,
                       total_price, down_payment, months, monthly_payment, 
                       installment_last_payment, start_date, status) 
                      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
                    `;
                    
                    db.query(contractQuery, [
                      saleInsertId,
                      contract_data.worker_id,
                      customerId,
                      contract_data.item_id,
                      contract_data.price_id,
                      contract_data.total_price,
                      contract_data.down_payment,
                      contract_data.months,
                      contract_data.monthly_payment,
                      contract_data.installment_last_payment,
                      contract_data.start_date
                    ], (contractErr, contractResult) => {
                      if (contractErr) {
                        return rollbackAndReject(contractErr, reject);
                      }

                      contractId = contractResult.insertId;

                      // 7. Create contract approval record
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

                        // 8. Create sponsor records for this contract
                        createSponsors();
                      });
                    });
                  });
                });
              });
            });
          }

          function createSponsors() {
            if (!sponsors_data || sponsors_data.length === 0) {
              return finalizeContract();
            }

            let sponsorsProcessed = 0;
            
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
          }

          function finalizeContract() {
            // Commit transaction
            db.query('COMMIT', (commitErr) => {
              if (commitErr) {
                return rollbackAndReject(commitErr, reject);
              }
              
              resolve({
                contractId,
                saleId: saleInsertId,
                item_name: contract_data.item_name,
                total_price: contract_data.total_price,
                quantity: contract_data.quantity || 1,
                contract_number: contract_data.contract_number || 1,
                success: true
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

  // Apply for multiple contracts (batch processing with quantity support)
  static applyMultiple(contractsData) {
    return new Promise((resolve, reject) => {
      const results = [];
      const errors = [];
      let processed = 0;
      const total = contractsData.length;

      if (total === 0) {
        return resolve({
          success: false,
          results: [],
          errors: [{ error: 'No contracts to process' }],
          total: 0,
          successful: 0,
          failed: 1
        });
      }

      // Group contracts by item_id to check availability in bulk
      const itemsToCheck = {};
      contractsData.forEach((contractData, index) => {
        const itemId = contractData.contract_data.item_id;
        if (!itemsToCheck[itemId]) {
          itemsToCheck[itemId] = {
            count: 0,
            contracts: [],
            item_name: contractData.contract_data.item_name
          };
        }
        itemsToCheck[itemId].count++;
        itemsToCheck[itemId].contracts.push(index);
      });

      // Check all items availability first
      const checkAvailability = () => {
        const itemIds = Object.keys(itemsToCheck);
        if (itemIds.length === 0) {
          processContracts();
          return;
        }
        
        let checked = 0;
        
        itemIds.forEach(itemId => {
          const query = 'SELECT quantity, name FROM items WHERE id = ?';
          db.query(query, [itemId], (err, results) => {
            checked++;
            
            if (err) {
              console.error('Error checking item availability:', err);
              // Mark all contracts for this item as failed
              itemsToCheck[itemId].contracts.forEach(index => {
                errors.push({
                  index,
                  item_name: itemsToCheck[itemId].item_name,
                  error: 'Database error checking availability'
                });
              });
            } else if (results.length === 0) {
              // Item not found
              itemsToCheck[itemId].contracts.forEach(index => {
                errors.push({
                  index,
                  item_name: itemsToCheck[itemId].item_name,
                  error: 'Item not found in database'
                });
              });
            } else {
              const available = results[0].quantity;
              const itemName = results[0].name;
              
              if (available < itemsToCheck[itemId].count) {
                // Not enough quantity
                itemsToCheck[itemId].contracts.forEach(index => {
                  errors.push({
                    index,
                    item_name: itemName,
                    error: `Only ${available} available, requested ${itemsToCheck[itemId].count}`
                  });
                });
              }
            }
            
            if (checked === itemIds.length) {
              // All items checked, proceed with processing
              processContracts();
            }
          });
        });
      };

      const processContracts = () => {
        const processNext = () => {
          if (processed >= total) {
            resolve({
              success: results.length > 0,
              results,
              errors,
              total,
              successful: results.length,
              failed: errors.length
            });
            return;
          }

          // Skip contracts that already have errors
          while (processed < total && errors.some(e => e.index === processed)) {
            processed++;
          }
          
          if (processed >= total) {
            resolve({
              success: results.length > 0,
              results,
              errors,
              total,
              successful: results.length,
              failed: errors.length
            });
            return;
          }

          const contractData = contractsData[processed];
          
          Contract.apply(contractData)
            .then(result => {
              results.push({
                index: processed,
                item_name: contractData.contract_data.item_name,
                contract_number: contractData.contract_data.contract_number,
                ...result
              });
              processed++;
              processNext();
            })
            .catch(error => {
              errors.push({
                index: processed,
                item_name: contractData.contract_data.item_name,
                error: error.message
              });
              processed++;
              processNext();
            });
        };

        processNext();
      };

      // Start by checking availability
      checkAvailability();
    });
  }

  // Get pending contracts for admin review with price info
  static getPendingContracts() {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          ic.*,
          cc.full_name as customer_name,
          cc.phone as customer_phone,
          i.name as item_name,
          ip.price_cash,
          ip.price_installment_total,
          ip.installment_first_payment,
          ip.installment_months,
          ip.installment_per_month,
          ip.installment_last_payment,
          ip.buy_price,
          ip.on_sale_price,
          i.quantity as item_quantity,
          u.username as worker_name,
          ca.status as approval_status
        FROM installment_contracts ic
        LEFT JOIN contract_customers cc ON ic.customer_id = cc.id
        LEFT JOIN items i ON ic.item_id = i.id
        LEFT JOIN item_prices ip ON ic.price_id = ip.id
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

  // Get all contracts with filters and price info
  static getAllContracts(status = null) {
    return new Promise((resolve, reject) => {
      let query = `
        SELECT 
          ic.*,
          cc.full_name as customer_name,
          cc.phone as customer_phone,
          i.name as item_name,
          ip.price_cash,
          ip.price_installment_total,
          ip.installment_first_payment,
          ip.installment_months,
          ip.installment_per_month,
          ip.installment_last_payment,
          ip.buy_price,
          ip.on_sale_price,
          u.username as worker_name,
          ca.status as approval_status,
          ca.reason as rejection_reason,
          ca.approver_id,
          ca.updated_at as decision_date,
          (SELECT COUNT(*) FROM installment_payments ipay WHERE ipay.sale_id = ic.sale_id) as total_payments,
          (SELECT COUNT(*) FROM installment_payments ipay WHERE ipay.sale_id = ic.sale_id AND ipay.status = 'paid') as paid_payments
        FROM installment_contracts ic
        LEFT JOIN contract_customers cc ON ic.customer_id = cc.id
        LEFT JOIN items i ON ic.item_id = i.id
        LEFT JOIN item_prices ip ON ic.price_id = ip.id
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

  // Get contract details by ID with price info
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
          ip.installment_first_payment as default_first_payment,
          ip.installment_months as default_months,
          ip.installment_per_month as default_monthly,
          ip.installment_last_payment as default_last_payment,
          ip.price_cash,
          ip.price_installment_total as default_total_price,
          ip.buy_price,
          ip.on_sale_price,
          u.username as worker_name,
          ca.status as approval_status,
          ca.reason as rejection_reason,
          ca.approver_id,
          ca.updated_at as decision_date
        FROM installment_contracts ic
        LEFT JOIN contract_customers cc ON ic.customer_id = cc.id
        LEFT JOIN items i ON ic.item_id = i.id
        LEFT JOIN item_prices ip ON ic.price_id = ip.id
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
        
        // Convert customer image if exists
        if (contract && contract.customer_id_card_image) {
          try {
            if (Buffer.isBuffer(contract.customer_id_card_image)) {
              contract.customer_id_card_image = contract.customer_id_card_image.toString('base64');
            } else if (typeof contract.customer_id_card_image === 'string' && 
                      !contract.customer_id_card_image.startsWith('data:')) {
              // Keep as raw base64 - frontend will add data URL prefix
            }
          } catch (error) {
            console.error('Error converting customer image:', error);
            contract.customer_id_card_image = null;
          }
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
        
        // Convert BLOB images to base64
        const sponsors = results.map(sponsor => {
          if (sponsor.id_card_image) {
            try {
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

  // Approve contract - create payment schedule
  static approve(contractId, approverId) {
    return new Promise((resolve, reject) => {
      db.query('START TRANSACTION', (startErr) => {
        if (startErr) {
          reject(startErr);
          return;
        }

        // 1. Get contract details
        const getContractQuery = `
          SELECT 
            ic.*, 
            cc.full_name as customer_name, 
            i.name as item_name
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

              // 4. Create payment schedule in installment_payments table
              const createPaymentSchedule = () => {
                const firstPayment = parseFloat(contract.down_payment);
                const monthlyPayment = parseFloat(contract.monthly_payment);
                const lastPayment = parseFloat(contract.installment_last_payment);
                const months = parseInt(contract.months);
                const startDate = new Date(contract.start_date);
                
                let paymentsCreated = 0;
                const totalPayments = months;

                // Create first payment (down payment)
                const firstDueDate = new Date(startDate);
                firstDueDate.setMonth(firstDueDate.getMonth() + 1);
                
                const firstPaymentQuery = `
                  INSERT INTO installment_payments 
                  (sale_id, month_number, due_date, amount_due, amount_paid, status) 
                  VALUES (?, ?, ?, ?, 0.00, 'pending')
                `;
                
                db.query(firstPaymentQuery, [
                  contract.sale_id,
                  1,
                  firstDueDate.toISOString().split('T')[0],
                  firstPayment
                ], (firstPaymentErr) => {
                  if (firstPaymentErr) {
                    return rollbackAndReject(firstPaymentErr, reject);
                  }
                  
                  paymentsCreated++;
                  
                  // Create monthly payments (months 2 to n-1)
                  for (let month = 2; month < months; month++) {
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
                      if (paymentsCreated === totalPayments - 1) {
                        // Create last payment
                        const lastDueDate = new Date(startDate);
                        lastDueDate.setMonth(lastDueDate.getMonth() + months);
                        
                        const lastPaymentQuery = `
                          INSERT INTO installment_payments 
                          (sale_id, month_number, due_date, amount_due, amount_paid, status) 
                          VALUES (?, ?, ?, ?, 0.00, 'pending')
                        `;
                        
                        db.query(lastPaymentQuery, [
                          contract.sale_id,
                          months,
                          lastDueDate.toISOString().split('T')[0],
                          lastPayment
                        ], (lastErr) => {
                          if (lastErr) {
                            return rollbackAndReject(lastErr, reject);
                          }
                          
                          // Commit transaction
                          db.query('COMMIT', (commitErr) => {
                            if (commitErr) {
                              return rollbackAndReject(commitErr, reject);
                            }
                            
                            resolve({
                              success: true,
                              message: 'Contract approved successfully and payment schedule created',
                              contractId: contractId,
                              paymentsCreated: months,
                              payments: {
                                first: firstPayment,
                                monthly: monthlyPayment,
                                last: lastPayment
                              }
                            });
                          });
                        });
                      }
                    });
                  }
                  
                  // If only 2 months (down + last)
                  if (months === 2) {
                    const lastDueDate = new Date(startDate);
                    lastDueDate.setMonth(lastDueDate.getMonth() + 2);
                    
                    const lastPaymentQuery = `
                      INSERT INTO installment_payments 
                      (sale_id, month_number, due_date, amount_due, amount_paid, status) 
                      VALUES (?, ?, ?, ?, 0.00, 'pending')
                    `;
                    
                    db.query(lastPaymentQuery, [
                      contract.sale_id,
                      2,
                      lastDueDate.toISOString().split('T')[0],
                      lastPayment
                    ], (lastErr) => {
                      if (lastErr) {
                        return rollbackAndReject(lastErr, reject);
                      }
                      
                      // Commit transaction
                      db.query('COMMIT', (commitErr) => {
                        if (commitErr) {
                          return rollbackAndReject(commitErr, reject);
                        }
                        
                        resolve({
                          success: true,
                          message: 'Contract approved successfully and payment schedule created',
                          contractId: contractId,
                          paymentsCreated: 2
                        });
                      });
                    });
                  }
                });
              };

              // Start creating payment schedule
              createPaymentSchedule();
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

  // Reject contract - increase item quantity by 1
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

              // 4. INCREASE item quantity by 1
              const increaseQuantityQuery = 'UPDATE items SET quantity = quantity + 1 WHERE id = ?';
              db.query(increaseQuantityQuery, [itemId], (quantityErr) => {
                if (quantityErr) {
                  return rollbackAndReject(quantityErr, reject);
                }

                // 5. Create inventory log for return
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

        function rollbackAndReject(error, rejectCallback) {
          db.query('ROLLBACK', () => {
            rejectCallback(error);
          });
        }
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

  // Get item quantity by ID
  static getItemQuantity(itemId) {
    return new Promise((resolve, reject) => {
      const query = 'SELECT quantity FROM items WHERE id = ?';
      db.query(query, [itemId], (err, results) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(results[0]?.quantity || 0);
      });
    });
  }
}

module.exports = Contract;