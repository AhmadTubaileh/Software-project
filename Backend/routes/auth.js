const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../config/database'); // Use the same DB as employees

// Login endpoint - USES SAME DATABASE AS EMPLOYEES
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate required fields
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    console.log('Login attempt for username:', username);

    // Query the database for the user (same table as employees)
    const query = 'SELECT * FROM users WHERE username = ?';
    
    db.execute(query, [username], async (error, results) => {
      if (error) {
        console.error('Database error:', error);
        return res.status(500).json({ error: 'Database error' });
      }

      console.log('Found users:', results.length);

      if (results.length === 0) {
        return res.status(401).json({ error: 'Invalid username or password' });
      }

      const user = results[0];

      // Debug: Log what we found
      console.log('User found:', {
        id: user.id,
        username: user.username,
        hasPassword: !!user.password,
        user_type: user.user_type,
        passwordHash: user.password ? user.password.substring(0, 20) + '...' : 'none'
      });

      // Check if user has a password (should always have one)
      if (!user.password) {
        console.error('User has no password in database');
        return res.status(500).json({ error: 'Account configuration error' });
      }

      // Compare the provided password with the hashed password from database
      // Using bcrypt.compare (same as your employee route)
      bcrypt.compare(password, user.password, (err, isMatch) => {
        if (err) {
          console.error('Password comparison error:', err);
          return res.status(500).json({ error: 'Server error' });
        }

        console.log('Password match:', isMatch);

        if (!isMatch) {
          return res.status(401).json({ error: 'Invalid username or password' });
        }

        // Determine role based on user_type (same logic as employee route)
        let role;
        if (user.user_type === 0) {
          role = 'admin';
        } else if (user.user_type >= 1 && user.user_type <= 9) {
          role = 'employee';
        } else {
          role = 'customer';
        }

        // Return user data without password
        const userResponse = {
          id: user.id,
          username: user.username,
          email: user.email,
          user_type: user.user_type,
          role: role
        };

        console.log('Login successful for:', userResponse.username);
        
        res.json({
          message: 'Login successful',
          user: userResponse
        });
      });
    });

  } catch (error) {
    console.error('Unexpected error in login:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Signup endpoint - DISABLED since you're using admin-created users
router.post('/signup', (req, res) => {
  res.status(403).json({ 
    error: 'Signup is disabled. Please contact administrator to create an account.' 
  });
});

// Get all users (for debugging) - FROM DATABASE
router.get('/users', (req, res) => {
  const query = 'SELECT id, username, email, user_type FROM users';
  
  db.execute(query, (error, results) => {
    if (error) {
      console.error('Error fetching users:', error);
      return res.status(500).json({ error: 'Database error' });
    }
    
    console.log('Total users in database:', results.length);
    res.json(results);
  });
});

// Health check
router.get('/test', (req, res) => {
  res.json({ message: 'Auth route is working!' });
});

module.exports = router;