const db = require('../config/database');

class Cart {
  static addItem(userId, itemId, quantity, price, paymentPreference = 'cash', callback) {
    const query = `
      INSERT INTO cart_items (user_id, item_id, quantity, price_at_add, payment_preference)
      VALUES (?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
        quantity = quantity + VALUES(quantity),
        price_at_add = VALUES(price_at_add),
        payment_preference = VALUES(payment_preference),
        updated_at = CURRENT_TIMESTAMP
    `;
    
    db.query(query, [userId, itemId, quantity, price, paymentPreference], (err, result) => {
      if (err) {
        console.error('Error adding item to cart:', err);
        return callback(err, null);
      }
      callback(null, result);
    });
  }

  static getCartItems(userId, callback) {
    const query = `
      SELECT 
        ci.id as cart_item_id,
        ci.quantity,
        ci.price_at_add,
        ci.payment_preference,
        ci.created_at,
        ci.updated_at,
        i.id as item_id,
        i.name,
        i.description,
        i.main_img,
        i.item_image,
        i.installment,
        i.available,
        ip.price_cash as current_price,
        ip.on_sale_price
      FROM cart_items ci
      JOIN items i ON ci.item_id = i.id
      LEFT JOIN item_prices ip ON i.id = ip.item_id
      WHERE ci.user_id = ? 
        AND (ip.date = (
          SELECT MAX(date) 
          FROM item_prices 
          WHERE item_id = i.id
        ) OR ip.date IS NULL)
      ORDER BY ci.created_at DESC
    `;
    
    db.query(query, [userId], (err, results) => {
      if (err) {
        console.error('Error getting cart items:', err);
        return callback(err, null);
      }
      callback(null, results);
    });
  }

  static updateQuantity(userId, itemId, quantity, callback) {
    if (quantity <= 0) {
      return this.removeItem(userId, itemId, callback);
    }

    const query = `
      UPDATE cart_items 
      SET quantity = ?, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ? AND item_id = ?
    `;
    
    db.query(query, [quantity, userId, itemId], (err, result) => {
      if (err) {
        console.error('Error updating cart quantity:', err);
        return callback(err, null);
      }
      callback(null, result);
    });
  }

  static removeItem(userId, itemId, callback) {
    const query = 'DELETE FROM cart_items WHERE user_id = ? AND item_id = ?';
    
    db.query(query, [userId, itemId], (err, result) => {
      if (err) {
        console.error('Error removing item from cart:', err);
        return callback(err, null);
      }
      callback(null, result);
    });
  }

  static clearCart(userId, callback) {
    const query = 'DELETE FROM cart_items WHERE user_id = ?';
    
    db.query(query, [userId], (err, result) => {
      if (err) {
        console.error('Error clearing cart:', err);
        return callback(err, null);
      }
      callback(null, result);
    });
  }

  static getCartCount(userId, callback) {
    const query = `
      SELECT SUM(quantity) as total_items 
      FROM cart_items 
      WHERE user_id = ?
    `;
    
    db.query(query, [userId], (err, results) => {
      if (err) {
        console.error('Error getting cart count:', err);
        return callback(err, null);
      }
      callback(null, results[0]?.total_items || 0);
    });
  }

  static getCartTotal(userId, callback) {
    const query = `
      SELECT SUM(ci.quantity * ci.price_at_add) as total
      FROM cart_items ci
      WHERE ci.user_id = ?
    `;
    
    db.query(query, [userId], (err, results) => {
      if (err) {
        console.error('Error getting cart total:', err);
        return callback(err, null);
      }
      callback(null, results[0]?.total || 0);
    });
  }
}

module.exports = Cart;
