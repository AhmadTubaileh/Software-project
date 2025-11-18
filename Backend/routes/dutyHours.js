const express = require('express');
const router = express.Router();
const DutyHour = require('../models/DutyHour'); // Use the model class

// Generate unique session ID
function generateSessionId(userId) {
  const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.random().toString(36).substring(2, 8);
  return `sess_${userId}_${timestamp}_${random}`;
}

// Test endpoint
router.get('/test', (req, res) => {
  res.json({ 
    message: 'Duty Hours API is working!',
    timestamp: new Date().toISOString()
  });
});

// Get user's duty hours
router.get('/user/:userId', (req, res) => {
  try {
    const userId = req.params.userId;
    const { start_date, end_date } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    DutyHour.getByUserId(userId, start_date, end_date, (err, results) => {
      if (err) {
        console.error('Error fetching duty hours:', err);
        return res.status(500).json({ error: 'Failed to fetch duty hours' });
      }

      // Calculate duration for each session
      const sessionsWithDuration = results.map(session => {
        let duration = 0;
        if (session.out_time) {
          duration = (new Date(session.out_time) - new Date(session.in_time)) / (1000 * 60 * 60);
        }
        return {
          ...session,
          duration: duration.toFixed(2)
        };
      });

      res.json(sessionsWithDuration);
    });
  } catch (error) {
    console.error('Error fetching duty hours:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Clock in
router.post('/clock-in', (req, res) => {
  try {
    const { user_id, session_type = 'work' } = req.body;
    
    if (!user_id) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Check for active session using model
    DutyHour.getActiveSession(user_id, (err, activeSessions) => {
      if (err) {
        console.error('Error checking active sessions:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      if (activeSessions.length > 0) {
        return res.status(400).json({ error: 'You already have an active session' });
      }

      // Create new session
      const currentTime = new Date();
      const sessionData = {
        user_id,
        session_id: generateSessionId(user_id),
        session_type,
        in_time: currentTime,
        date: currentTime.toISOString().split('T')[0],
        auto_generated: 1
      };

      // Use model to create session
      DutyHour.create(sessionData, (err, result) => {
        if (err) {
          console.error('Error clocking in:', err);
          return res.status(500).json({ error: 'Failed to clock in' });
        }

        res.json({
          message: `Clocked in successfully (${session_type})`,
          session_id: sessionData.session_id
        });
      });
    });
  } catch (error) {
    console.error('Error in clock-in:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Clock out
router.post('/clock-out', (req, res) => {
  try {
    const { user_id, notes = '' } = req.body;

    if (!user_id) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Find active session using model
    DutyHour.getActiveSession(user_id, (err, activeSessions) => {
      if (err) {
        console.error('Error finding active session:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      if (activeSessions.length === 0) {
        return res.status(400).json({ error: 'No active session found' });
      }

      const activeSession = activeSessions[0];
      const currentTime = new Date();

      // Update session using model
      const updateData = {
        out_time: currentTime,
        notes: notes
      };

      DutyHour.update(activeSession.id, updateData, (err, result) => {
        if (err) {
          console.error('Error clocking out:', err);
          return res.status(500).json({ error: 'Failed to clock out' });
        }

        res.json({
          message: `Clocked out successfully (${activeSession.session_type})`
        });
      });
    });
  } catch (error) {
    console.error('Error in clock-out:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all duty hours for admin
router.get('/admin/all', (req, res) => {
  try {
    const { user_id, start_date, end_date } = req.query;

    // Use model to get all duty hours
    DutyHour.getAll(user_id, start_date, end_date, (err, results) => {
      if (err) {
        console.error('Error fetching duty hours:', err);
        return res.status(500).json({ error: 'Failed to fetch duty hours' });
      }

      // Calculate duration for each session
      const sessionsWithDuration = results.map(session => {
        let duration = 0;
        if (session.out_time) {
          duration = (new Date(session.out_time) - new Date(session.in_time)) / (1000 * 60 * 60);
        }
        return {
          ...session,
          duration: duration.toFixed(2)
        };
      });

      res.json(sessionsWithDuration);
    });
  } catch (error) {
    console.error('Error fetching duty hours:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get workers list
router.get('/admin/workers', (req, res) => {
  try {
    // Use model to get workers
    DutyHour.getWorkers((err, results) => {
      if (err) {
        console.error('Error fetching workers:', err);
        return res.status(500).json({ error: 'Failed to fetch workers' });
      }
      res.json(results);
    });
  } catch (error) {
    console.error('Error fetching workers:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update session (admin only)
router.put('/:id', (req, res) => {
  try {
    const sessionId = req.params.id;
    const { in_time, out_time, session_type, notes, date } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }

    const updateData = {
      in_time,
      out_time,
      session_type,
      notes,
      date,
      auto_generated: 0
    };

    // Remove undefined fields
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    // Use model to update session
    DutyHour.update(sessionId, updateData, (err, result) => {
      if (err) {
        console.error('Error updating session:', err);
        return res.status(500).json({ error: 'Failed to update session' });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Session not found' });
      }

      res.json({ message: 'Session updated successfully' });
    });
  } catch (error) {
    console.error('Error updating session:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete session (admin only)
router.delete('/:id', (req, res) => {
  try {
    const sessionId = req.params.id;

    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }

    // Use model to delete session
    DutyHour.delete(sessionId, (err, result) => {
      if (err) {
        console.error('Error deleting session:', err);
        return res.status(500).json({ error: 'Failed to delete session' });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Session not found' });
      }

      res.json({ message: 'Session deleted successfully' });
    });
  } catch (error) {
    console.error('Error deleting session:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create session (admin only)
router.post('/admin/create', (req, res) => {
  try {
    const { user_id, in_time, out_time, session_type = 'work', notes, date } = req.body;

    if (!user_id || !in_time || !date) {
      return res.status(400).json({ error: 'User ID, in_time, and date are required' });
    }

    const sessionData = {
      user_id,
      session_id: generateSessionId(user_id),
      session_type,
      in_time,
      out_time: out_time || null,
      date,
      notes: notes || '',
      auto_generated: 0
    };

    // Use model to create session
    DutyHour.create(sessionData, (err, result) => {
      if (err) {
        console.error('Error creating session:', err);
        return res.status(500).json({ error: 'Failed to create session' });
      }

      res.status(201).json({
        message: 'Session created successfully',
        session_id: sessionData.session_id
      });
    });
  } catch (error) {
    console.error('Error creating session:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;