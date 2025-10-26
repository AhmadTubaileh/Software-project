const db = require('../config/database');

class Employee {
  // Get all employees
  static getAll(callback) {
    const query = 'SELECT id, username, email, phone, card_image, user_type, date_joined FROM users';
    db.query(query, callback);
  }

  // Get employee by ID
  static getById(id, callback) {
    const query = 'SELECT id, username, email, phone, card_image, user_type, date_joined FROM users WHERE id = ?';
    db.query(query, [id], callback);
  }

  // Create new employee
  static create(employeeData, callback) {
    const { username, email, phone, card_image, password, user_type } = employeeData;
    const query = `
      INSERT INTO users (username, email, phone, card_image, password, user_type) 
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    db.query(query, [username, email, phone, card_image, password, user_type], callback);
  }

  // Update employee
  static update(id, employeeData, callback) {
    const { username, email, phone, card_image, password, user_type } = employeeData;
    
    let query, params;
    
    if (password) {
      query = `
        UPDATE users 
        SET username = ?, email = ?, phone = ?, card_image = ?, password = ?, user_type = ? 
        WHERE id = ?
      `;
      params = [username, email, phone, card_image, password, user_type, id];
    } else {
      query = `
        UPDATE users 
        SET username = ?, email = ?, phone = ?, card_image = ?, user_type = ? 
        WHERE id = ?
      `;
      params = [username, email, phone, card_image, user_type, id];
    }
    
    db.query(query, params, callback);
  }

  // Delete employee
  static delete(id, callback) {
    const query = 'DELETE FROM users WHERE id = ?';
    db.query(query, [id], callback);
  }

  // Check if email already exists
  static checkEmailExists(email, callback) {
    const query = 'SELECT id FROM users WHERE email = ?';
    db.query(query, [email], callback);
  }

  // Check if username already exists
  static checkUsernameExists(username, callback) {
    const query = 'SELECT id FROM users WHERE username = ?';
    db.query(query, [username], callback);
  }

  // Check if email exists for other users (for update)
  static checkEmailExistsForOtherUsers(email, userId, callback) {
    const query = 'SELECT id FROM users WHERE email = ? AND id != ?';
    db.query(query, [email, userId], callback);
  }

  // Check if username exists for other users (for update)
  static checkUsernameExistsForOtherUsers(username, userId, callback) {
    const query = 'SELECT id FROM users WHERE username = ? AND id != ?';
    db.query(query, [username, userId], callback);
  }
}

module.exports = Employee;