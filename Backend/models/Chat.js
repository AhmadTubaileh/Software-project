const db = require('../config/database');

class Chat {
  // Get project chat messages
  static getByProject(projectId, callback) {
    const query = `
      SELECT 
        pc.*,
        u.username,
        u.user_type
      FROM project_chats pc
      LEFT JOIN users u ON pc.user_id = u.id
      WHERE pc.project_id = ?
      ORDER BY pc.sent_at ASC
    `;
    db.query(query, [projectId], callback);
  }

  // Add message to project chat
  static addMessage(messageData, callback) {
    const query = 'INSERT INTO project_chats SET ?';
    db.query(query, messageData, callback);
  }

  // Get recent projects with chat activity for user
  static getRecentProjects(userId, callback) {
    const query = `
      SELECT DISTINCT 
        p.id,
        p.title,
        (SELECT message FROM project_chats WHERE project_id = p.id ORDER BY sent_at DESC LIMIT 1) as last_message,
        (SELECT sent_at FROM project_chats WHERE project_id = p.id ORDER BY sent_at DESC LIMIT 1) as last_activity
      FROM projects p
      LEFT JOIN project_members pm ON p.id = pm.project_id
      WHERE pm.user_id = ? OR p.team_leader_id = ? OR p.created_by = ?
      ORDER BY last_activity DESC
      LIMIT 10
    `;
    db.query(query, [userId, userId, userId], callback);
  }
}

module.exports = Chat;