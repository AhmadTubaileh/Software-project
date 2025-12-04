const express = require('express');
const router = express.Router();
const Chat = require('../models/Chat');
const Project = require('../models/Project');

// Get project chat messages
router.get('/project/:projectId', (req, res) => {
  const projectId = req.params.projectId;

  Chat.getByProject(projectId, (err, results) => {
    if (err) {
      console.error('Error fetching chat messages:', err);
      return res.status(500).json({ error: 'Failed to fetch messages' });
    }
    res.json(results);
  });
});

// Send message to project chat
router.post('/project/:projectId', (req, res) => {
  const projectId = req.params.projectId;
  const { user_id, message } = req.body;

  if (!user_id || !message || message.trim() === '') {
    return res.status(400).json({ error: 'User ID and message are required' });
  }

  // Check if user is project member
  Project.isMember(projectId, user_id, (err, results) => {
    if (err) {
      console.error('Error checking membership:', err);
      return res.status(500).json({ error: 'Failed to send message' });
    }

    if (results.length === 0) {
      return res.status(403).json({ error: 'You are not a member of this project' });
    }

    const messageData = {
      project_id: projectId,
      user_id: user_id,
      message: message.trim()
    };

    Chat.addMessage(messageData, (err, results) => {
      if (err) {
        console.error('Error sending message:', err);
        return res.status(500).json({ error: 'Failed to send message' });
      }

      res.json({ 
        message: 'Message sent successfully',
        messageId: results.insertId
      });
    });
  });
});

// Get recent projects with chat activity
router.get('/recent/:userId', (req, res) => {
  const userId = req.params.userId;

  Chat.getRecentProjects(userId, (err, results) => {
    if (err) {
      console.error('Error fetching recent projects:', err);
      return res.status(500).json({ error: 'Failed to fetch recent projects' });
    }
    res.json(results);
  });
});

module.exports = router;