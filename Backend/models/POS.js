// models/POS.js
const db = require('../config/database');

class POS {
  // models/POS.js - Update the getAvailableItems function to filter by accessible branches:
static getAvailableItems(userId, callback) {
  // If no userId provided, return all items (for admin or backward compatibility)
  if (!userId) {
    const query = `
      SELECT 
        i.id, 
        i.name, 
        i.description, 
        i.available,
        i.quantity,
        i.installment,
        i.item_image,
        i.branch_id,
        b.name as branch_name,
        ip.id as price_id,
        ip.price_cash,
        ip.buy_price,
        ip.price_installment_total,
        ip.installment_first_payment,
        ip.installment_months,
        ip.installment_per_month,
        ip.installment_last_payment,
        ip.on_sale_price,
        ip.date as price_date,
        u.username as updated_by
      FROM items i
      LEFT JOIN branches b ON i.branch_id = b.id
      LEFT JOIN item_prices ip ON i.id = ip.item_id
      LEFT JOIN users u ON ip.user_id = u.id
      WHERE ip.id = (
        SELECT id 
        FROM item_prices 
        WHERE item_id = i.id 
        ORDER BY date DESC 
        LIMIT 1
      )
      OR ip.id IS NULL
      ORDER BY 
        CASE 
          WHEN i.available = 1 AND i.quantity > 0 THEN 1  -- Available items first
          ELSE 2  -- Out of stock items last
        END,
        i.name
    `;
    
    db.query(query, (err, results) => {
      if (err) {
        console.error('❌ POS.getAvailableItems Error:', err);
        return callback(err);
      }
      
      console.log(`✅ POS: Found ${results.length} total items (no user filter)`);
      callback(null, results);
    });
    return;
  }

  // Get user's accessible branches
  const branchQuery = `
    SELECT DISTINCT branch_id 
    FROM user_branches 
    WHERE user_id = ?
  `;
  
  db.query(branchQuery, [userId], (err, branchResults) => {
    if (err) {
      console.error('❌ Error fetching accessible branches:', err);
      return callback(err);
    }
    
    if (!branchResults || branchResults.length === 0) {
      console.log(`⚠️ User ${userId} has no accessible branches, returning empty array`);
      return callback(null, []);
    }
    
    const branchIds = branchResults.map(b => b.branch_id);
    console.log(`✅ User ${userId} has access to ${branchIds.length} branches:`, branchIds);
    
    // Query items filtered by accessible branches
    const query = `
      SELECT 
        i.id, 
        i.name, 
        i.description, 
        i.available,
        i.quantity,
        i.installment,
        i.item_image,
        i.branch_id,
        b.name as branch_name,
        ip.id as price_id,
        ip.price_cash,
        ip.buy_price,
        ip.price_installment_total,
        ip.installment_first_payment,
        ip.installment_months,
        ip.installment_per_month,
        ip.installment_last_payment,
        ip.on_sale_price,
        ip.date as price_date,
        u.username as updated_by
      FROM items i
      LEFT JOIN branches b ON i.branch_id = b.id
      LEFT JOIN item_prices ip ON i.id = ip.item_id
      LEFT JOIN users u ON ip.user_id = u.id
      WHERE i.branch_id IN (?)
        AND (
          ip.id = (
            SELECT id 
            FROM item_prices 
            WHERE item_id = i.id 
            ORDER BY date DESC 
            LIMIT 1
          )
          OR ip.id IS NULL
        )
      ORDER BY 
        CASE 
          WHEN i.available = 1 AND i.quantity > 0 THEN 1  -- Available items first
          ELSE 2  -- Out of stock items last
        END,
        i.name
    `;
    
    db.query(query, [branchIds], (err, results) => {
      if (err) {
        console.error('❌ POS.getAvailableItems Error:', err);
        return callback(err);
      }
      
      console.log(`✅ POS: Found ${results.length} total items for user ${userId} (filtered by ${branchIds.length} branches)`);
      
      callback(null, results);
    });
  });
}

// Process return transaction
  static processReturnTransaction(returnData, callback) {
    const { saleId, itemId, cashRecordId, returnQuantity, returnType, userId, originalPrice } = returnData;
    
    db.getConnection((err, connection) => {
      if (err) {
        console.error('❌ Error getting database connection:', err);
        return callback(err);
      }
      
      connection.beginTransaction(async (transErr) => {
        if (transErr) {
          connection.release();
          console.error('❌ Error starting transaction:', transErr);
          return callback(transErr);
        }
        
        try {
          // 1. Get user's primary_branch_id
          const getUserQuery = 'SELECT primary_branch_id FROM users WHERE id = ?';
          const userResults = await new Promise((resolve, reject) => {
            connection.query(getUserQuery, [userId], (err, results) => {
              if (err) reject(err);
              else resolve(results);
            });
          });
          
          if (!userResults || userResults.length === 0) {
            throw new Error('User not found');
          }
          
          const primaryBranchId = userResults[0].primary_branch_id;
          console.log(`📍 User ${userId} primary branch: ${primaryBranchId}`);
          
          // 2. Check available quantity for return
          const checkQuery = `
            SELECT 
              (SELECT SUM(quantity) FROM sales 
               WHERE sale_id = ? AND item_id = ? AND sale_type = 'cash') as original_qty,
              (SELECT COALESCE(SUM(quantity), 0) FROM sales 
               WHERE sale_id = ? AND item_id = ? AND sale_type = 'retrieve') as returned_qty
          `;
          
          const checkResults = await new Promise((resolve, reject) => {
            connection.query(checkQuery, [saleId, itemId, saleId, itemId], (err, results) => {
              if (err) reject(err);
              else resolve(results);
            });
          });
          
          const originalQty = checkResults[0].original_qty || 0;
          const returnedQty = checkResults[0].returned_qty || 0;
          const availableQty = originalQty - returnedQty;
          
          if (returnQuantity > availableQty) {
            throw new Error(`Cannot return ${returnQuantity} items. Only ${availableQty} available for return.`);
          }
          
          // 3. Get price_id and branch_id from cash record
          const getCashRecordQuery = 'SELECT price_id, branch_id FROM sales WHERE id = ?';
          const cashRecordResults = await new Promise((resolve, reject) => {
            connection.query(getCashRecordQuery, [cashRecordId], (err, results) => {
              if (err) reject(err);
              else resolve(results);
            });
          });
          
          const priceId = cashRecordResults[0]?.price_id || null;
          // Use branch_id from original sale, or fallback to user's primary branch
          const branchId = cashRecordResults[0]?.branch_id || primaryBranchId;
          
          // 4. Create retrieve record in sales table (with branch_id)
          // Column order: branch_id, user_id, customer_id, item_id, sale_type, price, sale_id, price_id, quantity
          const createRetrieveQuery = `
            INSERT INTO sales 
              (branch_id, user_id, customer_id, item_id, sale_type, price, sale_id, price_id, quantity)
            VALUES (?, ?, NULL, ?, 'retrieve', ?, ?, ?, ?)
          `;
          
          await new Promise((resolve, reject) => {
            connection.query(createRetrieveQuery, 
              [branchId, userId, itemId, originalPrice, saleId, priceId, returnQuantity], 
              (err, result) => {
                if (err) reject(err);
                else {
                  console.log('✅ Created retrieve record, ID:', result.insertId);
                  resolve(result);
                }
              }
            );
          });
          
          // 5. If return type is 'resale', update items quantity
          if (returnType === 'resale') {
            const updateItemQuery = 'UPDATE items SET quantity = quantity + ? WHERE id = ?';
            await new Promise((resolve, reject) => {
              connection.query(updateItemQuery, [returnQuantity, itemId], (err, result) => {
                if (err) reject(err);
                else {
                  console.log(`✅ Updated item ${itemId} quantity by +${returnQuantity}`);
                  resolve(result);
                }
              });
            });
            
            // 6. Create inventory log for resale return (with branch_id)
            const createLogQuery = `
              INSERT INTO inventory_logs 
                (branch_id, item_id, worker_id, change_type, quantity_changed)
              VALUES (?, ?, ?, 'return', ?)
            `;
            await new Promise((resolve, reject) => {
              connection.query(createLogQuery, [branchId, itemId, userId, returnQuantity], (err, result) => {
                if (err) reject(err);
                else {
                  console.log(`✅ Created inventory log for return with branch_id ${branchId}`);
                  resolve(result);
                }
              });
            });
          }
          
          // Commit transaction
          connection.commit((commitErr) => {
            if (commitErr) {
              return connection.rollback(() => {
                connection.release();
                console.error('❌ Error committing transaction:', commitErr);
                callback(commitErr);
              });
            }
            
            connection.release();
            console.log(`✅ Return transaction completed for sale ${saleId}, item ${itemId}`);
            
            callback(null, {
              success: true,
              saleId: saleId,
              itemId: itemId,
              returnQuantity: returnQuantity,
              returnType: returnType
            });
          });
          
        } catch (error) {
          connection.rollback(() => {
            connection.release();
            console.error('❌ Error in return processing:', error);
            callback(error);
          });
        }
      });
    });
  }
  
