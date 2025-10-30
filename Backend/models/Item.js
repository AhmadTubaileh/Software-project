const db = require('../config/database');

class Item {
  // Get all items
  static getAll(callback) {
    const query = 'SELECT * FROM items ORDER BY date_added DESC';
    db.query(query, callback);
  }

  // Get item by ID
  static getById(id, callback) {
    const query = 'SELECT * FROM items WHERE id = ?';
    db.query(query, [id], callback);
  }

  // Create new item
  static create(data, callback) {
    const {
      name, description, price_cash, price_installment_total,
      installment_months, istallment_per_month, available,
      quantity, installment, item_image
    } = data;
    
    const query = `INSERT INTO items 
      (name, description, price_cash, price_installment_total, installment_months, istallment_per_month, available, quantity, installment, item_image) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    
    db.query(
      query,
      [
        name, 
        description, 
        price_cash, 
        price_installment_total || null, 
        installment_months || 0, 
        istallment_per_month || null, 
        available ? 1 : 0, 
        quantity, 
        installment ? 1 : 0, 
        item_image || null
      ],
      callback
    );
  }

  // Update item
  static update(id, data, callback) {
    const {
      name, description, price_cash, price_installment_total,
      installment_months, istallment_per_month, available,
      quantity, installment, item_image
    } = data;
    
    let query = `UPDATE items SET 
      name=?, description=?, price_cash=?, price_installment_total=?, 
      installment_months=?, istallment_per_month=?, available=?, 
      quantity=?, installment=?`;
    
    let params = [
      name, 
      description, 
      price_cash, 
      price_installment_total || null, 
      installment_months || 0, 
      istallment_per_month || null, 
      available ? 1 : 0, 
      quantity, 
      installment ? 1 : 0
    ];
    
    if (item_image !== undefined) {
      query += ', item_image=?';
      params.push(item_image);
    }
    
    query += ' WHERE id=?';
    params.push(id);
    
    db.query(query, params, callback);
  }

  // Delete item
  static delete(id, callback) {
    const query = 'DELETE FROM items WHERE id = ?';
    db.query(query, [id], callback);
  }
}

module.exports = Item;