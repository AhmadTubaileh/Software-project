const db = require('../config/database');

class Item {
  // Get all items with their latest prices (callback version)
  static getAllWithLatestPrices(callback) {
    const query = `
      SELECT 
        i.*,
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
      WHERE ip.date = (
        SELECT MAX(date) 
        FROM item_prices 
        WHERE item_id = i.id
      )
      OR ip.date IS NULL
      ORDER BY i.id DESC
    `;
    
    db.query(query, (err, results) => {
      if (err) {
        console.error('Error in getAllWithLatestPrices:', err);
        return callback(err, null);
      }
      callback(null, results);
    });
  }

  // Get item by ID with latest price (callback version)
  static getByIdWithLatestPrice(id, callback) {
    const query = `
      SELECT 
        i.*,
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
    
    db.query(query, [id], (err, results) => {
      if (err) {
        console.error('Error in getByIdWithLatestPrice:', err);
        return callback(err, null);
      }
      callback(null, results[0] || null);
    });
  }

  // Get item by ID (basic info only) - callback version
  static getById(id, callback) {
    const query = 'SELECT * FROM items WHERE id = ?';
    db.query(query, [id], (err, results) => {
      if (err) {
        console.error('Error in getById:', err);
        return callback(err, null);
      }
      callback(null, results[0] || null);
    });
  }

  // Get latest price for an item - callback version
  static getLatestPrice(itemId, callback) {
    const query = `
      SELECT * FROM item_prices 
      WHERE item_id = ? 
      ORDER BY date DESC 
      LIMIT 1
    `;
    db.query(query, [itemId], (err, results) => {
      if (err) {
        console.error('Error in getLatestPrice:', err);
        return callback(err, null);
      }
      callback(null, results[0] || {
        price_cash: 0,
        buy_price: 0,
        price_installment_total: null,
        installment_first_payment: null,
        installment_months: null,
        installment_per_month: null,
        installment_last_payment: null,
        on_sale_price: null
      });
    });
  }

  // Get price history for an item - callback version
  static getPriceHistory(itemId, callback) {
    const query = `
      SELECT ip.*, u.username as updated_by
      FROM item_prices ip
      LEFT JOIN users u ON ip.user_id = u.id
      WHERE ip.item_id = ?
      ORDER BY ip.date DESC
    `;
    db.query(query, [itemId], (err, results) => {
      if (err) {
        console.error('Error in getPriceHistory:', err);
        return callback(err, null);
      }
      callback(null, results);
    });
  }

  // Create item with initial price (transaction) - callback version
  static createWithPrice(itemData, priceData, callback) {
    db.beginTransaction((err) => {
      if (err) {
        console.error('Error starting transaction:', err);
        return callback(err);
      }

      // Insert into items table
      const itemQuery = `
        INSERT INTO items (name, description, available, installment, quantity, item_image) 
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      
      db.query(itemQuery, [
        itemData.name,
        itemData.description,
        itemData.available,
        itemData.installment,
        itemData.quantity,
        itemData.item_image
      ], (err, itemResult) => {
        if (err) {
          console.error('Error inserting item:', err);
          return db.rollback(() => {
            callback(err);
          });
        }

        const itemId = itemResult.insertId;
        
        // Insert into item_prices table
        const priceQuery = `
          INSERT INTO item_prices 
          (item_id, user_id, price_cash, buy_price, price_installment_total, 
           installment_first_payment, installment_months, installment_per_month, 
           installment_last_payment, on_sale_price) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        console.log('Inserting price with buy_price:', priceData.buy_price);
        
        db.query(priceQuery, [
          itemId,
          priceData.user_id,
          priceData.price_cash,
          priceData.buy_price || null,
          priceData.price_installment_total,
          priceData.installment_first_payment,
          priceData.installment_months,
          priceData.installment_per_month,
          priceData.installment_last_payment,
          priceData.on_sale_price
        ], (err) => {
          if (err) {
            console.error('Error inserting price:', err);
            return db.rollback(() => {
              callback(err);
            });
          }

          db.commit((err) => {
            if (err) {
              console.error('Error committing transaction:', err);
              return db.rollback(() => {
                callback(err);
              });
            }
            
            callback(null, { itemId, success: true });
          });
        });
      });
    });
  }

  // Update item and price (edit mode) - callback version
  static updateWithPrice(itemId, itemData, priceData, callback) {
    db.beginTransaction((err) => {
      if (err) {
        console.error('Error starting transaction:', err);
        return callback(err);
      }

      // Update items table
      const itemQuery = `
        UPDATE items 
        SET name = ?, description = ?, available = ?, 
            installment = ?, quantity = ?, item_image = ?
        WHERE id = ?
      `;
      
      db.query(itemQuery, [
        itemData.name,
        itemData.description,
        itemData.available,
        itemData.installment,
        itemData.quantity,
        itemData.item_image,
        itemId
      ], (err) => {
        if (err) {
          console.error('Error updating item:', err);
          return db.rollback(() => {
            callback(err);
          });
        }

        // Get latest price to update it
        Item.getLatestPrice(itemId, (err, latestPrice) => {
          if (err) {
            console.error('Error getting latest price:', err);
            return db.rollback(() => {
              callback(err);
            });
          }

          if (latestPrice && latestPrice.id) {
            const priceQuery = `
              UPDATE item_prices 
              SET price_cash = ?, buy_price = ?, price_installment_total = ?, 
                  installment_first_payment = ?, installment_months = ?, 
                  installment_per_month = ?, installment_last_payment = ?, 
                  on_sale_price = ?, user_id = ?
              WHERE id = ?
            `;
            
            console.log('Updating price with buy_price:', priceData.buy_price);
            
            db.query(priceQuery, [
              priceData.price_cash,
              priceData.buy_price || null,
              priceData.price_installment_total,
              priceData.installment_first_payment,
              priceData.installment_months,
              priceData.installment_per_month,
              priceData.installment_last_payment,
              priceData.on_sale_price,
              priceData.user_id,
              latestPrice.id
            ], (err) => {
              if (err) {
                console.error('Error updating price:', err);
                return db.rollback(() => {
                  callback(err);
                });
              }

              db.commit((err) => {
                if (err) {
                  console.error('Error committing transaction:', err);
                  return db.rollback(() => {
                    callback(err);
                  });
                }
                
                callback(null, { success: true });
              });
            });
          } else {
            db.commit((err) => {
              if (err) {
                console.error('Error committing transaction:', err);
                return db.rollback(() => {
                  callback(err);
                });
              }
              
              callback(null, { success: true });
            });
          }
        });
      });
    });
  }

  // Update basic item info only - callback version
  static updateBasicInfo(itemId, itemData, callback) {
    const query = `
      UPDATE items 
      SET name = ?, description = ?, available = ?, 
          installment = ?, quantity = ?, item_image = ?
      WHERE id = ?
    `;
    
    db.query(query, [
      itemData.name,
      itemData.description,
      itemData.available,
      itemData.installment,
      itemData.quantity,
      itemData.item_image,
      itemId
    ], (err, result) => {
      if (err) {
        console.error('Error in updateBasicInfo:', err);
        return callback(err, null);
      }
      callback(null, result);
    });
  }

  // Create new price row (update mode) - callback version
  static createPrice(priceData, callback) {
    const query = `
      INSERT INTO item_prices 
      (item_id, user_id, price_cash, buy_price, price_installment_total, 
       installment_first_payment, installment_months, installment_per_month, 
       installment_last_payment, on_sale_price) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    console.log('Creating new price row with buy_price:', priceData.buy_price);
    
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
    ], (err, result) => {
      if (err) {
        console.error('Error in createPrice:', err);
        return callback(err, null);
      }
      callback(null, result);
    });
  }

  // Delete item - callback version
  static delete(itemId, callback) {
    const query = 'DELETE FROM items WHERE id = ?';
    db.query(query, [itemId], (err, result) => {
      if (err) {
        console.error('Error in delete:', err);
        return callback(err, null);
      }
      callback(null, result);
    });
  }

  // Get user by ID - callback version
  static getUserById(userId, callback) {
    const query = 'SELECT id, username FROM users WHERE id = ?';
    db.query(query, [userId], (err, results) => {
      if (err) {
        console.error('Error in getUserById:', err);
        return callback(err, null);
      }
      callback(null, results[0] || null);
    });
  }
}

module.exports = Item;