  // Search sales by sale ID
  static searchSalesBySaleId(saleId, callback) {
    const query = `
      SELECT 
        s.*,
        i.name as item_name,
        i.description as item_description,
        i.quantity as current_stock,
        u.username as worker_name
      FROM sales s
      LEFT JOIN items i ON s.item_id = i.id
      LEFT JOIN users u ON s.user_id = u.id
      WHERE s.sale_id = ? 
        AND s.sale_type IN ('cash', 'retrieve')
      ORDER BY s.item_id, s.sale_type, s.date
    `;
    
    db.query(query, [saleId], (err, results) => {
      if (err) {
        console.error('❌ Error searching sales by ID:', err);
        return callback(err);
      }
      callback(null, results);
    });
  }
  
  // Search cash sales by worker and time period
  static searchSalesByWorkerTime(userId, startDate, endDate, callback) {
    const query = `
      SELECT DISTINCT
        s.sale_id,
        s.user_id,
        u.username as worker_name,
        COUNT(DISTINCT s.item_id) as total_items,
        SUM(s.quantity) as total_units,
        MAX(s.date) as sale_date,
        GROUP_CONCAT(DISTINCT i.name SEPARATOR ', ') as items_list
      FROM sales s
      LEFT JOIN items i ON s.item_id = i.id
      LEFT JOIN users u ON s.user_id = u.id
      WHERE s.user_id = ? 
        AND s.date BETWEEN ? AND ?
        AND s.sale_type = 'cash'
      GROUP BY s.sale_id, s.user_id
      ORDER BY s.sale_id DESC
    `;
    
    db.query(query, [userId, startDate, endDate], (err, results) => {
      if (err) {
        console.error('❌ Error searching sales by worker/time:', err);
        return callback(err);
      }
      callback(null, results);
    });
  }
  
