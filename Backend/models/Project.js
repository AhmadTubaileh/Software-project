const db = require('../config/database');

class Project {
  // Get all non-deleted projects
  static getAll(callback) {
    const query = `
      SELECT 
        p.*,
        creator.username as created_by_name,
        leader.username as team_leader_name,
        COUNT(DISTINCT t.id) as task_count,
        COUNT(DISTINCT pm.user_id) as member_count
      FROM projects p
      LEFT JOIN users creator ON p.created_by = creator.id
      LEFT JOIN users leader ON p.team_leader_id = leader.id
      LEFT JOIN project_members pm ON p.id = pm.project_id
      LEFT JOIN tasks t ON p.id = t.project_id AND t.is_deleted = 0
      WHERE p.is_deleted = 0
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `;
    db.query(query, callback);
  }

  // Get project by ID (including deleted ones for admin purposes)
  static getById(id, callback) {
    const query = `
      SELECT 
        p.*,
        creator.username as created_by_name,
        leader.username as team_leader_name
      FROM projects p
      LEFT JOIN users creator ON p.created_by = creator.id
      LEFT JOIN users leader ON p.team_leader_id = leader.id
      WHERE p.id = ?
    `;
    db.query(query, [id], callback);
  }

  // Create new project
  static create(projectData, callback) {
    const query = 'INSERT INTO projects SET ?';
    db.query(query, projectData, callback);
  }

  // Update project
  static update(id, projectData, callback) {
    const query = 'UPDATE projects SET ? WHERE id = ?';
    db.query(query, [projectData, id], callback);
  }

  // Soft delete project (set is_deleted = 1)
  static softDelete(id, callback) {
    const query = 'UPDATE projects SET is_deleted = 1, updated_at = NOW() WHERE id = ?';
    db.query(query, [id], callback);
  }

  // Hard delete project (permanent removal)
  static hardDelete(id, callback) {
    const query = 'DELETE FROM projects WHERE id = ?';
    db.query(query, [id], callback);
  }

  // Restore soft-deleted project
  static restore(id, callback) {
    const query = 'UPDATE projects SET is_deleted = 0, updated_at = NOW() WHERE id = ?';
    db.query(query, [id], callback);
  }

  // Get project members
  static getMembers(projectId, callback) {
    const query = `
      SELECT 
        pm.*,
        u.username,
        u.email,
        u.user_type
      FROM project_members pm
      LEFT JOIN users u ON pm.user_id = u.id
      WHERE pm.project_id = ?
      ORDER BY pm.joined_at DESC
    `;
    db.query(query, [projectId], callback);
  }

  // Add member to project
  static addMember(memberData, callback) {
    const query = 'INSERT INTO project_members SET ?';
    db.query(query, memberData, callback);
  }

  // Remove member from project
  static removeMember(projectId, userId, callback) {
    const query = 'DELETE FROM project_members WHERE project_id = ? AND user_id = ?';
    db.query(query, [projectId, userId], callback);
  }

  // Get projects for specific user
  static getByUser(userId, callback) {
    const query = `
      SELECT 
        p.*,
        creator.username as created_by_name,
        leader.username as team_leader_name,
        COUNT(DISTINCT t.id) as task_count,
        COUNT(DISTINCT pm.user_id) as member_count
      FROM projects p
      LEFT JOIN users creator ON p.created_by = creator.id
      LEFT JOIN users leader ON p.team_leader_id = leader.id
      LEFT JOIN project_members pm ON p.id = pm.project_id
      LEFT JOIN tasks t ON p.id = t.project_id AND t.is_deleted = 0
      WHERE p.is_deleted = 0 AND (p.created_by = ? OR p.team_leader_id = ? OR pm.user_id = ?)
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `;
    db.query(query, [userId, userId, userId], callback);
  }

  // Get archived (soft-deleted) projects
  static getArchived(callback) {
    const query = `
      SELECT 
        p.*,
        creator.username as created_by_name,
        leader.username as team_leader_name,
        COUNT(DISTINCT t.id) as task_count
      FROM projects p
      LEFT JOIN users creator ON p.created_by = creator.id
      LEFT JOIN users leader ON p.team_leader_id = leader.id
      LEFT JOIN tasks t ON p.id = t.project_id
      WHERE p.is_deleted = 1
      GROUP BY p.id
      ORDER BY p.updated_at DESC
    `;
    db.query(query, callback);
  }
}

module.exports = Project;