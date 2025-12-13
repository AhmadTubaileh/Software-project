const db = require('../config/database');

class DutyHour {
  // Get user's duty hours
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

  // Get all duty hours for admin with updater info
  static getAllWithUpdater(userId, startDate, endDate, callback) {
    let query = `
      SELECT dh.*, u.username, u.user_type, updater.username as updater_username
      FROM duty_hours dh 
      LEFT JOIN users u ON dh.user_id = u.id 
      LEFT JOIN users updater ON dh.update_by = updater.id
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

  // Get workers list
  static getWorkers(callback) {
    const query = 'SELECT id, username, user_type FROM users WHERE user_type BETWEEN 0 AND 9 ORDER BY username';
    db.query(query, callback);
  }

  // Get workers list filtered by accessible branches
  static getWorkersByBranches(branchIds, callback) {
    if (!branchIds || branchIds.length === 0) {
      return callback(null, []);
    }
    
    const placeholders = branchIds.map(() => '?').join(',');
    const query = `
      SELECT DISTINCT u.id, u.username, u.user_type 
      FROM users u
      LEFT JOIN user_branches ub ON u.id = ub.user_id
      WHERE u.user_type BETWEEN 0 AND 9
        AND (ub.branch_id IN (${placeholders}) OR u.primary_branch_id IN (${placeholders}))
      ORDER BY u.username
    `;
    
    // Duplicate branchIds for both conditions
    const params = [...branchIds, ...branchIds];
    db.query(query, params, callback);
  }

  // Get workers list filtered by a specific branch (primary branch only)
  static getWorkersByBranch(branchId, callback) {
    if (!branchId) {
      return callback(null, []);
    }
    
    const query = `
      SELECT DISTINCT u.id, u.username, u.user_type 
      FROM users u
      WHERE u.user_type BETWEEN 0 AND 9
        AND u.primary_branch_id = ?
      ORDER BY u.username
    `;
    
    db.query(query, [branchId], callback);
  }

  // Get all duty hours for admin with updater info, filtered by accessible branches
  static getAllWithUpdaterByBranches(userId, startDate, endDate, branchIds, branchId, callback) {
    let query = `
      SELECT dh.*, u.username, u.user_type, updater.username as updater_username
      FROM duty_hours dh 
      LEFT JOIN users u ON dh.user_id = u.id 
      LEFT JOIN users updater ON dh.update_by = updater.id
      LEFT JOIN user_branches ub ON u.id = ub.user_id
      WHERE u.user_type BETWEEN 0 AND 9
    `;
    const params = [];

    // If specific branch_id is provided, filter by primary branch only
    if (branchId) {
      query += ` AND u.primary_branch_id = ?`;
      params.push(branchId);
    } else if (branchIds && branchIds.length > 0) {
      // Otherwise, filter by all accessible branches
      const placeholders = branchIds.map(() => '?').join(',');
      query += ` AND (ub.branch_id IN (${placeholders}) OR u.primary_branch_id IN (${placeholders}))`;
      params.push(...branchIds, ...branchIds);
    }

    if (userId) {
      query += ' AND dh.user_id = ?';
      params.push(userId);
    }

    if (startDate && endDate) {
      query += ' AND dh.date BETWEEN ? AND ?';
      params.push(startDate, endDate);
    }

    query += ' GROUP BY dh.id ORDER BY dh.date DESC, dh.in_time DESC';
    db.query(query, params, callback);
  }
}

module.exports = DutyHour;