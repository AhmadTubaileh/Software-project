// models/POS.js
const db = require('../config/database');

class POS {
  // models/POS.js - Update the getAvailableItems function:
static getAvailableItems(callback) {
  const query = `
    SELECT 
      i.id, 
      i.name, 
      i.description, 
      i.available,
      i.quantity,
      i.installment,
      i.item_image,
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
    
    console.log(`✅ POS: Found ${results.length} total items`);
    
    // Debug: Check if price_id is being returned
    results.forEach((item, index) => {
      if (!item.price_id) {
        console.warn(`⚠️ Item ${item.id} (${item.name}) has no price_id`);
      }
    });
    
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

        // Step 1: Get next sale_id for cash sales
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
              // Sales record (one per item type with quantity)
              salesRecords.push([
                saleData.userId,      // user_id
                null,                 // customer_id (walk-in)
                item.id,              // item_id
                'cash',               // sale_type
                item.price_cash,      // price (actual charged price)
                saleId,               // sale_id
                item.totalQty,        // quantity
                item.price_id         // price_id
              ]);

              // Inventory log
              inventoryLogs.push([
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
                // Step 2: Update quantities sequentially
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

                // Step 3: Create sales records
                await new Promise((resolve, reject) => {
                  if (salesRecords.length === 0) {
                    resolve();
                    return;
                  }
                  
                  const salesQuery = `
                    INSERT INTO sales 
                      (user_id, customer_id, item_id, sale_type, price, sale_id, quantity, price_id) 
                    VALUES ?
                  `;
                  
                  connection.query(salesQuery, [salesRecords], (err) => {
                    if (err) {
                      reject(err);
                    } else {
                      console.log(`✅ Created ${salesRecords.length} sales records`);
                      resolve();
                    }
                  });
                });

                // Step 4: Create inventory logs
                await new Promise((resolve, reject) => {
                  if (inventoryLogs.length === 0) {
                    resolve();
                    return;
                  }
                  
                  const logsQuery = `
                    INSERT INTO inventory_logs 
                      (item_id, worker_id, change_type, quantity_changed) 
                    VALUES ?
                  `;
                  
                  connection.query(logsQuery, [inventoryLogs], (err) => {
                    if (err) {
                      reject(err);
                    } else {
                      console.log(`✅ Created ${inventoryLogs.length} inventory logs`);
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