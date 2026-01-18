const db = require('../config/database');

class Branch {
  // Get all branches
  static getAll(callback) {
    const query = 'SELECT id, name, address, phone, created_at, branch_img FROM branches ORDER BY created_at DESC';
    db.query(query, callback);
  }

  // Get branch by ID
  static getById(id, callback) {
    const query = 'SELECT id, name, address, phone, created_at, branch_img FROM branches WHERE id = ?';
    db.query(query, [id], callback);
  }

  // Create new branch
  static create(branchData, callback) {
    const { name, address, phone, branch_img } = branchData;
    const query = `
      INSERT INTO branches (name, address, phone, branch_img) 
      VALUES (?, ?, ?, ?)
    `;
    db.query(query, [name, address, phone, branch_img], callback);
  }

  // Update branch
  static update(id, branchData, callback) {
    const { name, address, phone, branch_img } = branchData;
    const query = `
      UPDATE branches 
      SET name = ?, address = ?, phone = ?, branch_img = ? 
      WHERE id = ?
    `;
    db.query(query, [name, address, phone, branch_img, id], callback);
  }

  // Delete branch
  static delete(id, callback) {
    const query = 'DELETE FROM branches WHERE id = ?';
    db.query(query, [id], callback);
  }

  // Check if branch name already exists
  static checkNameExists(name, callback) {
    const query = 'SELECT id FROM branches WHERE name = ?';
    db.query(query, [name], callback);
  }

  // Check if branch name exists for other branches (for update)
  static checkNameExistsForOtherBranches(name, branchId, callback) {
    const query = 'SELECT id FROM branches WHERE name = ? AND id != ?';
    db.query(query, [name, branchId], callback);
  }
}

module.exports = Branch;