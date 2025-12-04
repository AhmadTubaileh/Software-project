const db = require('../config/database');

class Task {
  // Get all tasks with project and user details
  static getAll(callback) {
    const query = `
      SELECT 
        t.*,
        p.title as project_title,
        assigner.username as assigned_by_name,
        assignee.username as assigned_to_name,
        leader.username as team_leader_name,
        admin_approver.username as admin_approver_name,
        leader_approver.username as leader_approver_name
      FROM tasks t
      LEFT JOIN projects p ON t.project_id = p.id
      LEFT JOIN users assigner ON t.assigned_by = assigner.id
      LEFT JOIN users assignee ON t.assigned_to = assignee.id
      LEFT JOIN users leader_approver ON t.approved_by_leader = leader_approver.id
      LEFT JOIN users admin_approver ON t.approved_by_admin = admin_approver.id
      LEFT JOIN users leader ON p.team_leader_id = leader.id
      WHERE t.is_deleted = 0
      ORDER BY t.created_at DESC
    `;
    db.query(query, callback);
  }

  // Get tasks assigned to specific user
  static getByAssignee(userId, callback) {
    const query = `
      SELECT 
        t.*,
        p.title as project_title,
        p.team_leader_id,
        assigner.username as assigned_by_name,
        leader.username as team_leader_name
      FROM tasks t
      LEFT JOIN projects p ON t.project_id = p.id
      LEFT JOIN users assigner ON t.assigned_by = assigner.id
      LEFT JOIN users leader ON p.team_leader_id = leader.id
      WHERE t.assigned_to = ? AND t.is_deleted = 0
      ORDER BY t.created_at DESC
    `;
    db.query(query, [userId], callback);
  }

  // Get tasks by project
  static getByProject(projectId, callback) {
    const query = `
      SELECT 
        t.*,
        assigner.username as assigned_by_name,
        assignee.username as assigned_to_name
      FROM tasks t
      LEFT JOIN users assigner ON t.assigned_by = assigner.id
      LEFT JOIN users assignee ON t.assigned_to = assignee.id
      WHERE t.project_id = ? AND t.is_deleted = 0
      ORDER BY t.created_at DESC
    `;
    db.query(query, [projectId], callback);
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

  // Soft delete task
  static softDelete(id, callback) {
    const query = 'UPDATE tasks SET is_deleted = 1, deleted_at = NOW() WHERE id = ?';
    db.query(query, [id], callback);
  }

  // Hard delete task (for mistaken entries)
  static hardDelete(id, callback) {
    const query = 'DELETE FROM tasks WHERE id = ?';
    db.query(query, [id], callback);
  }

  // Update task status with time tracking
  static updateStatus(id, status, callback) {
    let updateData = { status };
    
    // Start time tracking when status changes to in_progress
    if (status === 'in_progress') {
      updateData.time_started = new Date();
    }
    
    // End time tracking when status changes to ready_for_review
    if (status === 'ready_for_review' && !updateData.time_completed) {
      updateData.time_completed = new Date();
      
      // Calculate actual time in minutes
      const timeQuery = 'SELECT time_started FROM tasks WHERE id = ?';
      db.query(timeQuery, [id], (err, results) => {
        if (err) return callback(err);
        
        if (results[0] && results[0].time_started) {
          const startTime = new Date(results[0].time_started);
          const endTime = new Date();
          const actualMinutes = Math.round((endTime - startTime) / (1000 * 60));
          updateData.actual_time_minutes = actualMinutes;
        }
        
        const updateQuery = 'UPDATE tasks SET ? WHERE id = ?';
        db.query(updateQuery, [updateData, id], callback);
      });
      return;
    }
    
    const query = 'UPDATE tasks SET ? WHERE id = ?';
    db.query(query, [updateData, id], callback);
  }

  // Approve task by team leader
  static approveByLeader(taskId, leaderId, callback) {
    const query = 'UPDATE tasks SET approved_by_leader = ?, status = "ready_for_review" WHERE id = ?';
    db.query(query, [leaderId, taskId], callback);
  }

  // Approve task by admin
  static approveByAdmin(taskId, adminId, callback) {
    const query = 'UPDATE tasks SET approved_by_admin = ?, approved_at = NOW(), status = "completed" WHERE id = ?';
    db.query(query, [adminId, taskId], callback);
  }

  // Reject task
  static rejectTask(taskId, notes, rejectedById, callback) {
    const query = 'UPDATE tasks SET status = "pending", rejection_notes = ? WHERE id = ?';
    db.query(query, [notes, taskId], callback);
  }

  // Get workers list
  static getWorkers(callback) {
    const query = 'SELECT id, username, user_type FROM users WHERE user_type BETWEEN 0 AND 9 ORDER BY username';
    db.query(query, callback);
  }

  // Add file to task
  static addFile(fileData, callback) {
    const query = 'INSERT INTO task_files SET ?';
    db.query(query, fileData, callback);
  }

  // Get task files
  static getFiles(taskId, callback) {
    const query = `
      SELECT tf.*, u.username as uploaded_by_name 
      FROM task_files tf 
      LEFT JOIN users u ON tf.uploaded_by = u.id 
      WHERE tf.task_id = ? 
      ORDER BY tf.uploaded_at DESC
    `;
    db.query(query, [taskId], callback);
  }
  // Add these methods to your existing Task model:

// Archive tasks by project (for when project is deleted)
static archiveByProject(projectId, callback) {
  const query = 'UPDATE tasks SET is_deleted = 1, deleted_at = NOW() WHERE project_id = ? AND status != "completed"';
  db.query(query, [projectId], callback);
}

// Get tasks with project filter (for non-deleted projects)
static getByProjectWithFilter(projectId, callback) {
  const query = `
    SELECT 
      t.*,
      assigner.username as assigned_by_name,
      assignee.username as assigned_to_name
    FROM tasks t
    LEFT JOIN users assigner ON t.assigned_by = assigner.id
    LEFT JOIN users assignee ON t.assigned_to = assignee.id
    LEFT JOIN projects p ON t.project_id = p.id
    WHERE t.project_id = ? AND t.is_deleted = 0 AND p.is_deleted = 0
    ORDER BY t.created_at DESC
  `;
  db.query(query, [projectId], callback);
}

  // Add approval history record
  static addApprovalHistory(historyData, callback) {
    const query = 'INSERT INTO task_approval_history SET ?';
    db.query(query, historyData, callback);
  }

  // Get approval history for task
  static getApprovalHistory(taskId, callback) {
    const query = `
      SELECT ah.*, u.username as user_name 
      FROM task_approval_history ah 
      LEFT JOIN users u ON ah.user_id = u.id 
      WHERE ah.task_id = ? 
      ORDER BY ah.created_at DESC
    `;
    db.query(query, [taskId], callback);
  }
}

module.exports = Task;