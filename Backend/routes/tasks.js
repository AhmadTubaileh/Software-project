const express = require('express');
const router = express.Router();
const Task = require('../models/Task');

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

// Get workers list (user_type 0-9)
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
  const { assigned_by, assigned_to, task } = req.body;

  if (!assigned_by || !assigned_to || !task) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const taskData = {
    assigned_by,
    assigned_to,
    task,
    status: 'pending'
  };

  Task.create(taskData, (err, results) => {
    if (err) {
      console.error('Error creating task:', err);
      return res.status(500).json({ error: 'Failed to create task' });
    }

    res.status(201).json({
      message: 'Task created successfully',
      taskId: results.insertId
    });
  });
});

// Update task status
router.put('/:id/status', (req, res) => {
  const taskId = req.params.id;
  const { status } = req.body;

  if (!['pending', 'in_progress', 'completed'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  Task.update(taskId, { status }, (err, results) => {
    if (err) {
      console.error('Error updating task:', err);
      return res.status(500).json({ error: 'Failed to update task' });
    }

    if (results.affectedRows === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json({ message: 'Task status updated successfully' });
  });
});

// Delete task
router.delete('/:id', (req, res) => {
  const taskId = req.params.id;

  Task.delete(taskId, (err, results) => {
    if (err) {
      console.error('Error deleting task:', err);
      return res.status(500).json({ error: 'Failed to delete task' });
    }

    if (results.affectedRows === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json({ message: 'Task deleted successfully' });
  });
});

module.exports = router;