const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const Task = require('../models/Task');
const db = require('../config/database'); // Add this import

// Get all non-deleted projects (with optional branch filtering)
router.get('/', (req, res) => {
  const branchId = req.query.branch_id ? parseInt(req.query.branch_id) : null;
  
  if (branchId) {
    // Filter by branch_id
    Project.getByBranch(branchId, (err, results) => {
      if (err) {
        console.error('Error fetching projects:', err);
        return res.status(500).json({ error: 'Failed to fetch projects' });
      }
      res.json(results);
    });
  } else {
    // Get all projects
    Project.getAll((err, results) => {
      if (err) {
        console.error('Error fetching projects:', err);
        return res.status(500).json({ error: 'Failed to fetch projects' });
      }
      res.json(results);
    });
  }
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
  const { title, description, created_by, team_leader_id, status, branch_id } = req.body;

  if (!title || !created_by) {
    return res.status(400).json({ error: 'Title and created_by are required' });
  }

  if (!branch_id) {
    return res.status(400).json({ error: 'Branch ID is required' });
  }

  const projectData = {
    title,
    description: description || null,
    created_by,
    team_leader_id: team_leader_id || null,
    status: status || 'active',
    branch_id: parseInt(branch_id),
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

// Update project - UPDATED to handle team_leader_id properly
router.put('/:id', (req, res) => {
  const projectId = req.params.id;
  const { title, description, team_leader_id, status, is_deleted } = req.body;

  const projectData = {
    title,
    description,
    team_leader_id: team_leader_id !== undefined ? team_leader_id : null, // Handle null values
    status,
    is_deleted,
    updated_at: new Date()
  };

  // Remove undefined fields but keep null values for team_leader_id
  Object.keys(projectData).forEach(key => {
    if (projectData[key] === undefined && key !== 'team_leader_id') {
      delete projectData[key];
    }
  });

  console.log('Updating project with data:', projectData); // Debug log

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

// Add member to project (with branch validation)
router.post('/:id/members', (req, res) => {
  const projectId = req.params.id;
  const { user_id, role } = req.body;

  if (!user_id) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  // First, get the project to check its branch_id
  Project.getById(projectId, (err, projectResults) => {
    if (err) {
      console.error('Error fetching project:', err);
      return res.status(500).json({ error: 'Failed to fetch project' });
    }

    if (projectResults.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const project = projectResults[0];
    const projectBranchId = project.branch_id;

    // Check if the employee's primary_branch_id matches the project's branch_id
    const checkEmployeeQuery = 'SELECT primary_branch_id FROM users WHERE id = ?';
    db.query(checkEmployeeQuery, [user_id], (empErr, empResults) => {
      if (empErr) {
        console.error('Error checking employee branch:', empErr);
        return res.status(500).json({ error: 'Failed to validate employee' });
      }

      if (empResults.length === 0) {
        return res.status(404).json({ error: 'Employee not found' });
      }

      const employeePrimaryBranchId = empResults[0].primary_branch_id;

      if (employeePrimaryBranchId !== projectBranchId) {
        return res.status(400).json({ 
          error: `Cannot add employee. Employee's primary branch (${employeePrimaryBranchId}) does not match project's branch (${projectBranchId})` 
        });
      }

      // Branch matches, proceed with adding member
      const memberData = {
        project_id: projectId,
        user_id,
        role: role || 'member',
        joined_at: new Date()
      };

      Project.addMember(memberData, (addErr, results) => {
        if (addErr) {
          console.error('Error adding project member:', addErr);
          
          // Check if it's a duplicate entry error
          if (addErr.code === 'ER_DUP_ENTRY') {
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

  const projectData = { status, updated_at: new Date() };

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

// NEW: Update member role
router.put('/:projectId/members/:userId/role', (req, res) => {
  const { projectId, userId } = req.params;
  const { role } = req.body;

  console.log(`Updating role for user ${userId} in project ${projectId} to ${role}`); // Debug log

  if (!['member', 'team_leader'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }

  const query = 'UPDATE project_members SET role = ? WHERE project_id = ? AND user_id = ?';
  db.query(query, [role, projectId, userId], (err, results) => {
    if (err) {
      console.error('Error updating member role:', err);
      return res.status(500).json({ error: 'Failed to update member role' });
    }

    if (results.affectedRows === 0) {
      return res.status(404).json({ error: 'Member not found in project' });
    }

    console.log(`Role updated successfully. Affected rows: ${results.affectedRows}`); // Debug log

    res.json({ message: 'Member role updated successfully' });
  });
});


// NEW: Enhanced remove member with smart task reassignment
router.delete('/:projectId/members/:userId/remove-with-tasks', (req, res) => {
  const { projectId, userId } = req.params;
  const { reassignment_strategy, remaining_member_count } = req.body;

  console.log(`Removing member ${userId} from project ${projectId}`);
  console.log(`Reassignment strategy: ${reassignment_strategy}, Remaining members: ${remaining_member_count}`);

  // Start a transaction to ensure data consistency
  db.beginTransaction((err) => {
    if (err) {
      console.error('Error starting transaction:', err);
      return res.status(500).json({ error: 'Failed to remove member' });
    }

    // 1. Get all tasks assigned to this user in this project
    const getTasksQuery = 'SELECT id FROM tasks WHERE project_id = ? AND assigned_to = ? AND is_deleted = 0';
    db.query(getTasksQuery, [projectId, userId], (taskErr, taskResults) => {
      if (taskErr) {
        return db.rollback(() => {
          console.error('Error fetching tasks:', taskErr);
          res.status(500).json({ error: 'Failed to remove member' });
        });
      }

      const taskIds = taskResults.map(task => task.id);
      let reassignedTasks = 0;
      let unassignedTasks = 0;

      if (taskIds.length > 0) {
        // Process each task based on reassignment strategy
        let processedTasks = 0;
        
        taskIds.forEach((taskId) => {
          // Remove associated files
          const deleteFilesQuery = 'DELETE FROM task_files WHERE task_id = ?';
          db.query(deleteFilesQuery, [taskId], (fileErr) => {
            if (fileErr) {
              return db.rollback(() => {
                console.error('Error deleting files:', fileErr);
                res.status(500).json({ error: 'Failed to remove member' });
              });
            }

            // Determine the new assignee based on strategy
            let newAssignee = null;
            let updateQuery = '';

            if (reassignment_strategy === 'auto_reassign' && remaining_member_count === 1) {
              // Auto-reassign to the only remaining member
              const getRemainingMemberQuery = `
                SELECT user_id FROM project_members 
                WHERE project_id = ? AND user_id != ? 
                LIMIT 1
              `;
              
              db.query(getRemainingMemberQuery, [projectId, userId], (memberErr, memberResults) => {
                if (memberErr) {
                  return db.rollback(() => {
                    console.error('Error fetching remaining member:', memberErr);
                    res.status(500).json({ error: 'Failed to remove member' });
                  });
                }

                if (memberResults.length > 0) {
                  newAssignee = memberResults[0].user_id;
                  console.log(`Auto-reassigning task ${taskId} to member ${newAssignee}`);
                  
                  // Update task: reassign and reset to pending
                  updateQuery = `
                    UPDATE tasks 
                    SET assigned_to = ?, status = 'pending', rejection_notes = NULL 
                    WHERE id = ?
                  `;
                  
                  db.query(updateQuery, [newAssignee, taskId], (updateErr) => {
                    if (updateErr) {
                      return db.rollback(() => {
                        console.error('Error updating task:', updateErr);
                        res.status(500).json({ error: 'Failed to remove member' });
                      });
                    }

                    processedTasks++;
                    reassignedTasks++;

                    // When all tasks are processed, remove the member
                    if (processedTasks === taskIds.length) {
                      removeMember();
                    }
                  });
                } else {
                  // Fallback: no remaining member found
                  updateQuery = `
                    UPDATE tasks 
                    SET assigned_to = NULL, status = 'pending', rejection_notes = NULL 
                    WHERE id = ?
                  `;
                  
                  db.query(updateQuery, [taskId], (updateErr) => {
                    if (updateErr) {
                      return db.rollback(() => {
                        console.error('Error updating task:', updateErr);
                        res.status(500).json({ error: 'Failed to remove member' });
                      });
                    }

                    processedTasks++;
                    unassignedTasks++;

                    if (processedTasks === taskIds.length) {
                      removeMember();
                    }
                  });
                }
              });
            } else {
              // Default strategy: set to null for admin decision
              updateQuery = `
                UPDATE tasks 
                SET assigned_to = NULL, status = 'pending', rejection_notes = NULL 
                WHERE id = ?
              `;
              
              db.query(updateQuery, [taskId], (updateErr) => {
                if (updateErr) {
                  return db.rollback(() => {
                    console.error('Error updating task:', updateErr);
                    res.status(500).json({ error: 'Failed to remove member' });
                  });
                }

                processedTasks++;
                unassignedTasks++;

                if (processedTasks === taskIds.length) {
                  removeMember();
                }
              });
            }
          });
        });
      } else {
        // If no tasks, just remove the member
        removeMember();
      }

      function removeMember() {
        // Remove member from project
        const removeMemberQuery = 'DELETE FROM project_members WHERE project_id = ? AND user_id = ?';
        db.query(removeMemberQuery, [projectId, userId], (removeErr, removeResults) => {
          if (removeErr) {
            return db.rollback(() => {
              console.error('Error removing member:', removeErr);
              res.status(500).json({ error: 'Failed to remove member' });
            });
          }

          // Commit transaction
          db.commit((commitErr) => {
            if (commitErr) {
              return db.rollback(() => {
                console.error('Error committing transaction:', commitErr);
                res.status(500).json({ error: 'Failed to remove member' });
              });
            }

            res.json({ 
              message: 'Member removed successfully', 
              reassignedTasks,
              unassignedTasks,
              totalAffectedTasks: reassignedTasks + unassignedTasks
            });
          });
        });
      }
    });
  });
});

// NEW: Remove member and unassign their tasks
router.delete('/:projectId/members/:userId/remove-with-tasks', (req, res) => {
  const { projectId, userId } = req.params;

  // Start a transaction to ensure data consistency
  db.beginTransaction((err) => {
    if (err) {
      console.error('Error starting transaction:', err);
      return res.status(500).json({ error: 'Failed to remove member' });
    }

    // 1. Get all tasks assigned to this user in this project
    const getTasksQuery = 'SELECT id FROM tasks WHERE project_id = ? AND assigned_to = ? AND is_deleted = 0';
    db.query(getTasksQuery, [projectId, userId], (taskErr, taskResults) => {
      if (taskErr) {
        return db.rollback(() => {
          console.error('Error fetching tasks:', taskErr);
          res.status(500).json({ error: 'Failed to remove member' });
        });
      }

      const taskIds = taskResults.map(task => task.id);
      let unassignedTasks = 0;

      if (taskIds.length > 0) {
        // Process each task to remove files and unassign
        let processedTasks = 0;
        
        taskIds.forEach((taskId) => {
          // Remove associated files
          const deleteFilesQuery = 'DELETE FROM task_files WHERE task_id = ?';
          db.query(deleteFilesQuery, [taskId], (fileErr) => {
            if (fileErr) {
              return db.rollback(() => {
                console.error('Error deleting files:', fileErr);
                res.status(500).json({ error: 'Failed to remove member' });
              });
            }

            // Unassign task and reset status
            const updateTaskQuery = `
              UPDATE tasks 
              SET assigned_to = NULL, status = 'pending', rejection_notes = NULL 
              WHERE id = ?
            `;
            db.query(updateTaskQuery, [taskId], (updateErr) => {
              if (updateErr) {
                return db.rollback(() => {
                  console.error('Error updating task:', updateErr);
                  res.status(500).json({ error: 'Failed to remove member' });
                });
              }

              processedTasks++;
              unassignedTasks++;

              // When all tasks are processed, remove the member
              if (processedTasks === taskIds.length) {
                removeMember();
              }
            });
          });
        });
      } else {
        // If no tasks, just remove the member
        removeMember();
      }

      function removeMember() {
        // Remove member from project
        const removeMemberQuery = 'DELETE FROM project_members WHERE project_id = ? AND user_id = ?';
        db.query(removeMemberQuery, [projectId, userId], (removeErr, removeResults) => {
          if (removeErr) {
            return db.rollback(() => {
              console.error('Error removing member:', removeErr);
              res.status(500).json({ error: 'Failed to remove member' });
            });
          }

          // Commit transaction
          db.commit((commitErr) => {
            if (commitErr) {
              return db.rollback(() => {
                console.error('Error committing transaction:', commitErr);
                res.status(500).json({ error: 'Failed to remove member' });
              });
            }

            res.json({ 
              message: 'Member removed successfully', 
              unassignedTasks 
            });
          });
        });
      }
    });
  });
});

// NEW: Update project team leader specifically
router.put('/:id/team-leader', (req, res) => {
  const projectId = req.params.id;
  const { team_leader_id } = req.body;

  console.log(`Updating team leader for project ${projectId} to:`, team_leader_id); // Debug log

  const updateData = {
    team_leader_id: team_leader_id || null,
    updated_at: new Date()
  };

  const query = 'UPDATE projects SET ? WHERE id = ?';
  db.query(query, [updateData, projectId], (err, results) => {
    if (err) {
      console.error('Error updating team leader:', err);
      return res.status(500).json({ error: 'Failed to update team leader' });
    }

    if (results.affectedRows === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    console.log(`Team leader updated successfully. Affected rows: ${results.affectedRows}`); // Debug log

    res.json({ message: 'Team leader updated successfully' });
  });
});

module.exports = router;