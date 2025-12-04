const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const Project = require('../models/Project');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../config/database');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads/tasks');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('📁 Created uploads/tasks directory');
}

// Configure multer for file uploads with file type filtering
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExtension = path.extname(file.originalname).toLowerCase();
    cb(null, 'task-' + uniqueSuffix + fileExtension);
  }
});

// File filter for allowed types
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    // Images
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
    // Documents
    'application/pdf', 
    'application/msword', 
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain', 'text/csv',
    // Archives
    'application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type "${file.mimetype}" not allowed. Please upload images (JPEG, PNG, GIF), PDFs, or documents.`), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: { 
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Get all tasks
router.get('/', (req, res) => {
  Task.getAll((err, results) => {
    if (err) {
      console.error('Error fetching tasks:', err);
      return res.status(500).json({ error: 'Failed to fetch tasks' });
    }
    res.json(results);
  });
});

// Get tasks for current user
router.get('/my-tasks/:userId', (req, res) => {
  const userId = req.params.userId;
  
  Task.getByAssignee(userId, (err, results) => {
    if (err) {
      console.error('Error fetching user tasks:', err);
      return res.status(500).json({ error: 'Failed to fetch tasks' });
    }
    res.json(results);
  });
});

// Get tasks by project
router.get('/project/:projectId', (req, res) => {
  const projectId = req.params.projectId;
  
  Task.getByProject(projectId, (err, results) => {
    if (err) {
      console.error('Error fetching project tasks:', err);
      return res.status(500).json({ error: 'Failed to fetch tasks' });
    }
    res.json(results);
  });
});

// Get workers list
router.get('/workers', (req, res) => {
  Task.getWorkers((err, results) => {
    if (err) {
      console.error('Error fetching workers:', err);
      return res.status(500).json({ error: 'Failed to fetch workers' });
    }
    res.json(results);
  });
});

// Create new task
router.post('/', (req, res) => {
  const { assigned_by, assigned_to, task, project_id, priority, estimated_time_minutes, start_time, end_time } = req.body;

  if (!assigned_by || !assigned_to || !task || !project_id) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const taskData = {
    assigned_by,
    assigned_to,
    task,
    project_id,
    priority: priority || 'medium',
    estimated_time_minutes: estimated_time_minutes || null,
    start_time: start_time || null,
    end_time: end_time || null,
    status: 'pending'
  };

  Task.create(taskData, (err, results) => {
    if (err) {
      console.error('Error creating task:', err);
      return res.status(500).json({ error: 'Failed to create task' });
    }

    // Add to approval history
    Task.addApprovalHistory({
      task_id: results.insertId,
      user_id: assigned_by,
      action: 'created',
      notes: 'Task created'
    }, () => {});

    res.status(201).json({
      message: 'Task created successfully',
      taskId: results.insertId
    });
  });
});