  // Get sale details with item information
  static getSaleDetails(saleId, callback) {
    const query = `
      SELECT 
        s.*,
        i.name as item_name,
        i.description as item_description,
        i.quantity as current_stock,
        u.username as worker_name,
        u.id as worker_id,
        b.name as branch_name
      FROM sales s
      LEFT JOIN items i ON s.item_id = i.id
      LEFT JOIN users u ON s.user_id = u.id
      LEFT JOIN branches b ON s.branch_id = b.id
      WHERE s.sale_id = ? 
        AND s.sale_type IN ('cash', 'retrieve')
      ORDER BY s.item_id, s.sale_type, s.date
    `;
    
    db.query(query, [saleId], (err, results) => {
      if (err) {
        console.error('❌ Error getting sale details:', err);
        return callback(err);
      }
      callback(null, results);
    });
  }
  
  // Get all workers (users with user_type 0-9)
  static getWorkers(callback) {
    const query = `
      SELECT id, username, email, phone, user_type
      FROM users
      WHERE user_type BETWEEN 0 AND 9
      ORDER BY username
    `;
    
    db.query(query, (err, results) => {
      if (err) {
        console.error('❌ Error fetching workers:', err);
        return callback(err);
      }
      callback(null, results);
    });
  }

  // Get item by ID with latest price
  static getItemById(id, callback) {
    const query = `
      SELECT 
        i.*,
        ip.id as price_id,
        ip.price_cash,
        ip.buy_price,
        ip.price_installment_total,
        ip.installment_first_payment,
        ip.installment_months,
        ip.installment_per_month,
        ip.installment_last_payment,
        ip.on_sale_price,
        ip.date as price_date
      FROM items i
      LEFT JOIN item_prices ip ON i.id = ip.item_id
      WHERE i.id = ? AND (
        ip.date = (
          SELECT MAX(date) 
          FROM item_prices 
          WHERE item_id = i.id
        )
        OR ip.date IS NULL
      )
      LIMIT 1
    `;
    db.query(query, [id], callback);
  }

  // Update item quantity and auto-update availability
  static updateItemQuantity(id, newQuantity, callback) {
    // If quantity reaches 0, set available to 0 (false), otherwise keep as is
    const availableValue = newQuantity <= 0 ? 0 : 1;
    
    const query = 'UPDATE items SET quantity = ?, available = ? WHERE id = ?';
    db.query(query, [newQuantity, availableValue, id], callback);
  }

  // Create sales records with quantity field
  static createSale(salesData, callback) {
    const query = `
      INSERT INTO sales 
        (user_id, customer_id, item_id, sale_type, price, sale_id, quantity, price_id) 
      VALUES ?
    `;
    db.query(query, [salesData], callback);
  }

