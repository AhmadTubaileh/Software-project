const express = require('express');
const router = express.Router();
const DutyHour = require('../models/DutyHour');

// Generate unique session ID
function generateSessionId(userId) {
  const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.random().toString(36).substring(2, 8);
  return `sess_${userId}_${timestamp}_${random}`;
}

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

      const sessionsWithDuration = results.map(session => {
        let duration = 0;
        if (session.out_time) {
          // Calculate duration from time strings (HH:MM:SS)
          const inTime = session.in_time.split(':').map(Number);
          const outTime = session.out_time.split(':').map(Number);
          
          const inMinutes = inTime[0] * 60 + inTime[1] + (inTime[2] / 60);
          const outMinutes = outTime[0] * 60 + outTime[1] + (outTime[2] / 60);
          
          duration = (outMinutes - inMinutes) / 60;
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

// Get all duty hours for admin
router.get('/admin/all', (req, res) => {
  try {
    const { user_id, start_date, end_date } = req.query;

    DutyHour.getAllWithUpdater(user_id, start_date, end_date, (err, results) => {
      if (err) {
        console.error('Error fetching duty hours:', err);
        return res.status(500).json({ error: 'Failed to fetch duty hours' });
      }

      const sessionsWithDuration = results.map(session => {
        let duration = 0;
        if (session.out_time) {
          // Calculate duration from time strings (HH:MM:SS)
          const inTime = session.in_time.split(':').map(Number);
          const outTime = session.out_time.split(':').map(Number);
          
          const inMinutes = inTime[0] * 60 + inTime[1] + (inTime[2] / 60);
          const outMinutes = outTime[0] * 60 + outTime[1] + (outTime[2] / 60);
          
          duration = (outMinutes - inMinutes) / 60;
        }
        return {
          ...session,
          duration: duration.toFixed(2),
          updater_username: session.updater_username || null
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

    DutyHour.getActiveSession(user_id, (err, activeSessions) => {
      if (err) {
        console.error('Error checking active sessions:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      if (activeSessions.length > 0) {
        return res.status(400).json({ error: 'You already have an active session' });
      }

      const currentTime = new Date();
      const sessionData = {
        user_id,
        session_id: generateSessionId(user_id),
        session_type,
        in_time: String(currentTime.getHours()).padStart(2, '0') + ':' + 
                String(currentTime.getMinutes()).padStart(2, '0') + ':' + 
                String(currentTime.getSeconds()).padStart(2, '0'),
        date: currentTime.toISOString().split('T')[0],
        auto_generated: 1
      };

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

      const updateData = {
        out_time: String(currentTime.getHours()).padStart(2, '0') + ':' + 
                  String(currentTime.getMinutes()).padStart(2, '0') + ':' + 
                  String(currentTime.getSeconds()).padStart(2, '0'),
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

// Update session - FIXED: Proper time handling for TIME type
router.put('/:id', (req, res) => {
  try {
    const sessionId = req.params.id;
    const { in_time, out_time, session_type, notes, date, update_by } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }

    if (!update_by) {
      return res.status(400).json({ error: 'Update by user ID is required' });
    }

    console.log('Received update data:', { in_time, out_time, date, update_by });

    // FIXED: Use time strings directly since they're already in TIME format (HH:MM:SS)
    const updateData = {
      session_type,
      notes,
      date: date.split('T')[0], // Extract just the date part (YYYY-MM-DD)
      update_by: parseInt(update_by),
      updated_at: new Date(),
      auto_generated: 0
    };

    // FIXED: Use time strings directly - no conversion needed for TIME type
    if (in_time) {
      // Validate time format (HH:MM:SS)
      if (isValidTimeFormat(in_time)) {
        updateData.in_time = in_time;
      } else {
        console.error('Invalid time format for in_time:', in_time);
        return res.status(400).json({ error: 'Invalid time format for start time' });
      }
    }

    if (out_time) {
      // Validate time format (HH:MM:SS)
      if (isValidTimeFormat(out_time)) {
        updateData.out_time = out_time;
      } else {
        console.error('Invalid time format for out_time:', out_time);
        return res.status(400).json({ error: 'Invalid time format for end time' });
      }
    } else {
      updateData.out_time = null;
    }

    console.log('Final update data for database:', updateData);

    DutyHour.update(sessionId, updateData, (err, result) => {
      if (err) {
        console.error('Error updating session:', err);
        return res.status(500).json({ error: 'Failed to update session' });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Session not found' });
      }

      res.json({ 
        message: 'Session updated successfully',
        affectedRows: result.affectedRows
      });
    });
  } catch (error) {
    console.error('Error updating session:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Helper function to validate time format (HH:MM:SS)
function isValidTimeFormat(timeString) {
  if (!timeString) return false;
  
  // Simple regex for HH:MM:SS format
  const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/;
  return timeRegex.test(timeString);
}

// Delete session
router.delete('/:id', (req, res) => {
  try {
    const sessionId = req.params.id;

    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }

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

// Create session (admin only) - FIXED: Proper time handling for TIME type
router.post('/admin/create', (req, res) => {
  try {
    const { user_id, in_time, out_time, session_type = 'work', notes, date, update_by } = req.body;

    if (!user_id || !in_time || !date || !update_by) {
      return res.status(400).json({ 
        error: 'User ID, in_time, date, and update_by are required'
      });
    }

    console.log('Received create data:', { user_id, in_time, out_time, date, update_by });

    // FIXED: Use time strings directly - no conversion needed for TIME type
    if (!isValidTimeFormat(in_time)) {
      return res.status(400).json({ error: 'Invalid time format for start time' });
    }

    if (out_time && !isValidTimeFormat(out_time)) {
      return res.status(400).json({ error: 'Invalid time format for end time' });
    }

    const sessionData = {
      user_id: parseInt(user_id),
      session_id: generateSessionId(user_id),
      session_type,
      in_time: in_time, // Use time string directly
      out_time: out_time || null, // Use time string directly
      date: date.split('T')[0], // Extract just the date part (YYYY-MM-DD)
      notes: notes || '',
      auto_generated: 0,
      update_by: parseInt(update_by),
      updated_at: new Date()
    };

    console.log('Final session data for database:', sessionData);

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

// Get workers list
router.get('/admin/workers', (req, res) => {
  try {
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

module.exports = router;