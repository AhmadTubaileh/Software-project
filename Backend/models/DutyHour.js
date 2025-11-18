const db = require('../config/database');

class DutyHour {
  // Get user's duty hours with date range
  static getByUserId(userId, startDate, endDate, callback) {
    let query = `
      SELECT dh.*, u.username 
      FROM duty_hours dh 
      LEFT JOIN users u ON dh.user_id = u.id 
      WHERE dh.user_id = ?
    `;
    const params = [userId];

    if (startDate && endDate) {
      query += ' AND dh.date BETWEEN ? AND ?';
      params.push(startDate, endDate);
    }

    query += ' ORDER BY dh.date DESC, dh.in_time DESC';
    db.query(query, params, callback);
  }

  // Get all duty hours for admin
  static getAll(userId, startDate, endDate, callback) {
    let query = `
      SELECT dh.*, u.username, u.user_type 
      FROM duty_hours dh 
      LEFT JOIN users u ON dh.user_id = u.id 
      WHERE u.user_type BETWEEN 0 AND 9
    `;
    const params = [];

    if (userId) {
      query += ' AND dh.user_id = ?';
      params.push(userId);
    }

    if (startDate && endDate) {
      query += ' AND dh.date BETWEEN ? AND ?';
      params.push(startDate, endDate);
    }

    query += ' ORDER BY dh.date DESC, dh.in_time DESC';
    db.query(query, params, callback);
  }

  // Get workers list
  static getWorkers(callback) {
    const query = 'SELECT id, username, user_type FROM users WHERE user_type BETWEEN 0 AND 9 ORDER BY username';
    db.query(query, callback);
  }

  // Get active session for user
  static getActiveSession(userId, callback) {
    const query = 'SELECT * FROM duty_hours WHERE user_id = ? AND out_time IS NULL ORDER BY in_time DESC LIMIT 1';
    db.query(query, [userId], callback);
  }

  // Create new session
  static create(sessionData, callback) {
    const query = 'INSERT INTO duty_hours SET ?';
    db.query(query, sessionData, callback);
  }

  // Update session
  static update(id, sessionData, callback) {
    const query = 'UPDATE duty_hours SET ? WHERE id = ?';
    db.query(query, [sessionData, id], callback);
  }

  // Delete session
  static delete(id, callback) {
    const query = 'DELETE FROM duty_hours WHERE id = ?';
    db.query(query, [id], callback);
  }
}

module.exports = DutyHour;