// Update task status - FIXED: Added 'approved' to allowed statuses
router.put('/:id/status', (req, res) => {
  const taskId = req.params.id;
  const { status, user_id } = req.body;

  // FIX: Added 'approved' to the allowed statuses
  if (!['pending', 'in_progress', 'ready_for_review', 'approved', 'completed'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  Task.updateStatus(taskId, status, (err, results) => {
    if (err) {
      console.error('Error updating task status:', err);
      return res.status(500).json({ error: 'Failed to update task status' });
    }

    if (results.affectedRows === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Add to approval history
    const action = status === 'ready_for_review' ? 'submitted' : 
                  status === 'approved' ? 'approved' : 'status_updated';
    Task.addApprovalHistory({
      task_id: taskId,
      user_id: user_id,
      action: action,
      notes: `Status changed to ${status}`
    }, () => {});

    res.json({ message: 'Task status updated successfully' });
  });
});

// NEW: Smart task submission endpoint that checks for team leader
router.put('/:id/submit', (req, res) => {
  const taskId = req.params.id;
  const { user_id } = req.body;

  // First get the task to find its project
  const getTaskQuery = 'SELECT project_id FROM tasks WHERE id = ?';
  db.query(getTaskQuery, [taskId], (taskErr, taskResults) => {
    if (taskErr) {
      console.error('Error fetching task:', taskErr);
      return res.status(500).json({ error: 'Failed to fetch task' });
    }

    if (taskResults.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const projectId = taskResults[0].project_id;

    // Check if project has a team leader
    const getProjectQuery = 'SELECT team_leader_id FROM projects WHERE id = ?';
    db.query(getProjectQuery, [projectId], (projectErr, projectResults) => {
      if (projectErr) {
        console.error('Error fetching project:', projectErr);
        return res.status(500).json({ error: 'Failed to fetch project' });
      }

      let nextStatus = 'approved'; // Default if no team leader
      
      if (projectResults.length > 0 && projectResults[0].team_leader_id) {
        nextStatus = 'ready_for_review'; // If team leader exists
      }

      // Update the task status
      Task.updateStatus(taskId, nextStatus, (updateErr, updateResults) => {
        if (updateErr) {
          console.error('Error updating task status:', updateErr);
          return res.status(500).json({ error: 'Failed to update task status' });
        }

        if (updateResults.affectedRows === 0) {
          return res.status(404).json({ error: 'Task not found' });
        }

        // Add to approval history
        const action = nextStatus === 'ready_for_review' ? 'submitted' : 'approved';
        Task.addApprovalHistory({
          task_id: taskId,
          user_id: user_id,
          action: action,
          notes: `Status automatically set to ${nextStatus}`
        }, () => {});

        res.json({ 
          message: `Task ${nextStatus === 'ready_for_review' ? 'submitted for review' : 'approved'} successfully`,
          status: nextStatus
        });
      });
    });
  });
});

// Approve task by team leader
router.put('/:id/approve-leader', (req, res) => {
  const taskId = req.params.id;
  const { leader_id } = req.body;

  Task.approveByLeader(taskId, leader_id, (err, results) => {
    if (err) {
      console.error('Error approving task:', err);
      return res.status(500).json({ error: 'Failed to approve task' });
    }

    if (results.affectedRows === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    Task.addApprovalHistory({
      task_id: taskId,
      user_id: leader_id,
      action: 'approved_by_leader',
      notes: 'Approved by team leader'
    }, () => {});

    res.json({ message: 'Task approved by team leader' });
  });
});

// Approve task by admin
router.put('/:id/approve-admin', (req, res) => {
  const taskId = req.params.id;
  const { admin_id } = req.body;

  Task.approveByAdmin(taskId, admin_id, (err, results) => {
    if (err) {
      console.error('Error approving task:', err);
      return res.status(500).json({ error: 'Failed to approve task' });
    }

    if (results.affectedRows === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    Task.addApprovalHistory({
      task_id: taskId,
      user_id: admin_id,
      action: 'approved_by_admin',
      notes: 'Approved by admin'
    }, () => {});

    res.json({ message: 'Task approved by admin' });
  });
});

// Reject task
router.put('/:id/reject', (req, res) => {
  const taskId = req.params.id;
  const { notes, rejected_by_id } = req.body;

  if (!notes || notes.trim() === '') {
    return res.status(400).json({ error: 'Rejection notes are required' });
  }

  Task.rejectTask(taskId, notes.trim(), rejected_by_id, (err, results) => {
    if (err) {
      console.error('Error rejecting task:', err);
      return res.status(500).json({ error: 'Failed to reject task' });
    }

    if (results.affectedRows === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    Task.addApprovalHistory({
      task_id: taskId,
      user_id: rejected_by_id,
      action: 'rejected',
      notes: notes.trim()
    }, () => {});

    res.json({ message: 'Task rejected successfully' });
  });
});

// Soft delete task
router.put('/:id/soft-delete', (req, res) => {
  const taskId = req.params.id;

  Task.softDelete(taskId, (err, results) => {
    if (err) {
      console.error('Error soft deleting task:', err);
      return res.status(500).json({ error: 'Failed to delete task' });
    }

    if (results.affectedRows === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json({ message: 'Task deleted successfully' });
  });
});

// Hard delete task
router.delete('/:id', (req, res) => {
  const taskId = req.params.id;

  Task.hardDelete(taskId, (err, results) => {
    if (err) {
      console.error('Error deleting task:', err);
      return res.status(500).json({ error: 'Failed to delete task' });
    }

    if (results.affectedRows === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json({ message: 'Task permanently deleted' });
  });
});

// Upload file to task
router.post('/:id/files', upload.single('file'), (req, res) => {
  const taskId = req.params.id;
  const { uploaded_by } = req.body;

  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded or file type not allowed' });
  }

  // Create relative path for database
  const relativePath = path.relative(path.join(__dirname, '..'), req.file.path).replace(/\\/g, '/');

  const fileData = {
    task_id: taskId,
    file_name: req.file.originalname,
    file_path: relativePath,
    file_size: req.file.size,
    uploaded_by: uploaded_by
  };

  Task.addFile(fileData, (err, results) => {
    if (err) {
      console.error('Error uploading file:', err);
      // Delete the uploaded file if database operation fails
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.error('Error deleting uploaded file:', unlinkError);
      }
      return res.status(500).json({ error: 'Failed to upload file to database' });
    }

    res.json({ 
      message: 'File uploaded successfully', 
      fileId: results.insertId,
      fileName: req.file.originalname,
      fileUrl: `/uploads/tasks/${path.basename(req.file.path)}`
    });
  });
});

// Get task files
router.get('/:id/files', (req, res) => {
  const taskId = req.params.id;

  Task.getFiles(taskId, (err, results) => {
    if (err) {
      console.error('Error fetching task files:', err);
      return res.status(500).json({ error: 'Failed to fetch files' });
    }
    
    // Fix file paths for frontend access
    const filesWithFixedPaths = results.map(file => ({
      ...file,
      file_url: `/uploads/tasks/${path.basename(file.file_path)}`,
      file_name: file.file_name,
      uploaded_at: file.uploaded_at
    }));
    
    res.json(filesWithFixedPaths);
  });
});

// Delete task file
router.delete('/:taskId/files/:fileId', (req, res) => {
  const { taskId, fileId } = req.params;

  // First get file path
  const getFileQuery = 'SELECT file_path FROM task_files WHERE id = ? AND task_id = ?';
  db.query(getFileQuery, [fileId, taskId], (err, results) => {
    if (err) {
      console.error('Error fetching file:', err);
      return res.status(500).json({ error: 'Failed to fetch file' });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: 'File not found' });
    }

    const filePath = results[0].file_path;

    // Delete from database
    const deleteQuery = 'DELETE FROM task_files WHERE id = ?';
    db.query(deleteQuery, [fileId], (err, results) => {
      if (err) {
        console.error('Error deleting file:', err);
        return res.status(500).json({ error: 'Failed to delete file' });
    }

      // Delete physical file
      try {
        const fullPath = path.join(__dirname, '..', filePath);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      } catch (unlinkError) {
        console.error('Error deleting physical file:', unlinkError);
      }

      res.json({ message: 'File deleted successfully' });
    });
  });
});

// Get task approval history
router.get('/:id/approval-history', (req, res) => {
  const taskId = req.params.id;

  Task.getApprovalHistory(taskId, (err, results) => {
    if (err) {
      console.error('Error fetching approval history:', err);
      return res.status(500).json({ error: 'Failed to fetch history' });
    }
    res.json(results);
  });
});

// Get tasks needing approval (for team leaders and admins)
router.get('/approval/needed/:userId', (req, res) => {
  const userId = req.params.userId;

  // Get tasks where user is team leader and task is ready for review
  const query = `
    SELECT 
      t.*,
      p.title as project_title,
      p.team_leader_id,
      assigner.username as assigned_by_name,
      assignee.username as assigned_to_name,
      leader.username as team_leader_name
    FROM tasks t
    LEFT JOIN projects p ON t.project_id = p.id
    LEFT JOIN users assigner ON t.assigned_by = assigner.id
    LEFT JOIN users assignee ON t.assigned_to = assignee.id
    LEFT JOIN users leader ON p.team_leader_id = leader.id
    WHERE t.status = 'ready_for_review' 
    AND (p.team_leader_id = ? OR ? IN (SELECT id FROM users WHERE user_type = 0))
    AND t.is_deleted = 0
    ORDER BY t.created_at DESC
  `;

  db.query(query, [userId, userId], (err, results) => {
    if (err) {
      console.error('Error fetching tasks needing approval:', err);
      return res.status(500).json({ error: 'Failed to fetch tasks' });
    }
    res.json(results);
  });
});

// Check for scheduling conflicts
router.get('/worker/:workerId/conflicts', (req, res) => {
  const workerId = req.params.workerId;
  const { start_time, end_time } = req.query;

  if (!start_time || !end_time) {
    return res.status(400).json({ error: 'Start time and end time are required' });
  }

  const query = `
    SELECT t.*, p.title as project_title 
    FROM tasks t 
    LEFT JOIN projects p ON t.project_id = p.id 
    WHERE t.assigned_to = ? 
    AND t.is_deleted = 0 
    AND t.status NOT IN ('completed', 'cancelled')
    AND ((t.start_time BETWEEN ? AND ?) OR (t.end_time BETWEEN ? AND ?) OR (t.start_time <= ? AND t.end_time >= ?))
  `;

  db.query(query, [workerId, start_time, end_time, start_time, end_time, start_time, end_time], (err, results) => {
    if (err) {
      console.error('Error checking conflicts:', err);
      return res.status(500).json({ error: 'Failed to check conflicts' });
    }
    res.json(results);
  });
});

// Get archived tasks (completed and deleted)
router.get('/archive', (req, res) => {
  const query = `
    SELECT 
      t.*,
      p.title as project_title,
      assigner.username as assigned_by_name,
      assignee.username as assigned_to_name
    FROM tasks t
    LEFT JOIN projects p ON t.project_id = p.id
    LEFT JOIN users assigner ON t.assigned_by = assigner.id
    LEFT JOIN users assignee ON t.assigned_to = assignee.id
    WHERE t.status = 'completed' OR t.is_deleted = 1
    ORDER BY COALESCE(t.approved_at, t.deleted_at, t.created_at) DESC
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching archived tasks:', err);
      return res.status(500).json({ error: 'Failed to fetch archived tasks' });
    }
    res.json(results);
  });
});

// Get user's projects with task counts
router.get('/user-projects/:userId', (req, res) => {
  const userId = req.params.userId;

  const query = `
    SELECT 
      p.*,
      creator.username as created_by_name,
      leader.username as team_leader_name,
      COUNT(DISTINCT t.id) as task_count,
      COUNT(DISTINCT CASE WHEN t.status = 'completed' THEN t.id END) as completed_tasks,
      COUNT(DISTINCT pm.user_id) as member_count
    FROM projects p
    LEFT JOIN users creator ON p.created_by = creator.id
    LEFT JOIN users leader ON p.team_leader_id = leader.id
    LEFT JOIN project_members pm ON p.id = pm.project_id
    LEFT JOIN tasks t ON p.id = t.project_id AND t.is_deleted = 0
    WHERE p.created_by = ? OR p.team_leader_id = ? OR pm.user_id = ?
    GROUP BY p.id
    ORDER BY p.created_at DESC
  `;

  db.query(query, [userId, userId, userId], (err, results) => {
    if (err) {
      console.error('Error fetching user projects:', err);
      return res.status(500).json({ error: 'Failed to fetch projects' });
    }
    res.json(results);
  });
});

// Get project progress statistics
router.get('/project-stats/:projectId', (req, res) => {
  const projectId = req.params.projectId;

  const query = `
    SELECT 
      COUNT(*) as total_tasks,
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_tasks,
      SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress_tasks,
      SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_tasks,
      SUM(CASE WHEN status = 'ready_for_review' THEN 1 ELSE 0 END) as ready_for_review_tasks,
      SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved_tasks,
      AVG(estimated_time_minutes) as avg_estimated_time,
      AVG(actual_time_minutes) as avg_actual_time
    FROM tasks 
    WHERE project_id = ? AND is_deleted = 0
  `;

  db.query(query, [projectId], (err, results) => {
    if (err) {
      console.error('Error fetching project stats:', err);
      return res.status(500).json({ error: 'Failed to fetch project statistics' });
    }

    const stats = results[0];
    stats.completion_rate = stats.total_tasks > 0 
      ? Math.round((stats.completed_tasks / stats.total_tasks) * 100) 
      : 0;

    res.json(stats);
  });
});

// Update task with full data
router.put('/:id', (req, res) => {
  const taskId = req.params.id;
  const { assigned_to, task, priority, estimated_time_minutes, start_time, end_time, status } = req.body;

  const taskData = {
    assigned_to,
    task,
    priority,
    estimated_time_minutes,
    start_time,
    end_time,
    status
  };

  // Remove undefined fields
  Object.keys(taskData).forEach(key => {
    if (taskData[key] === undefined) {
      delete taskData[key];
    }
  });

  Task.update(taskId, taskData, (err, results) => {
    if (err) {
      console.error('Error updating task:', err);
      return res.status(500).json({ error: 'Failed to update task' });
    }

    if (results.affectedRows === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json({ message: 'Task updated successfully' });
  });
});

// Reassign task to another worker
router.put('/:id/reassign', (req, res) => {
  const taskId = req.params.id;
  const { assigned_to } = req.body;

  if (!assigned_to) {
    return res.status(400).json({ error: 'New assignee is required' });
  }

  const taskData = {
    assigned_to: assigned_to,
    status: 'pending' // Reset status when reassigning
  };

  Task.update(taskId, taskData, (err, results) => {
    if (err) {
      console.error('Error reassigning task:', err);
      return res.status(500).json({ error: 'Failed to reassign task' });
    }

    if (results.affectedRows === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json({ message: 'Task reassigned successfully' });
  });
});

// Get all tasks with filters
router.get('/filter/all', (req, res) => {
  const { status, project_id, priority } = req.query;

  let query = `
    SELECT 
      t.*,
      p.title as project_title,
      assigner.username as assigned_by_name,
      assignee.username as assigned_to_name
    FROM tasks t
    LEFT JOIN projects p ON t.project_id = p.id
    LEFT JOIN users assigner ON t.assigned_by = assigner.id
    LEFT JOIN users assignee ON t.assigned_to = assignee.id
    WHERE t.is_deleted = 0
  `;

  const queryParams = [];

  if (status && status !== 'all') {
    query += ' AND t.status = ?';
    queryParams.push(status);
  }

  if (project_id && project_id !== 'all') {
    query += ' AND t.project_id = ?';
    queryParams.push(project_id);
  }

  if (priority && priority !== 'all') {
    query += ' AND t.priority = ?';
    queryParams.push(priority);
  }

  query += ' ORDER BY t.created_at DESC';

  db.query(query, queryParams, (err, results) => {
    if (err) {
      console.error('Error fetching filtered tasks:', err);
      return res.status(500).json({ error: 'Failed to fetch tasks' });
    }
    res.json(results);
  });
});

// NEW: Approve task (for team leaders and admins)
router.put('/:id/approve', (req, res) => {
  const taskId = req.params.id;
  const { approved_by, role } = req.body;

  if (!approved_by) {
    return res.status(400).json({ error: 'Approver ID is required' });
  }

  // Determine which approval field to set based on role
  let updateData = {
    status: 'approved',
    approved_at: new Date()
  };

  if (role === 'admin') {
    updateData.approved_by_admin = approved_by;
  } else {
    updateData.approved_by_leader = approved_by;
  }

  const query = 'UPDATE tasks SET ? WHERE id = ?';
  db.query(query, [updateData, taskId], (err, results) => {
    if (err) {
      console.error('Error approving task:', err);
      return res.status(500).json({ error: 'Failed to approve task' });
    }

    if (results.affectedRows === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Add to approval history
    Task.addApprovalHistory({
      task_id: taskId,
      user_id: approved_by,
      action: role === 'admin' ? 'approved_by_admin' : 'approved_by_leader',
      notes: `Approved by ${role}`
    }, () => {});

    res.json({ message: 'Task approved successfully' });
  });
});

// NEW: Reject task (for team leaders and admins) - Updated version
router.put('/:id/reject-task', (req, res) => {
  const taskId = req.params.id;
  const { notes, rejected_by_id } = req.body;

  if (!notes || notes.trim() === '') {
    return res.status(400).json({ error: 'Rejection notes are required' });
  }

  const updateData = {
    status: 'pending',
    rejection_notes: notes.trim()
  };

  const query = 'UPDATE tasks SET ? WHERE id = ?';
  db.query(query, [updateData, taskId], (err, results) => {
    if (err) {
      console.error('Error rejecting task:', err);
      return res.status(500).json({ error: 'Failed to reject task' });
    }

    if (results.affectedRows === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Add to approval history
    Task.addApprovalHistory({
      task_id: taskId,
      user_id: rejected_by_id,
      action: 'rejected',
      notes: notes.trim()
    }, () => {});

    res.json({ message: 'Task rejected successfully' });
  });
});
// Archive all non-completed tasks for a project
router.put('/project/:projectId/archive-non-completed', (req, res) => {
  const projectId = req.params.projectId;

  const query = `
    UPDATE tasks 
    SET is_deleted = 1, deleted_at = NOW() 
    WHERE project_id = ? AND status != 'completed' AND is_deleted = 0
  `;

  db.query(query, [projectId], (err, results) => {
    if (err) {
      console.error('Error archiving non-completed tasks:', err);
      return res.status(500).json({ error: 'Failed to archive project tasks' });
    }

    res.json({ 
      message: 'Non-completed tasks archived successfully',
      archivedTasks: results.affectedRows
    });
  });
});

// Error handling for file uploads
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 10MB.' });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ error: 'Too many files. Only one file allowed.' });
    }
  }
  
  if (error.message.includes('File type')) {
    return res.status(400).json({ error: error.message });
  }
  
  res.status(500).json({ error: 'File upload failed' });
});

module.exports = router;