  // Create inventory log
  static createInventoryLog(logsData, callback) {
    const query = `
      INSERT INTO inventory_logs 
        (item_id, worker_id, change_type, quantity_changed) 
      VALUES ?
    `;
    db.query(query, [logsData], callback);
  }

  // Get next sale ID for cash sales only
  static getNextSaleId(callback) {
    const query = `
      SELECT COALESCE(MAX(sale_id), 0) + 1 as next_sale_id 
      FROM sales 
      WHERE sale_type = 'cash'
    `;
    db.query(query, callback);
  }

  // Check if items have sufficient quantity (grouped by item_id)
  static checkQuantities(items, callback) {
    if (items.length === 0) {
      return callback(null, []);
    }
    
    // Group items by ID to get total quantity per item
    const itemQuantities = {};
    items.forEach(item => {
      if (!itemQuantities[item.id]) {
        itemQuantities[item.id] = {
          id: item.id,
          name: item.name,
          requested: 0,
          available: 0
        };
      }
      itemQuantities[item.id].requested += item.qty;
    });
    
    const itemIds = Object.keys(itemQuantities);
    const placeholders = itemIds.map(() => '?').join(',');
    
    const query = `SELECT id, name, quantity FROM items WHERE id IN (${placeholders})`;
    
    db.query(query, itemIds, (err, results) => {
      if (err) {
        console.error('❌ Error checking quantities:', err);
        return callback(err);
      }
      
      // Map available quantities
      results.forEach(item => {
        if (itemQuantities[item.id]) {
          itemQuantities[item.id].available = item.quantity;
        }
      });
      
      const insufficientItems = Object.values(itemQuantities).filter(
        item => item.requested > item.available
      );
      
      callback(null, insufficientItems);
    });
  }

