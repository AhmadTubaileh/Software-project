const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const Task = require('../models/Task');

// Get all non-deleted projects
router.get('/', (req, res) => {
  Project.getAll((err, results) => {
    if (err) {
      console.error('Error fetching projects:', err);
      return res.status(500).json({ error: 'Failed to fetch projects' });
    }
    res.json(results);
  });
});

// Get project by ID
router.get('/:id', (req, res) => {
  const projectId = req.params.id;
  
  Project.getById(projectId, (err, results) => {
    if (err) {
      console.error('Error fetching project:', err);
      return res.status(500).json({ error: 'Failed to fetch project' });
    }
    
    if (results.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    res.json(results[0]);
  });
});

// Create new project
router.post('/', (req, res) => {
  const { title, description, created_by, team_leader_id, status } = req.body;

  if (!title || !created_by) {
    return res.status(400).json({ error: 'Title and created_by are required' });
  }

  const projectData = {
    title,
    description: description || null,
    created_by,
    team_leader_id: team_leader_id || null,
    status: status || 'active',
    is_deleted: 0
  };

  Project.create(projectData, (err, results) => {
    if (err) {
      console.error('Error creating project:', err);
      return res.status(500).json({ error: 'Failed to create project' });
    }

    res.status(201).json({
      message: 'Project created successfully',
      projectId: results.insertId
    });
  });
});

// Update project
router.put('/:id', (req, res) => {
  const projectId = req.params.id;
  const { title, description, team_leader_id, status, is_deleted } = req.body;

  const projectData = {
    title,
    description,
    team_leader_id,
    status,
    is_deleted
  };

  // Remove undefined fields
  Object.keys(projectData).forEach(key => {
    if (projectData[key] === undefined) {
      delete projectData[key];
    }
  });

  Project.update(projectId, projectData, (err, results) => {
    if (err) {
      console.error('Error updating project:', err);
      return res.status(500).json({ error: 'Failed to update project' });
    }

    if (results.affectedRows === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json({ message: 'Project updated successfully' });
  });
});

// Soft delete project
router.put('/:id/soft-delete', (req, res) => {
  const projectId = req.params.id;

  Project.softDelete(projectId, (err, results) => {
    if (err) {
      console.error('Error soft deleting project:', err);
      return res.status(500).json({ error: 'Failed to delete project' });
    }

    if (results.affectedRows === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json({ message: 'Project deleted successfully' });
  });
});

// Hard delete project (permanent removal - use with caution)
router.delete('/:id', (req, res) => {
  const projectId = req.params.id;

  // First check if project exists and get its details
  Project.getById(projectId, (err, projectResults) => {
    if (err) {
      console.error('Error fetching project:', err);
      return res.status(500).json({ error: 'Failed to fetch project' });
    }

    if (projectResults.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Archive all non-completed tasks first
    const archiveTasksQuery = `
      UPDATE tasks 
      SET is_deleted = 1, deleted_at = NOW() 
      WHERE project_id = ? AND status != 'completed'
    `;

    db.query(archiveTasksQuery, [projectId], (archiveErr, archiveResults) => {
      if (archiveErr) {
        console.error('Error archiving tasks:', archiveErr);
        return res.status(500).json({ error: 'Failed to archive project tasks' });
      }

      // Now hard delete the project
      Project.hardDelete(projectId, (deleteErr, deleteResults) => {
        if (deleteErr) {
          console.error('Error hard deleting project:', deleteErr);
          return res.status(500).json({ error: 'Failed to delete project' });
        }

        res.json({ 
          message: 'Project permanently deleted successfully',
          archivedTasks: archiveResults.affectedRows
        });
      });
    });
  });
});

// Restore soft-deleted project
router.put('/:id/restore', (req, res) => {
  const projectId = req.params.id;

  Project.restore(projectId, (err, results) => {
    if (err) {
      console.error('Error restoring project:', err);
      return res.status(500).json({ error: 'Failed to restore project' });
    }

    if (results.affectedRows === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json({ message: 'Project restored successfully' });
  });
});

// Get project members
router.get('/:id/members', (req, res) => {
  const projectId = req.params.id;

  Project.getMembers(projectId, (err, results) => {
    if (err) {
      console.error('Error fetching project members:', err);
      return res.status(500).json({ error: 'Failed to fetch project members' });
    }
    res.json(results);
  });
});

// Add member to project
router.post('/:id/members', (req, res) => {
  const projectId = req.params.id;
  const { user_id, role } = req.body;

  if (!user_id) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  const memberData = {
    project_id: projectId,
    user_id,
    role: role || 'member',
    joined_at: new Date()
  };

  Project.addMember(memberData, (err, results) => {
    if (err) {
      console.error('Error adding project member:', err);
      
      // Check if it's a duplicate entry error
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ error: 'User is already a member of this project' });
      }
      
      return res.status(500).json({ error: 'Failed to add project member' });
    }

    res.status(201).json({
      message: 'Member added to project successfully',
      memberId: results.insertId
    });
  });
});

// Remove member from project
router.delete('/:projectId/members/:userId', (req, res) => {
  const { projectId, userId } = req.params;

  Project.removeMember(projectId, userId, (err, results) => {
    if (err) {
      console.error('Error removing project member:', err);
      return res.status(500).json({ error: 'Failed to remove project member' });
    }

    if (results.affectedRows === 0) {
      return res.status(404).json({ error: 'Member not found in project' });
    }

    res.json({ message: 'Member removed from project successfully' });
  });
});

// Get user's projects
router.get('/user/:userId', (req, res) => {
  const userId = req.params.userId;

  Project.getByUser(userId, (err, results) => {
    if (err) {
      console.error('Error fetching user projects:', err);
      return res.status(500).json({ error: 'Failed to fetch user projects' });
    }
    res.json(results);
  });
});

// Get archived projects
router.get('/archive/all', (req, res) => {
  Project.getArchived((err, results) => {
    if (err) {
      console.error('Error fetching archived projects:', err);
      return res.status(500).json({ error: 'Failed to fetch archived projects' });
    }
    res.json(results);
  });
});

// Update project status
router.put('/:id/status', (req, res) => {
  const projectId = req.params.id;
  const { status } = req.body;

  if (!['active', 'completed', 'archived'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  const projectData = { status };

  Project.update(projectId, projectData, (err, results) => {
    if (err) {
      console.error('Error updating project status:', err);
      return res.status(500).json({ error: 'Failed to update project status' });
    }

    if (results.affectedRows === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json({ message: 'Project status updated successfully' });
  });
});

// Get project statistics
router.get('/:id/stats', (req, res) => {
  const projectId = req.params.id;

  const statsQuery = `
    SELECT 
      COUNT(DISTINCT t.id) as total_tasks,
      SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END) as completed_tasks,
      SUM(CASE WHEN t.status = 'in_progress' THEN 1 ELSE 0 END) as in_progress_tasks,
      SUM(CASE WHEN t.status = 'pending' THEN 1 ELSE 0 END) as pending_tasks,
      SUM(CASE WHEN t.status = 'ready_for_review' THEN 1 ELSE 0 END) as ready_for_review_tasks,
      SUM(CASE WHEN t.status = 'approved' THEN 1 ELSE 0 END) as approved_tasks,
      COUNT(DISTINCT pm.user_id) as total_members,
      AVG(t.estimated_time_minutes) as avg_estimated_time,
      AVG(t.actual_time_minutes) as avg_actual_time
    FROM projects p
    LEFT JOIN tasks t ON p.id = t.project_id AND t.is_deleted = 0
    LEFT JOIN project_members pm ON p.id = pm.project_id
    WHERE p.id = ?
    GROUP BY p.id
  `;

  db.query(statsQuery, [projectId], (err, results) => {
    if (err) {
      console.error('Error fetching project stats:', err);
      return res.status(500).json({ error: 'Failed to fetch project statistics' });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const stats = results[0];
    stats.completion_rate = stats.total_tasks > 0 
      ? Math.round((stats.completed_tasks / stats.total_tasks) * 100) 
      : 0;

    res.json(stats);
  });
});

module.exports = router;