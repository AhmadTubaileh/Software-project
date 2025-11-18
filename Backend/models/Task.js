const db = require('../config/database');

class Task {
  // Get all tasks with assigner and assignee details
  static getAll(callback) {
    const query = `
      SELECT 
        t.*,
        assigner.username as assigned_by_name,
        assignee.username as assigned_to_name
      FROM tasks t
      LEFT JOIN users assigner ON t.assigned_by = assigner.id
      LEFT JOIN users assignee ON t.assigned_to = assignee.id
      ORDER BY t.created_at DESC
    `;
    db.query(query, callback);
  }

  // Get tasks assigned to a specific user
  static getByAssignee(assigneeId, callback) {
    const query = `
      SELECT 
        t.*,
        assigner.username as assigned_by_name
      FROM tasks t
      LEFT JOIN users assigner ON t.assigned_by = assigner.id
      WHERE t.assigned_to = ?
      ORDER BY t.created_at DESC
    `;
    db.query(query, [assigneeId], callback);
  }

  // Get task by ID
  static getById(id, callback) {
    const query = `
      SELECT 
        t.*,
        assigner.username as assigned_by_name,
        assignee.username as assigned_to_name
      FROM tasks t
      LEFT JOIN users assigner ON t.assigned_by = assigner.id
      LEFT JOIN users assignee ON t.assigned_to = assignee.id
      WHERE t.id = ?
    `;
    db.query(query, [id], callback);
  }

  // Create new task
  static create(taskData, callback) {
    const query = 'INSERT INTO tasks SET ?';
    db.query(query, taskData, callback);
  }

  // Update task
  static update(id, taskData, callback) {
    const query = 'UPDATE tasks SET ? WHERE id = ?';
    db.query(query, [taskData, id], callback);
  }

  // Delete task
  static delete(id, callback) {
    const query = 'DELETE FROM tasks WHERE id = ?';
    db.query(query, [id], callback);
  }

  // Get workers only (user_type 0-9)
  static getWorkers(callback) {
    const query = 'SELECT id, username, user_type FROM users WHERE user_type BETWEEN 0 AND 9 ORDER BY username';
    db.query(query, callback);
  }
}

module.exports = Task;