  // Process sale transaction (all in one transaction)
  static processSaleTransaction(saleData, callback) {
    db.getConnection((err, connection) => {
      if (err) {
        console.error('❌ Error getting database connection:', err);
        return callback(err);
      }

      connection.beginTransaction((err) => {
        if (err) {
          console.error('❌ Error starting transaction:', err);
          connection.release();
          return callback(err);
        }

        // Step 1: Get user's primary_branch_id
        connection.query(
          `SELECT primary_branch_id FROM users WHERE id = ?`,
          [saleData.userId],
          (err, userResults) => {
            if (err) {
              console.error('❌ Error getting user primary branch:', err);
              return connection.rollback(() => {
                connection.release();
                callback(err);
              });
            }

            if (!userResults || userResults.length === 0) {
              return connection.rollback(() => {
                connection.release();
                callback(new Error('User not found'));
              });
            }

            const primaryBranchId = userResults[0].primary_branch_id;
            console.log(`📍 User ${saleData.userId} primary branch: ${primaryBranchId}`);

            // Step 2: Get next sale_id for cash sales
            connection.query(
              `SELECT COALESCE(MAX(sale_id), 0) + 1 as next_sale_id FROM sales WHERE sale_type = 'cash'`,
              (err, results) => {
                if (err) {
                  console.error('❌ Error getting sale ID:', err);
                  return connection.rollback(() => {
                    connection.release();
                    callback(err);
                  });
                }

                const saleId = results[0].next_sale_id;
                console.log(`🆕 New Sale ID: ${saleId}`);

                // Group items by item_id for batch processing
                const groupedItems = {};
                saleData.cart.forEach(item => {
                  if (!groupedItems[item.id]) {
                    groupedItems[item.id] = {
                      id: item.id,
                      name: item.name,
                      totalQty: 0,
                      price_cash: item.price_cash,
                      price_id: item.price_id,
                      quantity: item.quantity
                    };
                  }
                  groupedItems[item.id].totalQty += item.qty;
                });

                const groupedItemsArray = Object.values(groupedItems);

                // Prepare data arrays
                const salesRecords = [];
                const inventoryLogs = [];
                const quantityUpdates = [];

                // Prepare data for each grouped item
                groupedItemsArray.forEach(item => {
                  // Sales record (one per item type with quantity) - includes branch_id
                  // Column order: branch_id, user_id, customer_id, item_id, sale_type, price, sale_id, price_id, quantity
                  salesRecords.push([
                    primaryBranchId,      // branch_id
                    saleData.userId,      // user_id
                    null,                 // customer_id (walk-in)
                    item.id,              // item_id
                    'cash',               // sale_type
                    item.price_cash,      // price (actual charged price)
                    saleId,               // sale_id
                    item.price_id,        // price_id
                    item.totalQty         // quantity
                  ]);

                  // Inventory log - includes branch_id
                  inventoryLogs.push([
                    primaryBranchId,     // branch_id
                    item.id,              // item_id
                    saleData.userId,      // worker_id
                    'sale',               // change_type
                    -item.totalQty        // quantity_changed (negative for sales)
                  ]);

                  // Quantity update
                  quantityUpdates.push({
                    id: item.id,
                    newQuantity: item.quantity - item.totalQty
                  });
                });

                // Process sequentially
                const processSequentially = async () => {
                  try {
                    // Step 3: Update quantities sequentially
                    for (const update of quantityUpdates) {
                      await new Promise((resolve, reject) => {
                        connection.query(
                          'UPDATE items SET quantity = ?, available = CASE WHEN ? <= 0 THEN 0 ELSE 1 END WHERE id = ?',
                          [update.newQuantity, update.newQuantity, update.id],
                          (err) => {
                            if (err) {
                              reject(err);
                            } else {
                              console.log(`✅ Updated item ${update.id} quantity to ${update.newQuantity}`);
                              resolve();
                            }
                          }
                        );
                      });
                    }

                    // Step 4: Create sales records (with branch_id)
                    await new Promise((resolve, reject) => {
                      if (salesRecords.length === 0) {
                        resolve();
                        return;
                      }
                      
                      const salesQuery = `
                        INSERT INTO sales 
                          (branch_id, user_id, customer_id, item_id, sale_type, price, sale_id, price_id, quantity) 
                        VALUES ?
                      `;
                      
                      connection.query(salesQuery, [salesRecords], (err) => {
                        if (err) {
                          reject(err);
                        } else {
                          console.log(`✅ Created ${salesRecords.length} sales records with branch_id ${primaryBranchId}`);
                          resolve();
                        }
                      });
                    });

                    // Step 5: Create inventory logs (with branch_id)
                    await new Promise((resolve, reject) => {
                      if (inventoryLogs.length === 0) {
                        resolve();
                        return;
                      }
                      
                      const logsQuery = `
                        INSERT INTO inventory_logs 
                          (branch_id, item_id, worker_id, change_type, quantity_changed) 
                        VALUES ?
                      `;
                      
                      connection.query(logsQuery, [inventoryLogs], (err) => {
                        if (err) {
                          reject(err);
                        } else {
                          console.log(`✅ Created ${inventoryLogs.length} inventory logs with branch_id ${primaryBranchId}`);
                          resolve();
                        }
                      });
                    });

                    // Commit transaction
                    connection.commit((err) => {
                      if (err) {
                        console.error('❌ Error committing transaction:', err);
                        return connection.rollback(() => {
                          connection.release();
                          callback(err);
                        });
                      }
                      
                      console.log(`✅ Transaction committed successfully for sale ${saleId}`);
                      connection.release();
                      callback(null, {
                        success: true,
                        saleId: saleId,
                        totalItems: groupedItemsArray.length,
                        totalUnits: saleData.cart.reduce((sum, item) => sum + item.qty, 0),
                        timestamp: new Date().toISOString()
                      });
                    });

                  } catch (error) {
                    console.error('❌ Error in sequential processing:', error);
                    connection.rollback(() => {
                      connection.release();
                      callback(error);
                    });
                  }
                };

                // Start sequential processing
                processSequentially();
              }
            );
          }
        );
      });
    });
  }

  // Get price history for an item
  static getPriceHistory(itemId, callback) {
    const query = `
      SELECT ip.*, u.username as updated_by
      FROM item_prices ip
      LEFT JOIN users u ON ip.user_id = u.id
      WHERE ip.item_id = ?
      ORDER BY ip.date DESC
    `;
    db.query(query, [itemId], callback);
  }

  // Create new price record (for price updates)
  static createPrice(priceData, callback) {
    const query = `
      INSERT INTO item_prices 
      (item_id, user_id, price_cash, buy_price, price_installment_total, 
       installment_first_payment, installment_months, installment_per_month, 
       installment_last_payment, on_sale_price) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    db.query(query, [
      priceData.item_id,
      priceData.user_id,
      priceData.price_cash,
      priceData.buy_price || null,
      priceData.price_installment_total,
      priceData.installment_first_payment,
      priceData.installment_months,
      priceData.installment_per_month,
      priceData.installment_last_payment,
      priceData.on_sale_price
    ], callback);
  }
}

module.exports = POS;