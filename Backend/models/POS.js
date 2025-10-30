const db = require('../config/database');

class POS {
  // Get all available items for POS
  static getAvailableItems(callback) {
    const query = `
      SELECT 
        id, 
        name, 
        description, 
        price_cash,
        price_installment_total,
        installment_months,
        installment_per_month,
        available,
        quantity,
        installment,
        item_image
      FROM items 
      WHERE available = 1 AND quantity > 0 
      ORDER BY name
    `;
    
    db.query(query, (err, results) => {
      if (err) {
        console.error('❌ POS.getAvailableItems Error:', err);
        return callback(err);
      }
      
      console.log(`✅ POS: Found ${results.length} available items`);
      callback(null, results);
    });
  }

  // Get item by ID
  static getItemById(id, callback) {
    const query = 'SELECT * FROM items WHERE id = ? AND available = 1 AND quantity > 0';
    db.query(query, [id], callback);
  }

  // Update item quantity after sale
  static updateItemQuantity(id, newQuantity, callback) {
    const query = 'UPDATE items SET quantity = ? WHERE id = ?';
    db.query(query, [newQuantity, id], callback);
  }

  // Create sale records
  static createSale(salesData, callback) {
    const query = `
      INSERT INTO sales 
        (user_id, customer_id, item_id, sale_type, total_price, sale_id) 
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

  // Get next sale ID
  static getNextSaleId(callback) {
    const query = 'SELECT COALESCE(MAX(sale_id), 0) + 1 as next_sale_id FROM sales';
    db.query(query, callback);
  }

  // Check if items have sufficient quantity
  static checkQuantities(items, callback) {
    if (items.length === 0) {
      return callback(null, []);
    }
    
    const placeholders = items.map(() => '?').join(',');
    const itemIds = items.map(item => item.id);
    
    const query = `SELECT id, name, quantity FROM items WHERE id IN (${placeholders})`;
    db.query(query, itemIds, callback);
  }
}

module.exports = POS;